const Feedback = require('../models/Feedback');
const { getFullName } = require('./person');
const { FEEDBACK_WINDOW_DAYS } = require('../config/feedback');

const FEEDBACK_WINDOW_MS = FEEDBACK_WINDOW_DAYS * 24 * 60 * 60 * 1000;

const summarizePerson = (doc) => {
    if (!doc || typeof doc !== 'object') {
        return null;
    }

    const identifier = doc._id || doc.id || null;
    if (!identifier && !doc.firstname && !doc.lastname && !doc.email) {
        return null;
    }

    return {
        id: identifier ? identifier.toString() : null,
        name: getFullName(doc) || doc.email,
        email: doc.email,
    };
};

const summarizeParticipantEntry = (entry) => {
    if (!entry || !entry.user) {
        return null;
    }

    const person = summarizePerson(entry.user);
    if (!person) {
        return null;
    }

    return {
        ...person,
        status: entry.status || 'invited',
    };
};

const getChatThreadId = (sessionDoc) => {
    if (!sessionDoc.chatThread) return null;
    if (typeof sessionDoc.chatThread === 'string') return sessionDoc.chatThread;
    if (sessionDoc.chatThread && sessionDoc.chatThread._id) {
        return sessionDoc.chatThread._id.toString();
    }
    return null;
};

const formatSessionRow = (sessionDoc) => {
    if (!sessionDoc) {
        return null;
    }

    const participants = Array.isArray(sessionDoc.participants)
        ? sessionDoc.participants.map(summarizeParticipantEntry).filter(Boolean)
        : [];

    // Format attendance records for the response
    const attendance = Array.isArray(sessionDoc.attendance)
        ? sessionDoc.attendance.map((entry) => ({
            user: entry.user && typeof entry.user === 'object' ? entry.user._id || entry.user.id : entry.user,
            status: entry.status,
            recordedAt: entry.recordedAt,
            note: entry.note,
          }))
        : [];

    return {
        id: sessionDoc._id.toString(),
        subject: sessionDoc.subject,
        mentor: summarizePerson(sessionDoc.mentor),
        mentee: summarizePerson(sessionDoc.mentee),
        date: sessionDoc.date,
        durationMinutes: sessionDoc.durationMinutes,
        status: sessionDoc.status || null,
        attended: !!sessionDoc.attended,
        attendance: attendance,
        tasksCompleted: sessionDoc.tasksCompleted || 0,
        notes: sessionDoc.notes || null,
        room: sessionDoc.room || null,
        capacity: sessionDoc.capacity || (participants?.length || 1),
        isGroup: !!sessionDoc.isGroup,
        participants,
        participantCount: participants.length || (sessionDoc.mentee ? 1 : 0),
        chatThreadId: getChatThreadId(sessionDoc),
        completedAt: sessionDoc.completedAt || null,
        calendarEvent: sessionDoc.calendarEvent
            ? {
                provider: sessionDoc.calendarEvent.provider || null,
                htmlLink: sessionDoc.calendarEvent.htmlLink || null,
                hangoutLink: sessionDoc.calendarEvent.hangoutLink || null,
                status: sessionDoc.calendarEvent.status || null,
              }
            : null,
    };
};

const normalizeSessionDoc = (doc) => {
    if (!doc) {
        return null;
    }

    if (typeof doc.toObject === 'function') {
        return doc.toObject();
    }

    return doc;
};

const annotateSessionsWithMeta = async (sessionDocs = []) => {
    const plainDocs = sessionDocs.map(normalizeSessionDoc).filter(Boolean);
    if (!plainDocs.length) {
        return [];
    }

    const sessionIds = plainDocs.map((doc) => doc._id);
    const feedbackDocs = await Feedback.find({ sessionId: { $in: sessionIds } })
        .select('sessionId menteeId')
        .lean();
    const submittedSet = new Set(feedbackDocs.map((fb) => fb.sessionId.toString()));

    const nowMs = Date.now();

    return plainDocs.map((doc) => {
        const baseRow = formatSessionRow(doc);
        const completedAt = doc.completedAt || doc.statusMeta?.confirmedAt || doc.updatedAt || doc.date;
        const completedMs = completedAt ? new Date(completedAt).getTime() : null;
        const attended = !!doc.attended;
        const feedbackSubmitted = submittedSet.has(doc._id.toString());
        const feedbackWindowOpen = attended && completedMs && completedMs <= nowMs && nowMs - completedMs <= FEEDBACK_WINDOW_MS;
        const feedbackWindowClosesAt = feedbackWindowOpen && completedMs ? new Date(completedMs + FEEDBACK_WINDOW_MS) : null;

        let status = baseRow.status;
        if (!status) {
            status = attended
                ? 'completed'
                : new Date(doc.date).getTime() < nowMs
                    ? 'overdue'
                    : 'upcoming';
        }

        return {
            ...baseRow,
            status,
            completedAt: attended ? completedAt : null,
            feedbackSubmitted,
            feedbackDue: feedbackWindowOpen && !feedbackSubmitted,
            feedbackWindowClosesAt,
        };
    });
};

module.exports = {
    FEEDBACK_WINDOW_MS,
    summarizePerson,
    formatSessionRow,
    annotateSessionsWithMeta,
};
