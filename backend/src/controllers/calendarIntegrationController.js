const googleCalendarService = require('../services/googleCalendarService');
const { ok, fail } = require('../utils/responses');
const logger = require('../utils/logger');
const { getPrimaryClientUrl } = require('../config/urls');

const getClientBaseUrl = () => {
  return getPrimaryClientUrl();
};

const buildCallbackRedirect = (status, message) => {
  const base = getClientBaseUrl();
  if (!base) {
    throw new Error('CLIENT_URL_NOT_CONFIGURED');
  }
  const search = new URLSearchParams({ status, message: message || '' });
  return `${base.replace(/\/$/, '')}/integrations/google-calendar/callback?${search.toString()}`;
};

exports.getStatus = async (req, res) => {
  if (!googleCalendarService.isConfigured()) {
    return ok(res, {
      integration: {
        connected: false,
        featureDisabled: true,
        message: 'Google Calendar integration is not yet available. Ask an admin to configure it.',
      },
    });
  }

  try {
    const integration = await googleCalendarService.getStatusForUser(req.user.id);
    return ok(res, { integration });
  } catch (error) {
    logger.error('Failed to load Google Calendar status:', error);
    const code = error?.code === 'USER_NOT_FOUND' ? 404 : 500;
    return fail(res, code, error?.code || 'GOOGLE_CALENDAR_STATUS_FAILED', error?.message || 'Unable to load calendar status.');
  }
};

exports.getAuthUrl = async (req, res) => {
  if (!googleCalendarService.isConfigured()) {
    return fail(res, 503, 'GOOGLE_CALENDAR_NOT_CONFIGURED', 'Google Calendar integration is disabled.');
  }

  try {
    const { url } = googleCalendarService.generateAuthUrlForUser(req.user.id);
    return ok(res, { url });
  } catch (error) {
    logger.error('Failed to create Google Calendar auth URL:', error);
    return fail(res, 500, 'GOOGLE_CALENDAR_URL_FAILED', 'Unable to start Google Calendar connection.');
  }
};

exports.disconnect = async (req, res) => {
  try {
    await googleCalendarService.disconnectGoogleCalendar(req.user.id);
    return ok(res, { message: 'Google Calendar disconnected.' });
  } catch (error) {
    logger.error('Failed to disconnect Google Calendar:', error);
    return fail(res, 500, 'GOOGLE_CALENDAR_DISCONNECT_FAILED', 'Unable to disconnect Google Calendar.');
  }
};

exports.handleCallback = async (req, res) => {
  const { error, error_description: errorDescription, code, state } = req.query || {};

  if (!getClientBaseUrl()) {
    return fail(res, 500, 'CLIENT_URL_NOT_CONFIGURED', 'Client URL configuration is missing.');
  }

  if (!googleCalendarService.isConfigured()) {
    return res.redirect(buildCallbackRedirect('error', 'Google Calendar integration is disabled.'));
  }

  if (error) {
    const description = errorDescription || error;
    return res.redirect(buildCallbackRedirect('error', description));
  }

  try {
    await googleCalendarService.completeOAuthConnection({ code, state });
    return res.redirect(buildCallbackRedirect('success', 'Google Calendar connected successfully.'));
  } catch (callbackError) {
    logger.error('Google Calendar OAuth callback failed:', callbackError);
    const message = callbackError?.message || 'Unable to connect Google Calendar.';
    return res.redirect(buildCallbackRedirect('error', message));
  }
};
