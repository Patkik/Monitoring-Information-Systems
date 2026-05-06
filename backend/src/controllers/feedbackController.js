const mongoose = require('mongoose');
const crypto = require('crypto');
const Session = require('../models/Session');
const SessionFeedback = require('../models/SessionFeedback');
module.exports = require('./sessionFeedbackController');

exports.getMentorFeedbackSummary = async (req, res) => {
  try {
    const { mentorId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(mentorId)) {
      return fail(res, 400, 'INVALID_ID', 'Invalid mentor id.');
    }

    const mentor = await User.findById(mentorId).select('feedbackStats firstname lastname email role');
    if (!mentor || mentor.role !== 'mentor') {
      return fail(res, 404, 'MENTOR_NOT_FOUND', 'Mentor not found.');
    }

    const summary = {
      averageRating: mentor.feedbackStats?.averageRating || 0,
      totalReviews: mentor.feedbackStats?.totalReviews || 0,
      lastReviewAt: mentor.feedbackStats?.lastReviewAt || null,
    };

    const recent = await SessionFeedback.find({ mentorId: mentorId, flagged: { $ne: true } })
      .sort({ submittedAt: -1 })
      .limit(10)
      .select('rating text submittedAt anonymizedCode')
      .lean();

    return ok(res, {
      summary,
      recent: recent.map((item) => ({
        code: item.anonymizedCode,
        rating: item.rating,
        comment: item.text || null,
        submittedAt: item.submittedAt,
      })),
    });
  } catch (error) {
    return fail(res, 500, 'FEEDBACK_SUMMARY_FAILED', error.message);
  }
};

exports.listAdminFeedback = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return fail(res, 403, 'FORBIDDEN', 'Admin access required.');
    }

    const status = req.query.status === 'all' ? undefined : req.query.status;
    const filter = {};
    if (status === 'flagged') {
      filter.flagged = true;
    }

    const feedbacks = await SessionFeedback.find(filter)
      .sort({ submittedAt: -1 })
      .limit(100)
      .select('mentor rating comment submittedAt anonymizedCode flagged flagReason')
      .populate('mentor', 'firstname lastname email')
      .lean();

    const rows = feedbacks.map((fb) => ({
      id: fb._id.toString(),
      mentor: fb.mentor ? getFullName(fb.mentor) || fb.mentor.email : 'Mentor',
      rating: fb.rating,
      comment: fb.comment || null,
      submittedAt: fb.submittedAt,
      anonymizedCode: fb.anonymizedCode,
      flagged: !!fb.flagged,
      flagReason: fb.flagReason || null,
    }));

    return ok(res, { feedback: rows }, { count: rows.length });
  } catch (error) {
    return fail(res, 500, 'ADMIN_FEEDBACK_FAILED', error.message);
  }
};
