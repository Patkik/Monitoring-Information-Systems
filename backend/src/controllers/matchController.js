const mongoose = require('mongoose');
const User = require('../models/User');
const { ok, fail } = require('../utils/responses');
const {
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
  menteeDeclineMatch: menteeDeclineMatchService,
} = require('../services/matchService');

const canActOnMentorResource = (reqUser, mentorId) => {
  if (!reqUser) return false;
  if (reqUser.role === 'admin') return true;
  return reqUser.id === mentorId;
};

const serializeMenteePreview = (matchDoc) => {
  const mentee = matchDoc.applicantId;
  const profile = mentee?.profile || {};
  const appData = mentee?.applicationData || {};
  const education = profile.education || {};
  
  const extractTags = (source) => {
    if (Array.isArray(source)) return source;
    if (typeof source === 'string') return source.split(',').map(s => s.trim()).filter(Boolean);
    return [];
  };

  return {
    id: mentee?._id?.toString(),
    name: [mentee?.firstname, mentee?.lastname].filter(Boolean).join(' ').trim() || profile.displayName || mentee?.email,
    email: mentee?.email,
    photoUrl: profile.photoUrl || null,
    bio: profile.bio || appData.bio || null,
    expertiseAreas: profile.expertiseAreas?.length ? profile.expertiseAreas : extractTags(appData.expertiseAreas || appData.mentoringTopics),
    skills: profile.skills?.length ? profile.skills : extractTags(appData.learningGoals || appData.mentoringGoals || appData.specificSkills || appData.programmingLanguage),
    interests: profile.interests?.length ? profile.interests : extractTags(appData.interests),
    availabilitySlots: profile.availabilitySlots || [],
    education: {
      program: education.program || appData.program || null,
    },
  };
};

const serializeMentorPreview = (matchDoc) => {
  const mentor = matchDoc.mentorId;
  const profile = mentor?.profile || {};
  const snapshot = matchDoc.mentorSnapshot || {};
  const nameFromDoc = [mentor?.firstname, mentor?.lastname].filter(Boolean).join(' ').trim();
  return {
    id: mentor?._id?.toString() || null,
    name: nameFromDoc || snapshot.name || mentor?.email || null,
    email: mentor?.email || null,
    photoUrl: profile.photoUrl || null,
    bio: profile.bio || null,
    expertiseAreas: profile.expertiseAreas || snapshot.expertiseAreas || [],
    capacity: mentor?.mentorSettings?.capacity ?? snapshot.capacity ?? null,
  };
};

const serializeMatch = (matchDoc) => {
  const populated =
    matchDoc.applicantId && typeof matchDoc.applicantId === 'object' && 'firstname' in matchDoc.applicantId;
  const mentorPopulated = matchDoc.mentorId && typeof matchDoc.mentorId === 'object' && 'firstname' in matchDoc.mentorId;
  return {
    id: matchDoc._id.toString(),
    score: matchDoc.score,
    status: matchDoc.status,
    expiresAt: matchDoc.expiresAt,
    mentorId: matchDoc.mentorId?.toString() || null,
    mentee: populated ? serializeMenteePreview(matchDoc) : matchDoc.menteeSnapshot,
    mentor: mentorPopulated ? serializeMentorPreview(matchDoc) : matchDoc.mentorSnapshot,
    scoreBreakdown: matchDoc.scoreBreakdown,
    notes: matchDoc.notes,
    metadata: matchDoc.metadata,
    createdAt: matchDoc.createdAt,
    updatedAt: matchDoc.updatedAt,
  };
};

exports.getMatchSuggestions = async (req, res) => {
  const { mentorId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(mentorId)) {
    return fail(res, 400, 'INVALID_ID', 'Invalid mentor id.');
  }
  if (!canActOnMentorResource(req.user, mentorId)) {
    return fail(res, 403, 'FORBIDDEN', 'You are not allowed to view these suggestions.');
  }

  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));

  try {
    const [suggestions, mentor] = await Promise.all([
      listSuggestionsForMentor({ mentorId, limit }),
      User.findById(mentorId).select('mentorSettings').lean(),
    ]);
    const capacity = mentor?.mentorSettings?.capacity ?? null;
    const active = mentor?.mentorSettings?.activeMenteesCount ?? null;
    return ok(
      res,
      { suggestions: suggestions.map(serializeMatch) },
      { count: suggestions.length, capacity, activeMentees: active, remainingSlots: capacity !== null ? Math.max(capacity - (active || 0), 0) : null }
    );
  } catch (error) {
    return fail(res, error.status || 500, error.code || 'MATCH_SUGGESTIONS_FAILED', error.message || 'Unable to load suggestions.');
  }
};

exports.getMenteeMatchSuggestions = async (req, res) => {
  const { menteeId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(menteeId)) {
    return fail(res, 400, 'INVALID_ID', 'Invalid mentee id.');
  }
  if (req.user.role !== 'admin' && req.user.id !== menteeId) {
    return fail(res, 403, 'FORBIDDEN', 'You are not allowed to view these suggestions.');
  }

  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));

  try {
    const suggestions = await listSuggestionsForMentee({ menteeId, limit });
    const awaitingMentee = suggestions.filter((match) => match.status === 'mentor_accepted').length;
    const awaitingMentor = suggestions.filter((match) => match.status === 'mentee_accepted').length;
    return ok(
      res,
      { suggestions: suggestions.map(serializeMatch) },
      {
        count: suggestions.length,
        awaitingMentee,
        awaitingMentor,
        capacity: null,
        activeMentees: null,
        remainingSlots: null,
      }
    );
  } catch (error) {
    return fail(
      res,
      error.status || 500,
      error.code || 'MENTEE_MATCH_SUGGESTIONS_FAILED',
      error.message || 'Unable to load mentee suggestions.'
    );
  }
};

exports.getMatchSuggestionDetail = async (req, res) => {
  const { mentorId, matchId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(mentorId) || !mongoose.Types.ObjectId.isValid(matchId)) {
    return fail(res, 400, 'INVALID_ID', 'Invalid identifier supplied.');
  }
  if (!canActOnMentorResource(req.user, mentorId)) {
    return fail(res, 403, 'FORBIDDEN', 'You are not allowed to view this suggestion.');
  }

  try {
    const detail = await getSuggestionDetail({ mentorId, matchId });
    if (!detail) {
      return fail(res, 404, 'MATCH_NOT_FOUND', 'Match suggestion not found.');
    }
    return ok(res, { match: serializeMatch(detail) });
  } catch (error) {
    return fail(res, error.status || 500, error.code || 'MATCH_SUGGESTION_FAILED', error.message || 'Failed to load match.');
  }
};

exports.acceptMatch = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return fail(res, 400, 'INVALID_ID', 'Invalid match identifier.');
  }
  if (req.user.role !== 'mentor') {
    return fail(res, 403, 'FORBIDDEN', 'Only mentors can accept matches.');
  }

  try {
    const result = await mentorAcceptMatch({ matchId: id, mentorId: req.user.id, note: req.body?.note, ipAddress: req.ip });
    return ok(res, { match: serializeMatch(result.match), mentorship: result.mentorship || null });
  } catch (error) {
    const status = error.status || 500;
    const code = error.code || 'MATCH_ACCEPT_FAILED';
    return fail(res, status, code, error.message || 'Unable to accept match.');
  }
};

exports.declineMatch = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return fail(res, 400, 'INVALID_ID', 'Invalid match identifier.');
  }
  if (req.user.role !== 'mentor') {
    return fail(res, 403, 'FORBIDDEN', 'Only mentors can decline matches.');
  }

  try {
    const match = await mentorDeclineMatch({ matchId: id, mentorId: req.user.id, reason: req.body?.reason, ipAddress: req.ip });
    return ok(res, { match: serializeMatch(match) });
  } catch (error) {
    return fail(res, error.status || 500, error.code || 'MATCH_DECLINE_FAILED', error.message || 'Unable to decline match.');
  }
};

exports.menteeAcceptMatch = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return fail(res, 400, 'INVALID_ID', 'Invalid match identifier.');
  }
  if (req.user.role !== 'mentee') {
    return fail(res, 403, 'FORBIDDEN', 'Only mentees can accept matches from their queue.');
  }

  try {
    const result = await menteeAcceptMatch({ matchId: id, menteeId: req.user.id, ipAddress: req.ip });
    return ok(res, { match: serializeMatch(result.match), mentorship: result.mentorship || null });
  } catch (error) {
    return fail(res, error.status || 500, error.code || 'MENTEE_ACCEPT_FAILED', error.message || 'Unable to accept match.');
  }
};

exports.listMentorMatches = async (req, res) => {
  const { mentorId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(mentorId)) {
    return fail(res, 400, 'INVALID_ID', 'Invalid mentor id.');
  }
  if (!canActOnMentorResource(req.user, mentorId)) {
    return fail(res, 403, 'FORBIDDEN', 'You are not allowed to view these records.');
  }

  try {
    const [matches, mentor] = await Promise.all([
      listMentorMatches({ mentorId }),
      User.findById(mentorId).select('mentorSettings').lean(),
    ]);
    const capacity = mentor?.mentorSettings?.capacity ?? null;
    const active = mentor?.mentorSettings?.activeMenteesCount ?? null;
    return ok(
      res,
      { matches: matches.map(serializeMatch) },
      { count: matches.length, capacity, activeMentees: active, remainingSlots: capacity !== null ? Math.max(capacity - (active || 0), 0) : null }
    );
  } catch (error) {
    return fail(res, error.status || 500, error.code || 'MATCH_LIST_FAILED', error.message || 'Unable to list matches.');
  }
};

exports.listMenteeMatches = async (req, res) => {
  const { menteeId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(menteeId)) {
    return fail(res, 400, 'INVALID_ID', 'Invalid mentee id.');
  }
  if (req.user.role !== 'admin' && req.user.id !== menteeId) {
    return fail(res, 403, 'FORBIDDEN', 'You are not allowed to view these records.');
  }

  try {
    const matches = await listMenteeMatches({ menteeId });
    return ok(
      res,
      { matches: matches.map(serializeMatch) },
      { count: matches.length, capacity: null, activeMentees: null, remainingSlots: null }
    );
  } catch (error) {
    return fail(res, error.status || 500, error.code || 'MENTEE_MATCH_LIST_FAILED', error.message || 'Unable to list matches.');
  }
};

exports.menteeDeclineMatch = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return fail(res, 400, 'INVALID_ID', 'Invalid match identifier.');
  }
  if (req.user.role !== 'mentee') {
    return fail(res, 403, 'FORBIDDEN', 'Only mentees can decline these matches.');
  }

  try {
  const match = await menteeDeclineMatchService({ matchId: id, menteeId: req.user.id, reason: req.body?.reason, ipAddress: req.ip });
    return ok(res, { match: serializeMatch(match) });
  } catch (error) {
    return fail(res, error.status || 500, error.code || 'MENTEE_DECLINE_FAILED', error.message || 'Unable to decline match.');
  }
};

exports.generateSuggestionsJob = async (req, res) => {
  const targetMentor = req.body?.mentorId || req.query?.mentorId;
  const limit = req.body?.limit || req.query?.limit;

  if (targetMentor) {
    if (!mongoose.Types.ObjectId.isValid(targetMentor)) {
      return fail(res, 400, 'INVALID_ID', 'Invalid mentor id supplied.');
    }
    if (!canActOnMentorResource(req.user, targetMentor)) {
      return fail(res, 403, 'FORBIDDEN', 'You are not allowed to regenerate matches for this mentor.');
    }
  } else if (req.user.role !== 'admin') {
    return fail(res, 403, 'FORBIDDEN', 'Only administrators can regenerate matches for everyone.');
  }

  try {
    if (targetMentor) {
      const results = await generateSuggestionsForMentor({ mentorId: targetMentor, limit });
      return ok(res, { matches: results.map(serializeMatch) });
    }
    const summaries = await generateSuggestionsForAllMentors({ limit });
    return ok(res, { runs: summaries });
  } catch (error) {
    return fail(res, error.status || 500, error.code || 'MATCH_GENERATION_FAILED', error.message || 'Unable to generate suggestions.');
  }
};
