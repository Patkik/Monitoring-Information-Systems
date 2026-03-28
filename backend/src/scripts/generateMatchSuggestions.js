const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const MatchRequest = require('../models/MatchRequest');

async function generateMatchSuggestions() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find mentees and mentors
    const mentees = await User.find({ role: 'mentee' });
    const mentors = await User.find({ role: 'mentor' });

    console.log(`Found ${mentees.length} mentees and ${mentors.length} mentors`);

    if (mentees.length === 0 || mentors.length === 0) {
      console.log('⚠️  Need at least one mentee and one mentor to generate suggestions');
      process.exit(0);
    }

    let count = 0;

    // For each mentee, create match suggestions with available mentors
    for (const mentee of mentees) {
      // Skip if mentee already has active mentorship or pending suggestions
      const existing = await MatchRequest.findOne({
        applicantId: mentee._id,
        status: { $in: ['suggested', 'mentor_accepted', 'mentee_accepted', 'connected'] }
      });

      if (existing) {
        console.log(`⏭️  Skipping ${mentee.email} (already has suggestions/match)`);
        continue;
      }

      // Create 2-3 suggestions per mentee
      const numSuggestions = Math.min(3, mentors.length);
      const selected = mentors.slice(0, numSuggestions);

      for (const mentor of selected) {
        const match = new MatchRequest({
          mentorId: mentor._id,
          applicantId: mentee._id,
          status: 'suggested',
          score: Math.round((85 + Math.random() * 15) * 100) / 100, // 85-100, rounded to 2 decimals
          metadata: {
            reason: `Mentor expertise aligns with your interests in ${mentor.subjects ? mentor.subjects[0] : 'mentoring'}`,
            matchQuality: 'excellent',
            matchedOn: new Date()
          },
          menteeSnapshot: {
            name: `${mentee.firstname} ${mentee.lastname}`,
            email: mentee.email,
            goals: mentee.goals || 'Seeking mentorship',
            program: mentee.program || 'General'
          },
          mentorSnapshot: {
            name: `${mentor.firstname} ${mentor.lastname}`,
            email: mentor.email,
            expertise: mentor.expertise || ['Web Development', 'Career Growth'],
            availability: mentor.availability || ['Monday 10am', 'Wednesday 2pm']
          }
        });

        await match.save();
        count++;
        console.log(`✅ Created match: ${mentee.email} ↔ ${mentor.email}`);
      }
    }

    console.log(`\n✨ Generated ${count} match suggestions`);
    console.log('Mentees can now view suggestions at: /mentee/matches');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

generateMatchSuggestions();
