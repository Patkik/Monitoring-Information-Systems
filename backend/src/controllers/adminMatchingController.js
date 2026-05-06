const mongoose = require('mongoose');
const Mentorship = require('../models/Mentorship');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { ok, fail } = require('../utils/responses');
const { sendNotification } = require('../utils/notificationService');

const ALLOWED_STATUSES = ['active', 'paused', 'completed', 'cancelled'];
const ensureAdmin = (user) => user && user.role === 'admin';

const formatUserSummary = (userDoc, fallbackRole) => {
    if (!userDoc) {
        return null;
    }

    const name = [userDoc.firstname, userDoc.lastname]
        .filter(Boolean)
        .join(' ')
        .trim();

    const profile = userDoc.profile || {};
    const mentorSettings = userDoc.mentorSettings || {};

    return {
        id: userDoc._id?.toString() || null,
        name: name || profile.displayName || userDoc.email,
        email: userDoc.email,
        avatar: profile.photoUrl || null,
        role: userDoc.role || fallbackRole,
        applicationStatus: userDoc.applicationStatus || null,
        capacity: typeof mentorSettings.capacity === 'number' ? mentorSettings.capacity : null,
        activeMentees:
            typeof mentorSettings.activeMenteesCount === 'number' ? mentorSettings.activeMenteesCount : null,
    };
};

const serializePairing = (mentorshipDoc) => {
    const matchRequest = mentorshipDoc.matchRequestId;
    return {
        id: mentorshipDoc._id.toString(),
        status: mentorshipDoc.status,
        startedAt: mentorshipDoc.startedAt,
        updatedAt: mentorshipDoc.updatedAt,
        mentor: formatUserSummary(mentorshipDoc.mentorId, 'mentor'),
        mentee: formatUserSummary(mentorshipDoc.menteeId, 'mentee'),
        metadata: mentorshipDoc.metadata || {},
        sessionsCount: Array.isArray(mentorshipDoc.sessions) ? mentorshipDoc.sessions.length : 0,
        matchRequest: matchRequest
            ? {
                  id: matchRequest._id?.toString() || null,
                  status: matchRequest.status,
                  score: matchRequest.score,
                  notes: matchRequest.notes,
                  priority: matchRequest.priority,
                  metadata: matchRequest.metadata || {},
              }
            : null,
    };
};

const buildSearchClause = async (search) => {
    if (!search) {
        return null;
    }

    const regex = new RegExp(search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
    
    // Also build a name components regex if searching for full names
    const parts = search.split(/\s+/).filter(Boolean);
    const regexParts = parts.map(p => new RegExp(p.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i'));

    const orClauses = [
        { email: regex },
        { 'profile.displayName': regex },
        { firstname: regex },
        { lastname: regex }
    ];

    if (parts.length > 1) {
        orClauses.push({
            $and: [
                { firstname: regexParts[0] },
                { lastname: regexParts[1] }
            ]
        });
    }

    const users = await User.find({
        $or: orClauses
    })
        .select('_id')
        .lean();

    const userIds = users.map((record) => record._id);

    if (!userIds.length) {
        return { $or: [{ _id: null }] }; // intentionally empty result set
    }

    return {
        $or: [
            { mentorId: { $in: userIds } },
            { menteeId: { $in: userIds } }
        ]
    };
};

exports.listPairings = async (req, res) => {
    if (!ensureAdmin(req.user)) {
        return fail(res, 403, 'FORBIDDEN', 'Administrator access required.');
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const statusFilter = typeof req.query.status === 'string' ? req.query.status : 'all';
    const searchValue = (req.query.search || '').trim();

    try {
        const query = {};
        if (ALLOWED_STATUSES.includes(statusFilter)) {
            query.status = statusFilter;
        }

        if (searchValue) {
            const clause = await buildSearchClause(searchValue);
            if (clause) {
                Object.assign(query, clause);
            }
        }

        const total = await Mentorship.countDocuments(query);
        const docs = await Mentorship.find(query)
            .sort({ updatedAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('mentorId', 'firstname lastname email profile role applicationStatus mentorSettings')
            .populate('menteeId', 'firstname lastname email profile role applicationStatus')
            .populate('matchRequestId', 'status score notes priority metadata')
            .lean();

        const totalPages = total > 0 ? Math.ceil(total / limit) : 1;

        return ok(
            res,
            { pairings: docs.map(serializePairing) },
            {
                page,
                limit,
                total,
                totalPages,
                filters: { search: searchValue, status: statusFilter },
            }
        );
    } catch (error) {
        return fail(res, 500, 'PAIRING_LIST_FAILED', error.message || 'Unable to load pairings.');
    }
};

exports.getPairingDetail = async (req, res) => {
    if (!ensureAdmin(req.user)) {
        return fail(res, 403, 'FORBIDDEN', 'Administrator access required.');
    }

    const { pairingId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(pairingId)) {
        return fail(res, 400, 'INVALID_ID', 'Invalid pairing id.');
    }

    try {
        const pairing = await Mentorship.findById(pairingId)
            .populate('mentorId', 'firstname lastname email profile role applicationStatus mentorSettings')
            .populate('menteeId', 'firstname lastname email profile role applicationStatus')
            .populate('matchRequestId', 'status score notes priority metadata')
            .lean();

        if (!pairing) {
            return fail(res, 404, 'PAIRING_NOT_FOUND', 'Pairing not found.');
        }

        const audits = await AuditLog.find({ resourceType: 'mentorship', resourceId: pairingId })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        const auditTrail = audits.map((entry) => ({
            id: entry._id.toString(),
            action: entry.action,
            metadata: entry.metadata || {},
            createdAt: entry.createdAt,
        }));

        return ok(res, { pairing: serializePairing(pairing), auditTrail });
    } catch (error) {
        return fail(res, 500, 'PAIRING_DETAIL_FAILED', error.message || 'Unable to load pairing detail.');
    }
};

const normalizeTextField = (value) => {
    if (typeof value !== 'string') {
        return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
};

const notifyStatusChange = async ({ pairing, status, reason }) => {
    const mentor = pairing.mentorId;
    const mentee = pairing.menteeId;
    const mentorName = mentor ? [mentor.firstname, mentor.lastname].filter(Boolean).join(' ').trim() || mentor.email : 'your mentee';
    const menteeName = mentee ? [mentee.firstname, mentee.lastname].filter(Boolean).join(' ').trim() || mentee.email : 'your mentor';

    const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
    const reasonSuffix = reason ? ` Reason: ${reason}` : '';

    const messages = [];
    if (mentor?._id) {
        messages.push(
            sendNotification({
                userId: mentor._id,
                type: 'PAIRING_STATUS_UPDATED',
                title: `Mentorship ${statusLabel.toLowerCase()}`,
                message: `Your mentorship with ${menteeName} is now ${statusLabel.toLowerCase()}.${reasonSuffix}`,
                data: { pairingId: pairing._id, status },
            })
        );
    }
    if (mentee?._id) {
        messages.push(
            sendNotification({
                userId: mentee._id,
                type: 'PAIRING_STATUS_UPDATED',
                title: `Mentorship ${statusLabel.toLowerCase()}`,
                message: `Your mentorship with ${mentorName} is now ${statusLabel.toLowerCase()}.${reasonSuffix}`,
                data: { pairingId: pairing._id, status },
            })
        );
    }
    await Promise.all(messages);
};

exports.updatePairing = async (req, res) => {
    if (!ensureAdmin(req.user)) {
        return fail(res, 403, 'FORBIDDEN', 'Administrator access required.');
    }

    const { pairingId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(pairingId)) {
        return fail(res, 400, 'INVALID_ID', 'Invalid pairing id.');
    }

    const desiredStatus = typeof req.body?.status === 'string' ? req.body.status : undefined;
    if (desiredStatus && !ALLOWED_STATUSES.includes(desiredStatus)) {
        return fail(res, 422, 'INVALID_STATUS', 'Status must be active, paused, completed, or cancelled.');
    }

    try {
        const pairing = await Mentorship.findById(pairingId)
            .populate('mentorId', 'firstname lastname email profile role applicationStatus mentorSettings')
            .populate('menteeId', 'firstname lastname email profile role applicationStatus')
            .populate('matchRequestId', 'status score notes priority metadata');

        if (!pairing) {
            return fail(res, 404, 'PAIRING_NOT_FOUND', 'Pairing not found.');
        }

        const previousStatus = pairing.status;
        let statusChanged = false;
        if (desiredStatus && desiredStatus !== pairing.status) {
            pairing.status = desiredStatus;
            statusChanged = true;
        }

        pairing.metadata = pairing.metadata || {};
        const fields = ['notes', 'goals', 'program'];
        let metadataChanged = false;
        fields.forEach((field) => {
            if (Object.prototype.hasOwnProperty.call(req.body || {}, field)) {
                const value = normalizeTextField(req.body[field]);
                pairing.metadata[field] = value;
                metadataChanged = true;
            }
        });

        if (!statusChanged && !metadataChanged) {
            return ok(res, { pairing: serializePairing(pairing.toObject()) }, { unchanged: true });
        }

        await pairing.save();

        const mentorId = pairing.mentorId?._id || pairing.mentorId;
        let capacityDelta = 0;
        if (statusChanged) {
            if (previousStatus === 'active' && desiredStatus && ['completed', 'cancelled'].includes(desiredStatus)) {
                capacityDelta = -1;
            } else if (desiredStatus === 'active' && previousStatus !== 'active') {
                capacityDelta = 1;
            }
        }

        if (capacityDelta !== 0 && mentorId) {
            await User.updateOne({ _id: mentorId }, { $inc: { 'mentorSettings.activeMenteesCount': capacityDelta } });
        }

        await AuditLog.create({
            actorId: req.user.id,
            action: 'pairing_update',
            resourceType: 'mentorship',
            resourceId: pairing._id.toString(),
            metadata: {
                previousStatus,
                newStatus: pairing.status,
                metadataChanged,
                reason: normalizeTextField(req.body?.reason) || null,
            },
        });

        if (statusChanged) {
            await notifyStatusChange({ pairing, status: pairing.status, reason: normalizeTextField(req.body?.reason) });
        }

        return ok(res, { pairing: serializePairing(pairing.toObject()) });
    } catch (error) {
        return fail(res, 500, 'PAIRING_UPDATE_FAILED', error.message || 'Unable to update pairing.');
    }
};
