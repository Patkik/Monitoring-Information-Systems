require('dotenv').config();
const mongoose = require('mongoose');

const User = require('../models/User');
const Session = require('../models/Session');

const DEFAULT_HOURS_AHEAD = 2;
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

    const hoursAhead = toPositiveNumber(process.env.SEED_SESSION_HOURS_AHEAD, DEFAULT_HOURS_AHEAD);
    const durationMinutes = toPositiveNumber(process.env.SEED_SESSION_DURATION_MINUTES, DEFAULT_DURATION_MINUTES);
    const mentorEmail = process.env.SEED_MENTOR_EMAIL;
    const menteeEmail = process.env.SEED_MENTEE_EMAIL;

    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);

    const mentorQuery = mentorEmail ? { role: 'mentor', email: mentorEmail.toLowerCase() } : { role: 'mentor' };
    const menteeQuery = menteeEmail ? { role: 'mentee', email: menteeEmail.toLowerCase() } : { role: 'mentee' };

    const mentor = await User.findOne(mentorQuery).sort({ createdAt: 1 });
    const mentee = await User.findOne(menteeQuery).sort({ createdAt: 1 });

    if (!mentor) {
      throw new Error('No mentor account found. Seed users first or set SEED_MENTOR_EMAIL.');
    }

    if (!mentee) {
      throw new Error('No mentee account found. Seed users first or set SEED_MENTEE_EMAIL.');
    }

    const now = new Date();
    const sessionDate = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
    const subject = process.env.SEED_SESSION_SUBJECT || `Late cancel demo (${now.toISOString()})`;

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
          user: mentee._id,
          status: 'confirmed',
          invitedAt: now,
          respondedAt: now,
        },
      ],
    });

    console.log('Late-cancel session seeded successfully.');
    console.log(`Session ID: ${session._id}`);
    console.log(`Mentor: ${mentor.email}`);
    console.log(`Mentee: ${mentee.email}`);
    console.log(`Scheduled At: ${session.date.toISOString()}`);
    console.log(`Hours Ahead: ${hoursAhead}`);
    if (hoursAhead <= 6) {
      console.log('This session is inside the late-cancellation penalty window.');
    } else {
      console.log('This session is outside the late-cancellation penalty window.');
    }
  } catch (error) {
    console.error('Failed to seed late-cancel session:', error.message || error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();
