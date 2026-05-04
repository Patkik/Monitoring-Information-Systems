require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const { generateSuggestionsForMentor } = require('../services/matchService');
const { DEMO_MENTOR_EMAIL, DEMO_PASSWORD } = require('./demoSeedConfig');

const pickArg = (key, fallback = undefined) => {
  const prefix = `--${key}=`;
  const raw = process.argv.find((arg) => arg.startsWith(prefix));
  if (raw) return raw.slice(prefix.length);
  return fallback;
};

const mentorId = pickArg('mentorId');
const mentorEmail = pickArg('mentorEmail');
const count = Number(pickArg('count', 3));
const prefix = pickArg('prefix', 'seed-mentee');
const regenerate = pickArg('regenerate', 'false') === 'true';
const targetMentorEmail = mentorEmail || DEMO_MENTOR_EMAIL;

const normalize = (text) => {
  if (!text) return [];
  if (Array.isArray(text)) return text.map((t) => String(t).trim().toLowerCase()).filter(Boolean);
  if (typeof text === 'string') return text.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  return [];
};

const sample = (arr, n) => {
  if (!arr || arr.length === 0) return [];
  const unique = Array.from(new Set(arr));
  const out = [];
  while (out.length < n && unique.length) {
    const idx = Math.floor(Math.random() * unique.length);
    out.push(unique.splice(idx, 1)[0]);
  }
  return out;
};

const randName = (base, idx) => ({ first: `${base.charAt(0).toUpperCase()}${base.slice(1)}${idx}`, last: `Seed${idx}` });

const days = ['mon', 'tue', 'wed', 'thu', 'fri'];

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  // eslint-disable-next-line no-console
  console.info('Connected to DB');

  const mentor = mentorId ? await User.findById(mentorId).lean() : await User.findOne({ email: targetMentorEmail.toLowerCase() }).lean();
  if (!mentor) {
    // eslint-disable-next-line no-console
    console.error(`Mentor not found for ${targetMentorEmail}`);
    process.exit(1);
  }

  const mentorTerms = [
    ...normalize(mentor.profile?.expertiseAreas || mentor.applicationData?.expertiseAreas),
    ...normalize(mentor.profile?.interests),
    ...normalize(mentor.applicationData?.mentoringTopics),
  ].filter(Boolean);

  const created = [];

  for (let i = 0; i < count; i += 1) {
    const name = randName(prefix, Date.now() % 100000 + i);
    const matchedSkills = sample(mentorTerms, Math.min(4, mentorTerms.length)) || ['general'];

    const availability = (mentor.profile?.availabilitySlots || []).slice(0, 1).map((s) => ({ day: s.day || days[i % days.length], start: s.start || '10:00', end: s.end || '11:00' }));
    if (!availability.length) availability.push({ day: days[i % days.length], start: '10:00', end: '11:00' });

    const email = `${prefix}-${Date.now()}-${i}@example.com`;

    const mentee = new User({
      firstname: name.first,
      lastname: name.last,
      email,
      password: DEMO_PASSWORD,
      role: 'mentee',
      applicationStatus: 'approved',
      applicationRole: 'mentee',
      applicationData: {
        mentoringGoals: `Match with mentor ${mentor.firstname || ''} ${mentor.lastname || ''}`,
        interests: matchedSkills,
        program: mentor.applicationData?.program || 'General',
      },
      profile: {
        displayName: `${name.first} ${name.last}`,
        skills: matchedSkills,
        interests: matchedSkills,
        availabilitySlots: availability,
        education: { program: mentor.profile?.education?.program || 'General' },
      },
      notificationSettings: { channels: { matches: { inApp: true, email: true } } },
    });

    try {
      const saved = await mentee.save();
      created.push(saved);
      // eslint-disable-next-line no-console
      console.info(`Created mentee: ${saved._id} (${saved.email}) with skills: ${matchedSkills.join(', ')}`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to create mentee', err?.message || err);
    }
  }

  if (regenerate) {
    try {
      await generateSuggestionsForMentor({ mentorId: mentor._id, limit: 10 });
      // eslint-disable-next-line no-console
      console.info('Regenerated suggestions for mentor');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to regenerate suggestions for mentor', error?.message || error);
    }
  }

  // eslint-disable-next-line no-console
  console.info(`Created ${created.length} mentees.`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Script failed', err?.message || err);
  process.exit(1);
});