const path = require('path');
const fs = require('fs');
const workspaceRoot = path.resolve(__dirname, '..');
const mongoose = require(path.join(workspaceRoot, 'backend', 'node_modules', 'mongoose'));
const jwt = require(path.join(workspaceRoot, 'backend', 'node_modules', 'jsonwebtoken'));

const resolvePlaywright = () => {
  try {
    return require('playwright');
  } catch (_err) {
    const localAppData = process.env.LOCALAPPDATA;
    if (!localAppData) {
      throw new Error('Playwright module not found and LOCALAPPDATA is unavailable');
    }

    const npxRoot = path.join(localAppData, 'npm-cache', '_npx');
    if (!fs.existsSync(npxRoot)) {
      throw new Error('Playwright module not found and npm npx cache directory does not exist');
    }

    const candidates = fs
      .readdirSync(npxRoot)
      .map((dir) => path.join(npxRoot, dir, 'node_modules', 'playwright'))
      .filter((candidate) => fs.existsSync(candidate));

    if (!candidates.length) {
      throw new Error('Playwright module not found in npm npx cache');
    }

    // Use the most recently modified candidate.
    candidates.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
    return require(candidates[0]);
  }
};

const { chromium } = resolvePlaywright();

(async () => {
  const root = workspaceRoot;
  require(path.join(root, 'backend', 'node_modules', 'dotenv')).config({ path: path.join(root, 'backend', '.env') });

  const User = require(path.join(root, 'backend', 'src', 'models', 'User'));
  const MentorshipRequest = require(path.join(root, 'backend', 'src', 'models', 'MentorshipRequest'));

  const report = {
    steps: [],
    observedFailureDetails: [],
    capturedRequestResponseEvidence: [],
    consoleErrors: [],
  };

  const nowIso = new Date().toISOString();
  report.steps.push(`Start repro at ${nowIso}`);

  const mongoUri = process.env.MONGODB_URI;
  const jwtSecret = process.env.JWT_SECRET;
  if (!mongoUri || !jwtSecret) {
    throw new Error('Missing MONGODB_URI or JWT_SECRET in environment');
  }

  await mongoose.connect(mongoUri);
  report.steps.push('Connected to MongoDB');

  const mentor = await User.findOne({ email: 'mentor1@mentoring-system.com' });
  const menteeA = await User.findOne({ email: 'mentee1@mentoring-system.com' });
  const menteeB = await User.findOne({ email: 'mentee2@mentoring-system.com' });

  if (!mentor || !menteeA || !menteeB) {
    throw new Error('Expected seed users not found (mentor1, mentee1, mentee2)');
  }

  await MentorshipRequest.deleteMany({
    mentor: mentor._id,
    mentee: { $in: [menteeA._id, menteeB._id] },
    status: 'pending',
  });

  const reqA = await MentorshipRequest.create({
    mentor: mentor._id,
    mentee: menteeA._id,
    subject: `Repro Request A ${Date.now()}`,
    preferredSlot: 'Monday 10:00 AM',
    goals: 'Understand mentorship workflow',
    notes: 'Automation-created request A',
    status: 'pending',
  });

  const reqB = await MentorshipRequest.create({
    mentor: mentor._id,
    mentee: menteeB._id,
    subject: `Repro Request B ${Date.now()}`,
    preferredSlot: 'Tuesday 11:00 AM',
    goals: 'Validate decline path',
    notes: 'Automation-created request B',
    status: 'pending',
  });

  report.steps.push(`Created pending requests: ${reqA._id} and ${reqB._id}`);

  const token = jwt.sign({ id: mentor._id.toString() }, jwtSecret, { expiresIn: '2h' });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  await context.addInitScript((payload) => {
    localStorage.setItem('token', payload.token);
    localStorage.setItem('accountStatus', 'active');
    localStorage.setItem('user', JSON.stringify(payload.user));
  }, {
    token,
    user: {
      id: mentor._id.toString(),
      email: mentor.email,
      role: 'mentor',
      applicationStatus: 'approved',
      accountStatus: 'active',
      firstname: mentor.firstname,
      lastname: mentor.lastname,
    },
  });

  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      report.consoleErrors.push({
        type: msg.type(),
        text: msg.text(),
      });
    }
  });

  page.on('pageerror', (err) => {
    report.consoleErrors.push({
      type: 'pageerror',
      text: String(err && err.message ? err.message : err),
    });
  });

  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('/api/mentorship/requests')) {
      report.capturedRequestResponseEvidence.push({
        stage: 'request',
        url,
        method: request.method(),
        requestBody: request.postData() || null,
      });
    }
  });

  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/mentorship/requests')) {
      let responseBody = null;
      try {
        responseBody = await response.text();
      } catch (_err) {
        responseBody = null;
      }
      report.capturedRequestResponseEvidence.push({
        stage: 'response',
        url,
        method: response.request().method(),
        status: response.status(),
        responseBody,
      });
    }
  });

  page.on('dialog', async (dialog) => {
    const message = dialog.message();
    if (dialog.type() === 'prompt') {
      if (message.includes('Suggest a first session slot')) {
        await dialog.accept('Friday 3:00 PM');
      } else if (message.includes('Provide a reason for declining')) {
        await dialog.accept('Not a fit at this time');
      } else {
        await dialog.accept('');
      }
      return;
    }

    if (dialog.type() === 'confirm') {
      await dialog.accept();
      return;
    }

    await dialog.accept();
  });

  await page.goto('http://localhost:5174/mentor/dashboard', { waitUntil: 'domcontentloaded' });
  report.steps.push('Opened mentor dashboard at /mentor/dashboard');

  await page.waitForSelector('text=Mentorship Requests', { timeout: 15000 });
  report.steps.push('Mentorship Requests section rendered');

  try {
    await page.waitForSelector('text=Repro Request', { timeout: 12000 });
    report.steps.push('At least one seeded request row became visible');
  } catch (_err) {
    report.observedFailureDetails.push('Seeded request rows did not render in UI within timeout.');
  }

  const acceptButtons = page.getByRole('button', { name: 'Accept' });
  const declineButtons = page.getByRole('button', { name: 'Decline' });

  const acceptCount = await acceptButtons.count();
  const declineCount = await declineButtons.count();
  report.steps.push(`Visible action buttons before click: Accept=${acceptCount}, Decline=${declineCount}`);

  if (acceptCount === 0 || declineCount === 0) {
    report.observedFailureDetails.push('No visible Accept/Decline buttons were found on mentor dashboard.');
  } else {
    await acceptButtons.first().click();
    report.steps.push('Clicked Accept on first visible request row');

    await page.waitForTimeout(1200);

    const declineAfterAccept = page.getByRole('button', { name: 'Decline' });
    const declineAfterCount = await declineAfterAccept.count();
    report.steps.push(`Visible Decline buttons after Accept click: ${declineAfterCount}`);

    if (declineAfterCount > 0) {
      await declineAfterAccept.first().click();
      report.steps.push('Clicked Decline on next visible request row');
    } else {
      report.observedFailureDetails.push('No Decline button remained visible after Accept click; decline action could not be triggered.');
    }
  }

  await page.waitForTimeout(1500);

  const failedResponses = report.capturedRequestResponseEvidence.filter(
    (entry) => entry.stage === 'response' && typeof entry.status === 'number' && entry.status >= 400
  );

  if (failedResponses.length > 0) {
    report.observedFailureDetails.push(`Detected ${failedResponses.length} failed mentorship request API responses.`);
  }

  await browser.close();
  await mongoose.disconnect();

  // Keep only mentorship request patch/get entries for concise evidence.
  report.capturedRequestResponseEvidence = report.capturedRequestResponseEvidence.filter((entry) => {
    const m = entry.method || '';
    return m === 'GET' || m === 'PATCH';
  });

  console.log(JSON.stringify(report, null, 2));
})().catch(async (error) => {
  try {
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  } catch (_ignore) {
    // no-op
  }

  console.error(JSON.stringify({
    fatalError: String(error && error.message ? error.message : error),
    stack: error && error.stack ? error.stack : null,
  }, null, 2));
  process.exit(1);
});
