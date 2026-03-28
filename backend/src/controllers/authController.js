const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendPasswordResetEmail, sendVerificationCodeEmail } = require('../utils/emailService');
const { verifyRecaptchaToken } = require('../utils/recaptcha');

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes

const createJwt = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

const ACCOUNT_DEACTIVATED_MESSAGE = 'Your account has been deactivated. Only an administrator can reactivate it.';

exports.register = async (req, res) => {
  try {
    const { firstname, lastname, email, password, role, recaptchaToken } = req.body;

    const recaptchaResult = await verifyRecaptchaToken(recaptchaToken, req.ip);
    if (!recaptchaResult.ok) {
      return res.status(recaptchaResult.status).json({
        error: recaptchaResult.code,
        message: recaptchaResult.message,
        details: recaptchaResult.details
      });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'EMAIL_EXISTS' });
    const resolvedRole = role || 'mentee';
    // Prevent public registration for admin accounts; admins must be provisioned via back-office
    if (resolvedRole === 'admin') {
      return res.status(403).json({ error: 'ADMIN_REGISTRATION_FORBIDDEN', message: 'Admin accounts can only be created by an administrator.' });
    }
    // Admins must be explicitly approved by another admin (disabled for UI flows)
    const initialStatus = resolvedRole === 'admin' ? 'pending' : 'not_submitted';
    const initialApplicationRole = resolvedRole === 'admin' ? 'admin' : resolvedRole;

    const user = new User({
      firstname,
      lastname,
      email,
      password,
      role: resolvedRole,
      applicationStatus: initialStatus,
      applicationRole: initialApplicationRole,
      applicationData: {}
    });
    await user.save();
    // create JWT for immediate login after registration
    const token = createJwt(user);
    return res.status(201).json({
      token,
      role: user.role,
      user: {
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
        applicationStatus: user.applicationStatus,
        applicationRole: user.applicationRole,
        accountStatus: user.accountStatus || 'active'
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'NETWORK_ERROR' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, recaptchaToken } = req.body;

    const recaptchaResult = await verifyRecaptchaToken(recaptchaToken, req.ip);
    if (!recaptchaResult.ok) {
      return res.status(recaptchaResult.status).json({
        error: recaptchaResult.code,
        message: recaptchaResult.message,
        details: recaptchaResult.details
      });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'INVALID_CREDENTIALS' });

    if (user.accountStatus && user.accountStatus !== 'active') {
      return res.status(403).json({
        error: 'ACCOUNT_DEACTIVATED',
        message: ACCOUNT_DEACTIVATED_MESSAGE
      });
    }

    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(403).json({ error: 'ACCOUNT_LOCKED' });
    }

    const passwordOk = await user.comparePassword(password);
    if (!passwordOk) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
        user.loginAttempts = 0;
      }
      await user.save();
      return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
    }

    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    const token = createJwt(user);
    return res.json({
      token,
      role: user.role || null,
      user: {
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role || null,
        applicationStatus: user.applicationStatus,
        applicationRole: user.applicationRole,
        accountStatus: user.accountStatus || 'active'
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'NETWORK_ERROR' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email, recaptchaToken } = req.body;

    const recaptchaResult = await verifyRecaptchaToken(recaptchaToken, req.ip);
    if (!recaptchaResult.ok) {
      return res.status(recaptchaResult.status).json({
        error: recaptchaResult.code,
        message: recaptchaResult.message,
        details: recaptchaResult.details
      });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'INVALID_TOKEN' });

    // Generate a 6-character alphanumeric reset code
    const resetCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    user.resetPasswordCode = resetCode;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    try {
      await sendPasswordResetEmail(user.email, resetCode);
    } catch (emailErr) {
      // Log email error but don't block the request for development
      console.warn('Password reset email failed to send:', emailErr.message);
      // In development, still return success so user can proceed
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEV] Password reset code for ${email}: ${resetCode}`);
      }
    }

    return res.json({ message: 'RESET_EMAIL_SENT' });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ error: 'NETWORK_ERROR' });
  }
};

exports.verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'MISSING_FIELDS', message: 'Email and code are required.' });
    }

    const user = await User.findOne({
      email,
      resetPasswordCode: code.toUpperCase(),
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'INVALID_CODE', message: 'Invalid or expired reset code.' });
    }

    return res.json({ message: 'CODE_VERIFIED', success: true });
  } catch (err) {
    console.error('Verify code error:', err);
    return res.status(500).json({ error: 'NETWORK_ERROR' });
  }
};

exports.verifyResetCode = async (req, res) => {
  try {
    const { email, code, password } = req.body;

    if (!email || !code || !password) {
      return res.status(400).json({ error: 'MISSING_FIELDS', message: 'Email, code, and password are required.' });
    }

    const user = await User.findOne({
      email,
      resetPasswordCode: code.toUpperCase(),
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'INVALID_CODE', message: 'Invalid or expired reset code.' });
    }

    user.password = password;
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.json({ message: 'PASSWORD_RESET', success: true });
  } catch (err) {
    console.error('Verify reset code error:', err);
    return res.status(500).json({ error: 'NETWORK_ERROR' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    if (!user) return res.status(400).json({ error: 'INVALID_TOKEN' });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    return res.json({ message: 'PASSWORD_RESET' });
  } catch (err) {
    return res.status(500).json({ error: 'NETWORK_ERROR' });
  }
};

exports.googleAuthCallback = (req, res) => {
  const redirectBase = process.env.CLIENT_URL || 'http://localhost:5173';
  if (req.user?.accountStatus && req.user.accountStatus !== 'active') {
    return res.redirect(`${redirectBase}/login?error=ACCOUNT_DEACTIVATED`);
  }
  const token = createJwt(req.user);
  return res.redirect(`${redirectBase}/oauth/callback?token=${token}`);
};

// Facebook OAuth handlers
exports.facebookAuthCallback = (req, res) => {
  const redirectBase = process.env.CLIENT_URL || 'http://localhost:5173';
  if (req.user?.accountStatus && req.user.accountStatus !== 'active') {
    return res.redirect(`${redirectBase}/login?error=ACCOUNT_DEACTIVATED`);
  }
  const token = createJwt(req.user);
  return res.redirect(`${redirectBase}/oauth/callback?token=${token}`);
};

exports.updateRole = async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.user.id;

    if (!['mentee', 'mentor', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'INVALID_ROLE' });
    }

    // Prevent non-admin users from setting themselves as admin via this API
    if (role === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'UNAUTHORIZED_ROLE_CHANGE', message: 'Only administrators may assign the admin role.' });
    }

    const update = {
      role,
      applicationData: {},
      applicationSubmittedAt: undefined,
      applicationReviewedAt: undefined,
      applicationReviewedBy: undefined
    };

    if (role === 'admin') {
      // When switching to admin, mark as pending until approved
      update.applicationStatus = 'pending';
      update.applicationRole = 'admin';
    } else {
      update.applicationStatus = 'not_submitted';
      update.applicationRole = role;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      update,
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'USER_NOT_FOUND' });
    }

    res.json({
      success: true,
      message: 'Role updated successfully',
      user: {
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
        applicationStatus: user.applicationStatus,
        applicationRole: user.applicationRole,
        accountStatus: user.accountStatus || 'active'
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'NETWORK_ERROR' });
  }
};

exports.profile = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
    // Select password only to compute passwordSet; do not return it to client
  const user = await User.findById(userId).select('firstname lastname email role applicationStatus applicationRole applicationData profile password accountStatus');
    if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });

    return res.json({
      id: user._id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role || null,
      applicationStatus: user.applicationStatus || 'not_submitted',
      applicationRole: user.applicationRole || null,
      applicationData: user.applicationData || {},
      profile: user.profile || {},
      accountStatus: user.accountStatus || 'active',
      passwordSet: Boolean(user.password)
    });
  } catch (err) {
    console.error('Profile fetch error:', err);
    return res.status(500).json({ error: 'NETWORK_ERROR' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'INVALID_CREDENTIALS' });

    const {
      firstname,
      lastname,
      applicationData
    } = req.body;

    const update = {};
    if (firstname !== undefined) update.firstname = firstname;
    if (lastname !== undefined) update.lastname = lastname;
    if (applicationData) {
      // Only allow expected fields to be updated
      const allowed = ['professionalSummary', 'program', 'mentoringGoals', 'interests', 'yearLevel', 'specificSkills'];
      const sanitized = {};
      allowed.forEach((k) => {
        if (applicationData[k] !== undefined) sanitized[k] = applicationData[k];
      });
      update.applicationData = { ...(sanitized || {}) };
    }

    const user = await User.findByIdAndUpdate(userId, { $set: update }, { new: true }).select('firstname lastname email role applicationStatus applicationRole applicationData accountStatus');
    if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });

    return res.json({
      message: 'PROFILE_UPDATED',
      user: {
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role || null,
        applicationStatus: user.applicationStatus || 'not_submitted',
        applicationRole: user.applicationRole || null,
        applicationData: user.applicationData || {},
        accountStatus: user.accountStatus || 'active'
      }
    });
  } catch (err) {
    console.error('Profile update error:', err);
    return res.status(500).json({ error: 'NETWORK_ERROR' });
  }
};

exports.setPassword = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'INVALID_CREDENTIALS' });

    const { password } = req.body || {};
    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'WEAK_PASSWORD', message: 'Password must be at least 8 characters.' });
    }

    const user = await User.findById(userId).select('password');
    if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });

    if (user.password) {
      return res.status(400).json({ error: 'PASSWORD_ALREADY_SET', message: 'Password already set. Use reset password instead.' });
    }

    user.password = password; // will be hashed by pre-save hook
    await user.save();

    return res.json({ success: true, message: 'PASSWORD_SET' });
  } catch (err) {
    console.error('Set password error:', err);
    return res.status(500).json({ error: 'NETWORK_ERROR' });
  }
};

// Send 6-digit verification code to email
exports.sendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'EMAIL_REQUIRED', message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'USER_NOT_FOUND', message: 'No account found with this email' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: 'EMAIL_ALREADY_VERIFIED', message: 'Email is already verified' });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiration to 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Save code to user
    user.verificationCode = code;
    user.verificationCodeExpires = expiresAt;
    user.verificationCodeAttempts = 0;
    await user.save();

    // Send email
    try {
      await sendVerificationCodeEmail(user.email, code, user.firstname);
      return res.json({
        success: true,
        message: 'Verification code sent to your email',
        expiresAt: expiresAt.toISOString()
      });
    } catch (emailErr) {
      console.error('Failed to send verification email:', emailErr);
      return res.status(500).json({
        error: 'EMAIL_SEND_FAILED',
        message: 'Failed to send verification email. Please try again later.'
      });
    }
  } catch (err) {
    console.error('sendVerificationCode error:', err);
    return res.status(500).json({ error: 'NETWORK_ERROR', message: 'An error occurred' });
  }
};

// Verify the 6-digit code
exports.verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        error: 'MISSING_FIELDS',
        message: 'Email and verification code are required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'USER_NOT_FOUND', message: 'No account found with this email' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: 'EMAIL_ALREADY_VERIFIED', message: 'Email is already verified' });
    }

    if (!user.verificationCode || !user.verificationCodeExpires) {
      return res.status(400).json({
        error: 'NO_CODE_SENT',
        message: 'No verification code has been sent. Please request a new code.'
      });
    }

    // Check if code expired
    if (user.verificationCodeExpires < Date.now()) {
      return res.status(400).json({
        error: 'CODE_EXPIRED',
        message: 'Verification code has expired. Please request a new code.'
      });
    }

    // Check attempt limit (max 5 attempts)
    if (user.verificationCodeAttempts >= 5) {
      return res.status(429).json({
        error: 'TOO_MANY_ATTEMPTS',
        message: 'Too many failed attempts. Please request a new code.'
      });
    }

    // Verify code
    if (user.verificationCode !== code.trim()) {
      user.verificationCodeAttempts += 1;
      await user.save();
      
      const attemptsLeft = 5 - user.verificationCodeAttempts;
      return res.status(400).json({
        error: 'INVALID_CODE',
        message: `Invalid verification code. ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining.`,
        attemptsLeft
      });
    }

    // Code is valid - mark email as verified
    user.emailVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    user.verificationCodeAttempts = 0;
    await user.save();

    // Generate JWT token for auto-login after verification
    const token = createJwt(user);

    return res.json({
      success: true,
      message: 'Email verified successfully',
      token,
      user: {
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        applicationStatus: user.applicationStatus,
        applicationRole: user.applicationRole,
        accountStatus: user.accountStatus || 'active'
      }
    });
  } catch (err) {
    console.error('verifyEmail error:', err);
    return res.status(500).json({ error: 'NETWORK_ERROR', message: 'An error occurred' });
  }
};


