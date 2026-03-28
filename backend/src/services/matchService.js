const mongoose = require('mongoose');
const MatchRequest = require('../models/MatchRequest');
const Mentorship = require('../models/Mentorship');
const MatchAudit = require('../models/MatchAudit');
const User = require('../models/User');
const { sendNotification } = require('../utils/notificationService');
const logger = require('../utils/logger');

const SCORE_WEIGHTS = {
  expertise: 0.5,
  availability: 0.25,
  interactions: 0.15,
  priority: 0.1,
};

const MATCH_TTL_DAYS = Number(process.env.MATCH_SUGGESTION_TTL_DAYS || 14);
const SUGGESTION_LIMIT = Number(process.env.MATCH_SUGGESTION_LIMIT || 10);

const normalizeArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((entry) => String(entry).trim().toLowerCase()).filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean);
  }
  return [];
};

const computeOverlapRatio = (mentorList, menteeList) => {
  if (!mentorList.length && !menteeList.length) {
    return 0.5; // neutral score when both missing data
  }
  if (!mentorList.length || !menteeList.length) {
    return 0.25;
  }
  const mentorSet = new Set(mentorList);
  const menteeSet = new Set(menteeList);
  let intersection = 0;
  mentorSet.forEach((entry) => {
    if (menteeSet.has(entry)) {
      intersection += 1;
    }
  });
  const union = new Set([...mentorSet, ...menteeSet]).size || 1;
  return intersection / union;
};

const calculateExpertiseScore = (mentor, mentee) => {
  const mentorExpertise = normalizeArray(mentor?.profile?.expertiseAreas || mentor?.applicationData?.expertiseAreas);
  const menteeNeeds = normalizeArray(mentee?.profile?.skills || mentee?.profile?.interests || mentee?.applicationData?.mentoringGoals);
  const overlapRatio = computeOverlapRatio(mentorExpertise, menteeNeeds);
  return Math.round(overlapRatio * 100);
};

const calculateAvailabilityScore = (mentor, mentee) => {
  const mentorSlots = Array.isArray(mentor?.profile?.availabilitySlots) ? mentor.profile.availabilitySlots : [];
  const menteeSlots = Array.isArray(mentee?.profile?.availabilitySlots) ? mentee.profile.availabilitySlots : [];

  if (!mentorSlots.length && !menteeSlots.length) {
    return 60;
  }

  const mentorDays = mentorSlots.map((slot) => slot.day).filter(Boolean);
  const menteeDays = menteeSlots.map((slot) => slot.day).filter(Boolean);
  const overlapRatio = computeOverlapRatio(mentorDays, menteeDays);

  return Math.round(overlapRatio * 100);
};

const calculateInteractionScore = (mentor, mentee) => {
  const mentorProgram = mentor?.applicationData?.program || mentor?.profile?.education?.program;
  const menteeProgram = mentee?.applicationData?.program || mentee?.profile?.education?.program;
  const mentorDepartment = mentor?.applicationData?.major || mentor?.profile?.education?.major;
  const menteeDepartment = mentee?.applicationData?.major || mentee?.profile?.education?.major;

  let score = 30;
  if (mentorProgram && menteeProgram && mentorProgram === menteeProgram) {
    score += 40;
  }
  if (mentorDepartment && menteeDepartment && mentorDepartment === menteeDepartment) {
    score += 20;
  }

  const mentorInterests = normalizeArray(mentor?.profile?.interests);
  const menteeInterests = normalizeArray(mentee?.profile?.interests);
  const overlapRatio = computeOverlapRatio(mentorInterests, menteeInterests);
  score += Math.round(overlapRatio * 30);

  return Math.min(100, score);
};

const calculatePriorityScore = (mentee) => {
  if (typeof mentee?.applicationData?.priority === 'number') {
    return Math.max(0, Math.min(100, mentee.applicationData.priority));
  }
  if (typeof mentee?.applicationData?.priority === 'string') {
    const normalized = mentee.applicationData.priority.toLowerCase();
    if (['high', 'urgent'].includes(normalized)) return 90;
    if (['medium'].includes(normalized)) return 60;
    if (['low'].includes(normalized)) return 35;
  }
  return 50;
};

const calculateScore = (mentor, mentee) => {
  const expertise = calculateExpertiseScore(mentor, mentee);
  const availability = calculateAvailabilityScore(mentor, mentee);
  const interactions = calculateInteractionScore(mentor, mentee);
  const priority = calculatePriorityScore(mentee);

  const rawScore = expertise * SCORE_WEIGHTS.expertise +
    availability * SCORE_WEIGHTS.availability +
    interactions * SCORE_WEIGHTS.interactions +
    priority * SCORE_WEIGHTS.priority;
  const score = Math.round(rawScore * 100) / 100;

  return {
    score,
    breakdown: { expertise, availability, interactions, priority },
  };
};

const buildSnapshot = (user) => ({
  name: [user?.firstname, user?.lastname].filter(Boolean).join(' ').trim() || user?.profile?.displayName || user?.email,
  program: user?.profile?.education?.program || user?.applicationData?.program || null,
  skills: Array.isArray(user?.profile?.skills) ? user.profile.skills.slice(0, 10) : [],
  expertiseAreas: Array.isArray(user?.profile?.expertiseAreas) ? user.profile.expertiseAreas.slice(0, 10) : [],
  interests: Array.isArray(user?.profile?.interests) ? user.profile.interests.slice(0, 10) : [],
  availabilitySlots: Array.isArray(user?.profile?.availabilitySlots) ? user.profile.availabilitySlots.slice(0, 6) : [],
});

const ensureMentorCapacity = (mentorDoc) => {
  const capacity = mentorDoc?.mentorSettings?.capacity ?? 3;
  const active = mentorDoc?.mentorSettings?.activeMenteesCount ?? 0;
  if (active >= capacity) {
    const error = new Error('Mentor capacity reached');
    error.code = 'MENTOR_CAPACITY_REACHED';
    error.status = 409;
    throw error;
  }
  return { capacity, active };
};

const logAudit = async ({ matchRequestId, actorId, actorRole, action, reason, ipAddress, meta }) => {
  try {
    await MatchAudit.create({ matchRequestId, actorId, actorRole, action, reason, ipAddress, meta });
  } catch (error) {
    logger.warn('match audit failed', error?.message || error);
  }
};

const upsertMatchRequest = async ({ mentor, mentee, score, breakdown }) => {
  const expiresAt = new Date(Date.now() + MATCH_TTL_DAYS * 24 * 60 * 60 * 1000);
  const menteeSnapshot = buildSnapshot(mentee);
  const mentorSnapshot = buildSnapshot(mentor);

  const existing = await MatchRequest.findOne({ mentorId: mentor._id, applicantId: mentee._id });
  const payload = {
    mentorId: mentor._id,
    applicantId: mentee._id,
    score,
    scoreBreakdown: breakdown,
    priority: breakdown.priority,
    menteeSnapshot,
    mentorSnapshot: { ...mentorSnapshot, capacity: mentor?.mentorSettings?.capacity },
    metadata: {
      availabilityOverlap: breakdown.availability,
      expertiseOverlap: breakdown.expertise,
      previousInteractions: breakdown.interactions,
    },
    expiresAt,
  };

  const result = await MatchRequest.findOneAndUpdate(
    { mentorId: mentor._id, applicantId: mentee._id },
    { $set: payload, $setOnInsert: { status: 'suggested' } },
    { new: true, upsert: true }
  );

  if (!existing) {
    await logAudit({ matchRequestId: result._id, actorId: mentor._id, actorRole: 'system', action: 'suggested' });
  }

  return { request: result, isNew: !existing };
};

const fetchCandidateMentees = async ({ mentorId, limit }) => {
  const [mentor, existingMatches, connectedMentees] = await Promise.all([
    User.findById(mentorId)
      .select(
        'role applicationStatus firstname lastname email profile applicationData mentorSettings'
      )
      .lean(),
    MatchRequest.find({ mentorId }).select('applicantId status').lean(),
    Mentorship.find({ mentorId }).select('menteeId status').lean(),
  ]);

  if (!mentor || mentor.role !== 'mentor' || mentor.applicationStatus !== 'approved') {
    const error = new Error('Mentor not found or not approved');
    error.code = 'MENTOR_NOT_AVAILABLE';
    error.status = 404;
    throw error;
  }

  const excludedIds = new Set();
  existingMatches.forEach((item) => excludedIds.add(item.applicantId.toString()));
  connectedMentees.forEach((item) => excludedIds.add(item.menteeId.toString()));

  const menteeQuery = {
    role: 'mentee',
    applicationStatus: 'approved',
    _id: { $nin: Array.from(excludedIds) },
  };

  const mentees = await User.find(menteeQuery)
    .select('firstname lastname email profile applicationData mentorSettings notificationSettings')
    .limit(Math.max(limit * 3, 30))
    .lean();

  return { mentor, mentees };
};

const generateSuggestionsForMentor = async ({ mentorId, limit = SUGGESTION_LIMIT }) => {
  const { mentor, mentees } = await fetchCandidateMentees({ mentorId, limit });
  const scored = mentees
    .map((mentee) => {
      const { score, breakdown } = calculateScore(mentor, mentee);
      return { mentee, score, breakdown };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, limit));

  const upserts = [];
  let newCount = 0;
  for (const entry of scored) {
    // eslint-disable-next-line no-await-in-loop
    const result = await upsertMatchRequest({ mentor, mentee: entry.mentee, score: entry.score, breakdown: entry.breakdown });
    upserts.push(result.request);
    if (result.isNew) {
      newCount += 1;
    }
  }

  if (newCount > 0) {
    await sendNotification({
      userId: mentor._id,
      type: 'MATCH_SUGGESTION',
      title: 'New mentee suggestions ready',
      message: `We found ${newCount} new mentee${newCount > 1 ? 's' : ''} that match your expertise.`,
      data: { mentorId: mentor._id, matchCount: newCount },
    });
  }

  return upserts;
};

const generateSuggestionsForAllMentors = async ({ limit = SUGGESTION_LIMIT } = {}) => {
  const mentors = await User.find({ role: 'mentor', applicationStatus: 'approved' })
    .select('mentorSettings applicationData profile firstname lastname email')
    .lean();

  const results = [];
  for (const mentor of mentors) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const requests = await generateSuggestionsForMentor({ mentorId: mentor._id, limit });
      results.push({ mentorId: mentor._id, generated: requests.length });
    } catch (error) {
      logger.error('generateSuggestionsForAllMentors failed', error?.message || error);
      results.push({ mentorId: mentor._id, error: error?.message || 'failed' });
    }
  }
  return results;
};

const listSuggestionsForMentor = async ({ mentorId, limit = 10 }) => {
  return MatchRequest.find({
    mentorId,
    status: { $in: ['suggested', 'mentor_accepted', 'mentee_accepted'] },
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  })
    .populate('applicantId', 'firstname lastname email profile applicationData')
    .sort({ score: -1, updatedAt: -1 })
    .limit(limit)
    .lean();
};

const getSuggestionDetail = async ({ mentorId, matchId }) => {
  return MatchRequest.findOne({ _id: matchId, mentorId })
    .populate('applicantId', 'firstname lastname email profile applicationData createdAt')
    .lean();
};

const listMentorMatches = async ({ mentorId }) => {
  return MatchRequest.find({ mentorId })
    .populate('applicantId', 'firstname lastname email profile applicationData')
    .sort({ updatedAt: -1 })
    .lean();
};

const listSuggestionsForMentee = async ({ menteeId, limit = 10 }) => {
  return MatchRequest.find({
    applicantId: menteeId,
    status: { $in: ['suggested', 'mentor_accepted', 'mentee_accepted'] },
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  })
    .populate('mentorId', 'firstname lastname email profile mentorSettings')
    .sort({ score: -1, updatedAt: -1 })
    .limit(limit)
    .lean();
};

const listMenteeMatches = async ({ menteeId }) => {
  return MatchRequest.find({ applicantId: menteeId })
    .populate('mentorId', 'firstname lastname email profile mentorSettings')
    .sort({ updatedAt: -1 })
    .lean();
};

const establishMentorship = async ({ matchRequest, actorId, ipAddress }) => {
  const mentorship = await Mentorship.create({
    mentorId: matchRequest.mentorId,
    menteeId: matchRequest.applicantId,
    matchRequestId: matchRequest._id,
    startedAt: new Date(),
    status: 'active',
    metadata: {
      goals: matchRequest?.metadata?.reason || matchRequest?.menteeSnapshot?.goals,
      program: matchRequest?.menteeSnapshot?.program,
    },
  });

  await Promise.all([
    User.updateOne({ _id: matchRequest.mentorId }, { $inc: { 'mentorSettings.activeMenteesCount': 1 } }),
    MatchRequest.updateOne({ _id: matchRequest._id }, { $set: { status: 'connected' } }),
  ]);

  await Promise.all([
    sendNotification({
      userId: matchRequest.mentorId,
      type: 'MATCH_CONFIRMED',
      title: 'Mentorship confirmed',
      message: 'You and your mentee both accepted. A mentorship connection has been created.',
      data: { mentorshipId: mentorship._id, matchRequestId: matchRequest._id },
    }),
    sendNotification({
      userId: matchRequest.applicantId,
      type: 'MATCH_CONFIRMED',
      title: 'Mentor confirmed!',
      message: 'Your mentor accepted your request. You are now officially matched.',
      data: { mentorshipId: mentorship._id, mentorId: matchRequest.mentorId },
    }),
  ]);

  await logAudit({
    matchRequestId: matchRequest._id,
    actorId: actorId || matchRequest.mentorId,
    actorRole: 'system',
    action: 'connected',
    ipAddress,
  });

  return mentorship;
};

const mentorAcceptMatch = async ({ matchId, mentorId, note, ipAddress }) => {
  const match = await MatchRequest.findOne({ _id: matchId, mentorId });
  if (!match) {
    const error = new Error('Match not found');
    error.status = 404;
    throw error;
  }
  if (match.expiresAt && match.expiresAt < new Date()) {
    match.status = 'expired';
    await match.save();
    const error = new Error('Match suggestion expired');
    error.status = 409;
    error.code = 'MATCH_EXPIRED';
    throw error;
  }
  if (['mentor_declined', 'rejected', 'connected', 'expired'].includes(match.status)) {
    const error = new Error('Match is no longer actionable');
    error.status = 409;
    error.code = 'MATCH_NOT_ACTIONABLE';
    throw error;
  }

  const mentor = await User.findById(mentorId).select('mentorSettings role applicationStatus');
  ensureMentorCapacity(mentor);

  if (note) {
    match.notes = String(note).trim();
  }

  let newStatus = 'mentor_accepted';
  if (match.status === 'mentee_accepted') {
    const mentorship = await establishMentorship({ matchRequest: match, actorId: mentorId, ipAddress });
    const refreshed = await MatchRequest.findById(match._id).lean();
    return { match: refreshed, mentorship, status: 'connected' };
  }

  match.status = newStatus;
  await match.save();

  await Promise.all([
    sendNotification({
      userId: match.applicantId,
      type: 'MATCH_RESPONSE',
      title: 'Mentor accepted your application',
      message: 'Your mentor accepted the match. Please confirm to finalize.',
      data: { matchRequestId: match._id },
    }),
    logAudit({ matchRequestId: match._id, actorId: mentorId, actorRole: 'mentor', action: 'mentor_accept', ipAddress }),
  ]);

  return { match, status: newStatus };
};

const mentorDeclineMatch = async ({ matchId, mentorId, reason, ipAddress }) => {
  const match = await MatchRequest.findOne({ _id: matchId, mentorId });
  if (!match) {
    const error = new Error('Match not found');
    error.status = 404;
    throw error;
  }
  if (match.expiresAt && match.expiresAt < new Date()) {
    match.status = 'expired';
    await match.save();
    const error = new Error('Match suggestion expired');
    error.status = 409;
    error.code = 'MATCH_EXPIRED';
    throw error;
  }

  match.status = 'mentor_declined';
  match.notes = reason ? String(reason).trim() : match.notes;
  await match.save();

  await Promise.all([
    sendNotification({
      userId: match.applicantId,
      type: 'MATCH_DECLINED',
      title: 'Mentor declined the match',
      message: 'This mentor declined the suggestion. We will find another match for you soon.',
      data: { matchRequestId: match._id },
    }),
    logAudit({ matchRequestId: match._id, actorId: mentorId, actorRole: 'mentor', action: 'mentor_decline', reason, ipAddress }),
  ]);

  return match;
};

const menteeAcceptMatch = async ({ matchId, menteeId, ipAddress }) => {
  const match = await MatchRequest.findOne({ _id: matchId, applicantId: menteeId });
  if (!match) {
    const error = new Error('Match not found');
    error.status = 404;
    throw error;
  }
  if (match.expiresAt && match.expiresAt < new Date()) {
    match.status = 'expired';
    await match.save();
    const error = new Error('Match suggestion expired');
    error.status = 409;
    error.code = 'MATCH_EXPIRED';
    throw error;
  }

  if (['mentor_declined', 'rejected', 'connected', 'expired'].includes(match.status)) {
    const error = new Error('Match is no longer available');
    error.status = 409;
    error.code = 'MATCH_NOT_ACTIONABLE';
    throw error;
  }

  if (match.status === 'mentor_accepted') {
    const mentorship = await establishMentorship({ matchRequest: match, actorId: menteeId, ipAddress });
    const refreshed = await MatchRequest.findById(match._id).lean();
    return { match: refreshed, mentorship, status: 'connected' };
  }

  match.status = 'mentee_accepted';
  await match.save();

  await Promise.all([
    sendNotification({
      userId: match.mentorId,
      type: 'MATCH_RESPONSE',
      title: 'Mentee accepted the match',
      message: 'Your mentee accepted the match suggestion. Please confirm to finalize.',
      data: { matchRequestId: match._id },
    }),
    logAudit({ matchRequestId: match._id, actorId: menteeId, actorRole: 'mentee', action: 'mentee_accept', ipAddress }),
  ]);

  return { match, status: 'mentee_accepted' };
};

const menteeDeclineMatch = async ({ matchId, menteeId, reason, ipAddress }) => {
  const match = await MatchRequest.findOne({ _id: matchId, applicantId: menteeId });
  if (!match) {
    const error = new Error('Match not found');
    error.status = 404;
    throw error;
  }
  if (match.expiresAt && match.expiresAt < new Date()) {
    match.status = 'expired';
    await match.save();
    const error = new Error('Match suggestion expired');
    error.status = 409;
    error.code = 'MATCH_EXPIRED';
    throw error;
  }

  match.status = 'mentee_declined';
  match.notes = reason ? String(reason).trim() : match.notes;
  await match.save();

  await Promise.all([
    sendNotification({
      userId: match.mentorId,
      type: 'MATCH_DECLINED',
      title: 'Mentee declined the match',
      message: 'The mentee declined this match suggestion. We will look for another candidate soon.',
      data: { matchRequestId: match._id },
    }),
    logAudit({ matchRequestId: match._id, actorId: menteeId, actorRole: 'mentee', action: 'mentee_decline', reason, ipAddress }),
  ]);

  return match;
};

module.exports = {
  calculateScore,
  generateSuggestionsForMentor,
  generateSuggestionsForAllMentors,
  listSuggestionsForMentor,
  listSuggestionsForMentee,
  getSuggestionDetail,
  mentorAcceptMatch,
  mentorDeclineMatch,
  menteeAcceptMatch,
  listMentorMatches,
  listMenteeMatches,
  menteeDeclineMatch,
};
