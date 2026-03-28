const path = require('path');
const { test } = require('playwright/test');

const workspaceRoot = path.resolve(__dirname, '..');
const mongoose = require(path.join(workspaceRoot, 'backend', 'node_modules', 'mongoose'));
const jwt = require(path.join(workspaceRoot, 'backend', 'node_modules', 'jsonwebtoken'));
require(path.join(workspaceRoot, 'backend', 'node_modules', 'dotenv')).config({ path: path.join(workspaceRoot, 'backend', '.env') });
const User = require(path.join(workspaceRoot, 'backend', 'src', 'models', 'User'));
const MentorshipRequest = require(path.join(workspaceRoot, 'backend', 'src', 'models', 'MentorshipRequest'));

test('repro mentor request accept/decline from dashboard', async ({ page, context }) => {
  const report = {
    steps: [],
    observedFailureDetails: [],
    capturedRequestResponseEvidence: [],
    consoleErrors: [],
  };

  await mongoose.connect(process.env.MONGODB_URI);
  report.steps.push('Connected to MongoDB');

  const mentor = await User.findOne({ email: 'mentor1@mentoring-system.com' });
  const menteeA = await User.findOne({ email: 'mentee1@mentoring-system.com' });
  const menteeB = await User.findOne({ email: 'mentee2@mentoring-system.com' });

  if (!mentor || !menteeA || !menteeB) {
    throw new Error('Missing seed users for repro');
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

  const token = jwt.sign({ id: mentor._id.toString() }, process.env.JWT_SECRET, { expiresIn: '2h' });

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

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      report.consoleErrors.push({ type: msg.type(), text: msg.text() });
    }
  });

  page.on('pageerror', (err) => {
    report.consoleErrors.push({ type: 'pageerror', text: String(err?.message || err) });
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
      } catch {
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
  report.steps.push('Opened mentor dashboard');

  await page.waitForSelector('text=Mentorship Requests', { timeout: 15000 });
  report.steps.push('Mentorship Requests section visible');

  const acceptButtons = page.getByRole('button', { name: 'Accept' });
  const declineButtons = page.getByRole('button', { name: 'Decline' });

  const acceptCount = await acceptButtons.count();
  const declineCount = await declineButtons.count();
  report.steps.push(`Visible action buttons before clicks: Accept=${acceptCount}, Decline=${declineCount}`);

  if (acceptCount > 0) {
    await acceptButtons.first().click();
    report.steps.push('Clicked Accept');
  } else {
    report.observedFailureDetails.push('Accept button not found.');
  }

  await page.waitForTimeout(1200);

  const declineAfter = page.getByRole('button', { name: 'Decline' });
  const declineAfterCount = await declineAfter.count();
  report.steps.push(`Visible Decline buttons after accept: ${declineAfterCount}`);

  if (declineAfterCount > 0) {
    await declineAfter.first().click();
    report.steps.push('Clicked Decline');
  } else {
    report.observedFailureDetails.push('Decline button not found for second click.');
  }

  await page.waitForTimeout(1800);

  report.capturedRequestResponseEvidence = report.capturedRequestResponseEvidence.filter((entry) => {
    return entry.method === 'GET' || entry.method === 'PATCH';
  });

  const failed = report.capturedRequestResponseEvidence.filter((entry) => entry.stage === 'response' && entry.status >= 400);
  if (failed.length > 0) {
    report.observedFailureDetails.push(`Detected ${failed.length} failing mentorship API responses.`);
  }

  console.log('REPRO_REPORT_START');
  console.log(JSON.stringify(report, null, 2));
  console.log('REPRO_REPORT_END');

  await mongoose.disconnect();
});
