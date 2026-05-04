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
const { DEMO_PASSWORD } = require('./demoSeedConfig');

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

const createUser = async (userData, label) => {
    const user = new User({
        ...userData,
        password: DEMO_PASSWORD
    });

    await user.save();
    console.log(`   ✓ Created ${label} (${user.email} / Password123!)`);
    return user;
};

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

        const demoUsers = [
            {
                label: 'Admin account',
                firstname: 'Admin',
                lastname: 'User',
                email: 'admin@mentoring-system.com',
                role: 'admin',
                applicationStatus: 'approved',
                applicationRole: 'admin',
                applicationData: {
                    bio: 'System administrator',
                    expertise: ['Admin', 'System Management']
                },
                profileImage: null,
                verified: true
            },
            {
                label: 'Mentor account 1',
                firstname: 'Sarah',
                lastname: 'Johnson',
                email: 'mentor1@mentoring-system.com',
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
            },
            {
                label: 'Mentor account 2',
                firstname: 'Michael',
                lastname: 'Chen',
                email: 'mentor2@mentoring-system.com',
                role: 'mentor',
                applicationStatus: 'approved',
                applicationRole: 'mentor',
                applicationData: {
                    bio: 'Engineering manager focused on architecture and delivery',
                    expertise: ['TypeScript', 'System Design', 'Leadership', 'Testing'],
                    yearsOfExperience: 12,
                    availability: 'Mornings',
                    timezone: 'UTC+1'
                },
                profileImage: null,
                verified: true
            },
            {
                label: 'Mentor account 3',
                firstname: 'Priya',
                lastname: 'Patel',
                email: 'mentor3@mentoring-system.com',
                role: 'mentor',
                applicationStatus: 'approved',
                applicationRole: 'mentor',
                applicationData: {
                    bio: 'Product-minded full-stack mentor helping teams ship faster',
                    expertise: ['Product Strategy', 'React', 'Node.js', 'Mentoring'],
                    yearsOfExperience: 8,
                    availability: 'Evenings',
                    timezone: 'UTC+5:30'
                },
                profileImage: null,
                verified: true
            },
            {
                label: 'Mentor account 4',
                firstname: 'Daniel',
                lastname: 'Garcia',
                email: 'mentor4@mentoring-system.com',
                role: 'mentor',
                applicationStatus: 'approved',
                applicationRole: 'mentor',
                applicationData: {
                    bio: 'Cloud and backend mentor with a focus on practical delivery',
                    expertise: ['AWS', 'APIs', 'Databases', 'Backend Architecture'],
                    yearsOfExperience: 9,
                    availability: 'Flexible',
                    timezone: 'UTC-6'
                },
                profileImage: null,
                verified: true
            },
            {
                label: 'Mentor account 5',
                firstname: 'Alicia',
                lastname: 'Morgan',
                email: 'mentor5@mentoring-system.com',
                role: 'mentor',
                applicationStatus: 'approved',
                applicationRole: 'mentor',
                applicationData: {
                    bio: 'Mentor for career growth, communication, and technical interviews',
                    expertise: ['Career Growth', 'Interview Prep', 'Communication', 'JavaScript'],
                    yearsOfExperience: 7,
                    availability: 'Weekdays',
                    timezone: 'UTC+0'
                },
                profileImage: null,
                verified: true
            },
            {
                label: 'Mentee account 1',
                firstname: 'Alex',
                lastname: 'Rodriguez',
                email: 'mentee1@mentoring-system.com',
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
            },
            {
                label: 'Mentee account 2',
                firstname: 'Emma',
                lastname: 'Williams',
                email: 'mentee2@mentoring-system.com',
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
            },
            {
                label: 'Mentee account 3',
                firstname: 'Noah',
                lastname: 'Brown',
                email: 'mentee3@mentoring-system.com',
                role: 'mentee',
                applicationStatus: 'approved',
                applicationRole: 'mentee',
                applicationData: {
                    bio: 'Junior developer learning modern web development',
                    learningGoals: ['Improve TypeScript', 'Learn testing', 'Ship a portfolio project'],
                    currentSkills: ['HTML', 'CSS', 'JavaScript'],
                    availability: 'Weekends',
                    timezone: 'UTC-4'
                },
                profileImage: null,
                verified: true
            },
            {
                label: 'Mentee account 4',
                firstname: 'Sophia',
                lastname: 'Lee',
                email: 'mentee4@mentoring-system.com',
                role: 'mentee',
                applicationStatus: 'approved',
                applicationRole: 'mentee',
                applicationData: {
                    bio: 'Student exploring software engineering and internships',
                    learningGoals: ['Learn React', 'Strengthen problem solving', 'Prepare for internships'],
                    currentSkills: ['Python', 'Git', 'Problem Solving'],
                    availability: 'Mornings',
                    timezone: 'UTC+8'
                },
                profileImage: null,
                verified: true
            },
            {
                label: 'Mentee account 5',
                firstname: 'Ethan',
                lastname: 'Davis',
                email: 'mentee5@mentoring-system.com',
                role: 'mentee',
                applicationStatus: 'approved',
                applicationRole: 'mentee',
                applicationData: {
                    bio: 'Backend learner aiming to build scalable APIs',
                    learningGoals: ['Learn Node.js', 'Design APIs', 'Understand databases'],
                    currentSkills: ['JavaScript', 'SQL Basics'],
                    availability: 'Evenings',
                    timezone: 'UTC-6'
                },
                profileImage: null,
                verified: true
            },
            {
                label: 'Mentee account 6',
                firstname: 'Mia',
                lastname: 'Wilson',
                email: 'mentee6@mentoring-system.com',
                role: 'mentee',
                applicationStatus: 'approved',
                applicationRole: 'mentee',
                applicationData: {
                    bio: 'Aspiring product designer transitioning into tech',
                    learningGoals: ['Understand agile teams', 'Learn product thinking', 'Improve technical confidence'],
                    currentSkills: ['Figma', 'User Research', 'Communication'],
                    availability: 'Flexible',
                    timezone: 'UTC+2'
                },
                profileImage: null,
                verified: true
            }
        ];

        for (const userData of demoUsers) {
            await createUser(userData, userData.label);
        }

        console.log('\n✅ Database seeding completed successfully!');
        console.log('\n📋 Test Accounts:');
        console.log('   Admin:  admin@mentoring-system.com / Password123!');
        console.log('   Mentor 1: mentor1@mentoring-system.com / Password123!');
        console.log('   Mentor 2: mentor2@mentoring-system.com / Password123!');
        console.log('   Mentor 3: mentor3@mentoring-system.com / Password123!');
        console.log('   Mentor 4: mentor4@mentoring-system.com / Password123!');
        console.log('   Mentor 5: mentor5@mentoring-system.com / Password123!');
        console.log('   Mentee 1: mentee1@mentoring-system.com / Password123!');
        console.log('   Mentee 2: mentee2@mentoring-system.com / Password123!');
        console.log('   Mentee 3: mentee3@mentoring-system.com / Password123!');
        console.log('   Mentee 4: mentee4@mentoring-system.com / Password123!');
        console.log('   Mentee 5: mentee5@mentoring-system.com / Password123!');
        console.log('   Mentee 6: mentee6@mentoring-system.com / Password123!');

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error.message || error);
        await mongoose.disconnect();
        process.exit(1);
    }
};

seedDatabase();
