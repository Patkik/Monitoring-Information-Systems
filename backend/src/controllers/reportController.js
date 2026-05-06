const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const xlsx = require('xlsx');
const Session = require('../models/Session');
const Feedback = require('../models/Feedback');
const MentorFeedback = require('../models/MentorFeedback');
const User = require('../models/User');
const { ok, fail } = require('../utils/responses');
const logger = require('../utils/logger');

const SESSION_STATUSES = ['pending', 'confirmed', 'rescheduled', 'cancelled', 'completed'];
const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_RANGE_DAYS = Number(process.env.REPORT_DEFAULT_RANGE_DAYS || 90);
const MAX_EXPORT_ROWS = Number(process.env.REPORT_MAX_EXPORT_ROWS || 1500);
const MAX_RECENT_ROWS = 25;
const RECENT_FEEDBACK_LIMIT = 6;

const ensureAdmin = (user) => Boolean(user && user.role === 'admin');

const toObjectId = (value) => {
  if (!value) {
    return null;
  }
  if (value instanceof mongoose.Types.ObjectId) {
    return value;
  }
  if (mongoose.Types.ObjectId.isValid(value)) {
    return new mongoose.Types.ObjectId(value);
  }
  return null;
};

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeDate = (value, endOfDay = false) => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }
  return date;
};

const buildReportFilters = (query = {}) => {
  const filters = {};
  const appliedFilters = {};
  const dateRange = { from: null, to: null };

  let fromDate = normalizeDate(query.from);
  let toDate = normalizeDate(query.to, true);

  if (!fromDate && !toDate) {
    fromDate = new Date(Date.now() - DEFAULT_RANGE_DAYS * DAY_MS);
    fromDate.setHours(0, 0, 0, 0);
    appliedFilters.defaultRange = DEFAULT_RANGE_DAYS;
  }

  if (fromDate) {
    filters.date = filters.date || {};
    filters.date.$gte = fromDate;
    appliedFilters.from = fromDate.toISOString();
    dateRange.from = fromDate;
  }

  if (toDate) {
    filters.date = filters.date || {};
    filters.date.$lte = toDate;
    appliedFilters.to = toDate.toISOString();
    dateRange.to = toDate;
  }

  if (query.mentorId) {
    const mentorId = toObjectId(query.mentorId);
    if (mentorId) {
      filters.mentor = mentorId;
      appliedFilters.mentorId = mentorId.toString();
    }
  }

  if (query.menteeId) {
    const menteeId = toObjectId(query.menteeId);
    if (menteeId) {
      filters.mentee = menteeId;
      appliedFilters.menteeId = menteeId.toString();
    }
  }

  if (query.status) {
    const statuses = String(query.status)
      .split(',')
      .map((value) => value.trim())
      .filter((value) => SESSION_STATUSES.includes(value));
    if (statuses.length === 1) {
      filters.status = statuses[0];
    } else if (statuses.length > 1) {
      filters.status = { $in: statuses };
    }
    if (statuses.length) {
      appliedFilters.status = statuses;
    }
  }

  if (query.topic) {
    const topic = String(query.topic).trim();
    if (topic) {
      filters.subject = new RegExp(escapeRegex(topic), 'i');
      appliedFilters.topic = topic;
    }
  }

  if (query.attendance === 'attended') {
    filters.attended = true;
    appliedFilters.attendance = 'attended';
  } else if (query.attendance === 'missed') {
    filters.attended = false;
    appliedFilters.attendance = 'missed';
  }

  return { filters, appliedFilters, dateRange };
};

const buildFeedbackFilters = (filters, dateRange) => {
  const query = {};
  if (dateRange.from || dateRange.to) {
    query.submittedAt = {};
    if (dateRange.from) {
      query.submittedAt.$gte = dateRange.from;
    }
    if (dateRange.to) {
      query.submittedAt.$lte = dateRange.to;
    }
    if (!Object.keys(query.submittedAt).length) {
      delete query.submittedAt;
    }
  }

  if (filters.mentor) {
    query.mentorId = filters.mentor;
  }
  if (filters.mentee) {
    query.menteeId = filters.mentee;
  }

  return query;
};

const formatPerson = (doc) => {
  if (!doc) {
    return null;
  }

  const id = doc._id ? doc._id.toString() : doc.id || null;
  const first = doc.firstname || '';
  const last = doc.lastname || '';
  const name = [first, last].filter(Boolean).join(' ').trim() || doc.name || doc.email || 'Unknown';

  return {
    id,
    name,
    email: doc.email || null,
  };
};

const computeSessionSummary = async (filters) => {
  const [summary] = await Session.aggregate([
    { $match: filters },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        completedSessions: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        confirmedSessions: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
        rescheduledSessions: { $sum: { $cond: [{ $eq: ['$status', 'rescheduled'] }, 1, 0] } },
        cancelledSessions: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        pendingSessions: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        attendedSessions: { $sum: { $cond: [{ $ifNull: ['$attended', false] }, 1, 0] } },
        totalDuration: { $sum: { $ifNull: ['$durationMinutes', 0] } },
        totalTasks: { $sum: { $ifNull: ['$tasksCompleted', 0] } },
        mentorSet: { $addToSet: '$mentor' },
        menteeSet: { $addToSet: '$mentee' },
      },
    },
    {
      $project: {
        totalSessions: 1,
        completedSessions: 1,
        confirmedSessions: 1,
        rescheduledSessions: 1,
        cancelledSessions: 1,
        pendingSessions: 1,
        attendedSessions: 1,
        totalDuration: 1,
        totalTasks: 1,
        mentorCount: {
          $size: {
            $filter: {
              input: '$mentorSet',
              as: 'mentor',
              cond: { $ne: ['$$mentor', null] },
            },
          },
        },
        menteeCount: {
          $size: {
            $filter: {
              input: '$menteeSet',
              as: 'mentee',
              cond: { $ne: ['$$mentee', null] },
            },
          },
        },
      },
    },
  ]);

  if (!summary) {
    return {
      totalSessions: 0,
      completedSessions: 0,
      confirmedSessions: 0,
      rescheduledSessions: 0,
      cancelledSessions: 0,
      pendingSessions: 0,
      attendedSessions: 0,
      attendanceRate: 0,
      averageDurationMinutes: 0,
      averageTasksCompleted: 0,
      mentorCount: 0,
      menteeCount: 0,
    };
  }

  const attendanceRate = summary.totalSessions
    ? Math.round((summary.attendedSessions / summary.totalSessions) * 100)
    : 0;
  const averageDurationMinutes = summary.totalSessions
    ? summary.totalDuration / summary.totalSessions
    : 0;
  const averageTasksCompleted = summary.totalSessions
    ? summary.totalTasks / summary.totalSessions
    : 0;

  return {
    totalSessions: summary.totalSessions,
    completedSessions: summary.completedSessions,
    confirmedSessions: summary.confirmedSessions,
    rescheduledSessions: summary.rescheduledSessions,
    cancelledSessions: summary.cancelledSessions,
    pendingSessions: summary.pendingSessions,
    attendedSessions: summary.attendedSessions,
    attendanceRate,
    averageDurationMinutes,
    averageTasksCompleted,
    mentorCount: summary.mentorCount,
    menteeCount: summary.menteeCount,
  };
};

const buildStatusBreakdown = async (filters) => {
  const rows = await Session.aggregate([
    { $match: filters },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        attended: { $sum: { $cond: [{ $ifNull: ['$attended', false] }, 1, 0] } },
      },
    },
    { $sort: { count: -1 } },
  ]);

  return rows.map((row) => ({
    status: row._id,
    count: row.count,
    attendanceRate: row.count ? Math.round((row.attended / row.count) * 100) : 0,
  }));
};

const buildMonthlyTrends = async (filters) => {
  const rows = await Session.aggregate([
    { $match: filters },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
        },
        total: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
        },
        attended: { $sum: { $cond: [{ $ifNull: ['$attended', false] }, 1, 0] } },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  return rows.map((row) => ({
    month: `${row._id.year}-${String(row._id.month).padStart(2, '0')}`,
    total: row.total,
    completed: row.completed,
    attended: row.attended,
  }));
};

const buildMentorParticipation = async (filters) => {
  const matchStage = { ...filters };
  if (!matchStage.mentor) {
    matchStage.mentor = { $ne: null };
  }

  const rows = await Session.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$mentor',
        total: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        attended: { $sum: { $cond: [{ $ifNull: ['$attended', false] }, 1, 0] } },
      },
    },
    { $sort: { total: -1 } },
    { $limit: 5 },
  ]);

  if (!rows.length) {
    return [];
  }

  const mentorIds = rows.map((row) => row._id).filter(Boolean);
  const mentorDocs = await User.find({ _id: { $in: mentorIds } })
    .select('firstname lastname email')
    .lean();
  const mentorMap = new Map(mentorDocs.map((doc) => [doc._id.toString(), doc]));

  return rows.map((row) => {
    const mentorDoc = row._id ? mentorMap.get(row._id.toString()) : null;
    const attendanceRate = row.total ? Math.round((row.attended / row.total) * 100) : 0;
    const completionRate = row.total ? Math.round((row.completed / row.total) * 100) : 0;
    return {
      mentorId: row._id ? row._id.toString() : null,
      mentor: formatPerson(mentorDoc),
      totalSessions: row.total,
      attendanceRate,
      completionRate,
    };
  });
};

const hydrateFeedbackForSessions = async (sessionIds) => {
  if (!sessionIds.length) {
    return {
      mentee: new Map(),
      mentor: new Map(),
    };
  }

  const [menteeFeedback, mentorFeedback] = await Promise.all([
    Feedback.find({ sessionId: { $in: sessionIds } })
      .select('sessionId rating')
      .lean(),
    MentorFeedback.find({ sessionId: { $in: sessionIds } })
      .select('sessionId rating')
      .lean(),
  ]);

  const menteeMap = new Map();
  const mentorMap = new Map();

  menteeFeedback.forEach((entry) => {
    if (entry.sessionId) {
      menteeMap.set(entry.sessionId.toString(), entry.rating);
    }
  });

  mentorFeedback.forEach((entry) => {
    if (entry.sessionId) {
      mentorMap.set(entry.sessionId.toString(), entry.rating);
    }
  });

  return { mentee: menteeMap, mentor: mentorMap };
};

const fetchSessionsList = async (filters, limit = MAX_RECENT_ROWS) => {
  const size = Math.min(Math.max(1, limit), MAX_EXPORT_ROWS);
  const docs = await Session.find(filters)
    .sort({ date: -1 })
    .limit(size)
    .select('subject date status attended durationMinutes tasksCompleted mentor mentee')
    .populate('mentor', 'firstname lastname email')
    .populate('mentee', 'firstname lastname email')
    .lean();

  const sessionIds = docs.map((doc) => doc._id);
  const ratings = await hydrateFeedbackForSessions(sessionIds);

  return docs.map((doc) => ({
    id: doc._id.toString(),
    subject: doc.subject,
    date: doc.date,
    status: doc.status,
    attended: Boolean(doc.attended),
    durationMinutes: doc.durationMinutes || 0,
    tasksCompleted: doc.tasksCompleted || 0,
    mentor: formatPerson(doc.mentor),
    mentee: formatPerson(doc.mentee),
    menteeRating: ratings.mentee.get(doc._id.toString()) ?? null,
    mentorRating: ratings.mentor.get(doc._id.toString()) ?? null,
  }));
};

const fetchRecentFeedback = async (filters, dateRange, limit = RECENT_FEEDBACK_LIMIT) => {
  const feedbackFilters = buildFeedbackFilters(filters, dateRange);
  const docs = await Feedback.find(feedbackFilters)
    .sort({ submittedAt: -1 })
    .limit(limit)
    .select('rating sanitizedText text submittedAt mentorId menteeId flagged')
    .lean();

  if (!docs.length) {
    return [];
  }

  const userIds = new Set();
  docs.forEach((entry) => {
    if (entry.mentorId) {
      userIds.add(entry.mentorId.toString());
    }
    if (entry.menteeId) {
      userIds.add(entry.menteeId.toString());
    }
  });

  const people = await User.find({ _id: { $in: Array.from(userIds) } })
    .select('firstname lastname email')
    .lean();
  const peopleMap = new Map(people.map((person) => [person._id.toString(), person]));

  return docs.map((entry) => ({
    id: entry._id.toString(),
    rating: entry.rating,
    comment: entry.sanitizedText || entry.text || null,
    submittedAt: entry.submittedAt,
    mentor: entry.mentorId ? formatPerson(peopleMap.get(entry.mentorId.toString())) : null,
    mentee: entry.menteeId ? formatPerson(peopleMap.get(entry.menteeId.toString())) : null,
    flagged: Boolean(entry.flagged),
  }));
};

const buildRatingSummaryPipeline = (match) => [{ $match: match }, { $group: { _id: null, averageRating: { $avg: '$rating' }, count: { $sum: 1 } } }];

const buildRatingDistributionPipeline = (match) => [
  { $match: match },
  { $group: { _id: '$rating', count: { $sum: 1 } } },
  { $sort: { _id: 1 } },
];

const fetchSatisfactionMetrics = async (filters, dateRange) => {
  const menteeMatch = buildFeedbackFilters(filters, dateRange);
  const mentorMatch = buildFeedbackFilters(filters, dateRange);

  const [menteeSummary, menteeDistribution, mentorSummary, mentorDistribution] = await Promise.all([
    Feedback.aggregate(buildRatingSummaryPipeline(menteeMatch)),
    Feedback.aggregate(buildRatingDistributionPipeline(menteeMatch)),
    MentorFeedback.aggregate(buildRatingSummaryPipeline(mentorMatch)),
    MentorFeedback.aggregate(buildRatingDistributionPipeline(mentorMatch)),
  ]);

  const formatDistribution = (entries) =>
    entries.map((entry) => ({ rating: entry._id, count: entry.count }));

  return {
    mentee: {
      averageRating: menteeSummary[0]?.averageRating || 0,
      count: menteeSummary[0]?.count || 0,
      distribution: formatDistribution(menteeDistribution),
    },
    mentor: {
      averageRating: mentorSummary[0]?.averageRating || 0,
      count: mentorSummary[0]?.count || 0,
      distribution: formatDistribution(mentorDistribution),
    },
  };
};

const fetchOverviewData = async (filters, dateRange) => {
  const [
    summary,
    statusBreakdown,
    monthlyTrends,
    mentorParticipation,
    recentSessions,
    satisfaction,
    recentFeedback,
  ] = await Promise.all([
    computeSessionSummary(filters),
    buildStatusBreakdown(filters),
    buildMonthlyTrends(filters),
    buildMentorParticipation(filters),
    fetchSessionsList(filters, MAX_RECENT_ROWS),
    fetchSatisfactionMetrics(filters, dateRange),
    fetchRecentFeedback(filters, dateRange, RECENT_FEEDBACK_LIMIT),
  ]);

  return {
    summary,
    statusBreakdown,
    monthlyTrends,
    mentorParticipation,
    satisfaction,
    recentSessions,
    recentFeedback,
  };
};

const fetchSessionsForExport = (filters) => fetchSessionsList(filters, MAX_EXPORT_ROWS);

const buildCsv = (rows) => {
  const header = [
    'Date',
    'Subject',
    'Mentor',
    'Mentor Email',
    'Mentee',
    'Mentee Email',
    'Status',
    'Attended',
    'Duration (min)',
    'Tasks Completed',
    'Mentee Rating',
    'Mentor Rating',
  ];

  const formatValue = (value) => {
    if (value === null || typeof value === 'undefined') {
      return '';
    }
    return String(value).replace(/"/g, '""');
  };

  const lines = rows.map((row) => [
    row.date ? new Date(row.date).toISOString() : '',
    row.subject,
    row.mentor?.name ?? '',
    row.mentor?.email ?? '',
    row.mentee?.name ?? '',
    row.mentee?.email ?? '',
    row.status,
    row.attended ? 'Yes' : 'No',
    row.durationMinutes,
    row.tasksCompleted,
    row.menteeRating ?? '',
    row.mentorRating ?? '',
  ]
    .map((value) => `"${formatValue(value)}"`)
    .join(','));

  return [header.join(','), ...lines].join('\n');
};

const buildXlsx = (rows) => {
  const header = [
    'Date',
    'Subject',
    'Mentor',
    'Mentor Email',
    'Mentee',
    'Mentee Email',
    'Status',
    'Attended',
    'Duration (min)',
    'Tasks Completed',
    'Mentee Rating',
    'Mentor Rating',
  ];

  const data = rows.map((row) => [
    row.date ? new Date(row.date).toISOString() : '',
    row.subject,
    row.mentor?.name ?? '',
    row.mentor?.email ?? '',
    row.mentee?.name ?? '',
    row.mentee?.email ?? '',
    row.status,
    row.attended ? 'Yes' : 'No',
    row.durationMinutes,
    row.tasksCompleted,
    row.menteeRating ?? '',
    row.mentorRating ?? '',
  ]);

  const ws = xlsx.utils.aoa_to_sheet([header, ...data]);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'Admin Report');
  
  return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

const formatRangeLabel = (filters) => {
  if (filters.from && filters.to) {
    return `${new Date(filters.from).toLocaleDateString()} – ${new Date(filters.to).toLocaleDateString()}`;
  }
  if (filters.from) {
    return `Since ${new Date(filters.from).toLocaleDateString()}`;
  }
  if (filters.to) {
    return `Until ${new Date(filters.to).toLocaleDateString()}`;
  }
  if (filters.defaultRange) {
    return `Last ${filters.defaultRange} days`;
  }
  return 'All time';
};

const writePdfSectionHeading = (doc, text) => {
  doc.fontSize(12).fillColor('#111827').text(text, { underline: true });
  doc.moveDown(0.4);
};

const streamPdfReport = ({
  res,
  summary,
  filters,
  sessions,
  statusBreakdown,
  mentorParticipation,
  satisfaction,
}) => {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  doc.pipe(res);

  doc.fontSize(18).fillColor('#111827').text('Mentoring Program Report', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor('#4b5563').text(`Range: ${formatRangeLabel(filters)}`);
  doc.moveDown(1);

  writePdfSectionHeading(doc, 'Overview');
  doc.fontSize(10).fillColor('#1f2937');
  doc.text(`Total sessions: ${summary.totalSessions}`);
  doc.text(`Completed sessions: ${summary.completedSessions}`);
  doc.text(`Attendance rate: ${summary.attendanceRate}%`);
  doc.text(`Average duration: ${summary.averageDurationMinutes.toFixed(1)} minutes`);
  doc.text(`Average tasks completed: ${summary.averageTasksCompleted.toFixed(1)}`);
  doc.text(`Unique mentors: ${summary.mentorCount}`);
  doc.text(`Unique mentees: ${summary.menteeCount}`);
  doc.moveDown(0.8);

  writePdfSectionHeading(doc, 'Status breakdown');
  statusBreakdown.slice(0, 6).forEach((entry) => {
    const line = `• ${entry.status}: ${entry.count} sessions (${entry.attendanceRate}% attendance)`;
    doc.fontSize(10).text(line);
  });
  if (statusBreakdown.length === 0) {
    doc.fontSize(10).text('No sessions available for this range.');
  }
  doc.moveDown(0.8);

  writePdfSectionHeading(doc, 'Top mentors');
  if (!mentorParticipation.length) {
    doc.fontSize(10).text('No mentor participation data for this range.');
  } else {
    mentorParticipation.forEach((entry) => {
      const mentorLine =
        `• ${entry.mentor?.name ?? 'Mentor'} · ${entry.totalSessions} sessions · ` +
        `${entry.attendanceRate}% attendance · ${entry.completionRate}% completion`;
      doc.fontSize(10).text(mentorLine);
    });
  }
  doc.moveDown(0.8);

  writePdfSectionHeading(doc, 'Satisfaction');
  doc.fontSize(10).text(
    `Mentees: ${satisfaction.mentee.count} ratings · Avg ${satisfaction.mentee.averageRating.toFixed(2)}`
  );
  doc.text(`Mentors: ${satisfaction.mentor.count} ratings · Avg ${satisfaction.mentor.averageRating.toFixed(2)}`);
  doc.moveDown(0.8);

  writePdfSectionHeading(doc, 'Recent sessions');
  if (!sessions.length) {
    doc.fontSize(10).text('No sessions match the current filters.');
  } else {
    doc.fontSize(9);
    sessions.slice(0, 30).forEach((session) => {
      const dateLabel = `${new Date(session.date).toLocaleString()} · ${session.subject} (${session.status})`;
      const detailsLabel =
        `Mentor: ${session.mentor?.name ?? '—'} · ` +
        `Mentee: ${session.mentee?.name ?? '—'} · ` +
        `Attended: ${session.attended ? 'Yes' : 'No'} · ` +
        `Ratings Mentee/Mentor: ${session.menteeRating ?? '—'} / ${session.mentorRating ?? '—'}`;
      doc.fillColor('#111827').text(dateLabel);
      doc.fillColor('#4b5563').text(detailsLabel);
      doc.moveDown(0.35);
    });
    if (sessions.length > 30) {
      doc.fillColor('#6b7280').text(`+${sessions.length - 30} more sessions available via CSV export.`);
    }
  }

  doc.end();
};

exports.getAdminReportOverview = async (req, res) => {
  if (!ensureAdmin(req.user)) {
    return fail(res, 403, 'FORBIDDEN', 'Administrator access required.');
  }

  try {
    const { filters, appliedFilters, dateRange } = buildReportFilters(req.query || {});
    const report = await fetchOverviewData(filters, dateRange);
    return ok(res, { report: { filters: appliedFilters, ...report } });
  } catch (error) {
    logger.error('admin report overview failed: %s', error?.message || error);
    return fail(res, 500, 'REPORT_OVERVIEW_FAILED', 'Unable to load admin report.');
  }
};

exports.exportAdminReport = async (req, res) => {
  if (!ensureAdmin(req.user)) {
    return fail(res, 403, 'FORBIDDEN', 'Administrator access required.');
  }

  const format = (req.query?.format || 'csv').toString().toLowerCase();
  if (!['csv', 'xlsx', 'pdf'].includes(format)) {
    return fail(res, 400, 'INVALID_FORMAT', 'Supported formats: csv, xlsx, pdf.');
  }

  try {
    const { filters, appliedFilters, dateRange } = buildReportFilters(req.query || {});
    const sessions = await fetchSessionsForExport(filters);

    if (format === 'csv') {
      const csv = buildCsv(sessions);
      const filename = `admin_report_${new Date().toISOString().slice(0, 10)}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(csv);
    }
    
    if (format === 'xlsx') {
      const buffer = buildXlsx(sessions);
      const filename = `admin_report_${new Date().toISOString().slice(0, 10)}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(buffer);
    }

    const overview = await fetchOverviewData(filters, dateRange);
    const filename = `admin_report_${new Date().toISOString().slice(0, 10)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    streamPdfReport({
      res,
      summary: overview.summary,
      filters: appliedFilters,
      sessions,
      statusBreakdown: overview.statusBreakdown,
      mentorParticipation: overview.mentorParticipation,
      satisfaction: overview.satisfaction,
    });
    return undefined;
  } catch (error) {
    logger.error('admin report export failed: %s', error?.message || error);
    return fail(res, 500, 'REPORT_EXPORT_FAILED', 'Unable to export admin report.');
  }
};
