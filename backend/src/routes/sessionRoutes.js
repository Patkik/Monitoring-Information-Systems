const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const sessionController = require('../controllers/sessionController');

// All routes require authentication. Some are scoped to the logged-in mentee and others to mentors.
// NOTE: Specific routes must come before parameterized routes (/sessions/:id)
router.get('/sessions', auth, sessionController.getMenteeSessions);
router.post('/sessions', auth, sessionController.bookSession);
router.post('/sessions/lock', auth, sessionController.createBookingLock);
router.get('/sessions/report', auth, sessionController.getMenteeReport);
router.get('/sessions/export', auth, sessionController.exportMenteeData);
router.get('/mentor/sessions', auth, sessionController.getMentorSessions);
router.post('/mentor/sessions', auth, sessionController.createMentorSession);
router.get('/sessions/:id', auth, sessionController.getSessionDetail);
router.patch('/sessions/:id/confirm', auth, sessionController.confirmSession);
router.patch('/sessions/:id/reschedule', auth, sessionController.rescheduleSession);
router.patch('/sessions/:id/cancel', auth, sessionController.cancelSession);
router.post('/sessions/:id/attendance', auth, sessionController.recordAttendance);
router.patch('/sessions/:id/complete', auth, sessionController.completeSession);

module.exports = router;
