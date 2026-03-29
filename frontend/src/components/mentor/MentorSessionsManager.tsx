import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompleteMentorSession, useMentorSessions } from '../../shared/hooks/useMentorSessions';
import { useCancelSession } from '../../shared/hooks/useSessionLifecycle';
import type { ApiWarning, MentorSession } from '../../shared/services/sessionsService';
import MentorSessionComposer from './MentorSessionComposer';
import MentorFeedbackForm from './MentorFeedbackForm';
import AttendanceModal from './AttendanceModal';
import MentorSessionList from './sessions/MentorSessionList';
import MentorSessionDetails from './sessions/MentorSessionDetails';
import { 
    getParticipantList, 
    getPrimaryParticipantName, 
    canRecordAttendance, 
    canCancelSession, 
    getHoursUntilSession, 
    formatTimeUntil, 
    SESSION_CANCEL_PENALTY_HOURS 
} from './sessions/sessionUtils';

export const ATTENDANCE_LOCKOUT_MESSAGE =
    'Attendance opens at the scheduled start time. Please try again once the session begins.';

const MentorSessionsManager: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'completed'>('upcoming');
    const [sortBy, setSortBy] = useState<'date' | 'student' | 'subject'>('date');
    const [selectedSession, setSelectedSession] = useState<MentorSession | null>(null);
    // control completion modal independently of panel selection so the right panel can remain visible
    const [isCompletionOpen, setCompletionOpen] = useState(false);
    const [tasksCompleted, setTasksCompleted] = useState('0');
    const [notes, setNotes] = useState('');
    const [attended, setAttended] = useState(true);
    const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [isComposerOpen, setComposerOpen] = useState(false);
    const [isFeedbackOpen, setFeedbackOpen] = useState(false);
    const [feedbackSession, setFeedbackSession] = useState<MentorSession | null>(null);
    const [isAttendanceOpen, setAttendanceOpen] = useState(false);
    const [attendanceSession, setAttendanceSession] = useState<MentorSession | null>(null);
    const [cancelTarget, setCancelTarget] = useState<MentorSession | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelError, setCancelError] = useState<string | null>(null);
    const [lateCancelAcknowledged, setLateCancelAcknowledged] = useState(false);

    const { data: sessions = [], isLoading, isError, isFetching, refetch } = useMentorSessions();
    const completeSession = useCompleteMentorSession();
    const cancelSession = useCancelSession();
    const navigate = useNavigate();

    // Sync selectedSession when the react-query cache for sessions is updated
    useEffect(() => {
        if (selectedSession && sessions) {
            const updated = sessions.find((s) => s.id === selectedSession.id);
            if (updated && updated !== selectedSession) {
                setSelectedSession(updated);
            }
        }
    }, [sessions, selectedSession]);

    const handleSessionScheduled = (session: MentorSession, warnings?: ApiWarning[]) => {
        if (warnings && warnings.length > 0) {
            const mergedWarnings = warnings.map((warning) => warning.message).join(' ');
            setBanner({
                type: 'success',
                message: `Session "${session.subject}" scheduled. ${mergedWarnings}`,
            });
            return;
        }

        setBanner({ type: 'success', message: `Session "${session.subject}" scheduled and invites sent.` });
    };

    const handleOpenChat = (threadId?: string | null) => {
        if (!threadId) {
            setBanner({ type: 'error', message: 'Chat will be ready once the session syncs. Try again shortly.' });
            return;
        }
        navigate(`/mentor/chat?threadId=${threadId}`);
    };

    const stats = useMemo(() => {
        const total = sessions.length;
        const completed = sessions.filter((session) => (session.status ? session.status === 'completed' : session.attended)).length;
        const upcoming = sessions.filter((session) => (session.status ? session.status === 'upcoming' : !session.attended)).length;
        const awaitingFeedback = sessions.filter((session) => session.feedbackDue).length;
        return { total, upcoming, completed, awaitingFeedback };
    }, [sessions]);

    const filteredSessions = useMemo(() => {
        const lower = searchTerm.trim().toLowerCase();
        return sessions
            .filter((session) => {
                const isCompleted = session.status ? session.status === 'completed' : session.attended;
                const isCancelled = session.status === 'cancelled';
                if (statusFilter === 'upcoming' && (isCompleted || isCancelled)) return false;
                if (statusFilter === 'completed' && !isCompleted) return false;
                if (!lower) return true;
                const participantNames = getParticipantList(session)
                    .map((participant) => participant.name)
                    .join(' ');
                const haystack = `${session.subject} ${session.mentee?.name || ''} ${participantNames}`.toLowerCase();
                return haystack.includes(lower);
            })
            .sort((a, b) => {
                switch (sortBy) {
                    case 'student':
                        return getPrimaryParticipantName(a).localeCompare(getPrimaryParticipantName(b));
                    case 'subject':
                        return a.subject.localeCompare(b.subject);
                    case 'date':
                    default:
                        return Date.parse(a.date) - Date.parse(b.date);
                }
            });
    }, [sessions, searchTerm, statusFilter, sortBy]);

    // remove previous resetModalState - use closeCompletionModal or clearSelection explicitly where needed

    const closeCompletionModal = () => {
        // close only the completion modal but keep the right-side panel selection
        setCompletionOpen(false);
        setTasksCompleted('0');
        setNotes('');
        setAttended(true);
    };

    const openFeedbackModal = (session: MentorSession) => {
        const normalizedStatus = (session.status || (session.attended ? 'completed' : 'upcoming')).toLowerCase();
        if (normalizedStatus !== 'completed' && normalizedStatus !== 'ended') {
            return;
        }

        setFeedbackSession(session);
        setFeedbackOpen(true);
    };

    const closeFeedbackModal = () => {
        setFeedbackOpen(false);
        setFeedbackSession(null);
    };

    const openCompletionModal = (session: MentorSession) => {
        setSelectedSession(session);
        setTasksCompleted(String(session.tasksCompleted || 0));
        setNotes(session.notes || '');
        setAttended(true);
        setCompletionOpen(true);
    };

    const openAttendanceModal = (session: MentorSession) => {
        if (!canRecordAttendance(session)) {
            setBanner({ type: 'error', message: ATTENDANCE_LOCKOUT_MESSAGE });
            return;
        }

        setAttendanceSession(session);
        setAttendanceOpen(true);
    };

    const openCancelModal = (session: MentorSession) => {
        setCancelTarget(session);
        setCancelReason('');
        setCancelError(null);
        setLateCancelAcknowledged(false);
    };

    const closeCancelModal = () => {
        if (cancelSession.isLoading) {
            return;
        }

        setCancelTarget(null);
        setCancelReason('');
        setCancelError(null);
        setLateCancelAcknowledged(false);
    };

    const handleCancelSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!cancelTarget) {
            return;
        }

        const hoursUntilSession = getHoursUntilSession(cancelTarget);
        const isLateCancel = hoursUntilSession != null && hoursUntilSession <= SESSION_CANCEL_PENALTY_HOURS;
        if (isLateCancel && !lateCancelAcknowledged) {
            setCancelError('Please confirm you understand this is a late cancellation before continuing.');
            return;
        }

        try {
            const result = await cancelSession.mutateAsync({
                sessionId: cancelTarget.id,
                payload: {
                    reason: cancelReason.trim() || undefined,
                    notify: true,
                },
            });

            setSelectedSession((current) => (current && current.id === result.session.id ? ({ ...current, ...result.session } as MentorSession) : current));

            const warningMessage = result.warnings?.length
                ? ` ${result.warnings.map((warning) => warning.message).join(' ')}`
                : '';
            const latePenaltyMessage = isLateCancel ? ' you will be penalized for cancelling late.' : '';

            setBanner({
                type: 'success',
                message: `Session cancelled successfully.${latePenaltyMessage}${warningMessage}`,
            });

            closeCancelModal();
            void refetch();
        } catch (error: any) {
            setCancelError(error?.response?.data?.message || error?.message || 'Unable to cancel this session right now.');
        }
    };

    const handleComplete = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!selectedSession) return;

        try {
            await completeSession.mutateAsync({
                sessionId: selectedSession.id,
                payload: {
                    attended,
                    tasksCompleted: Number(tasksCompleted) || 0,
                    notes: notes.trim() ? notes.trim() : null,
                },
            });
            setBanner({ type: 'success', message: 'Session updated. The mentee can now submit feedback.' });
            // close completion modal but keep the panel selected
            setCompletionOpen(false);
            // refresh list so table/panel show updated values
            void refetch();
        } catch (error: any) {
            setBanner({ type: 'error', message: error?.message || 'Unable to update session. Try again.' });
        }
    };

    const showEmpty = !isLoading && filteredSessions.length === 0;
    const attendanceReady = selectedSession ? canRecordAttendance(selectedSession) : false;
    const cancellationReady = selectedSession ? canCancelSession(selectedSession) : false;
    const cancelHoursUntilSession = getHoursUntilSession(cancelTarget);
    const cancelIsLateWindow =
        cancelHoursUntilSession != null && cancelHoursUntilSession > 0 && cancelHoursUntilSession <= SESSION_CANCEL_PENALTY_HOURS;

    return (
        <>
        <section className="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-gray-100 tw-p-6">
            <div className="tw-flex tw-flex-col lg:tw-flex-row lg:tw-justify-between lg:tw-items-start tw-gap-6 tw-mb-6">
                <div className="tw-space-y-3">
                    <div>
                        <p className="tw-text-sm tw-font-semibold tw-text-primary">Mentor tools</p>
                        <h2 className="tw-text-2xl tw-font-bold tw-text-gray-900">Manage student sessions</h2>
                        <p className="tw-text-sm tw-text-gray-500">
                            Log attendance, capture notes, and unlock mentee feedback as soon as your session wraps.
                        </p>
                        <p className="tw-text-xs tw-text-gray-400">Scheduling a session automatically invites mentees to a shared chat.</p>
                    </div>
                    <div className="tw-flex tw-flex-wrap tw-gap-3">
                        <button
                            type="button"
                            onClick={() => setComposerOpen(true)}
                            className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-primary tw-text-white tw-text-sm tw-font-semibold tw-px-4 tw-py-2 hover:tw-bg-primary/90 focus:tw-ring-2 focus:tw-ring-offset-2 focus:tw-ring-primary"
                        >
                            Create session
                        </button>
                        <button
                            type="button"
                            onClick={() => refetch()}
                            className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-gray-200 tw-bg-white tw-text-sm tw-font-semibold tw-text-gray-700 tw-px-4 tw-py-2 hover:tw-bg-gray-50 focus:tw-ring-2 focus:tw-ring-offset-2 focus:tw-ring-gray-200"
                        >
                            Refresh list
                        </button>
                    </div>
                </div>
                <div className="tw-grid tw-grid-cols-2 tw-gap-3 sm:tw-gap-4">
                    <div className="tw-bg-gray-50 tw-rounded-xl tw-p-3 tw-text-center">
                        <p className="tw-text-xs tw-uppercase tw-text-gray-500">Upcoming</p>
                        <p className="tw-text-2xl tw-font-bold tw-text-gray-900">{stats.upcoming}</p>
                    </div>
                    <div className="tw-bg-gray-50 tw-rounded-xl tw-p-3 tw-text-center">
                        <p className="tw-text-xs tw-uppercase tw-text-gray-500">Completed</p>
                        <p className="tw-text-2xl tw-font-bold tw-text-gray-900">{stats.completed}</p>
                    </div>
                    <div className="tw-bg-gray-50 tw-rounded-xl tw-p-3 tw-text-center">
                        <p className="tw-text-xs tw-uppercase tw-text-gray-500">Awaiting feedback</p>
                        <p className="tw-text-2xl tw-font-bold tw-text-gray-900">{stats.awaitingFeedback}</p>
                    </div>
                    <div className="tw-bg-gray-50 tw-rounded-xl tw-p-3 tw-text-center">
                        <p className="tw-text-xs tw-uppercase tw-text-gray-500">Total</p>
                        <p className="tw-text-2xl tw-font-bold tw-text-gray-900">{stats.total}</p>
                    </div>
                </div>
            </div>

            {banner && (
                <div
                    role="status"
                    className={`tw-mb-4 tw-rounded-lg tw-border tw-p-3 tw-text-sm ${
                        banner.type === 'success'
                            ? 'tw-bg-green-50 tw-border-green-200 tw-text-green-800'
                            : 'tw-bg-red-50 tw-border-red-200 tw-text-red-700'
                    }`}
                >
                    <div className="tw-flex tw-justify-between tw-items-center">
                        <span>{banner.message}</span>
                        <button
                            onClick={() => setBanner(null)}
                            className="tw-text-xs tw-uppercase tw-font-semibold"
                            aria-label="Dismiss message"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            <div className="tw-flex tw-flex-col md:tw-flex-row tw-gap-3 tw-mb-4">
                <div className="tw-relative tw-flex-1">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Search by student or subject"
                        aria-label="Search sessions"
                        className="tw-w-full tw-px-4 tw-py-2 tw-pr-10 tw-border tw-border-gray-300 tw-rounded-lg tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary"
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            aria-label="Clear search"
                            className="tw-absolute tw-right-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-gray-400 hover:tw-text-gray-600"
                            onClick={() => setSearchTerm('')}
                        >
                            ×
                        </button>
                    )}
                </div>
                <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
                    className="tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary"
                    aria-label="Filter sessions by status"
                >
                    <option value="upcoming">Upcoming only</option>
                    <option value="completed">Completed</option>
                    <option value="all">All sessions</option>
                </select>
                <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
                    className="tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary"
                    aria-label="Sort sessions"
                >
                    <option value="date">Sort by date</option>
                    <option value="student">Sort by student</option>
                    <option value="subject">Sort by subject</option>
                </select>
            </div>

            {isError && (
                <div className="tw-bg-red-50 tw-text-red-700 tw-p-4 tw-rounded-lg tw-flex tw-items-center tw-justify-between tw-mb-4" role="alert">
                    <span>We couldn’t load your sessions. Please refresh.</span>
                    <button onClick={() => refetch()} className="tw-text-sm tw-font-medium tw-underline">
                        Retry
                    </button>
                </div>
            )}

                        <div className="tw-overflow-x-auto lg:tw-grid lg:tw-grid-cols-3 lg:tw-gap-6">
    <div className="lg:tw-col-span-2">
        <MentorSessionList
            isLoading={isLoading}
            isFetching={isFetching}
            filteredSessions={filteredSessions}
            showEmpty={showEmpty}
            setSelectedSession={setSelectedSession}
            openCancelModal={openCancelModal}
            openFeedbackModal={openFeedbackModal}
        />
    </div>
    <MentorSessionDetails
        selectedSession={selectedSession}
        feedbackSession={feedbackSession}
        setSelectedSession={setSelectedSession}
        banner={banner}
        setBanner={setBanner}
        handleOpenChat={handleOpenChat}
        openCompletionModal={openCompletionModal}
        openCancelModal={openCancelModal}
        openAttendanceModal={openAttendanceModal}
        cancellationReady={cancellationReady}
        attendanceReady={attendanceReady}
        setFeedbackSession={setFeedbackSession}
        setFeedbackOpen={setFeedbackOpen}
        openFeedbackModal={openFeedbackModal}
    />
</div>

            {selectedSession && isCompletionOpen && (
                <div
                    className="tw-fixed tw-inset-0 tw-bg-black/30 tw-backdrop-blur-sm tw-flex tw-items-center tw-justify-center tw-z-40"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="mentor-complete-session-title"
                >
                    <div className="tw-bg-white tw-rounded-2xl tw-shadow-2xl tw-w-full tw-max-w-xl tw-p-6 tw-space-y-4">
                        <div className="tw-flex tw-justify-between tw-items-start">
                            <div>
                                <p className="tw-text-sm tw-font-semibold tw-text-primary">Update session</p>
                                <h3 id="mentor-complete-session-title" className="tw-text-xl tw-font-bold tw-text-gray-900">
                                    {selectedSession.subject}
                                </h3>
                                <p className="tw-text-sm tw-text-gray-500">Mentee: {selectedSession.mentee?.name || '—'}</p>
                            </div>
                            <button
                                type="button"
                                onClick={closeCompletionModal}
                                className="tw-text-gray-400 hover:tw-text-gray-600"
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>

                        <form className="tw-space-y-4" onSubmit={handleComplete}>
                            <div>
                                <label className="tw-text-sm tw-font-medium tw-text-gray-700">Did this session take place?</label>
                                <div className="tw-mt-2 tw-flex tw-gap-4">
                                    <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-medium">
                                        <input type="radio" name="attended" value="yes" checked={attended} onChange={() => setAttended(true)} />
                                        Yes
                                    </label>
                                    <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-medium">
                                        <input type="radio" name="attended" value="no" checked={!attended} onChange={() => setAttended(false)} />
                                        No / cancelled
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="mentorTasksCompleted" className="tw-text-sm tw-font-medium tw-text-gray-700">
                                    Tasks or objectives covered
                                </label>
                                <input
                                    id="mentorTasksCompleted"
                                    type="number"
                                    min="0"
                                    value={tasksCompleted}
                                    onChange={(event) => setTasksCompleted(event.target.value)}
                                    className="tw-mt-1 tw-w-full tw-border tw-border-gray-300 tw-rounded-lg tw-px-3 tw-py-2 focus:tw-ring-2 focus:tw-ring-primary focus:tw-border-transparent"
                                />
                            </div>

                            <div>
                                <label htmlFor="mentorSessionNotes" className="tw-text-sm tw-font-medium tw-text-gray-700">
                                    Notes for the mentee (optional)
                                </label>
                                <textarea
                                    id="mentorSessionNotes"
                                    rows={3}
                                    value={notes}
                                    onChange={(event) => setNotes(event.target.value)}
                                    className="tw-mt-1 tw-w-full tw-border tw-border-gray-300 tw-rounded-lg tw-px-3 tw-py-2 focus:tw-ring-2 focus:tw-ring-primary focus:tw-border-transparent"
                                />
                            </div>

                            <div className="tw-flex tw-justify-end tw-gap-3">
                                <button
                                    type="button"
                                    onClick={closeCompletionModal}
                                    className="tw-px-4 tw-py-2 tw-rounded-lg tw-border tw-border-gray-200 tw-bg-white tw-text-gray-700 hover:tw-bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={completeSession.isLoading}
                                    className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-primary tw-text-white tw-text-sm tw-font-semibold tw-px-4 tw-py-2 hover:tw-bg-primary/90 focus:tw-ring-2 focus:tw-ring-offset-2 focus:tw-ring-primary disabled:tw-opacity-60"
                                >
                                    {completeSession.isLoading ? 'Saving…' : 'Save update'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {feedbackSession && isFeedbackOpen && (
                <MentorFeedbackForm
                    sessionId={feedbackSession.id}
                    sessionSubject={feedbackSession.subject}
                    menteeId={feedbackSession.mentee?.id || (feedbackSession.participants?.[0]?.id ?? null)}
                    onClose={closeFeedbackModal}
                    onSubmitted={(message) => {
                        setBanner({ type: 'success', message });
                        closeFeedbackModal();
                        void refetch();
                    }}
                    onSubmissionError={(message) => {
                        setBanner({ type: 'error', message });
                    }}
                />
            )}

            {attendanceSession && isAttendanceOpen && (
                <AttendanceModal
                    open={isAttendanceOpen}
                    onClose={() => {
                        setAttendanceOpen(false);
                        setAttendanceSession(null);
                    }}
                    sessionId={attendanceSession.id}
                    participants={getParticipantList(attendanceSession)}
                />
            )}

            {cancelTarget && (
                <div
                    className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-bg-black/40 tw-p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="mentor-cancel-session-title"
                >
                    <div className="tw-w-full tw-max-w-xl tw-rounded-2xl tw-bg-white tw-shadow-2xl tw-p-6">
                        <div className="tw-flex tw-items-start tw-justify-between tw-gap-4 tw-mb-4">
                            <div>
                                <h3 id="mentor-cancel-session-title" className="tw-text-xl tw-font-bold tw-text-gray-900">
                                    Cancel session
                                </h3>
                                <p className="tw-text-sm tw-text-gray-500 tw-mt-1">
                                    {cancelTarget.subject || 'Untitled session'} with {cancelTarget.mentee?.name || cancelTarget.participants?.[0]?.name || 'your mentee'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeCancelModal}
                                className="tw-text-gray-400 hover:tw-text-gray-600"
                                aria-label="Close"
                            >
                                x
                            </button>
                        </div>

                        <form onSubmit={handleCancelSubmit} className="tw-space-y-4">
                            {cancelIsLateWindow ? (
                                <div className="tw-rounded-lg tw-border tw-border-amber-200 tw-bg-amber-50 tw-p-3 tw-text-sm tw-text-amber-900">
                                    <p className="tw-font-semibold">Late cancellation warning</p>
                                    <p className="tw-mt-1">
                                        This session starts in {formatTimeUntil(cancelHoursUntilSession)}. Cancelling now may apply a late-cancellation warning or penalty.
                                    </p>
                                </div>
                            ) : (
                                <div className="tw-rounded-lg tw-border tw-border-blue-200 tw-bg-blue-50 tw-p-3 tw-text-sm tw-text-blue-900">
                                    Cancelling more than {SESSION_CANCEL_PENALTY_HOURS} hours before start does not trigger a late-cancellation penalty.
                                </div>
                            )}

                            <div>
                                <label htmlFor="mentor-cancel-session-reason" className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                                    Reason for cancellation (optional)
                                </label>
                                <textarea
                                    id="mentor-cancel-session-reason"
                                    value={cancelReason}
                                    onChange={(event) => {
                                        setCancelReason(event.target.value);
                                        if (cancelError) {
                                            setCancelError(null);
                                        }
                                    }}
                                    placeholder="Add a short reason to help the mentee understand"
                                    maxLength={500}
                                    rows={4}
                                    className="tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary"
                                />
                                <p className="tw-mt-1 tw-text-xs tw-text-gray-500">{cancelReason.length}/500</p>
                            </div>

                            {cancelIsLateWindow && (
                                <label className="tw-flex tw-items-start tw-gap-2 tw-text-sm tw-text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={lateCancelAcknowledged}
                                        onChange={(event) => {
                                            setLateCancelAcknowledged(event.target.checked);
                                            if (cancelError) {
                                                setCancelError(null);
                                            }
                                        }}
                                        className="tw-mt-0.5"
                                    />
                                    <span>I understand this is a late cancellation and may apply a warning/penalty.</span>
                                </label>
                            )}

                            {cancelError && (
                                <div role="alert" className="tw-rounded-lg tw-border tw-border-red-200 tw-bg-red-50 tw-p-3 tw-text-sm tw-text-red-700">
                                    {cancelError}
                                </div>
                            )}

                            <div className="tw-flex tw-justify-end tw-gap-3">
                                <button
                                    type="button"
                                    onClick={closeCancelModal}
                                    className="tw-rounded-lg tw-border tw-border-gray-300 tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-gray-700 hover:tw-bg-gray-50"
                                    disabled={cancelSession.isLoading}
                                >
                                    Keep session
                                </button>
                                <button
                                    type="submit"
                                    disabled={cancelSession.isLoading || (cancelIsLateWindow && !lateCancelAcknowledged)}
                                    className="tw-rounded-lg tw-bg-red-600 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-white hover:tw-bg-red-700 disabled:tw-opacity-70"
                                >
                                    {cancelSession.isLoading ? 'Cancelling...' : 'Confirm cancellation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>

        <MentorSessionComposer
            isOpen={isComposerOpen}
            onClose={() => setComposerOpen(false)}
            onCreated={handleSessionScheduled}
        />
        </>
    );
};

export default MentorSessionsManager;

