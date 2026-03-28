const express = require('express');
const passport = require('passport');
const controller = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();
const isGoogleConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const facebookAppId = process.env.FACEBOOK_APP_ID || process.env.FACEBOOK_CLIENT_ID;
const facebookAppSecret = process.env.FACEBOOK_APP_SECRET || process.env.FACEBOOK_CLIENT_SECRET;
const isFacebookConfigured = !!(facebookAppId && facebookAppSecret);

router.post('/auth/register', controller.register);
router.post('/auth/login', controller.login);
router.post('/auth/forgot-password', controller.forgotPassword);
router.post('/auth/verify-code', controller.verifyCode);
router.post('/auth/verify-reset-code', controller.verifyResetCode);
router.post('/auth/reset-password/:token', controller.resetPassword);
router.post('/auth/set-password', auth, controller.setPassword);

// Email verification endpoints
router.post('/auth/send-verification-code', controller.sendVerificationCode);
router.post('/auth/verify-email', controller.verifyEmail);

router.get('/auth/google', (req, res, next) => {
  if (!isGoogleConfigured) return res.status(503).json({ error: 'OAUTH_DISABLED' });
  // Starting Google OAuth flow
  return passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
});

router.get('/auth/facebook', (req, res, next) => {
  if (!isFacebookConfigured) return res.status(503).json({ error: 'OAUTH_DISABLED' });
  console.log('Starting Facebook OAuth flow...');
  return passport.authenticate('facebook', { scope: ['email'], session: false })(req, res, next);
});

// Debug endpoint to check OAuth configuration
router.get('/auth/debug', (req, res) => {
  res.json({
    googleConfigured: isGoogleConfigured,
    facebookConfigured: isFacebookConfigured,
    clientId: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Missing',
    facebookAppId: facebookAppId ? 'Set' : 'Missing',
    facebookAppSecret: facebookAppSecret ? 'Set' : 'Missing',
    serverUrl: process.env.SERVER_URL,
    clientUrl: process.env.CLIENT_URL,
    googleCallbackUrl: `${process.env.SERVER_URL || 'http://localhost:4000'}/api/auth/google/callback`,
    facebookCallbackUrl: `${process.env.SERVER_URL || 'http://localhost:4000'}/api/auth/facebook/callback`
  });
});

router.get('/auth/google/callback', (req, res, next) => {
  if (!isGoogleConfigured) return res.status(503).send('Google OAuth not configured');
  
  console.log('OAuth callback received:', {
    code: req.query.code ? 'Present' : 'Missing',
    error: req.query.error,
    state: req.query.state
  });
  
  return passport.authenticate('google', { session: false }, (err, user, info) => {
    console.log('OAuth callback - Error:', err?.message || 'None');
    console.log('OAuth callback - User:', user ? 'User found' : 'No user');
    console.log('OAuth callback - Info:', info);
    
    if (err) {
      console.error('OAuth Error Details:', {
        code: err.code,
        message: err.message,
        status: err.status
      });
      
      // Handle specific OAuth errors
      if (err.code === 'invalid_grant') {
        return res.redirect((process.env.CLIENT_URL || 'http://localhost:5173') + '/login?error=OAUTH_CODE_EXPIRED');
      }
      
      return res.redirect((process.env.CLIENT_URL || 'http://localhost:5173') + '/login?error=OAUTH_ERROR');
    }
    
    if (!user) {
      console.log('OAuth: No user returned from Google');
      return res.redirect((process.env.CLIENT_URL || 'http://localhost:5173') + '/login?error=INVALID_CREDENTIALS');
    }
    
    req.user = user;
    return controller.googleAuthCallback(req, res);
  })(req, res, next);
});

router.get('/auth/facebook/callback', (req, res, next) => {
  if (!isFacebookConfigured) return res.status(503).send('Facebook OAuth not configured');

  return passport.authenticate('facebook', { session: false }, (err, user, info) => {
    if (err) {
      console.error('Facebook OAuth Error:', err);
      return res.redirect((process.env.CLIENT_URL || 'http://localhost:5173') + '/login?error=OAUTH_ERROR');
    }

    if (info?.message === 'FACEBOOK_NO_EMAIL') {
      return res.redirect((process.env.CLIENT_URL || 'http://localhost:5173') + '/login?error=OAUTH_EMAIL_REQUIRED');
    }

    if (!user) {
      return res.redirect((process.env.CLIENT_URL || 'http://localhost:5173') + '/login?error=INVALID_CREDENTIALS');
    }

    req.user = user;
    return controller.facebookAuthCallback(req, res);
  })(req, res, next);
});

// Update user role
router.patch('/auth/update-role', auth, controller.updateRole);

// Update profile (firstname/lastname and applicationData)
router.patch('/auth/profile', auth, controller.updateProfile);

// Get profile for authenticated user
router.get('/auth/profile', auth, controller.profile);

module.exports = router;


