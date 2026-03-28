require('dotenv').config();
const mongoose = require('mongoose');

const User = require('../models/User');
const Session = require('../models/Session');

const DEFAULT_MENTOR_EMAIL = 'mentor1@mentoring-system.com';
const DEFAULT_MENTEE_EMAIL = 'mentee1@mentoring-system.com';
const DEFAULT_HOURS_AGO = 2;
const DEFAULT_SUBJECT = 'Attendance test session';
const DEFAULT_DURATION_MINUTES = 60;

const toPositiveNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const run = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not configured in environment variables.');
    }

    const mentorEmail = (process.env.SEED_MENTOR_EMAIL || DEFAULT_MENTOR_EMAIL).toLowerCase();
    const menteeEmail = (process.env.SEED_MENTEE_EMAIL || DEFAULT_MENTEE_EMAIL).toLowerCase();
    const hoursAgo = toPositiveNumber(process.env.SEED_SESSION_HOURS_AGO, DEFAULT_HOURS_AGO);
    const subject = process.env.SEED_SESSION_SUBJECT || DEFAULT_SUBJECT;
    const durationMinutes = toPositiveNumber(
      process.env.SEED_SESSION_DURATION_MINUTES,
      DEFAULT_DURATION_MINUTES
    );

    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);

    const mentor = await User.findOne({ role: 'mentor', email: mentorEmail }).sort({ createdAt: 1 });
    const mentee = await User.findOne({ role: 'mentee', email: menteeEmail }).sort({ createdAt: 1 });

    if (!mentor) {
      throw new Error(`No mentor account found for ${mentorEmail}. Seed users first or set SEED_MENTOR_EMAIL.`);
    }

    if (!mentee) {
      throw new Error(`No mentee account found for ${menteeEmail}. Seed users first or set SEED_MENTEE_EMAIL.`);
    }

    const now = new Date();
    const sessionDate = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

    const session = await Session.create({
      mentor: mentor._id,
      mentee: mentee._id,
      subject,
      date: sessionDate,
      durationMinutes,
      room: process.env.SEED_SESSION_ROOM || 'Comlab 1',
      capacity: 1,
      isGroup: false,
      status: 'confirmed',
      participants: [
        {
          user: mentor._id,
          status: 'confirmed',
          invitedAt: now,
          respondedAt: now,
        },
        {
          user: mentee._id,
          status: 'confirmed',
          invitedAt: now,
          respondedAt: now,
        },
      ],
    });

    const sessionEndDate = session.endDate || new Date(session.date.getTime() + durationMinutes * 60000);
    const attendanceWindowDays = 14;
    const attendanceWindowEnd = new Date(sessionEndDate.getTime() + attendanceWindowDays * 24 * 60 * 60 * 1000);

    console.log('Attendance test session seeded successfully.');
    console.log(`Session ID: ${session._id}`);
    console.log(`Mentor: ${mentor.email}`);
    console.log(`Mentee: ${mentee.email}`);
    console.log(`Scheduled At: ${session.date.toISOString()}`);
    console.log(`Ends At: ${sessionEndDate.toISOString()}`);
    console.log(`Attendance Marking Window Ends: ${attendanceWindowEnd.toISOString()} (14-day hint)`);
  } catch (error) {
    console.error('Failed to seed attendance test session:', error.message || error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();