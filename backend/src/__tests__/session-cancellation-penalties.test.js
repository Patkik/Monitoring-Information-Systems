const test = require('node:test');
const assert = require('node:assert/strict');
const { DateTime } = require('luxon');
const { connect, disconnect, cleanup } = require('./matchTestUtils');
const sessionController = require('../controllers/sessionController');
const User = require('../models/User');
const Session = require('../models/Session');

const mockNotificationAdapter = {
  sendNotification: async () => ({ delivered: true }),
};

const createMockRes = () => {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
};

test('TC-Mentor-028: Cancel session more than 6 hours away', async (t) => {
  await connect();
  t.after(async () => {
    await disconnect();
  });
  await cleanup();

  sessionController.__setNotificationAdapter(mockNotificationAdapter);

  const mentor = await User.create({
    firstname: 'TestMentor',
    lastname: 'User',
    email: `mentor-${Date.now()}@example.com`,
    role: 'mentor',
    emailVerified: true,
    accountStatus: 'active',
  });

  const mentee = await User.create({
    firstname: 'TestMentee',
    lastname: 'User',
    email: `mentee-${Date.now()}@example.com`,
    role: 'mentee',
    emailVerified: true,
    accountStatus: 'active',
  });

  const futureDate = DateTime.now().plus({ hours: 12 }).toJSDate();
  const session = await Session.create({
    mentor: mentor._id,
    mentee: mentee._id,
    date: futureDate,
    subject: 'Advanced JavaScript',
    status: 'confirmed',
    participants: [],
  });

  let user = await User.findById(mentor._id);
  assert.strictEqual(user.cancellationMetrics.lateCancellations, 0);
  assert.strictEqual(user.cancellationMetrics.totalCancellations, 0);

  const req = {
    params: { id: session._id.toString() },
    body: { reason: 'Cannot attend', notify: false },
    user: mentor,
  };
  const res = createMockRes();
  await sessionController.cancelSession(req, res);

  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.success, true);

  const cancelledSession = await Session.findById(session._id);
  assert.strictEqual(cancelledSession.status, 'cancelled');

  user = await User.findById(mentor._id);
  assert.strictEqual(user.cancellationMetrics.lateCancellations, 0);
  assert.strictEqual(user.cancellationMetrics.earlyCancellations, 1);
  assert.strictEqual(user.cancellationMetrics.totalCancellations, 1);
});

test('TC-Mentor-029: Cancel session less than 6 hours away', async (t) => {
  await connect();
  t.after(async () => {
    await disconnect();
  });
  await cleanup();

  sessionController.__setNotificationAdapter(mockNotificationAdapter);

  const mentor = await User.create({
    firstname: 'TestMentor',
    lastname: 'User',
    email: `mentor-${Date.now()}@example.com`,
    role: 'mentor',
    emailVerified: true,
    accountStatus: 'active',
  });

  const mentee = await User.create({
    firstname: 'TestMentee',
    lastname: 'User',
    email: `mentee-${Date.now()}@example.com`,
    role: 'mentee',
    emailVerified: true,
    accountStatus: 'active',
  });

  const soonDate = DateTime.now().plus({ hours: 3 }).toJSDate();
  const session = await Session.create({
    mentor: mentor._id,
    mentee: mentee._id,
    date: soonDate,
    subject: 'Resume Review',
    status: 'confirmed',
    participants: [],
  });

  let user = await User.findById(mentor._id);
  assert.strictEqual(user.cancellationMetrics.lateCancellations, 0);
  assert.strictEqual(user.cancellationMetrics.totalCancellations, 0);

  const req = {
    params: { id: session._id.toString() },
    body: { reason: 'Emergency', notify: false },
    user: mentor,
  };
  const res = createMockRes();
  await sessionController.cancelSession(req, res);

  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.success, true);

  const cancelledSession = await Session.findById(session._id);
  assert.strictEqual(cancelledSession.status, 'cancelled');

  user = await User.findById(mentor._id);
  assert.strictEqual(user.cancellationMetrics.lateCancellations, 1);
  assert.strictEqual(user.cancellationMetrics.earlyCancellations, 0);
  assert.strictEqual(user.cancellationMetrics.totalCancellations, 1);
  assert.ok(user.cancellationMetrics.lastLateCancel);
});

test('Multiple cancellations accumulate metrics', async (t) => {
  await connect();
  t.after(async () => {
    await disconnect();
  });
  await cleanup();

  sessionController.__setNotificationAdapter(mockNotificationAdapter);

  const mentor = await User.create({
    firstname: 'TestMentor',
    lastname: 'User',
    email: `mentor-${Date.now()}@example.com`,
    role: 'mentor',
    emailVerified: true,
    accountStatus: 'active',
  });

  const mentee = await User.create({
    firstname: 'TestMentee',
    lastname: 'User',
    email: `mentee-${Date.now()}@example.com`,
    role: 'mentee',
    emailVerified: true,
    accountStatus: 'active',
  });

  const earlyDate = DateTime.now().plus({ hours: 12 }).toJSDate();
  const earlySession = await Session.create({
    mentor: mentor._id,
    mentee: mentee._id,
    date: earlyDate,
    subject: 'Session 1',
    status: 'confirmed',
    participants: [],
  });

  let req = {
    params: { id: earlySession._id.toString() },
    body: { reason: 'Cancel 1', notify: false },
    user: mentor,
  };
  let res = createMockRes();
  await sessionController.cancelSession(req, res);

  const lateDate1 = DateTime.now().plus({ hours: 2 }).toJSDate();
  const lateSession1 = await Session.create({
    mentor: mentor._id,
    mentee: mentee._id,
    date: lateDate1,
    subject: 'Session 2',
    status: 'confirmed',
    participants: [],
  });

  req = {
    params: { id: lateSession1._id.toString() },
    body: { reason: 'Cancel 2', notify: false },
    user: mentor,
  };
  res = createMockRes();
  await sessionController.cancelSession(req, res);

  const lateDate2 = DateTime.now().plus({ hours: 1 }).toJSDate();
  const lateSession2 = await Session.create({
    mentor: mentor._id,
    mentee: mentee._id,
    date: lateDate2,
    subject: 'Session 3',
    status: 'confirmed',
    participants: [],
  });

  req = {
    params: { id: lateSession2._id.toString() },
    body: { reason: 'Cancel 3', notify: false },
    user: mentor,
  };
  res = createMockRes();
  await sessionController.cancelSession(req, res);

  const user = await User.findById(mentor._id);
  assert.strictEqual(user.cancellationMetrics.totalCancellations, 3);
  assert.strictEqual(user.cancellationMetrics.lateCancellations, 2);
  assert.strictEqual(user.cancellationMetrics.earlyCancellations, 1);
});
