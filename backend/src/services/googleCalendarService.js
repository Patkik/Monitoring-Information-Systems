const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { google } = require('googleapis');
const User = require('../models/User');
const logger = require('../utils/logger');
const { encryptSecret, decryptSecret, isTokenSecretConfigured } = require('../utils/tokenVault');
const { getServerBaseUrl } = require('../config/urls');

const serverUrl = getServerBaseUrl();
const CLIENT_ID = process.env.GOOGLE_CALENDAR_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CALENDAR_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
const STATE_SECRET = process.env.GOOGLE_CALENDAR_STATE_SECRET || process.env.JWT_SECRET;
const REDIRECT_URI =
  process.env.GOOGLE_CALENDAR_REDIRECT_URI || (serverUrl ? `${serverUrl}/api/integrations/google-calendar/callback` : null);
const SCOPES = (process.env.GOOGLE_CALENDAR_SCOPES || 'https://www.googleapis.com/auth/calendar.events')
  .split(',')
  .map((scope) => scope.trim())
  .filter(Boolean);

const isConfigured = () => Boolean(CLIENT_ID && CLIENT_SECRET && STATE_SECRET && REDIRECT_URI && isTokenSecretConfigured());

const buildConfigError = (message = 'Google Calendar integration is not configured yet.') => {
  const error = new Error(message);
  error.code = 'GOOGLE_CALENDAR_NOT_CONFIGURED';
  return error;
};

const getOAuthClient = () => {
  if (!isConfigured()) {
    throw buildConfigError();
  }

  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
};

const createStateToken = (userId) => {
  if (!STATE_SECRET) {
    throw buildConfigError('Missing GOOGLE_CALENDAR_STATE_SECRET or JWT_SECRET');
  }

  const payload = {
    sub: userId,
    nonce: crypto.randomBytes(12).toString('hex'),
  };

  return jwt.sign(payload, STATE_SECRET, { expiresIn: '10m' });
};

const verifyStateToken = (state) => {
  if (!state) {
    const error = new Error('Missing OAuth state parameter');
    error.code = 'GOOGLE_CALENDAR_STATE_MISSING';
    throw error;
  }

  if (!STATE_SECRET) {
    throw buildConfigError('Missing GOOGLE_CALENDAR_STATE_SECRET or JWT_SECRET');
  }

  return jwt.verify(state, STATE_SECRET);
};

const serializeStatus = (user) => {
  if (!user) {
    return { connected: false };
  }

  const googleIntegration = user.calendarIntegrations?.google;
  if (!googleIntegration || !googleIntegration.refreshToken) {
    return {
      connected: false,
      accountEmail: user.email,
      calendarId: 'primary',
      lastSyncedAt: null,
      connectedAt: null,
      hasSynced: false,
      lastError: null,
      featureDisabled: false,
    };
  }

  const connectedAt = googleIntegration.connectedAt || googleIntegration.createdAt || googleIntegration.updatedAt || null;
  const hasSynced = Boolean(googleIntegration.hasSynced || googleIntegration.lastSyncedAt);

  return {
    connected: googleIntegration.syncEnabled !== false,
    accountEmail: googleIntegration.accountEmail || user.email,
    calendarId: googleIntegration.calendarId || 'primary',
    lastSyncedAt: googleIntegration.lastSyncedAt || null,
    connectedAt,
    hasSynced,
    lastError: googleIntegration.lastError || null,
    featureDisabled: false,
    message: googleIntegration.syncEnabled === false ? 'Sync paused. Reconnect to resume automatic invites.' : undefined,
  };
};

const getStatusForUser = async (userId) => {
  const user = await User.findById(userId).select('email calendarIntegrations');
  if (!user) {
    const error = new Error('User not found');
    error.code = 'USER_NOT_FOUND';
    throw error;
  }

  return serializeStatus(user);
};

const generateAuthUrlForUser = (userId) => {
  const oauth = getOAuthClient();
  const state = createStateToken(userId);
  const url = oauth.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    state,
  });

  return { url };
};

const persistIntegration = async (userId, data) => {
  const now = new Date();
  await User.updateOne(
    { _id: userId },
    {
      $set: {
        'calendarIntegrations.google': {
          ...data,
          syncEnabled: data.syncEnabled !== false,
          connectedAt: data.connectedAt || now,
          lastSyncedAt: null,
          hasSynced: false,
          lastError: null,
          createdAt: data.createdAt || now,
          updatedAt: now,
        },
      },
    }
  );
};

const completeOAuthConnection = async ({ code, state }) => {
  if (!code) {
    const error = new Error('Missing authorization code');
    error.code = 'GOOGLE_CALENDAR_CODE_MISSING';
    throw error;
  }

  const payload = verifyStateToken(state);
  const userId = payload?.sub;
  if (!userId) {
    const error = new Error('Invalid OAuth state payload');
    error.code = 'GOOGLE_CALENDAR_STATE_INVALID';
    throw error;
  }

  const user = await User.findById(userId).select('email');
  if (!user) {
    const error = new Error('User not found for Google Calendar connection');
    error.code = 'USER_NOT_FOUND';
    throw error;
  }

  const oauth = getOAuthClient();
  const { tokens } = await oauth.getToken(code);
  if (!tokens?.refresh_token) {
    const error = new Error('Google did not return a refresh token. Remove the existing grant and try again.');
    error.code = 'GOOGLE_REFRESH_TOKEN_MISSING';
    throw error;
  }

  oauth.setCredentials(tokens);

  let accountEmail = user.email;
  try {
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth });
    const { data } = await oauth2.userinfo.get();
    accountEmail = data?.email;
  } catch (profileError) {
    logger.warn('Failed to fetch Google profile for calendar integration:', profileError?.message || profileError);
  }

  const encryptedRefreshToken = encryptSecret(tokens.refresh_token);
  const grantedScopes = Array.isArray(tokens?.scope)
    ? tokens.scope
    : typeof tokens?.scope === 'string'
      ? tokens.scope.split(' ')
      : SCOPES;

  await persistIntegration(userId, {
    refreshToken: encryptedRefreshToken,
    accountEmail,
    grantedScopes,
    calendarId: 'primary',
    syncEnabled: true,
  });

  return { userId };
};

const disconnectGoogleCalendar = async (userId) => {
  await User.updateOne(
    { _id: userId },
    {
      $unset: {
        'calendarIntegrations.google': '',
      },
    }
  );
};

const recordIntegrationError = async (userId, code, message) => {
  await User.updateOne(
    { _id: userId },
    {
      $set: {
        'calendarIntegrations.google.lastError': {
          code,
          message,
          occurredAt: new Date(),
        },
        'calendarIntegrations.google.updatedAt': new Date(),
      },
    }
  );
};

const clearIntegrationError = async (userId) => {
  await User.updateOne(
    { _id: userId },
    {
      $set: {
        'calendarIntegrations.google.lastError': null,
        'calendarIntegrations.google.lastSyncedAt': new Date(),
        'calendarIntegrations.google.hasSynced': true,
        'calendarIntegrations.google.updatedAt': new Date(),
      },
    }
  );
};

const buildEventPayload = ({ session, mentor, mentees }) => {
  const timezone = mentor?.profile?.timezone || 'UTC';
  const start = new Date(session.date);
  const durationMinutes = session.durationMinutes || 60;
  const end = new Date(start.getTime() + durationMinutes * 60000);

  const mentorName = [mentor?.firstname, mentor?.lastname].filter(Boolean).join(' ').trim();
  const attendeeEntries = [];

  if (mentor?.email) {
    attendeeEntries.push({ email: mentor.email, displayName: mentorName || mentor.email, organizer: true });
  }

  mentees
    .filter((mentee) => mentee?.email)
    .forEach((mentee) => {
      attendeeEntries.push({
        email: mentee.email,
        displayName: [mentee.firstname, mentee.lastname].filter(Boolean).join(' ').trim() || mentee.email,
      });
    });

  const descriptionLines = [
    `Mentor: ${mentorName || mentor?.email || 'Mentor'}`,
    `Meeting link / room: ${session.room}`,
    mentees.length
      ? `Participants: ${mentees.map((mentee) => `${mentee.firstname || ''} ${mentee.lastname || ''}`.trim()).join(', ')}`
      : null,
  ].filter(Boolean);

  return {
    summary: session.subject,
    description: descriptionLines.join('\n'),
    location: session.room,
    start: {
      dateTime: start.toISOString(),
      timeZone: timezone,
    },
    end: {
      dateTime: end.toISOString(),
      timeZone: timezone,
    },
    attendees: attendeeEntries,
    reminders: { useDefault: true },
  };
};

const getCalendarClientForMentor = (mentor) => {
  if (!isConfigured()) {
    return { skipped: 'config_missing' };
  }

  const integration = mentor?.calendarIntegrations?.google;
  if (!integration || !integration.refreshToken || integration.syncEnabled === false) {
    return { skipped: 'not_connected' };
  }

  const refreshToken = decryptSecret(integration.refreshToken);
  if (!refreshToken) {
    return { error: 'TOKEN_DECRYPT_FAILED' };
  }

  const oauth = getOAuthClient();
  oauth.setCredentials({ refresh_token: refreshToken });
  const calendar = google.calendar({ version: 'v3', auth: oauth });

  return { calendar, integration };
};

const persistSessionEventMetadata = async (session, mentorId, calendarId, event) => {
  session.calendarEvent = {
    provider: 'google',
    externalId: event.id,
    calendarId,
    htmlLink: event.htmlLink,
    hangoutLink: event.hangoutLink,
    status: event.status,
    updatedAt: event.updated ? new Date(event.updated) : new Date(),
    lastSyncedAt: new Date(),
  };

  session.googleEvents = Array.isArray(session.googleEvents) ? session.googleEvents : [];
  const existingIndex = session.googleEvents.findIndex((entry) => entry.user?.toString() === mentorId.toString());
  const entryPayload = {
    user: mentorId,
    eventId: event.id,
    calendarId,
    status: event.status,
    syncedAt: new Date(),
  };
  if (existingIndex >= 0) {
    session.googleEvents[existingIndex] = entryPayload;
  } else {
    session.googleEvents.push(entryPayload);
  }

  await session.save();
  await clearIntegrationError(mentorId);
};

const upsertMentorSessionEvent = async ({ session, mentor, mentees, operation = 'insert' }) => {
  const clientResult = getCalendarClientForMentor(mentor);

  if (clientResult.skipped) {
    return { skipped: clientResult.skipped };
  }

  if (clientResult.error) {
    await recordIntegrationError(mentor._id, clientResult.error, 'Reconnect your Google Calendar to continue syncing sessions.');
    return {
      warning: {
        code: 'GOOGLE_CALENDAR_TOKEN_INVALID',
        message: 'Session saved but Google Calendar sync is paused. Reconnect your Google Calendar to resume sending invites.',
      },
    };
  }

  const { calendar, integration } = clientResult;
  const calendarId = integration.calendarId || 'primary';
  const eventPayload = buildEventPayload({ session, mentor, mentees });
  const existingEventId = session.calendarEvent?.externalId;

  try {
    let response;
    if (operation === 'patch' && existingEventId) {
      response = await calendar.events.patch({
        calendarId,
        eventId: existingEventId,
        requestBody: eventPayload,
        sendUpdates: 'all',
      });
    } else {
      response = await calendar.events.insert({
        calendarId,
        requestBody: eventPayload,
        sendUpdates: 'all',
      });
    }

    const event = response?.data;
    if (event) {
      await persistSessionEventMetadata(session, mentor._id, calendarId, event);
    }

    return { success: true };
  } catch (error) {
    const message = error?.errors?.[0]?.message || error?.message || 'Failed to sync session to Google Calendar';
    logger.error('Google Calendar sync failed:', message);
    await recordIntegrationError(mentor._id, 'GOOGLE_CALENDAR_SYNC_FAILED', message);
    return {
      warning: {
        code: 'GOOGLE_CALENDAR_SYNC_FAILED',
        message: 'Session saved but Calendar invites were not sent. Check your Google connection in Profile settings.',
      },
    };
  }
};

const syncMentorSessionEvent = (args) => upsertMentorSessionEvent({ ...args, operation: 'insert' });

const updateMentorSessionEvent = (args) => upsertMentorSessionEvent({
  ...args,
  operation: args.session?.calendarEvent?.externalId ? 'patch' : 'insert',
});

const deleteMentorSessionEvent = async ({ session, mentor }) => {
  const clientResult = getCalendarClientForMentor(mentor);

  if (clientResult.skipped) {
    return { skipped: clientResult.skipped };
  }

  if (clientResult.error) {
    return {
      warning: {
        code: 'GOOGLE_CALENDAR_TOKEN_INVALID',
        message: 'Calendar connection invalid. Removal skipped.',
      },
    };
  }

  const eventId = session.calendarEvent?.externalId;
  if (!eventId) {
    return { skipped: 'no_event' };
  }

  const { calendar, integration } = clientResult;
  const calendarId = integration.calendarId || 'primary';

  try {
    await calendar.events.delete({ calendarId, eventId, sendUpdates: 'all' });
    session.calendarEvent = null;
    session.googleEvents = (session.googleEvents || []).filter((entry) => entry.eventId !== eventId);
    await session.save();
    return { success: true };
  } catch (error) {
    const message = error?.errors?.[0]?.message || error?.message || 'Failed to remove calendar event';
    logger.error('Google Calendar delete failed:', message);
    await recordIntegrationError(mentor._id, 'GOOGLE_CALENDAR_SYNC_FAILED', message);
    return {
      warning: {
        code: 'GOOGLE_CALENDAR_SYNC_FAILED',
        message: 'Session cancelled but Calendar event removal failed.',
      },
    };
  }
};

module.exports = {
  isConfigured,
  getStatusForUser,
  generateAuthUrlForUser,
  completeOAuthConnection,
  disconnectGoogleCalendar,
  syncMentorSessionEvent,
  updateMentorSessionEvent,
  deleteMentorSessionEvent,
};
