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
const BookingLock = require('../models/BookingLock');
const { generateSuggestionsForAllMentors } = require('../services/matchService');
const { DEMO_PASSWORD } = require('./demoSeedConfig');
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


const allModels = [
    User, Session, SessionFeedback, MentorFeedback, Feedback, Goal, Material,
    Mentorship, MentorshipRequest, MatchRequest, ChatThread, ChatMessage,
    Notification, Availability, Certificate, Achievement, ProgressSnapshot,
    AdminNotificationLog, AdminReviewTicket, AdminUserAction, AuditLog,
    FeedbackAuditLog, FeedbackReviewTicket, MatchAudit, Announcement, BookingLock
];

const createUser = async (userData, label) => {
    const user = new User({ ...userData, password: DEMO_PASSWORD });
    await user.save();
    console.log(`   ✓ Created ${label} (${user.email})`);
    return user;
};

const seedDatabase = async () => {
    try {
        console.log('🔗 Connecting to MongoDB...');
        try {
            await mongoose.connect(process.env.MONGODB_URI);
            console.log('✅ Connected to MongoDB');
        } catch (err) {
            await mongoose.connect(process.env.MONGODB_URI_FALLBACK);
            console.log('✅ Connected to MongoDB (fallback)');
        }

        console.log('\n🗑️  Clearing existing data...');
        for (const model of allModels) {
            await model.deleteMany({});
        }

        console.log('\n👥 Creating test accounts...');
        const demoUsers = [
            {
                label: 'Admin', firstname: 'Admin', lastname: 'User', email: 'admin@mentoring-system.com', role: 'admin',
                applicationStatus: 'approved', applicationRole: 'admin', verified: true,
                applicationData: { bio: 'System administrator', expertise: ['Admin'] }
            },
            {
                label: 'Mentor 1', firstname: 'Sarah', lastname: 'Johnson', email: 'mentor1@mentoring-system.com', role: 'mentor',
                applicationStatus: 'approved', applicationRole: 'mentor', verified: true,
                applicationData: { bio: 'Experienced software engineer', expertise: ['React', 'Node.js'], yearsOfExperience: 10, timezone: 'Asia/Manila' },
                profile: { displayName: 'Sarah Johnson', expertiseAreas: ['React', 'Node.js'], skills: ['React', 'Node.js'], timezone: 'Asia/Manila' },
                feedbackStats: { totalReviews: 3, totalScore: 14, averageRating: 4.67, lastReviewAt: new Date() },
                ratingAvg: 4.67,
                ratingCount: 3
            },
            {
                label: 'Mentor 2', firstname: 'Michael', lastname: 'Chen', email: 'mentor2@mentoring-system.com', role: 'mentor',
                applicationStatus: 'approved', applicationRole: 'mentor', verified: true,
                applicationData: { bio: 'Engineering manager', expertise: ['System Design'], yearsOfExperience: 12, timezone: 'Asia/Manila' },
                profile: { displayName: 'Michael Chen', expertiseAreas: ['System Design'], skills: ['System Design'], timezone: 'Asia/Manila' }
            },
            {
                label: 'Mentee 1', firstname: 'Alex', lastname: 'Rodriguez', email: 'mentee1@mentoring-system.com', role: 'mentee',
                applicationStatus: 'approved', applicationRole: 'mentee', verified: true,
                applicationData: { bio: 'Aspiring full-stack dev', learningGoals: ['React'], currentSkills: ['HTML', 'CSS'], timezone: 'Asia/Manila' },
                profile: { displayName: 'Alex Rodriguez', skills: ['HTML', 'CSS'], timezone: 'Asia/Manila' }
            },
            {
                label: 'Mentee 2', firstname: 'Emma', lastname: 'Williams', email: 'mentee2@mentoring-system.com', role: 'mentee',
                applicationStatus: 'approved', applicationRole: 'mentee', verified: true,
                applicationData: { bio: 'Career changer', learningGoals: ['System Design'], currentSkills: ['Data Analysis'], timezone: 'Asia/Manila' },
                profile: { displayName: 'Emma Williams', skills: ['Data Analysis'], timezone: 'Asia/Manila' }
            }
        ];

        for (let i = 1; i <= 25; i++) {
            const expertise = ['React', 'Node.js', 'System Design', 'Python'][i % 4];
            demoUsers.push({
                label: `Bulk Mentor ${i}`, firstname: `MentorName${i}`, lastname: `Smith${i}`, email: `bulkmentor${i}@mentoring.com`, role: 'mentor',
                applicationStatus: 'approved', applicationRole: 'mentor', verified: true,
                applicationData: { bio: 'A bulk generated mentor', expertise: [expertise], timezone: 'Asia/Manila' },
                profile: { displayName: `MentorName${i} Smith${i}`, expertiseAreas: [expertise], skills: [expertise], timezone: 'Asia/Manila' }
            });
        }

        for (let i = 1; i <= 25; i++) {
            const goal = ['React', 'Node.js', 'System Design', 'Python'][i % 4];
            demoUsers.push({
                label: `Bulk Mentee ${i}`, firstname: `MenteeName${i}`, lastname: `Doe${i}`, email: `bulkmentee${i}@mentoring.com`, role: 'mentee',
                applicationStatus: 'approved', applicationRole: 'mentee', verified: true,
                applicationData: { bio: 'A bulk generated mentee', learningGoals: [goal], timezone: 'Asia/Manila' },
                profile: { displayName: `MenteeName${i} Doe${i}`, skills: [], timezone: 'Asia/Manila' }
            });
        }

        const createdUsers = [];
        for (const userData of demoUsers) {
            createdUsers.push(await createUser(userData, userData.label));
        }

        const admin = createdUsers.find(u => u.email === 'admin@mentoring-system.com');
        const mentor1 = createdUsers.find(u => u.email === 'mentor1@mentoring-system.com');
        const mentor2 = createdUsers.find(u => u.email === 'mentor2@mentoring-system.com');
        const mentee1 = createdUsers.find(u => u.email === 'mentee1@mentoring-system.com');
        const mentee2 = createdUsers.find(u => u.email === 'mentee2@mentoring-system.com');

        console.log('\n🤝 Creating Mentorship Connections...');
        // Mentor 1 <-> Mentee 1
        await new MentorshipRequest({ mentor: mentor1._id, mentee: mentee1._id, status: 'accepted', subject: 'Web Dev' }).save();
        const mentorship1 = await new Mentorship({ mentorId: mentor1._id, menteeId: mentee1._id, status: 'active', metadata: { goals: 'React' } }).save();
        
        // Mentor 2 <-> Mentee 2
        await new MentorshipRequest({ mentor: mentor2._id, mentee: mentee2._id, status: 'accepted', subject: 'System Architecture' }).save();
        const mentorship2 = await new Mentorship({ mentorId: mentor2._id, menteeId: mentee2._id, status: 'active', metadata: { goals: 'System Design' } }).save();
        console.log('   ✓ Mentorships created');

        console.log('\n💬 Creating Chat Threads & Messages...');
        const thread1 = await new ChatThread({
            type: 'direct', mentor: mentor1._id, mentee: mentee1._id, participants: [mentor1._id, mentee1._id]
        }).save();
        await new ChatMessage({ thread: thread1._id, sender: mentor1._id, body: 'Welcome to the mentorship program!' }).save();
        await new ChatMessage({ thread: thread1._id, sender: mentee1._id, body: 'Thanks! Excited to start.' }).save();
        console.log('   ✓ Chat threads populated');

        console.log('\n📚 Creating Goals & Materials...');
        await new Goal({
            mentee: mentee1._id, mentor: mentor1._id, title: 'Master React Fundamentals',
            status: 'active', targetDate: new Date(Date.now() + 30 * 86400000),
            milestones: [{ label: 'Components', achieved: true }, { label: 'Hooks', achieved: false }],
            progressHistory: [{ value: 50, note: 'Halfway there' }]
        }).save();

        await new Material({
            mentor: mentor1._id, mentee: mentee1._id, title: 'React Guide', originalName: 'guide.pdf',
            googleDriveFileId: 'mock-file-id-1', mimeType: 'application/pdf', visibility: 'shared'
        }).save();
        console.log('   ✓ Goals and materials created');

        console.log('\n📅 Creating Sessions...');
        const pastDate1 = new Date(Date.now() - 14 * 86400000); // 2 weeks ago
        const pastDate2 = new Date(Date.now() - 7 * 86400000); // 1 week ago
        const pastDate3 = new Date(Date.now() - 2 * 86400000); // 2 days ago
        const futureDate = new Date(Date.now() + 2 * 86400000); // 2 days from now

        const pastSession1 = await new Session({
            mentor: mentor1._id, mentee: mentee1._id, subject: 'Initial Intro & Setup',
            date: pastDate1, durationMinutes: 60, status: 'completed', attended: true,
            participants: [{ user: mentee1._id, status: 'confirmed' }],
            attendance: [{ user: mentee1._id, status: 'present', recordedBy: mentor1._id }]
        }).save();

        const pastSession2 = await new Session({
            mentor: mentor1._id, mentee: mentee1._id, subject: 'React Components Deep Dive',
            date: pastDate2, durationMinutes: 60, status: 'completed', attended: true,
            participants: [{ user: mentee1._id, status: 'confirmed' }],
            attendance: [{ user: mentee1._id, status: 'present', recordedBy: mentor1._id }]
        }).save();

        const pastSession3 = await new Session({
            mentor: mentor1._id, mentee: mentee1._id, subject: 'State Management & Hooks',
            date: pastDate3, durationMinutes: 60, status: 'completed', attended: true,
            participants: [{ user: mentee1._id, status: 'confirmed' }],
            attendance: [{ user: mentee1._id, status: 'present', recordedBy: mentor1._id }]
        }).save();

        await new Session({
            mentor: mentor1._id, mentee: mentee1._id, subject: 'Next Steps Review',
            date: futureDate, durationMinutes: 60, status: 'confirmed',
            participants: [{ user: mentee1._id, status: 'confirmed' }]
        }).save();
        console.log('   ✓ Sessions scheduled and logged');

        console.log('\n⭐ Creating Feedback & Evaluations...');
        // Mentee leaving feedback for Mentor
        await new Feedback({
            sessionId: pastSession1._id, mentorId: mentor1._id, menteeId: mentee1._id,
            rating: 5, text: 'Great introductory session. Sarah was very patient and explained the basics of React clearly.', sanitizedText: 'Great introductory session. Sarah was very patient and explained the basics of React clearly.'
        }).save();
        
        await new Feedback({
            sessionId: pastSession2._id, mentorId: mentor1._id, menteeId: mentee1._id,
            rating: 4, text: 'Very informative, but went a bit fast on the useEffect hook. Still learned a lot!', sanitizedText: 'Very informative, but went a bit fast on the useEffect hook. Still learned a lot!'
        }).save();
        
        await new Feedback({
            sessionId: pastSession3._id, mentorId: mentor1._id, menteeId: mentee1._id,
            rating: 5, text: 'Awesome breakdown of state management. The practical examples were extremely helpful.', sanitizedText: 'Awesome breakdown of state management. The practical examples were extremely helpful.'
        }).save();

        // Mentor leaving feedback for Mentee
        const editWindow = new Date(Date.now() + 7 * 86400000);
        await new MentorFeedback({
            sessionId: pastSession1._id, mentorId: mentor1._id, menteeId: mentee1._id,
            rating: 5, comment: 'Alex is highly motivated and grasps basic concepts quickly. Great start!', sanitizedComment: 'Alex is highly motivated and grasps basic concepts quickly. Great start!',
            competencies: [{ skillKey: 'communication', level: 5 }, { skillKey: 'technical', level: 3 }], editWindowClosesAt: editWindow
        }).save();

        await new MentorFeedback({
            sessionId: pastSession2._id, mentorId: mentor1._id, menteeId: mentee1._id,
            rating: 4, comment: 'Alex struggled slightly with useEffect, but asked the right questions. We will review it next time.', sanitizedComment: 'Alex struggled slightly with useEffect, but asked the right questions. We will review it next time.',
            competencies: [{ skillKey: 'problem_solving', level: 4 }, { skillKey: 'technical', level: 3 }], editWindowClosesAt: editWindow
        }).save();

        console.log('   ✓ Feedback recorded');

        console.log('\n🏆 Creating Certificates & Achievements...');
        await new Certificate({
            user: mentee1._id, mentor: mentor1._id, programName: 'Web Development Basics',
            certificateType: 'completion', serialNumber: 'CERT-001', verificationCode: 'VERIFY123',
            verificationUrl: 'https://verify.mentoring.com/CERT-001'
        }).save();
        
        await new Achievement({
            user: mentee1._id, code: 'FIRST_SESSION', title: 'First Session Completed', badgeUrl: 'https://example.com/badge.png'
        }).save();
        console.log('   ✓ Certificates and achievements awarded');

        console.log('\n🔔 Creating Notifications & Admin Logs...');
        await new Notification({
            user: mentee1._id, type: 'session_reminder', title: 'Upcoming Session', message: 'You have a session tomorrow!'
        }).save();
        
        await new AuditLog({
            action: 'USER_CREATED', resourceType: 'User', resourceId: mentee1._id.toString(), actorId: admin._id
        }).save();

        await new AdminUserAction({
            adminId: admin._id, userId: mentee1._id, action: 'approve', reason: 'Looks good'
        }).save();

        await new Announcement({
            title: 'Welcome to the Platform!', body: 'We are thrilled to have you here.', createdBy: admin._id, status: 'published'
        }).save();
        console.log('   ✓ System logs and notifications seeded');

        console.log('\n🧠 Generating Match Suggestions...');
        await generateSuggestionsForAllMentors({ limit: 10 });
        console.log('   ✓ Match suggestions generated');

        console.log('\n✅ Comprehensive Database Seeding Completed!');
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
};

seedDatabase();
