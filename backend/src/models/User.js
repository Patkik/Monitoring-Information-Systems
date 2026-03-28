const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstname: { type: String, required: function() { return !this.googleId; }, trim: true },
    lastname: { type: String, required: function() { return !this.googleId; }, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String },
    role: { type: String, enum: ['mentee', 'mentor', 'admin'], default: null },
    accountStatus: {
      type: String,
      enum: ['active', 'deactivated', 'suspended'],
      default: 'active',
      index: true,
    },
    deletedAt: { type: Date },
    googleId: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    resetPasswordCode: { type: String },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    
    // Email verification
    emailVerified: { type: Boolean, default: false },
    verificationCode: { type: String },
    verificationCodeExpires: { type: Date },
    verificationCodeAttempts: { type: Number, default: 0 },
    
    // Application fields for mentees
    applicationStatus: {
      type: String,
      enum: ['not_submitted', 'pending', 'approved', 'rejected'],
      default: 'not_submitted'
    },
    applicationRole: {
      type: String,
      enum: ['mentee', 'mentor', 'admin'],
      default: null
    },
    applicationData: {
      yearLevel: { type: String },
      program: { type: String },
      specificSkills: { type: String },
      corUrl: { type: String },
      major: { type: String },
      programmingLanguage: { type: String },
      motivation: { type: String },
      currentRole: { type: String },
      organization: { type: String },
      yearsOfExperience: { type: Number },
      expertiseAreas: [{ type: String }],
      mentoringTopics: [{ type: String }],
      mentoringGoals: { type: String },
      interests: [{ type: String }],
      professionalSummary: { type: String },
      achievements: { type: String },
      linkedinUrl: { type: String },
      portfolioUrl: { type: String },
      availabilityDays: [{ type: String }],
      availabilityHoursPerWeek: { type: Number },
      meetingFormats: [{ type: String }],
      educationRole: { type: String, enum: ['student', 'instructor'] },
      educationProgram: { type: String },
      educationYearLevel: { type: String },
      educationMajor: { type: String },
      supportingDocumentUrl: { type: String }
    },
    applicationSubmittedAt: { type: Date },
    applicationReviewedAt: { type: Date },
    applicationReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Mentee/Mentor Profile (separate from application data)
    profile: {
      displayName: { type: String, trim: true },
      photoUrl: { type: String },
      photoPublicId: { type: String, trim: true },
      bio: { type: String, trim: true },
        // Mentor-facing fields
        expertiseAreas: [{ type: String, trim: true }],
        skills: [{ type: String, trim: true }],
        availabilitySlots: [
          {
            day: { type: String, enum: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
            start: { type: String, trim: true }, // HH:mm (24h)
            end: { type: String, trim: true },   // HH:mm (24h)
          },
        ],
      education: {
        program: { type: String, trim: true },
        yearLevel: { type: String, trim: true },
        major: { type: String, trim: true },
        role: { type: String, enum: ['student', 'instructor'], default: 'student' }
      },
      coursesNeeded: [{ type: String, trim: true }],
      interests: [{ type: String, trim: true }],
      learningGoals: { type: String, trim: true },
      timezone: { type: String, trim: true },
      contactPreferences: [{ type: String, enum: ['email', 'in_app'] }],
      privacy: {
        bio: { type: String, enum: ['public', 'mentors', 'private'], default: 'public' },
        education: { type: String, enum: ['public', 'mentors', 'private'], default: 'public' },
          expertiseAreas: { type: String, enum: ['public', 'mentors', 'private'], default: 'public' },
          skills: { type: String, enum: ['public', 'mentors', 'private'], default: 'public' },
          availabilitySlots: { type: String, enum: ['public', 'mentors', 'private'], default: 'public' },
        interests: { type: String, enum: ['public', 'mentors', 'private'], default: 'public' },
        learningGoals: { type: String, enum: ['public', 'mentors', 'private'], default: 'public' },
        coursesNeeded: { type: String, enum: ['public', 'mentors', 'private'], default: 'public' },
        contact: { type: String, enum: ['public', 'mentors', 'private'], default: 'private' },
        photo: { type: String, enum: ['public', 'mentors', 'private'], default: 'public' },
        displayName: { type: String, enum: ['public', 'mentors', 'private'], default: 'public' }
      }
    },
    notificationSettings: {
      channels: {
        sessionReminders: {
          inApp: { type: Boolean, default: true },
          email: { type: Boolean, default: true }
        },
        matches: {
          inApp: { type: Boolean, default: true },
          email: { type: Boolean, default: true }
        },
        announcements: {
          inApp: { type: Boolean, default: true },
          email: { type: Boolean, default: false }
        },
        messages: {
          inApp: { type: Boolean, default: true },
          email: { type: Boolean, default: true }
        }
      },
      sessionReminders: {
        enabled: { type: Boolean, default: true },
        offsets: {
          type: [Number],
          default: function () {
            return [2880, 1440, 60];
          },
          validate: {
            validator(value) {
              if (!Array.isArray(value) || value.length === 0) {
                return false;
              }
              return value.every((item) => Number.isFinite(item) && item > 0 && item <= 10080);
            },
            message: 'Reminders must be between 1 and 10080 minutes.',
          },
        },
      },
    },
    mentorSettings: {
      capacity: {
        type: Number,
        min: 1,
        default: 3,
      },
      activeMenteesCount: {
        type: Number,
        min: 0,
        default: 0,
      },
      capacityUpdatedAt: { type: Date },
    },
    calendarIntegrations: {
      google: {
        refreshToken: { type: String },
        calendarId: { type: String, trim: true, default: 'primary' },
        accountEmail: { type: String, trim: true },
        grantedScopes: [{ type: String }],
        syncEnabled: { type: Boolean, default: false },
        connectedAt: { type: Date },
        lastSyncedAt: { type: Date },
        hasSynced: { type: Boolean, default: false },
        lastError: {
          code: { type: String },
          message: { type: String },
          occurredAt: { type: Date },
        },
        createdAt: { type: Date },
        updatedAt: { type: Date },
      },
    },
    feedbackStats: {
      totalReviews: { type: Number, default: 0 },
      totalScore: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0 },
      lastReviewAt: { type: Date },
    },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Indexes for common queries
// Optimize mentor directory lookups and general auth by role/status and email
userSchema.index({ role: 1, applicationStatus: 1 });
userSchema.index({ accountStatus: 1, deletedAt: 1 });
userSchema.index({ role: 1, 'feedbackStats.averageRating': -1 });
userSchema.index({ ratingAvg: -1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);


