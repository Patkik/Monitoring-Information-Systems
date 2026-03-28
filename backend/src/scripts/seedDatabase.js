require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import all models
const User = require('../models/User');
const Session = require('../models/Session');
const SessionFeedback = require('../models/SessionFeedback');
const MentorFeedback = require('../models/MentorFeedback');
const Feedback = require('../models/Feedback');
const Goal = require('../models/Goal');
const Material = require('../models/Material');
const Mentorship = require('../models/Mentorship');
const MentorshipRequest = require('../models/MentorshipRequest');
const MatchRequest = require('../models/MatchRequest');
const ChatThread = require('../models/ChatThread');
const ChatMessage = require('../models/ChatMessage');
const Notification = require('../models/Notification');
const Availability = require('../models/Availability');
const Certificate = require('../models/Certificate');
const Achievement = require('../models/Achievement');
const ProgressSnapshot = require('../models/ProgressSnapshot');
const AdminNotificationLog = require('../models/AdminNotificationLog');
const AdminReviewTicket = require('../models/AdminReviewTicket');
const AdminUserAction = require('../models/AdminUserAction');
const AuditLog = require('../models/AuditLog');
const FeedbackAuditLog = require('../models/FeedbackAuditLog');
const FeedbackReviewTicket = require('../models/FeedbackReviewTicket');
const MatchAudit = require('../models/MatchAudit');
const Announcement = require('../models/Announcement');
const BookingLock = require('../models/BookingLock');

const allModels = [
    User,
    Session,
    SessionFeedback,
    MentorFeedback,
    Feedback,
    Goal,
    Material,
    Mentorship,
    MentorshipRequest,
    MatchRequest,
    ChatThread,
    ChatMessage,
    Notification,
    Availability,
    Certificate,
    Achievement,
    ProgressSnapshot,
    AdminNotificationLog,
    AdminReviewTicket,
    AdminUserAction,
    AuditLog,
    FeedbackAuditLog,
    FeedbackReviewTicket,
    MatchAudit,
    Announcement,
    BookingLock
];

const seedDatabase = async () => {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear all collections
        console.log('\n🗑️  Clearing all existing data...');
        for (const model of allModels) {
            await model.deleteMany({});
            console.log(`   ✓ Cleared ${model.collection.name}`);
        }
        console.log('✅ All collections cleared');

        // Create test accounts
        console.log('\n👥 Creating test accounts...');

        // Admin Account
        const adminUser = new User({
            firstname: 'Admin',
            lastname: 'User',
            email: 'admin@mentoring-system.com',
            password: 'AdminPass123!', // Will be hashed by pre-save hook
            role: 'admin',
            applicationStatus: 'approved',
            applicationRole: 'admin',
            applicationData: {
                bio: 'System administrator',
                expertise: ['Admin', 'System Management']
            },
            profileImage: null,
            verified: true
        });
        await adminUser.save();
        console.log('   ✓ Created Admin account (admin@mentoring-system.com / AdminPass123!)');

        // Mentor Account 1
        const mentor1 = new User({
            firstname: 'Sarah',
            lastname: 'Johnson',
            email: 'mentor1@mentoring-system.com',
            password: 'MentorPass123!',
            role: 'mentor',
            applicationStatus: 'approved',
            applicationRole: 'mentor',
            applicationData: {
                bio: 'Experienced software engineer with 10+ years of expertise',
                expertise: ['JavaScript', 'React', 'Node.js', 'Database Design'],
                yearsOfExperience: 10,
                availability: 'Weekends',
                timezone: 'UTC-5'
            },
            profileImage: null,
            verified: true
        });
        await mentor1.save();
        console.log('   ✓ Created Mentor 1 account (mentor1@mentoring-system.com / MentorPass123!)');

        // Mentor Account 2
        const mentor2 = new User({
            firstname: 'Michael',
            lastname: 'Chen',
            email: 'mentor2@mentoring-system.com',
            password: 'MentorPass123!',
            role: 'mentor',
            applicationStatus: 'approved',
            applicationRole: 'mentor',
            applicationData: {
                bio: 'Product manager with focus on tech leadership and strategy',
                expertise: ['Product Management', 'Leadership', 'Startups', 'Growth'],
                yearsOfExperience: 8,
                availability: 'Evenings',
                timezone: 'UTC-8'
            },
            profileImage: null,
            verified: true
        });
        await mentor2.save();
        console.log('   ✓ Created Mentor 2 account (mentor2@mentoring-system.com / MentorPass123!)');

        // Mentee Account 1
        const mentee1 = new User({
            firstname: 'Alex',
            lastname: 'Rodriguez',
            email: 'mentee1@mentoring-system.com',
            password: 'MenteePass123!',
            role: 'mentee',
            applicationStatus: 'approved',
            applicationRole: 'mentee',
            applicationData: {
                bio: 'Aspiring full-stack developer looking to break into tech',
                learningGoals: ['Learn React', 'Master Node.js', 'Build full-stack projects'],
                currentSkills: ['HTML', 'CSS', 'JavaScript Basics'],
                availability: 'Flexible',
                timezone: 'UTC-5'
            },
            profileImage: null,
            verified: true
        });
        await mentee1.save();
        console.log('   ✓ Created Mentee 1 account (mentee1@mentoring-system.com / MenteePass123!)');

        // Mentee Account 2
        const mentee2 = new User({
            firstname: 'Emma',
            lastname: 'Williams',
            email: 'mentee2@mentoring-system.com',
            password: 'MenteePass123!',
            role: 'mentee',
            applicationStatus: 'approved',
            applicationRole: 'mentee',
            applicationData: {
                bio: 'Career changer interested in product management',
                learningGoals: ['Understand product strategy', 'Learn analytics', 'Build leadership skills'],
                currentSkills: ['Data Analysis', 'Business Acumen'],
                availability: 'Evenings',
                timezone: 'UTC-0'
            },
            profileImage: null,
            verified: true
        });
        await mentee2.save();
        console.log('   ✓ Created Mentee 2 account (mentee2@mentoring-system.com / MenteePass123!)');

        // Mentee Account 3
        const mentee3 = new User({
            firstname: 'James',
            lastname: 'Smith',
            email: 'mentee3@mentoring-system.com',
            password: 'MenteePass123!',
            role: 'mentee',
            applicationStatus: 'pending',
            applicationRole: 'mentee',
            applicationData: {
                bio: 'Recent graduate looking for guidance in tech career',
                learningGoals: ['Land first tech job', 'Learn industry practices'],
                currentSkills: ['Python', 'Basic algorithms'],
                availability: 'Flexible',
                timezone: 'UTC+5'
            },
            profileImage: null,
            verified: false
        });
        await mentee3.save();
        console.log('   ✓ Created Mentee 3 account (pending approval) (mentee3@mentoring-system.com / MenteePass123!)');

        console.log('\n✅ Database seeding completed successfully!');
        console.log('\n📋 Test Accounts:');
        console.log('   Admin:  admin@mentoring-system.com / AdminPass123!');
        console.log('   Mentor 1: mentor1@mentoring-system.com / MentorPass123!');
        console.log('   Mentor 2: mentor2@mentoring-system.com / MentorPass123!');
        console.log('   Mentee 1: mentee1@mentoring-system.com / MenteePass123!');
        console.log('   Mentee 2: mentee2@mentoring-system.com / MenteePass123!');
        console.log('   Mentee 3: mentee3@mentoring-system.com / MenteePass123! (pending)');

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error.message || error);
        await mongoose.disconnect();
        process.exit(1);
    }
};

seedDatabase();
