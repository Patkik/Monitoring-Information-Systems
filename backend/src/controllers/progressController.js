const Session = require('../models/Session');
const Goal = require('../models/Goal');
const { ok, fail } = require('../utils/responses');

// Simple badge rules derived from goals & milestones.
// Returned badges are additive (no exclusivity enforced).
const deriveBadges = ({ totalGoals, completedGoals, avgProgress, totalMilestones, achievedMilestones }) => {
  const badges = [];
  if (totalGoals >= 1) badges.push({ code: 'goal_starter', label: 'Set Your First Goal' });
  if (completedGoals >= 1) badges.push({ code: 'goal_finisher', label: 'Completed Goal' });
  if (avgProgress >= 50) badges.push({ code: 'halfway_there', label: 'Halfway Milestone' });
  if (achievedMilestones >= 5) badges.push({ code: 'milestone_collector', label: '5 Milestones Achieved' });
  if (avgProgress >= 90 && completedGoals === totalGoals && totalGoals > 0) badges.push({ code: 'all_goals_mastered', label: 'All Goals Mastered' });
  return badges;
};

// GET /api/mentees/:menteeId/progress (mentor, admin, or mentee themselves)
exports.getMenteeProgress = async (req, res) => {
  try {
    const { menteeId } = req.params;
    
    // Authorization
    if (req.user.role === 'mentor') {
      const Match = require('../models/Match');
      const match = await Match.findOne({ mentor: req.user.id, mentee: menteeId, status: 'accepted' });
      if (!match) {
        return fail(res, 403, 'FORBIDDEN', 'You do not have access to view this mentee\'s progress');
      }
    } else if (req.user.role === 'mentee') {
      if (req.user.id !== menteeId) {
        return fail(res, 403, 'FORBIDDEN', 'You can only view your own progress');
      }
    } else if (req.user.role !== 'admin') {
      return fail(res, 403, 'FORBIDDEN', 'Unauthorized');
    }

    const User = require('../models/User');
    const mentee = await User.findById(menteeId);
    if (!mentee) {
      return fail(res, 404, 'NOT_FOUND', 'Mentee not found');
    }

    // Goals calculation
    const goalsList = await Goal.find({ mentee: menteeId, status: { $ne: 'archived' } })
      .select('title status milestones progressHistory targetDate createdAt')
      .lean();
      
    let totalProgressSum = 0;
    let achievedMilestones = 0;
    let totalMilestones = 0;
    
    const goals = goalsList.map(g => {
      let latest = 0;
      if (g.progressHistory && g.progressHistory.length) {
        latest = g.progressHistory[g.progressHistory.length - 1].value;
      } else if (g.milestones && g.milestones.length) {
        const done = g.milestones.filter((m) => m.achieved).length;
        latest = Math.round((done / g.milestones.length) * 100);
      }
      
      totalProgressSum += latest;
      if (g.milestones && g.milestones.length) {
        totalMilestones += g.milestones.length;
        achievedMilestones += g.milestones.filter((m) => m.achieved).length;
      }

      return {
        id: g._id,
        title: g.title,
        status: g.status,
        progressPercent: latest
      };
    });

    const averageProgress = goals.length ? Math.round(totalProgressSum / goals.length) : 0;

    // Sessions trend
    const eightWeeksAgo = new Date(Date.now() - 56 * 24 * 60 * 60 * 1000);
    const sessions = await Session.find({ 
      $or: [
        { mentee: menteeId },
        { participants: menteeId }
      ],
      date: { $gte: eightWeeksAgo } 
    }).select('date attended tasksCompleted status').lean();

    const byWeek = {};
    sessions.forEach((s) => {
      const d = new Date(s.date);
      const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      const dayNum = tmp.getUTCDay() || 7;
      tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil(((tmp - yearStart) / 86400000 + 1) / 7);
      const key = `${tmp.getUTCFullYear()}-W${weekNo}`;
      if (!byWeek[key]) byWeek[key] = { sessions: 0, attended: 0, tasksCompleted: 0 };
      byWeek[key].sessions += 1;
      
      const isAttended = s.attended || s.status === 'completed';
      if (isAttended) byWeek[key].attended += 1;
      byWeek[key].tasksCompleted += s.tasksCompleted || 0;
    });

    const sessionsTrend = Object.entries(byWeek)
      .sort((a, b) => (a[0] > b[0] ? 1 : -1))
      .map(([week, stats]) => ({ week, ...stats }));

    // Extract competencies from User's expertiseAreas or skills
    const competencies = (mentee.profile?.skills || []).map((skill, index) => ({
      skillKey: skill,
      level: 3, // Mocked level, or derive from somewhere if possible
      label: skill
    }));

    return ok(res, {
      menteeId,
      averageProgress,
      totalMilestones,
      milestonesAchieved: achievedMilestones,
      sessionsTrend,
      goals,
      competencies
    });
  } catch (err) {
    return fail(res, 500, 'MENTEE_PROGRESS_FAILED', err.message);
  }
};

// GET /api/progress-dashboard  (mentee only)
exports.getProgressDashboard = async (req, res) => {
  try {
    if (req.user.role !== 'mentee') return fail(res, 403, 'FORBIDDEN', 'Only mentees can access the progress dashboard.');
    const menteeId = req.user.id;

    // Goals aggregation
    const goals = await Goal.find({ mentee: menteeId, status: { $ne: 'archived' } })
      .select('status milestones progressHistory targetDate createdAt')
      .lean();
    let totalProgressSum = 0;
    let completedGoals = 0;
    let achievedMilestones = 0;
    let totalMilestones = 0;
    const now = Date.now();
    const nearingDeadlineThresholdDays = 7;
    let nearingDeadlines = 0;
    goals.forEach((g) => {
      // progress percent
      let latest = 0;
      if (g.progressHistory && g.progressHistory.length) {
        latest = g.progressHistory[g.progressHistory.length - 1].value;
      } else if (g.milestones && g.milestones.length) {
        const done = g.milestones.filter((m) => m.achieved).length;
        latest = Math.round((done / g.milestones.length) * 100);
      }
      totalProgressSum += latest;
      if (g.status === 'completed' || latest === 100) completedGoals += 1;
      if (g.milestones && g.milestones.length) {
        totalMilestones += g.milestones.length;
        achievedMilestones += g.milestones.filter((m) => m.achieved).length;
      }
      if (g.targetDate) {
        const diffDays = (g.targetDate.getTime() - now) / (1000 * 60 * 60 * 24);
        if (diffDays >= 0 && diffDays <= nearingDeadlineThresholdDays && g.status !== 'completed') nearingDeadlines += 1;
      }
    });
    const totalGoals = goals.length;
    const avgProgress = totalGoals ? Math.round(totalProgressSum / totalGoals) : 0;

    // Sessions trends (last 8 weeks, group by ISO week year-week)
    const eightWeeksAgo = new Date(Date.now() - 56 * 24 * 60 * 60 * 1000);
    const sessions = await Session.find({ mentee: menteeId, date: { $gte: eightWeeksAgo } })
      .select('date attended tasksCompleted')
      .lean();
    const byWeek = {};
    sessions.forEach((s) => {
      const d = new Date(s.date);
      // ISO week calculation
      const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      const dayNum = tmp.getUTCDay() || 7;
      tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil(((tmp - yearStart) / 86400000 + 1) / 7);
      const key = `${tmp.getUTCFullYear()}-W${weekNo}`;
      if (!byWeek[key]) byWeek[key] = { sessions: 0, attended: 0, tasksCompleted: 0 };
      byWeek[key].sessions += 1;
      if (s.attended) byWeek[key].attended += 1;
      byWeek[key].tasksCompleted += s.tasksCompleted || 0;
    });
    const weekTrend = Object.entries(byWeek)
      .sort((a, b) => (a[0] > b[0] ? 1 : -1))
      .map(([week, stats]) => ({ week, ...stats }));

    const badges = deriveBadges({ totalGoals, completedGoals, avgProgress, totalMilestones, achievedMilestones });

    return ok(
      res,
      {
        goalsSummary: {
          totalGoals,
          completedGoals,
          avgProgress,
          nearingDeadlines,
          totalMilestones,
          achievedMilestones,
        },
        sessionsTrend: weekTrend,
        badges,
      }
    );
  } catch (err) {
    return fail(res, 500, 'PROGRESS_DASHBOARD_FAILED', err.message);
  }
};