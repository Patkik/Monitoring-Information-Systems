const crypto = require('crypto');
const mongoose = require('mongoose');
const Certificate = require('../models/Certificate');
const Session = require('../models/Session');
const Goal = require('../models/Goal');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { uploadBuffer } = require('../utils/cloudinary');
const { generateCertificatePDF } = require('../utils/certificatePdf');
const { generateQrDataUri } = require('../utils/qr');
const { sendNotification } = require('../utils/notificationService');
const { recordCertificateAchievements } = require('./achievementService');
const { getPrimaryClientUrl } = require('../config/urls');

const serialPrefix = process.env.CERTIFICATE_SERIAL_PREFIX || 'MNT';
const baseVerifyUrl = getPrimaryClientUrl();

const generateSerialNumber = async () => {
    let attempts = 0;
    while (attempts < 6) {
        const chunk = crypto.randomInt(100000, 999999);
        const serial = `${serialPrefix}-${new Date().getFullYear()}-${chunk}`;
        const exists = await Certificate.exists({ serialNumber: serial });
        if (!exists) {
            return serial;
        }
        attempts += 1;
    }
    throw new Error('SERIAL_UNAVAILABLE');
};

const generateVerificationCode = async () => {
    let attempts = 0;
    while (attempts < 6) {
        const code = crypto.randomBytes(6).toString('hex').toUpperCase();
        const exists = await Certificate.exists({ verificationCode: code });
        if (!exists) {
            return code;
        }
        attempts += 1;
    }
    throw new Error('VERIFICATION_CODE_UNAVAILABLE');
};

const selectMentor = async ({ menteeId, mentorId }) => {
    if (mentorId) {
        const mentor = await User.findById(mentorId).select('firstname lastname profile.title role');
        if (!mentor || mentor.role !== 'mentor') {
            const error = new Error('MENTOR_NOT_FOUND');
            error.status = 404;
            throw error;
        }
        return mentor;
    }

    const recentSession = await Session.findOne({ mentee: menteeId, attended: true })
        .sort({ completedAt: -1 })
        .select('mentor')
        .lean();

    if (recentSession?.mentor) {
        const mentor = await User.findById(recentSession.mentor).select('firstname lastname profile.title role');
        if (mentor) {
            return mentor;
        }
    }

    const fallback = await User.findOne({ role: 'mentor', applicationStatus: 'approved' })
        .sort({ createdAt: 1 })
        .select('firstname lastname profile.title');

    if (!fallback) {
        const error = new Error('NO_MENTOR_AVAILABLE');
        error.status = 404;
        throw error;
    }
    return fallback;
};

const computeCompletionMetrics = async (menteeId) => {
    const [sessionStats] = await Session.aggregate([
        { $match: { mentee: new mongoose.Types.ObjectId(menteeId), attended: true } },
        {
            $group: {
                _id: null,
                completedSessions: { $sum: 1 },
                totalMinutes: { $sum: '$durationMinutes' },
            },
        },
    ]);
    const goalsCompleted = await Goal.countDocuments({ mentee: menteeId, status: 'completed' });

    return {
        completedSessions: sessionStats?.completedSessions || 0,
        totalHours: sessionStats?.totalMinutes ? Number((sessionStats.totalMinutes / 60).toFixed(1)) : 0,
        goalsCompleted,
    };
};

const validateEligibility = (type, metrics) => {
    if (type === 'completion') {
        if (metrics.completedSessions < 3) {
            return { eligible: false, reason: 'AT_LEAST_3_SESSIONS' };
        }
        if (metrics.goalsCompleted < 1) {
            return { eligible: false, reason: 'AT_LEAST_1_GOAL' };
        }
    }
    return { eligible: true };
};

const buildVerificationUrl = (code) => {
    if (!baseVerifyUrl) {
        throw new Error('CLIENT_URL_NOT_CONFIGURED');
    }
    return `${baseVerifyUrl}/verify/certificate/${code}`;
};

const uploadCertificate = async ({ buffer, serialNumber }) => {
    const asset = await uploadBuffer(buffer, {
        resource_type: 'raw',
        folder: process.env.CLOUDINARY_CERT_FOLDER || 'certificates',
        public_id: serialNumber,
        format: 'pdf',
    });
    return asset;
};

const formatUserName = (user) => {
    const first = user.firstname || user.profile?.displayName?.split(' ')?.[0] || '';
    const last = user.lastname || user.profile?.displayName?.split(' ')?.slice(1).join(' ') || '';
    return `${first} ${last}`.trim();
};

const buildMentorMeta = (mentor) => ({
    fullName: formatUserName(mentor),
    title: mentor.profile?.title || 'Mentor',
});

const buildMenteeMeta = (mentee) => ({
    fullName: formatUserName(mentee),
});

const persistCertificate = async ({
    mentee,
    mentor,
    requestedBy,
    payload,
    pdfAsset,
    qrDataUri,
    metrics,
}) => {
    const certificateDoc = await Certificate.create({
        ...payload,
        pdfAsset: {
            url: pdfAsset.secure_url,
            publicId: pdfAsset.public_id,
            bytes: pdfAsset.bytes,
            checksum: payload.checksum,
        },
        qrCode: {
            payload: payload.verificationUrl,
            dataUri: qrDataUri,
        },
        metrics,
        issuanceLog: [
            {
                issuedBy: requestedBy || mentee._id,
                channel: requestedBy ? 'admin' : 'self-service',
                reason: 'initial',
                pdfUrl: pdfAsset.secure_url,
            },
        ],
    });

    await sendNotification({
        userId: mentee._id,
        type: 'CERTIFICATE_ISSUED',
        title: '🎉 Certificate ready',
        message: `Your ${certificateDoc.programName} certificate is ready to download.`,
        data: {
            certificateId: certificateDoc._id,
            serialNumber: certificateDoc.serialNumber,
        },
    });

    await recordCertificateAchievements({
        userId: mentee._id,
        certificateType: certificateDoc.certificateType,
        serialNumber: certificateDoc.serialNumber,
    });

    return certificateDoc;
};

const issueCertificate = async ({
    menteeId,
    mentorId,
    requestedBy,
    programName,
    certificateType = 'completion',
    statement,
    cohort,
    allowEligibilityOverride = false,
}) => {
    const mentee = await User.findById(menteeId).select('firstname lastname role profile');
    if (!mentee || mentee.role !== 'mentee') {
        const error = new Error('MENTEE_NOT_FOUND');
        error.status = 404;
        throw error;
    }

    const mentor = await selectMentor({ menteeId, mentorId });
    const metrics = await computeCompletionMetrics(menteeId);
    const eligibility = validateEligibility(certificateType, metrics);
    const eligibilityOverrideApplied = !eligibility.eligible && allowEligibilityOverride;

    if (!eligibility.eligible && !allowEligibilityOverride) {
        const error = new Error(eligibility.reason);
        error.status = 400;
        throw error;
    }

    if (eligibilityOverrideApplied && requestedBy) {
        await AuditLog.create({
            actorId: requestedBy,
            action: 'certificate.eligibility_override',
            resourceType: 'certificate',
            resourceId: menteeId.toString(),
            metadata: {
                reason: eligibility.reason,
                certificateType,
            },
        });
    }

    const serialNumber = await generateSerialNumber();
    const verificationCode = await generateVerificationCode();
    const verificationUrl = buildVerificationUrl(verificationCode);

    const qrDataUri = await generateQrDataUri(verificationUrl);

    const menteeMeta = buildMenteeMeta(mentee);
    const mentorMeta = buildMentorMeta(mentor);

    const metadata = {
        signedBy: process.env.CERTIFICATE_SIGNER || mentorMeta.fullName,
        signerTitle: process.env.CERTIFICATE_SIGNER_TITLE || mentorMeta.title,
        sealUrl: process.env.CERTIFICATE_SEAL_URL,
    };

    if (eligibilityOverrideApplied && requestedBy) {
        metadata.eligibilityOverride = {
            approvedBy: requestedBy,
            reason: eligibility.reason,
            appliedAt: new Date().toISOString(),
        };
    }

    const certificatePayload = {
        user: mentee._id,
        mentor: mentor._id,
        cohort: cohort?.trim(),
        programName: (programName || 'Mentorship Program').trim(),
        certificateType,
        statement: statement?.trim(),
        serialNumber,
        verificationCode,
        verificationUrl,
        badgeUrl: process.env.CERTIFICATE_BADGE_URL,
        metadata,
    };

    const pdfBuffer = await generateCertificatePDF({
        certificate: { ...certificatePayload, issuedAt: new Date() },
        mentee: menteeMeta,
        mentor: mentorMeta,
        metrics,
        qrDataUri,
        brand: {
            primary: process.env.CERTIFICATE_COLOR_PRIMARY,
            accent: process.env.CERTIFICATE_COLOR_ACCENT,
        },
    });

    const checksum = crypto.createHash('sha256').update(pdfBuffer).digest('hex');
    certificatePayload.checksum = checksum;

    const pdfAsset = await uploadCertificate({ buffer: pdfBuffer, serialNumber });

    return persistCertificate({
        mentee,
        mentor,
        requestedBy,
        payload: certificatePayload,
        pdfAsset,
        qrDataUri,
        metrics,
    });
};

const getCertificateForDownload = async ({ certificateId, requester }) => {
    const certificate = await Certificate.findById(certificateId)
        .populate('user', 'firstname lastname role profile')
        .populate('mentor', 'firstname lastname profile');
    if (!certificate) {
        const error = new Error('CERTIFICATE_NOT_FOUND');
        error.status = 404;
        throw error;
    }
    const requesterId = requester.id;
    const isOwner = certificate.user._id.toString() === requesterId;
    const isMentor = certificate.mentor._id.toString() === requesterId;
    const isAdmin = requester.role === 'admin';
    if (!isOwner && !isMentor && !isAdmin) {
        const error = new Error('FORBIDDEN');
        error.status = 403;
        throw error;
    }

    if (isOwner && !certificate.signature?.signedAt) {
        const error = new Error('SIGNATURE_PENDING');
        error.status = 409;
        throw error;
    }
    return certificate;
};

const reissueCertificate = async ({ certificateId, adminId, reason = 'reissue' }) => {
    const certificate = await Certificate.findById(certificateId)
        .populate('user', 'firstname lastname profile')
        .populate('mentor', 'firstname lastname profile');
    if (!certificate) {
        const error = new Error('CERTIFICATE_NOT_FOUND');
        error.status = 404;
        throw error;
    }

    const qrDataUri = await generateQrDataUri(certificate.verificationUrl);
    const menteeMeta = buildMenteeMeta(certificate.user);
    const mentorMeta = buildMentorMeta(certificate.mentor);
    const metrics = certificate.metrics || {};

    const pdfBuffer = await generateCertificatePDF({
        certificate,
        mentee: menteeMeta,
        mentor: mentorMeta,
        metrics,
        qrDataUri,
        brand: {
            primary: process.env.CERTIFICATE_COLOR_PRIMARY,
            accent: process.env.CERTIFICATE_COLOR_ACCENT,
        },
    });

    const pdfAsset = await uploadCertificate({ buffer: pdfBuffer, serialNumber: certificate.serialNumber });

    certificate.reissueCount += 1;
    certificate.pdfAsset = {
        url: pdfAsset.secure_url,
        publicId: pdfAsset.public_id,
        bytes: pdfAsset.bytes,
        checksum: crypto.createHash('sha256').update(pdfBuffer).digest('hex'),
    };
    certificate.issuanceLog.push({
        issuedBy: adminId,
        channel: 'admin',
        reason,
        pdfUrl: pdfAsset.secure_url,
    });
    await certificate.save();

    await AuditLog.create({
        actorId: adminId,
        action: 'certificate.reissue',
        resourceType: 'certificate',
        resourceId: certificate._id.toString(),
        metadata: { reason },
    });

    await sendNotification({
        userId: certificate.user._id,
        type: 'CERTIFICATE_REISSUED',
        title: 'Certificate updated',
        message: 'Your certificate has been reissued by an administrator.',
        data: { certificateId: certificate._id, serialNumber: certificate.serialNumber },
    });

    return certificate;
};

const verifyCertificate = async (code) => {
    const certificate = await Certificate.findOne({ verificationCode: code }).populate('user', 'firstname lastname profile');
    if (!certificate) {
        const error = new Error('CERTIFICATE_NOT_FOUND');
        error.status = 404;
        throw error;
    }
    return {
        status: certificate.status,
        programName: certificate.programName,
        mentee: formatUserName(certificate.user),
        issuedAt: certificate.issuedAt,
        serialNumber: certificate.serialNumber,
        certificateType: certificate.certificateType,
    };
};

const signCertificate = async ({ certificateId, mentorId, signerTitle, statement, ipAddress }) => {
    const certificate = await Certificate.findById(certificateId)
        .populate('mentor', 'firstname lastname profile role')
        .populate('user', 'firstname lastname profile role');

    if (!certificate) {
        const error = new Error('CERTIFICATE_NOT_FOUND');
        error.status = 404;
        throw error;
    }

    if (certificate.mentor?._id?.toString() !== mentorId) {
        const error = new Error('FORBIDDEN');
        error.status = 403;
        throw error;
    }

    if (certificate.signature?.signedAt) {
        const error = new Error('ALREADY_SIGNED');
        error.status = 400;
        throw error;
    }

    const signedByName = certificate.mentor?.profile?.displayName || formatUserName(certificate.mentor);
    const signedByTitle = signerTitle?.trim() || certificate.mentor?.profile?.title || 'Mentor';

    certificate.signature = {
        signedAt: new Date(),
        signedBy: certificate.mentor._id,
        signedByName,
        signedByTitle,
        statement: statement?.trim(),
        method: 'digital',
        ipAddress,
    };

    certificate.metadata = certificate.metadata || {};
    certificate.metadata.signedBy = signedByName;
    certificate.metadata.signerTitle = signedByTitle;

    await certificate.save();

    await AuditLog.create({
        actorId: mentorId,
        action: 'certificate.signed',
        resourceType: 'certificate',
        resourceId: certificate._id.toString(),
        metadata: {
            menteeId: certificate.user?._id?.toString(),
            method: 'digital',
        },
    });

    if (certificate.user?._id) {
        await sendNotification({
            userId: certificate.user._id,
            type: 'CERTIFICATE_SIGNED',
            title: 'Certificate digitally signed',
            message: 'Your mentor has digitally signed your certificate of completion.',
            data: {
                certificateId: certificate._id,
                serialNumber: certificate.serialNumber,
            },
        });
    }

    return certificate;
};

module.exports = {
    issueCertificate,
    getCertificateForDownload,
    reissueCertificate,
    verifyCertificate,
    signCertificate,
};
