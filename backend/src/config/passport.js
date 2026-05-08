const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/User');
const { getServerBaseUrl } = require('./urls');

const serverUrl = getServerBaseUrl();

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && serverUrl) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${serverUrl}/api/auth/google/callback`
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log('Google OAuth Profile:', {
            id: profile.id,
            name: profile.name,
            emails: profile.emails,
            displayName: profile.displayName
          });
          
          let user = await User.findOne({ googleId: profile.id });
          if (!user) {
            // Check if user exists with same email
            const existingUser = await User.findOne({ email: profile.emails?.[0]?.value });
            if (existingUser) {
              // Link Google account to existing user
              existingUser.googleId = profile.id;
              // If the existing user has no role yet, set sensible defaults to avoid forcing role selection
              if (!existingUser.role) {
                existingUser.role = 'mentee';
                existingUser.applicationStatus = 'not_submitted';
                existingUser.applicationRole = 'mentee';
              }
              await existingUser.save();
              return done(null, existingUser);
            }
            
            // Create new user
            user = new User({
              firstname: profile.name?.givenName || profile.displayName?.split(' ')[0] || 'Google',
              lastname: profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ') || 'User',
              email: profile.emails?.[0]?.value,
              googleId: profile.id,
              // Default role: mentee to streamline onboarding; user can change later in settings
              role: 'mentee',
              applicationStatus: 'not_submitted',
              applicationRole: 'mentee'
            });
            await user.save();
            console.log('Created new Google user:', user.email);
          } else {
            console.log('Found existing Google user:', user.email);
          }
          return done(null, user);
        } catch (err) {
          console.error('Google OAuth Error:', err);
          return done(err, null);
        }
      }
    )
  );
} else {
  // eslint-disable-next-line no-console
  console.warn('Google OAuth disabled: missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET or SERVER_URL/API_BASE_URL');
}

if (process.env.FACEBOOK_APP_ID && (process.env.FACEBOOK_APP_SECRET || process.env.FACEBOOK_CLIENT_SECRET) && serverUrl) {
  const facebookClientSecret = process.env.FACEBOOK_APP_SECRET || process.env.FACEBOOK_CLIENT_SECRET;
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: facebookClientSecret,
        callbackURL: `${serverUrl}/api/auth/facebook/callback`,
        profileFields: ['id', 'emails', 'name', 'displayName']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;

          if (!email) {
            return done(null, false, { message: 'FACEBOOK_NO_EMAIL' });
          }

          let user = await User.findOne({ facebookId: profile.id });
          if (!user) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
              existingUser.facebookId = profile.id;
              // If the existing user has no role yet, set sensible defaults to avoid forcing role selection
              if (!existingUser.role) {
                existingUser.role = 'mentee';
                existingUser.applicationStatus = 'not_submitted';
                existingUser.applicationRole = 'mentee';
              }
              await existingUser.save();
              user = existingUser;
            } else {
              const firstname = profile.name?.givenName || profile.displayName?.split(' ')[0] || 'Facebook';
              const lastnameCandidate = profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ');
              const lastname = lastnameCandidate && lastnameCandidate.trim().length > 0 ? lastnameCandidate : 'User';

              user = new User({
                firstname,
                lastname,
                email,
                facebookId: profile.id,
                // Default role: mentee to streamline onboarding; user can change later in settings
                role: 'mentee',
                applicationStatus: 'not_submitted',
                applicationRole: 'mentee'
              });
              await user.save();
            }
          }

          return done(null, user);
        } catch (err) {
          console.error('Facebook OAuth Error:', err);
          return done(err, null);
        }
      }
    )
  );
} else {
  // eslint-disable-next-line no-console
  console.warn('Facebook OAuth disabled: missing FACEBOOK_APP_ID/FACEBOOK_APP_SECRET or SERVER_URL/API_BASE_URL');
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;


