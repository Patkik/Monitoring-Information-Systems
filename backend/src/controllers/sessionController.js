const crypto = require('crypto');
const mongoose = require('mongoose');
const { DateTime } = require('luxon');
const Session = require('../models/Session');
const Availability = require('../models/Availability');
const BookingLock = require('../models/BookingLock');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const ChatThread = require('../models/ChatThread');
const notificationService = require('../utils/notificationService');
const { annotateSessionsWithMeta, formatSessionRow, summarizePerson } = require('../utils/sessionFormatter');
const googleCalendarService = require('../services/googleCalendarService');

const NOTIFICATION_DISPATCH_TIMEOUT_MS = 2500;
const SESSION_CANCEL_PENALTY_HOURS = Number(process.env.SESSION_CANCEL_PENALTY_HOURS || 6);
const SESSION_ATTENDANCE_EDIT_DAYS = Number(process.env.SESSION_ATTENDANCE_EDIT_DAYS || 14);
const SESSION_BOOKING_LOCK_SECONDS = Number(process.env.SESSION_BOOKING_LOCK_SECONDS || 120);
const DEFAULT_BOOKING_SUBJECT = 'Mentoring Session';
const DEFAULT_ROOM_PLACEHOLDER = 'Virtual meeting link to be shared upon confirmation.';

const toObjectId = (id) => (mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null);

const extractIdString = (value) => {
  if (value == null) {
    return null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || null;
  }

  if (value instanceof mongoose.Types.ObjectId) {
    return value.toString();
  }

  if (typeof value === 'object') {
    const fromObjectId = extractIdString(value._id);
    if (fromObjectId) {
      return fromObjectId;
    }

    const fromId = extractIdString(value.id);
    if (fromId) {
      return fromId;
    }

    if (typeof value.toHexString === 'function') {
      const hex = value.toHexString();
      if (typeof hex === 'string' && hex) {
        return hex;
      }
    }
  }

  if (typeof value.toString === 'function') {
    const stringified = value.toString();
    if (typeof stringified === 'string' && stringified && stringified !== '[object Object]') {
      return stringified;
    }
  }

  return null;
};

const normalizeUserId = (value) => {
  if (!value) {
    return null;
  }

  const trimmed = typeof value === 'string' ? value.trim() : value;
  if (!trimmed) {
    return null;
  }

  return toObjectId(trimmed) || trimmed;
};

const buildMenteeScopeFilter = (user) => {
  const rawId = (user && user.id) || user;
  const normalized = normalizeUserId(rawId);

  if (!normalized) {
    return {};
  }

  return {
    $or: [
      { mentee: normalized },
      { participants: { $elemMatch: { user: normalized } } },
    ],
  };
};

const parseFilters = (req, scope = 'mentee') => {
  const { from, to, mentor, mentee, topic, page, limit } = req.query || {};
  const filters = {};

  if (scope === 'mentor') {
    filters.mentor = normalizeUserId(req.user.id) || req.user.id;
  } else {
    const menteeFilter = buildMenteeScopeFilter(req.user);
    if (Object.keys(menteeFilter).length === 0) {
      // Ensure no unintended records are returned if the user id is missing
      filters._id = null;
    } else {
      Object.assign(filters, menteeFilter);
    }
  }

  if (from) {
    filters.date = filters.date || {};
    const d = new Date(from);
    if (!Number.isNaN(d.getTime())) filters.date.$gte = d;
  }
  if (to) {
    filters.date = filters.date || {};
    const d = new Date(to);
    if (!Number.isNaN(d.getTime())) filters.date.$lte = d;
  }
  if (scope === 'mentee' && mentor) {
    const oid = toObjectId(mentor);
    if (oid) filters.mentor = oid;
  }
  if (scope === 'mentor' && mentee) {
    const oid = toObjectId(mentee);
    if (oid) filters.mentee = oid;
  }
  if (topic) {
    filters.subject = new RegExp(String(topic).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  return { filters, page: pageNum, limit: limitNum };
};

const formatInviteDate = (date) => {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  } catch (error) {
    console.warn('formatInviteDate fallback:', error.message);
    return date.toISOString();
  }
};

let notificationAdapter = {
  sendNotification: notificationService.sendNotification,
};

const sendNotificationSafe = (payload) => notificationAdapter.sendNotification(payload);

const clampDurationMinutes = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 60;
  return Math.min(240, Math.max(15, parsed));
};

const sanitizeSubject = (subject) => {
  if (typeof subject !== 'string') {
    return DEFAULT_BOOKING_SUBJECT;
  }
  const trimmed = subject.trim();
  return trimmed || DEFAULT_BOOKING_SUBJECT;
};

const sanitizeRoom = (room) => {
  if (typeof room !== 'string') {
    return DEFAULT_ROOM_PLACEHOLDER;
  }
  const trimmed = room.trim();
  return trimmed || DEFAULT_ROOM_PLACEHOLDER;
};

const computeEndDate = (start, durationMinutes) => {
  const minutes = clampDurationMinutes(durationMinutes);
  return new Date(start.getTime() + minutes * 60000);
};

const isSameMinute = (a, b) => Math.abs(new Date(a).getTime() - new Date(b).getTime()) < 60 * 1000;

const normalizeWeekday = (dt) => {
  const weekday = dt.weekday % 7;
  return weekday; // Sunday => 0, Monday => 1, etc.
};

const matchesRecurringSlot = (availability, scheduledAt) => {
  if (!Array.isArray(availability.recurring)) {
    return false;
  }

  return availability.recurring.some((rule) => {
    if (typeof rule.dayOfWeek !== 'number' || !rule.startTime) {
      return false;
    }

    const zone = rule.timezone || availability.timezone || 'UTC';
    const scheduled = DateTime.fromJSDate(scheduledAt, { zone });
    if (!scheduled.isValid) {
      return false;
    }

    if (normalizeWeekday(scheduled) !== rule.dayOfWeek) {
      return false;
    }

    const scheduledTime = scheduled.toFormat('HH:mm');
    return scheduledTime === rule.startTime;
  });
};

const matchesOneOffSlot = (availability, scheduledAt) => {
  if (!Array.isArray(availability.oneOff)) {
    return false;
  }

  return availability.oneOff.some((slot) => slot.start && isSameMinute(slot.start, scheduledAt));
};

const isScheduledWithinAvailability = (availability, scheduledAt) => {
  if (!availability) {
    return false;
  }

  if (availability.type === 'recurring') {
    return matchesRecurringSlot(availability, scheduledAt);
  }

  return matchesOneOffSlot(availability, scheduledAt);
};

const hasMentorConflict = async ({ mentorId, start, end, excludeId, availabilityId }) => {
  const conflict = await Session.findOne({
    mentor: mentorId,
    status: { $nin: ['cancelled'] },
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    date: { $lt: end },
    endDate: { $gt: start },
    ...(availabilityId
      ? {
          $nor: [
            {
              availabilityRef: availabilityId,
              date: start,
            },
          ],
        }
      : {}),
  })
    .select('_id date endDate status')
    .lean();

  return Boolean(conflict);
};

const countSlotUsage = async ({ mentorId, availabilityId, start }) => {
  if (!availabilityId) {
    return 0;
  }

  return Session.countDocuments({
    mentor: mentorId,
    availabilityRef: availabilityId,
    date: start,
    status: { $nin: ['cancelled'] },
  });
};

const recordSessionAudit = async ({ actorId, sessionId, action, metadata }) => {
  try {
    await AuditLog.create({
      actorId,
      action,
      resourceType: 'session',
      resourceId: sessionId.toString(),
      metadata: metadata || {},
    });
  } catch (error) {
    console.error('session audit log failed:', error.message);
  }
};

const collectParticipantIds = (session) => {
  const ids = new Set();
  const menteeId = extractIdString(session?.mentee);
  if (menteeId) ids.add(menteeId);

  if (Array.isArray(session.participants)) {
    session.participants.forEach((entry) => {
      const participantId = extractIdString(entry?.user);
      if (participantId) ids.add(participantId);
    });
  }

  return Array.from(ids);
};

const notifySessionParticipants = async ({ session, actorId, type, title, message, data = {} }) => {
  const participantIds = collectParticipantIds(session);
  const notifications = participantIds.map((userId) => {
    if (actorId && userId.toString() === actorId.toString()) {
      return null;
    }

    return sendNotificationSafe({
      userId,
      type,
      title,
      message,
      data: {
        sessionId: session._id,
        ...data,
      },
    });
  });

  await Promise.all(notifications.filter(Boolean));
};

const ensureSessionChatThread = async (session) => {
  if (session.chatThread) {
    return session.chatThread;
  }

  try {
    const mentorId = session.mentor;
    const participantIds = collectParticipantIds(session);
    const uniqueIds = Array.from(new Set([mentorId?.toString(), ...participantIds].filter(Boolean))).map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    if (!uniqueIds.length) {
      return null;
    }

    const thread = await ChatThread.create({
      type: 'session',
      title: `${session.subject} (${session.room || 'Virtual'})`,
      session: session._id,
      mentor: mentorId,
      participants: uniqueIds,
      participantStates: uniqueIds.map((userId) => ({ user: userId, unreadCount: 0 })),
    });

    session.chatThread = thread._id;
    await session.save();
    return thread._id;
  } catch (error) {
    console.error('ensureSessionChatThread failed:', error.message);
    return null;
  }
};

const buildSessionResponse = async (session, warnings = []) => {
  await session.populate('mentor', 'firstname lastname email profile calendarIntegrations');
  await session.populate('mentee', 'firstname lastname email');
  await session.populate('participants.user', 'firstname lastname email');
  const [annotated] = await annotateSessionsWithMeta([session]);
  const payload = annotated || formatSessionRow(session);
  if (warnings.length) {
    return { session: payload, meta: { warnings } };
  }

  return { session: payload };
};

const userCanAccessSession = (session, user) => {
  if (!session || !user) {
    return false;
  }

  if (user.role === 'admin') {
    return true;
  }

  const userId = extractIdString(user.id || user._id || user);
  if (!userId) {
    return false;
  }

  const mentorId = extractIdString(session.mentor);
  if (mentorId === userId) {
    return true;
  }

  const menteeId = extractIdString(session.mentee);
  if (menteeId === userId) {
    return true;
  }

  if (Array.isArray(session.participants)) {
    const match = session.participants.find((entry) => extractIdString(entry?.user) === userId);
    if (match) {
      return true;
    }
  }

  return false;
};


exports.getMenteeSessions = async (req, res) => {
  try {
    const { filters, page, limit } = parseFilters(req, 'mentee');
    const { cursor } = req.query || {};
    const { parseDateCursor } = require('../utils/cursor');

    // Cursor pagination (preferred) falls back to page-based if no cursor provided
    const query = Session.find(filters).sort({ date: -1 });

    let usingCursor = false;
    if (cursor) {
      usingCursor = true;
      const cursorDate = parseDateCursor(cursor);
      if (cursorDate) {
        query.where({ date: { $lt: cursorDate } });
      }
    } else {
      query.skip((page - 1) * limit);
    }

    query
      .limit(limit)
      .select('subject mentor mentee participants room capacity isGroup chatThread date durationMinutes status statusMeta attended completedAt tasksCompleted notes createdAt updatedAt calendarEvent')
      .populate('mentor', 'firstname lastname email')
      .populate('mentee', 'firstname lastname email')
      .populate('participants.user', 'firstname lastname email')
      .lean();

  const sessions = await query.exec();

    // Only compute total count when not using cursor (costly on large collections)
    let total; let totalPages; let nextCursor = null;
    if (!usingCursor) {
      total = await Session.countDocuments(filters);
      totalPages = Math.max(1, Math.ceil(total / limit));
    }

    if (sessions.length === limit) {
      // nextCursor is the last session's date (descending sort)
      nextCursor = sessions[sessions.length - 1].date.toISOString();
    }

  const rows = await annotateSessionsWithMeta(sessions);

    return res.json({
      success: true,
      sessions: rows,
      meta: usingCursor
        ? { cursor: nextCursor, limit, count: rows.length, usingCursor: true }
        : { total, page, limit, totalPages, count: rows.length, usingCursor: false },
    });
  } catch (error) {
    console.error('getMenteeSessions error:', error);
    return res.status(500).json({ success: false, error: 'SESSIONS_FETCH_FAILED', message: 'Unable to fetch sessions.' });
  }
};

exports.getMentorSessions = async (req, res) => {
  if (req.user.role !== 'mentor') {
    return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Mentor access required.' });
  }

  try {
    const { filters, page, limit } = parseFilters(req, 'mentor');
    const { cursor } = req.query || {};
    const { parseDateCursor } = require('../utils/cursor');

    const query = Session.find(filters).sort({ date: -1 });

    let usingCursor = false;
    if (cursor) {
      usingCursor = true;
      const cursorDate = parseDateCursor(cursor);
      if (cursorDate) {
        query.where({ date: { $lt: cursorDate } });
      }
    } else {
      query.skip((page - 1) * limit);
    }

    query
      .limit(limit)
      .select('subject mentor mentee participants room capacity isGroup chatThread date durationMinutes status statusMeta attended completedAt tasksCompleted notes createdAt updatedAt calendarEvent')
      .populate('mentee', 'firstname lastname email')
      .populate('mentor', 'firstname lastname email')
      .populate('participants.user', 'firstname lastname email')
      .lean();

  const sessions = await query.exec();

    let total; let totalPages; let nextCursor = null;
    if (!usingCursor) {
      total = await Session.countDocuments(filters);
      totalPages = Math.max(1, Math.ceil(total / limit));
    }

    if (sessions.length === limit) {
      nextCursor = sessions[sessions.length - 1].date.toISOString();
    }

  const rows = await annotateSessionsWithMeta(sessions);

    return res.json({
      success: true,
      sessions: rows,
      meta: usingCursor
        ? { cursor: nextCursor, limit, count: rows.length, usingCursor: true }
        : { total, page, limit, totalPages, count: rows.length, usingCursor: false },
    });
  } catch (error) {
    console.error('getMentorSessions error:', error);
    return res.status(500).json({ success: false, error: 'SESSIONS_FETCH_FAILED', message: 'Unable to fetch mentor sessions.' });
  }
};

exports.createMentorSession = async (req, res) => {
  if (req.user.role !== 'mentor') {
    return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Only mentors can create sessions.' });
  }

  try {
    const mentorAccount = await User.findById(req.user.id)
      .select('firstname lastname email profile calendarIntegrations')
      .lean();

    if (!mentorAccount) {
      return res.status(404).json({ success: false, error: 'MENTOR_NOT_FOUND', message: 'Mentor profile not found.' });
    }

    const { subject, date, durationMinutes = 60, room, capacity = 1, participantIds } = req.body || {};

    const trimmedSubject = typeof subject === 'string' ? subject.trim() : '';
    if (!trimmedSubject) {
      return res.status(400).json({ success: false, error: 'SUBJECT_REQUIRED', message: 'Session subject is required.' });
    }

    const trimmedRoom = typeof room === 'string' ? room.trim() : '';
    if (!trimmedRoom) {
      return res.status(400).json({ success: false, error: 'ROOM_REQUIRED', message: 'Please provide a room or meeting link.' });
    }

    const scheduledDate = date ? new Date(date) : null;
    if (!scheduledDate || Number.isNaN(scheduledDate.getTime())) {
      return res.status(400).json({ success: false, error: 'INVALID_DATE', message: 'Provide a valid ISO date/time.' });
    }

    if (scheduledDate.getTime() < Date.now() - 60_000) {
      return res.status(400).json({ success: false, error: 'PAST_DATE_NOT_ALLOWED', message: 'Session date must be in the future.' });
    }

    const parsedDuration = Math.min(240, Math.max(15, Number(durationMinutes) || 60));
    const parsedCapacity = Math.min(200, Math.max(1, Number(capacity) || 1));

    const rawParticipants = Array.isArray(participantIds) ? participantIds : [];
    const normalizedParticipants = [...new Set(rawParticipants.map((id) => (id ? id.toString().trim() : '')).filter(Boolean))];

    if (!normalizedParticipants.length) {
      return res.status(400).json({ success: false, error: 'PARTICIPANTS_REQUIRED', message: 'Select at least one mentee.' });
    }

    if (normalizedParticipants.includes(req.user.id)) {
      return res.status(400).json({ success: false, error: 'INVALID_PARTICIPANT', message: 'You cannot add yourself as a participant.' });
    }

    if (normalizedParticipants.length > parsedCapacity) {
      return res.status(400).json({ success: false, error: 'CAPACITY_EXCEEDED', message: 'Capacity must be greater than or equal to the number of invitees.' });
    }

    const mentees = await User.find({ _id: { $in: normalizedParticipants } })
      .select('firstname lastname email role applicationStatus');

    if (mentees.length !== normalizedParticipants.length) {
      return res.status(404).json({ success: false, error: 'MENTEE_NOT_FOUND', message: 'One or more invitees could not be found.' });
    }

    const invalidInvitees = mentees.filter((mentee) => mentee.role !== 'mentee');
    if (invalidInvitees.length) {
      return res.status(400).json({ success: false, error: 'INVITEE_NOT_ELIGIBLE', message: 'All invitees must be registered as mentees.' });
    }

    const participantDocs = mentees.map((mentee) => ({
      user: mentee._id,
      status: 'invited',
    }));

    const mentorObjectId = new mongoose.Types.ObjectId(req.user.id);
    const session = await Session.create({
      mentor: mentorObjectId,
      mentee: participantDocs.length === 1 ? participantDocs[0].user : undefined,
      subject: trimmedSubject,
      date: scheduledDate,
      durationMinutes: parsedDuration,
      room: trimmedRoom,
      capacity: parsedCapacity,
      isGroup: participantDocs.length > 1,
      participants: participantDocs,
      status: 'confirmed',
      statusMeta: { confirmedAt: new Date() },
    });

    const warnings = [];
    let chatThreadId = null;

    try {
  const threadParticipantIds = [mentorObjectId, ...participantDocs.map((entry) => entry.user)];
      const thread = await ChatThread.create({
        type: 'session',
        title: `${trimmedSubject} (${trimmedRoom})`,
        session: session._id,
        mentor: mentorObjectId,
        participants: threadParticipantIds,
        participantStates: threadParticipantIds.map((userId) => ({ user: userId, unreadCount: 0 })),
      });

      session.chatThread = thread._id;
      chatThreadId = thread._id;
      await session.save();
    } catch (threadError) {
      console.error('mentor session chat thread failed:', threadError);
      warnings.push({
        code: 'CHAT_THREAD_SYNC_FAILED',
        message: 'Session saved but the shared chat space is still syncing. Refresh shortly to access it.',
      });
    }

    const inviteMessage = `Your mentor scheduled "${trimmedSubject}" on ${formatInviteDate(scheduledDate)} at ${trimmedRoom}.`;
    const notificationJob = Promise.allSettled(
        participantDocs.map((participant) =>
          sendNotificationSafe({
          userId: participant.user,
          type: 'SESSION_INVITE',
          title: 'New mentoring session scheduled',
          message: inviteMessage,
          data: {
            sessionId: session._id,
            chatThreadId,
            scheduledAt: scheduledDate,
          },
        })
      )
    );

    let notifyOutcome;
    let notificationTimeoutId;
    try {
      notifyOutcome = await Promise.race([
        notificationJob,
        new Promise((resolve) => {
          notificationTimeoutId = setTimeout(() => resolve('timeout'), NOTIFICATION_DISPATCH_TIMEOUT_MS);
        }),
      ]);
    } finally {
      if (notificationTimeoutId) {
        clearTimeout(notificationTimeoutId);
      }
    }

    if (notifyOutcome === 'timeout') {
      warnings.push({
        code: 'INVITES_IN_PROGRESS',
        message: 'Invitations are still sending. Participants should receive them shortly.',
      });

  notificationJob
        .then((results) => {
          const delayedFailures = results.filter(
            (entry) => entry.status === 'rejected' || entry.value?.delivered === false
          );
          if (delayedFailures.length) {
            console.warn('mentor session invites background failures', {
              sessionId: session._id.toString(),
              failureCount: delayedFailures.length,
            });
          }
        })
        .catch((notifyError) => {
          console.error('mentor session invites background error:', notifyError);
        });
    } else {
      const failedNotifications = notifyOutcome.filter(
        (entry) => entry.status === 'rejected' || entry.value?.delivered === false
      );

      if (failedNotifications.length) {
        warnings.push({
          code: 'INVITES_PARTIAL_DELIVERY',
          message: `${failedNotifications.length} invite${failedNotifications.length > 1 ? 's' : ''} may take longer to deliver. Participants can still join from their Sessions page.`,
        });
      }
    }

    try {
      const calendarResult = await googleCalendarService.syncMentorSessionEvent({
        session,
        mentor: mentorAccount,
        mentees,
      });

      if (calendarResult?.warning) {
        warnings.push(calendarResult.warning);
      }
    } catch (calendarError) {
      console.error('mentor session calendar sync failed:', calendarError);
      warnings.push({
        code: 'GOOGLE_CALENDAR_SYNC_FAILED',
        message: 'Session saved but Google Calendar sync failed. Reconnect Google Calendar in Profile settings to resume automatic invites.',
      });
    }

    let hydrated;
    try {
      hydrated = await Session.findById(session._id)
        .select('subject mentor mentee participants room capacity isGroup chatThread date durationMinutes status statusMeta attended completedAt tasksCompleted notes createdAt updatedAt calendarEvent')
        .populate('mentor', 'firstname lastname email')
        .populate('mentee', 'firstname lastname email')
        .populate('participants.user', 'firstname lastname email')
        .lean();
    } catch (hydrateError) {
      console.error('mentor session hydrate failed:', hydrateError);
      warnings.push({
        code: 'SESSION_LOOKUP_DELAYED',
        message: 'Session saved but details may take a moment to appear. Try refreshing if it is missing.',
      });
    }

    let responseRow = hydrated ? formatSessionRow(hydrated) : null;
    let annotationSource = hydrated;
    if (!responseRow) {
      // Fallback to a minimal payload using already-loaded mentee docs
      const menteeLookup = new Map(mentees.map((mentee) => [mentee._id.toString(), mentee]));
      const fallbackParticipants = participantDocs.map((entry) => {
        const relatedUser = menteeLookup.get(entry.user.toString());
        return relatedUser ? { ...entry, user: relatedUser } : entry;
      });

      let fallbackMentor = mentorAccount
        ? {
            _id: mentorAccount._id,
            firstname: mentorAccount.firstname,
            lastname: mentorAccount.lastname,
            email: mentorAccount.email,
          }
        : null;
      if (!fallbackMentor) {
        try {
          fallbackMentor = await User.findById(req.user.id).select('firstname lastname email').lean();
        } catch (mentorLookupError) {
          console.error('mentor session mentor lookup failed:', mentorLookupError);
        }
      }

      const fallbackDoc = {
        _id: session._id,
        subject: session.subject,
        mentor: fallbackMentor,
        mentee: fallbackParticipants.length === 1 ? fallbackParticipants[0].user : null,
        participants: fallbackParticipants,
        room: session.room,
        capacity: session.capacity,
        isGroup: session.isGroup,
        chatThread: chatThreadId,
        date: session.date,
        durationMinutes: session.durationMinutes,
        attended: session.attended,
        tasksCompleted: session.tasksCompleted,
        notes: session.notes,
        calendarEvent: session.calendarEvent || null,
        createdAt: session.createdAt || session.date,
        updatedAt: session.updatedAt || session.date,
      };

      annotationSource = fallbackDoc;
      responseRow = formatSessionRow(fallbackDoc) || {
        id: session._id.toString(),
        subject: session.subject,
        mentor: fallbackMentor ? summarizePerson(fallbackMentor) : null,
        mentee: null,
        participants: [],
        participantCount: fallbackParticipants.length,
        room: session.room,
        capacity: session.capacity,
        isGroup: session.isGroup,
        chatThreadId: chatThreadId ? chatThreadId.toString() : null,
        date: session.date,
        durationMinutes: session.durationMinutes,
        attended: !!session.attended,
        tasksCompleted: session.tasksCompleted || 0,
        notes: session.notes || null,
      };
    }

    if (annotationSource) {
      const [annotated] = await annotateSessionsWithMeta([annotationSource]);
      if (annotated) {
        responseRow = annotated;
      }
    }

    const meta = warnings.length ? { warnings } : undefined;

    return res.status(201).json({ success: true, session: responseRow, ...(meta ? { meta } : {}) });
  } catch (error) {
    console.error('createMentorSession error:', error);
    return res.status(500).json({ success: false, error: 'SESSION_CREATE_FAILED', message: 'Unable to create session.' });
  }
};

exports.bookSession = async (req, res) => {
  if (req.user.role !== 'mentee') {
    return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Only mentees can request sessions.' });
  }

  const menteeId = normalizeUserId(req.user.id);

  try {
    const { mentorId: bodyMentorId, scheduledAt, durationMinutes, room, subject, availabilityRef, lockId } = req.body || {};
    const mentorId = toObjectId(bodyMentorId);
    if (!mentorId) {
      return res.status(400).json({ success: false, error: 'MENTOR_REQUIRED', message: 'Select a mentor to book.' });
    }

    const scheduled = scheduledAt ? new Date(scheduledAt) : null;
    if (!scheduled || Number.isNaN(scheduled.getTime())) {
      return res.status(400).json({ success: false, error: 'INVALID_DATE', message: 'Provide a valid start time.' });
    }

    if (scheduled.getTime() < Date.now()) {
      return res.status(400).json({ success: false, error: 'PAST_DATE_NOT_ALLOWED', message: 'Please pick a future time.' });
    }

    const duration = clampDurationMinutes(durationMinutes);
    const endDate = computeEndDate(scheduled, duration);

    const mentor = await User.findById(mentorId).select('firstname lastname email role profile calendarIntegrations');
    if (!mentor || mentor.role !== 'mentor') {
      return res.status(404).json({ success: false, error: 'MENTOR_NOT_FOUND', message: 'Mentor not found.' });
    }

    let availabilityDoc = null;
    if (availabilityRef) {
      availabilityDoc = await Availability.findOne({ _id: availabilityRef, mentor: mentorId, active: true });
      if (!availabilityDoc) {
        return res.status(404).json({ success: false, error: 'AVAILABILITY_NOT_FOUND', message: 'Selected slot is unavailable.' });
      }

      if (!isScheduledWithinAvailability(availabilityDoc, scheduled)) {
        return res.status(400).json({ success: false, error: 'SLOT_OUT_OF_RANGE', message: 'Selected time does not match the availability slot.' });
      }
    }

    let bookingLockDoc = null;
    if (lockId) {
      bookingLockDoc = await BookingLock.findOne({ key: lockId, mentor: mentorId, createdBy: menteeId });
      if (!bookingLockDoc) {
        return res.status(410).json({ success: false, error: 'BOOKING_LOCK_EXPIRED', message: 'The booking hold expired. Refresh and try again.' });
      }

      if (!isSameMinute(bookingLockDoc.scheduledAt, scheduled)) {
        return res.status(400).json({ success: false, error: 'BOOKING_LOCK_MISMATCH', message: 'Booking lock does not match the selected time.' });
      }

      if (availabilityDoc && (!bookingLockDoc.availability || bookingLockDoc.availability.toString() !== availabilityDoc._id.toString())) {
        return res.status(400).json({ success: false, error: 'BOOKING_LOCK_SLOT_MISMATCH', message: 'Booking lock does not match the selected slot.' });
      }
    }

    const slotCapacity = availabilityDoc ? availabilityDoc.capacity : 1;

    const overlap = await hasMentorConflict({
      mentorId,
      start: scheduled,
      end: endDate,
      availabilityId: availabilityDoc?._id,
    });
    if (overlap) {
      return res.status(409).json({ success: false, error: 'MENTOR_CONFLICT', message: 'Mentor already has a session that overlaps with this time.' });
    }

    const slotUsage = await countSlotUsage({ mentorId, availabilityId: availabilityDoc?._id, start: scheduled });
    if (slotUsage >= slotCapacity) {
      return res.status(409).json({ success: false, error: 'SLOT_FULL', message: 'This time slot has already been fully booked.' });
    }

    const safeSubject = sanitizeSubject(subject);
    const safeRoom = sanitizeRoom(room || availabilityDoc?.note);

    const session = await Session.create({
      mentor: mentorId,
      mentee: menteeId,
      subject: safeSubject,
      date: scheduled,
      durationMinutes: duration,
      room: safeRoom,
      capacity: slotCapacity,
      isGroup: slotCapacity > 1,
      availabilityRef: availabilityDoc?._id,
      lockId: lockId || undefined,
      participants: [
        {
          user: menteeId,
          status: 'pending',
          invitedAt: new Date(),
        },
      ],
      status: 'pending',
    });

    if (bookingLockDoc) {
      await bookingLockDoc.deleteOne();
    }

    // Ensure a chat thread exists for this session so mentor and mentee can communicate.
    // Keep this non-blocking for the booking flow — failures should not prevent session creation.
    let chatThreadId = null;
    try {
      const threadId = await ensureSessionChatThread(session);
      if (threadId) chatThreadId = threadId;
    } catch (threadErr) {
      console.error('bookSession ensureSessionChatThread failed:', threadErr);
    }

    await recordSessionAudit({
      actorId: menteeId,
      sessionId: session._id,
      action: 'session:book',
      metadata: {
        mentorId,
        availabilityId: availabilityDoc?._id,
      },
    });

    const bookingMessage = `${req.user.firstname || 'A mentee'} requested "${safeSubject}" on ${formatInviteDate(scheduled)}.`;
    await sendNotificationSafe({
      userId: mentorId,
      type: 'SESSION_BOOKING_REQUEST',
      title: 'New session booking pending confirmation',
      message: bookingMessage,
      data: { sessionId: session._id, chatThreadId },
    });

    await session.populate('mentor', 'firstname lastname email');
    await session.populate('mentee', 'firstname lastname email');
    await session.populate('participants.user', 'firstname lastname email');
    const [annotated] = await annotateSessionsWithMeta([session]);

    return res.status(201).json({ success: true, session: annotated || formatSessionRow(session) });
  } catch (error) {
    console.error('bookSession error:', error);
    return res.status(500).json({ success: false, error: 'SESSION_BOOK_FAILED', message: 'Unable to create session booking.' });
  }
};

exports.getSessionDetail = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'INVALID_SESSION_ID', message: 'Invalid session identifier.' });
    }

    const session = await Session.findById(id)
      .populate('mentor', 'firstname lastname email')
      .populate('mentee', 'firstname lastname email')
      .populate('participants.user', 'firstname lastname email');

    if (!session) {
      return res.status(404).json({ success: false, error: 'SESSION_NOT_FOUND', message: 'Session not found.' });
    }

    if (!userCanAccessSession(session, req.user)) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'You do not have access to this session.' });
    }

    const [annotated] = await annotateSessionsWithMeta([session]);
    return res.json({ success: true, session: annotated || formatSessionRow(session) });
  } catch (error) {
    console.error('getSessionDetail error:', error);
    return res.status(500).json({ success: false, error: 'SESSION_LOOKUP_FAILED', message: 'Unable to load session.' });
  }
};

exports.confirmSession = async (req, res) => {
  if (req.user.role !== 'mentor') {
    return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Only mentors can confirm sessions.' });
  }

  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'INVALID_SESSION_ID', message: 'Invalid session identifier.' });
    }

    const session = await Session.findById(id)
      .populate('mentor', 'firstname lastname email profile calendarIntegrations')
      .populate('mentee', 'firstname lastname email')
      .populate('participants.user', 'firstname lastname email');

    if (!session) {
      return res.status(404).json({ success: false, error: 'SESSION_NOT_FOUND', message: 'Session not found.' });
    }

  if (session.mentor._id.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'You can only confirm your own sessions.' });
    }

    if (session.status === 'cancelled') {
      return res.status(400).json({ success: false, error: 'SESSION_CANCELLED', message: 'Cancelled sessions cannot be confirmed.' });
    }

    session.status = 'confirmed';
    session.statusMeta = {
      ...(session.statusMeta || {}),
      confirmedAt: new Date(),
    };

    await ensureSessionChatThread(session);
    await session.save();

    await recordSessionAudit({
      actorId: req.user.id,
      sessionId: session._id,
      action: 'session:confirm',
    });

    const mentees = session.mentee
      ? [session.mentee]
      : (session.participants || []).map((entry) => entry.user).filter(Boolean);

    const warnings = [];
    try {
      const result = await googleCalendarService.syncMentorSessionEvent({
        session,
        mentor: session.mentor,
        mentees,
      });
      if (result?.warning) {
        warnings.push(result.warning);
      }
    } catch (calendarError) {
      console.error('confirm session calendar sync failed:', calendarError);
      warnings.push({
        code: 'GOOGLE_CALENDAR_SYNC_FAILED',
        message: 'Session confirmed but Calendar sync failed. Reconnect Google Calendar to resume invites.',
      });
    }

    const message = `${req.user.firstname || 'Your mentor'} confirmed "${session.subject}" on ${formatInviteDate(session.date)}.`;
    await notifySessionParticipants({
      session,
      actorId: req.user.id,
      type: 'SESSION_CONFIRMED',
      title: 'Session confirmed',
      message,
    });

    const payload = await buildSessionResponse(session, warnings);
    return res.json({ success: true, ...payload });
  } catch (error) {
    console.error('confirmSession error:', error);
    return res.status(500).json({ success: false, error: 'SESSION_CONFIRM_FAILED', message: 'Unable to confirm session.' });
  }
};

exports.rescheduleSession = async (req, res) => {
  if (req.user.role !== 'mentor') {
    return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Only mentors can reschedule sessions.' });
  }

  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'INVALID_SESSION_ID', message: 'Invalid session identifier.' });
    }

    const session = await Session.findById(id)
      .populate('mentor', 'firstname lastname email profile calendarIntegrations')
      .populate('mentee', 'firstname lastname email')
      .populate('participants.user', 'firstname lastname email');

    if (!session) {
      return res.status(404).json({ success: false, error: 'SESSION_NOT_FOUND', message: 'Session not found.' });
    }

    if (session.mentor._id.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'You can only reschedule your own sessions.' });
    }

    if (session.status === 'cancelled') {
      return res.status(400).json({ success: false, error: 'SESSION_CANCELLED', message: 'Cancelled sessions cannot be rescheduled.' });
    }

    const { scheduledAt, durationMinutes, availabilityRef } = req.body || {};
    const newDate = scheduledAt ? new Date(scheduledAt) : null;
    if (!newDate || Number.isNaN(newDate.getTime())) {
      return res.status(400).json({ success: false, error: 'INVALID_DATE', message: 'Provide a valid new time.' });
    }

    const duration = clampDurationMinutes(durationMinutes || session.durationMinutes);
    const newEnd = computeEndDate(newDate, duration);

    let availabilityDoc = null;
    if (availabilityRef) {
      availabilityDoc = await Availability.findOne({ _id: availabilityRef, mentor: session.mentor._id, active: true });
      if (!availabilityDoc) {
        return res.status(404).json({ success: false, error: 'AVAILABILITY_NOT_FOUND', message: 'Selected slot is unavailable.' });
      }

      if (!isScheduledWithinAvailability(availabilityDoc, newDate)) {
        return res.status(400).json({ success: false, error: 'SLOT_OUT_OF_RANGE', message: 'Selected time does not match the slot.' });
      }
    }

    const overlap = await hasMentorConflict({
      mentorId: session.mentor._id,
      start: newDate,
      end: newEnd,
      excludeId: session._id,
      availabilityId: availabilityDoc?._id || session.availabilityRef,
    });
    if (overlap) {
      return res.status(409).json({ success: false, error: 'MENTOR_CONFLICT', message: 'Mentor already has a session that overlaps with this time.' });
    }

    const previousDate = session.date;
    session.date = newDate;
    session.durationMinutes = duration;
    session.status = 'rescheduled';
    session.statusMeta = {
      ...(session.statusMeta || {}),
      rescheduledAt: new Date(),
    };
    if (availabilityDoc) {
      session.availabilityRef = availabilityDoc._id;
      session.capacity = availabilityDoc.capacity;
      session.isGroup = availabilityDoc.capacity > 1;
    }

    await session.save();

    await recordSessionAudit({
      actorId: req.user.id,
      sessionId: session._id,
      action: 'session:reschedule',
      metadata: { previousDate, newDate },
    });

    const mentees = session.mentee
      ? [session.mentee]
      : (session.participants || []).map((entry) => entry.user).filter(Boolean);
    const warnings = [];
    try {
      const result = await googleCalendarService.updateMentorSessionEvent({
        session,
        mentor: session.mentor,
        mentees,
      });
      if (result?.warning) {
        warnings.push(result.warning);
      }
    } catch (calendarError) {
      console.error('reschedule session calendar sync failed:', calendarError);
      warnings.push({
        code: 'GOOGLE_CALENDAR_SYNC_FAILED',
        message: 'Session rescheduled but Calendar sync failed. Reconnect Google Calendar to resume invites.',
      });
    }

    const message = `${req.user.firstname || 'Your mentor'} moved "${session.subject}" to ${formatInviteDate(newDate)} (was ${formatInviteDate(previousDate)}).`;
    await notifySessionParticipants({
      session,
      actorId: req.user.id,
      type: 'SESSION_RESCHEDULED',
      title: 'Session rescheduled',
      message,
    });

    const payload = await buildSessionResponse(session, warnings);
    return res.json({ success: true, ...payload });
  } catch (error) {
    console.error('rescheduleSession error:', error);
    return res.status(500).json({ success: false, error: 'SESSION_RESCHEDULE_FAILED', message: 'Unable to reschedule session.' });
  }
};

exports.cancelSession = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'INVALID_SESSION_ID', message: 'Invalid session identifier.' });
    }

    const session = await Session.findById(id)
      .populate('mentor', 'firstname lastname email profile calendarIntegrations role')
      .populate('mentee', 'firstname lastname email role')
      .populate('participants.user', 'firstname lastname email role');

    if (!session) {
      return res.status(404).json({ success: false, error: 'SESSION_NOT_FOUND', message: 'Session not found.' });
    }

    if (!userCanAccessSession(session, req.user)) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'You do not have access to this session.' });
    }

    if (session.status === 'cancelled') {
      return res.status(400).json({ success: false, error: 'ALREADY_CANCELLED', message: 'Session is already cancelled.' });
    }

    const { reason, notify = true } = req.body || {};
    session.status = 'cancelled';
    session.statusMeta = {
      ...(session.statusMeta || {}),
      cancelledAt: new Date(),
      cancellationReason: typeof reason === 'string' ? reason.trim().slice(0, 500) : undefined,
      cancellationBy: req.user.id,
    };

    await session.save();

    const hoursUntilSession = (session.date.getTime() - Date.now()) / 3_600_000;
    const penaltyWindow = hoursUntilSession <= SESSION_CANCEL_PENALTY_HOURS;

    await recordSessionAudit({
      actorId: req.user.id,
      sessionId: session._id,
      action: 'session:cancel',
      metadata: {
        penaltyWindow,
        reason: session.statusMeta.cancellationReason,
      },
    });

    // Update user cancellation metrics
    const userUpdate = {
      $inc: {
        'cancellationMetrics.totalCancellations': 1,
      },
    };

    if (penaltyWindow) {
      userUpdate.$inc['cancellationMetrics.lateCancellations'] = 1;
      userUpdate.$set = { 'cancellationMetrics.lastLateCancel': new Date() };
    } else {
      userUpdate.$inc['cancellationMetrics.earlyCancellations'] = 1;
    }

    await User.findByIdAndUpdate(req.user.id, userUpdate, { new: true });

    if (req.user.role === 'mentor' && penaltyWindow) {
      console.warn('Mentor cancelled within penalty window', {
        sessionId: session._id.toString(),
        mentorId: req.user.id,
      });

      const admins = await User.find({ role: 'admin' }).select('_id');
      await Promise.all(
        admins.map((admin) =>
          sendNotificationSafe({
            userId: admin._id,
            type: 'SESSION_CANCEL_ALERT',
            title: 'Mentor cancelled within penalty window',
            message: `${req.user.firstname || 'A mentor'} cancelled "${session.subject}" happening soon.`,
            data: { sessionId: session._id },
          })
        )
      );
    }

    const mentees = session.mentee
      ? [session.mentee]
      : (session.participants || []).map((entry) => entry.user).filter(Boolean);
    const warnings = [];
    try {
      const result = await googleCalendarService.deleteMentorSessionEvent({ session, mentor: session.mentor });
      if (result?.warning) {
        warnings.push(result.warning);
      }
    } catch (calendarError) {
      console.error('cancel session calendar sync failed:', calendarError);
      warnings.push({
        code: 'GOOGLE_CALENDAR_SYNC_FAILED',
        message: 'Session cancelled but Calendar event removal failed.',
      });
    }

    if (notify) {
      const message = `${req.user.firstname || 'A participant'} cancelled "${session.subject}" scheduled on ${formatInviteDate(session.date)}.`;
      await notifySessionParticipants({
        session,
        actorId: req.user.id,
        type: 'SESSION_CANCELLED',
        title: 'Session cancelled',
        message,
      });

      if (req.user.role === 'mentee') {
        await sendNotificationSafe({
          userId: session.mentor._id,
          type: 'SESSION_CANCELLED',
          title: 'Session cancelled by mentee',
          message,
          data: { sessionId: session._id },
        });
      }
    }

    const payload = await buildSessionResponse(session, warnings);
    return res.json({ success: true, ...payload });
  } catch (error) {
    console.error('cancelSession error:', error);
    return res.status(500).json({ success: false, error: 'SESSION_CANCEL_FAILED', message: 'Unable to cancel session.' });
  }
};

exports.recordAttendance = async (req, res) => {
  if (req.user.role !== 'mentor') {
    return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Only mentors can record attendance.' });
  }

  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'INVALID_SESSION_ID', message: 'Invalid session identifier.' });
    }

    const session = await Session.findById(id)
      .populate('mentor', 'firstname lastname email profile calendarIntegrations')
      .populate('mentee', 'firstname lastname email')
      .populate('participants.user', 'firstname lastname email');

    if (!session) {
      return res.status(404).json({ success: false, error: 'SESSION_NOT_FOUND', message: 'Session not found.' });
    }

    if (session.mentor._id.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'You can only update your own sessions.' });
    }

    const now = Date.now();
    const end = session.endDate ? session.endDate.getTime() : session.date.getTime();
    if (now < end) {
      return res.status(400).json({ success: false, error: 'SESSION_NOT_COMPLETED', message: 'Attendance can be recorded after the session ends.' });
    }

    const cutoff = end + SESSION_ATTENDANCE_EDIT_DAYS * 24 * 60 * 60 * 1000;
    if (now > cutoff) {
      return res.status(400).json({ success: false, error: 'ATTENDANCE_WINDOW_CLOSED', message: 'Attendance window has closed.' });
    }

    const entries = Array.isArray(req.body?.attendance) ? req.body.attendance : [];
    if (!entries.length) {
      return res.status(400).json({ success: false, error: 'ATTENDANCE_REQUIRED', message: 'Provide at least one attendance entry.' });
    }

    const validStatuses = new Set(['present', 'absent', 'late']);
    const attendanceDocs = [];
    const seen = new Set();
    entries.forEach((entry) => {
      const userId = toObjectId(entry.userId || entry.user || entry.participantId);
      if (!userId || seen.has(userId.toString())) {
        return;
      }

      const status = typeof entry.status === 'string' ? entry.status.toLowerCase() : '';
      if (!validStatuses.has(status)) {
        return;
      }

      seen.add(userId.toString());
      attendanceDocs.push({
        user: userId,
        status,
        recordedBy: req.user.id,
        recordedAt: new Date(),
        note: typeof entry.note === 'string' ? entry.note.trim().slice(0, 280) : undefined,
      });
    });

    if (!attendanceDocs.length) {
      return res.status(400).json({ success: false, error: 'INVALID_ATTENDANCE', message: 'Attendance payload invalid.' });
    }

    session.attendance = attendanceDocs;
    session.attended = attendanceDocs.some((entry) => entry.status === 'present');
    session.completedAt = new Date();
    session.status = 'completed';

    await session.save();

    await recordSessionAudit({
      actorId: req.user.id,
      sessionId: session._id,
      action: 'session:attendance',
      metadata: { count: attendanceDocs.length },
    });

    const payload = await buildSessionResponse(session);
    return res.json({ success: true, ...payload });
  } catch (error) {
    console.error('recordAttendance error:', error);
    return res.status(500).json({ success: false, error: 'ATTENDANCE_FAILED', message: 'Unable to record attendance.' });
  }
};

exports.createBookingLock = async (req, res) => {
  if (req.user.role !== 'mentee') {
    return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Only mentees can reserve slots.' });
  }

  try {
    const { mentorId: bodyMentorId, availabilityRef, scheduledAt, durationMinutes } = req.body || {};
    const mentorId = toObjectId(bodyMentorId);
    if (!mentorId) {
      return res.status(400).json({ success: false, error: 'MENTOR_REQUIRED', message: 'Mentor id is required.' });
    }

    const scheduled = scheduledAt ? new Date(scheduledAt) : null;
    if (!scheduled || Number.isNaN(scheduled.getTime())) {
      return res.status(400).json({ success: false, error: 'INVALID_DATE', message: 'Provide a valid slot start time.' });
    }

    let availabilityDoc = null;
    if (availabilityRef) {
      availabilityDoc = await Availability.findOne({ _id: availabilityRef, mentor: mentorId, active: true });
      if (!availabilityDoc) {
        return res.status(404).json({ success: false, error: 'AVAILABILITY_NOT_FOUND', message: 'Slot not found.' });
      }

      if (!isScheduledWithinAvailability(availabilityDoc, scheduled)) {
        return res.status(400).json({ success: false, error: 'SLOT_OUT_OF_RANGE', message: 'Slot does not match availability.' });
      }
    }

    const duration = clampDurationMinutes(durationMinutes || availabilityDoc?.metadata?.defaultDuration || 60);
    const expiresAt = new Date(Date.now() + SESSION_BOOKING_LOCK_SECONDS * 1000);
    const key = crypto.randomUUID();

    await BookingLock.deleteMany({
      mentor: mentorId,
      createdBy: req.user.id,
      scheduledAt: scheduled,
    });

    await BookingLock.create({
      key,
      mentor: mentorId,
      availability: availabilityDoc?._id,
      scheduledAt: scheduled,
      durationMinutes: duration,
      createdBy: req.user.id,
      sessionCandidate: { capacity: availabilityDoc?.capacity || 1 },
      expiresAt,
    });

    return res.status(201).json({ success: true, lockId: key, expiresAt });
  } catch (error) {
    console.error('createBookingLock error:', error);
    return res.status(500).json({ success: false, error: 'LOCK_CREATE_FAILED', message: 'Unable to create booking lock.' });
  }
};

exports.completeSession = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'INVALID_SESSION_ID', message: 'Invalid session identifier.' });
    }

    let ownerFilter;
    if (req.user.role === 'mentor') {
      ownerFilter = { mentor: normalizeUserId(req.user.id) || req.user.id };
    } else if (req.user.role === 'mentee') {
      ownerFilter = buildMenteeScopeFilter(req.user);
    } else {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Only mentors or mentees can update sessions.' });
    }

    const session = await Session.findOne({ _id: id, ...ownerFilter })
      .populate('mentor', 'firstname lastname email')
      .populate('mentee', 'firstname lastname email')
      .populate('participants.user', 'firstname lastname email');

    if (!session) {
      return res.status(404).json({ success: false, error: 'SESSION_NOT_FOUND', message: 'Session not found for this account.' });
    }

    const { attended, tasksCompleted, notes } = req.body || {};
    if (typeof attended !== 'undefined' && typeof attended !== 'boolean') {
      return res.status(400).json({ success: false, error: 'INVALID_ATTENDED_FLAG', message: 'attended must be a boolean value.' });
    }

    if (typeof tasksCompleted !== 'undefined') {
      const parsedTasks = Number(tasksCompleted);
      if (!Number.isFinite(parsedTasks) || parsedTasks < 0) {
        return res.status(400).json({ success: false, error: 'INVALID_TASK_COUNT', message: 'tasksCompleted must be a non-negative number.' });
      }
      session.tasksCompleted = Math.round(parsedTasks);
    }

    if (typeof notes !== 'undefined') {
      if (notes !== null && typeof notes !== 'string') {
        return res.status(400).json({ success: false, error: 'INVALID_NOTES', message: 'notes must be a string.' });
      }
      session.notes = notes ? notes.toString().trim() : null;
    }

    const nextAttended = typeof attended === 'boolean' ? attended : true;
    const wasAttended = session.attended;
    session.attended = nextAttended;

    if (nextAttended) {
      if (!wasAttended || !session.completedAt) {
        session.completedAt = new Date();
      }
      session.status = 'completed';
    } else {
      session.completedAt = null;
      if (session.status === 'completed') {
        session.status = 'confirmed';
      }
    }

    await session.save();

    const [annotated] = await annotateSessionsWithMeta([session]);

    return res.json({ success: true, session: annotated || formatSessionRow(session) });
  } catch (error) {
    console.error('completeSession error:', error);
    return res.status(500).json({ success: false, error: 'COMPLETE_SESSION_FAILED', message: 'Unable to update session.' });
  }
};

exports.getMenteeReport = async (req, res) => {
  try {
    const { filters } = parseFilters(req, 'mentee');
    const all = await Session.find(filters)
      .sort({ date: -1 })
      .limit(500)
      .select('date subject attended tasksCompleted')
      .lean();

    const total = all.length;
    const attendedCount = all.filter((s) => s.attended).length;
    const attendancePct = total ? Math.round((attendedCount / total) * 100) : 0;
    const tasksCompleted = all.reduce((acc, s) => acc + (s.tasksCompleted || 0), 0);

    const snapshots = all.slice(0, 5).map((s) => ({
      id: s._id.toString(),
      date: s.date,
      subject: s.subject,
      attended: !!s.attended,
      tasksCompleted: s.tasksCompleted || 0,
    }));

    return res.json({ success: true, report: { total, attendedCount, attendancePct, tasksCompleted, snapshots } });
  } catch (error) {
    console.error('getMenteeReport error:', error);
    return res.status(500).json({ success: false, error: 'REPORT_FETCH_FAILED', message: 'Unable to fetch report.' });
  }
};

const toCsv = (rows) => {
  const header = ['Date', 'Mentor', 'Subject', 'Duration(min)', 'Attended', 'Tasks Completed', 'Notes'];
  const lines = rows.map((r) => [
    new Date(r.date).toISOString(),
    (r.mentor && (r.mentor.firstname || '') + ' ' + (r.mentor.lastname || '')).trim(),
    r.subject,
    r.durationMinutes,
    r.attended ? 'Yes' : 'No',
    r.tasksCompleted || 0,
    (r.notes || '').replace(/\n/g, ' '),
  ].map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
  return [header.join(','), ...lines].join('\n');
};

exports.exportMenteeData = async (req, res) => {
  try {
    const { filters } = parseFilters(req, 'mentee');
    const format = (req.query.format || 'csv').toString().toLowerCase();
    const all = await Session.find(filters)
      .sort({ date: -1 })
      .select('date subject durationMinutes attended tasksCompleted notes mentor')
      .populate('mentor', 'firstname lastname')
      .lean();

    if (format === 'csv') {
      const csv = toCsv(all);
      const filename = `mentee_report_${new Date().toISOString().slice(0,10)}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(csv);
    }

    return res.status(501).json({ success: false, error: 'PDF_NOT_IMPLEMENTED', message: 'PDF export will be enabled after adding a PDF generator. Use format=csv for now.' });
  } catch (error) {
    console.error('exportMenteeData error:', error);
    return res.status(500).json({ success: false, error: 'EXPORT_FAILED', message: 'Unable to export report.' });
  }
};

exports.__setNotificationAdapter = (adapter) => {
  if (adapter && typeof adapter.sendNotification === 'function') {
    notificationAdapter.sendNotification = adapter.sendNotification;
  }
};
