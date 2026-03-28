import React, { useMemo, useState } from 'react';
import { isUpcomingMenteeSession, useMenteeSessions } from '../../shared/hooks/useMenteeSessions';
import { useCancelSession } from '../../shared/hooks/useSessionLifecycle';
import type { MenteeSession } from '../../shared/services/sessionsService';
import { useToast } from '../../hooks/useToast';

type SortKey = 'subject' | 'mentor' | 'date' | 'duration';

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
};

const normalizeText = (value?: string | null) => (typeof value === 'string' ? value : '');

const isSessionActive = (session: MenteeSession) => {
  if (!session?.date) {
    return false;
  }
  const start = Date.parse(session.date);
  if (Number.isNaN(start)) {
    return false;
  }
  const duration = (session.durationMinutes || 60) * 60_000;
  const end = start + duration;
  const now = Date.now();
  return now >= start && now <= end;
};

const formatRange = (session: MenteeSession) => {
  if (!session.date) {
    return 'Schedule TBA';
  }
  const start = new Date(session.date);
  if (Number.isNaN(start.getTime())) {
    return 'Schedule TBA';
  }
  const end = new Date(start.getTime() + (session.durationMinutes || 60) * 60_000);
  return `${start.toLocaleString()} - Ends ${end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
};

const UpcomingSessionsTable: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('date');
  const [cancelTarget, setCancelTarget] = useState<MenteeSession | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);
  const { showToast } = useToast();
  const cancelSession = useCancelSession();

  const { data: sessions = [], isLoading, isError, refetch, isFetching } = useMenteeSessions();

  const upcomingSessions = useMemo(() => sessions.filter((session) => isUpcomingMenteeSession(session)), [sessions]);

  const filteredSessions = useMemo(() => {
    const lower = normalizeText(searchTerm).toLowerCase();
    return upcomingSessions.filter((session) => {
      const subject = normalizeText(session.subject).toLowerCase();
      const mentor = normalizeText(session.mentor?.name).toLowerCase();
      return subject.includes(lower) || mentor.includes(lower);
    });
  }, [upcomingSessions, searchTerm]);

  const sortedSessions = useMemo(() => {
    const toTime = (value?: string | null) => (value ? Date.parse(value) : 0);
    return [...filteredSessions].sort((a, b) => {
      switch (sortBy) {
        case 'subject': {
          const subjectA = normalizeText(a.subject);
          const subjectB = normalizeText(b.subject);
          return subjectA.localeCompare(subjectB);
        }
        case 'mentor': {
          const mentorA = normalizeText(a.mentor?.name);
          const mentorB = normalizeText(b.mentor?.name);
          return mentorA.localeCompare(mentorB);
        }
        case 'duration':
          return b.durationMinutes - a.durationMinutes;
        case 'date':
        default:
          return toTime(a.date) - toTime(b.date);
      }
    });
  }, [filteredSessions, sortBy]);
  const activeSessions = useMemo(() => sortedSessions.filter((session) => isSessionActive(session)), [sortedSessions]);

  const showDetailsToast = (session: MenteeSession) => {
    const subject = session.subject || 'Untitled session';
    const mentorName = session.mentor?.name || 'your mentor';
    const schedule = formatRange(session);
    showToast({
      message: `${subject} with ${mentorName} - ${schedule}`,
      variant: 'info',
      durationMs: 6000
    });
  };

  const openCancelModal = (session: MenteeSession) => {
    setCancelTarget(session);
    setCancelReason('');
    setCancelError(null);
  };

  const closeCancelModal = () => {
    if (cancelSession.isLoading) {
      return;
    }

    setCancelTarget(null);
    setCancelReason('');
    setCancelError(null);
  };

  const handleCancelSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!cancelTarget) {
      return;
    }

    const trimmedReason = cancelReason.trim();
    if (!trimmedReason) {
      setCancelError('Please provide a cancellation reason before confirming.');
      return;
    }

    try {
      await cancelSession.mutateAsync({
        sessionId: cancelTarget.id,
        payload: {
          reason: trimmedReason,
          notify: true,
        },
      });

      showToast({
        message: 'Session cancelled. It has been moved to your history.',
        variant: 'success',
      });
      closeCancelModal();
    } catch (error: any) {
      setCancelError(error?.response?.data?.message || 'Unable to cancel this session right now. Please try again.');
    }
  };

  const showEmpty = !isLoading && sortedSessions.length === 0;

  return (
    <div className="tw-bg-white tw-rounded-lg tw-shadow-md tw-p-6 tw-mb-8">
      <div className="tw-flex tw-flex-col lg:tw-flex-row lg:tw-items-center lg:tw-justify-between tw-gap-4 tw-mb-6">
        <div>
          <h2 className="tw-text-2xl tw-font-bold tw-text-gray-900">Upcoming Sessions</h2>
          <p className="tw-text-sm tw-text-gray-500">Review your upcoming mentorship time blocks. Mentors decide when a session is marked complete.</p>
        </div>
        <div className="tw-flex tw-flex-col md:tw-flex-row tw-gap-3 tw-items-stretch md:tw-items-center">
          <div className="tw-relative">
            <input
              type="text"
              placeholder="Search by subject or mentor"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="tw-w-full md:tw-w-64 tw-px-4 tw-py-2 tw-pr-10 tw-border tw-border-gray-300 tw-rounded-lg tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary focus:tw-border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="tw-absolute tw-right-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-gray-400 hover:tw-text-gray-600"
                aria-label="Clear search"
              >
                x
              </button>
            )}
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary"
            title="Sort sessions"
            aria-label="Sort sessions"
          >
            <option value="date">Sort by Date</option>
            <option value="subject">Sort by Subject</option>
            <option value="mentor">Sort by Mentor</option>
            <option value="duration">Sort by Duration</option>
          </select>
        </div>
      </div>

      {activeSessions.length > 0 && (
        <div className="tw-mb-4 tw-rounded-lg tw-border tw-border-green-200 tw-bg-green-50 tw-p-4" role="status">
          <p className="tw-text-sm tw-font-semibold tw-text-green-800">Active now</p>
          <p className="tw-text-sm tw-text-green-900">
            {activeSessions.length === 1
              ? `${activeSessions[0].subject || 'Mentorship session'} with ${activeSessions[0].mentor?.name || 'your mentor'} is in progress.`
              : `You have ${activeSessions.length} sessions currently in progress.`}
          </p>
        </div>
      )}

      {isError && (
        <div className="tw-bg-red-50 tw-text-red-700 tw-p-4 tw-rounded-lg tw-flex tw-items-center tw-justify-between tw-mb-4" role="alert">
          <span>We couldn't load your sessions. Please refresh.</span>
          <button
            onClick={() => refetch()}
            className="tw-text-sm tw-font-medium tw-underline"
          >
            Retry
          </button>
        </div>
      )}

      <div className="tw-overflow-x-auto">
        <table className="tw-min-w-full tw-divide-y tw-divide-gray-200">
          <thead className="tw-bg-gray-50">
            <tr>
              <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                Subject
              </th>
              <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                Mentor
              </th>
              <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                Scheduled
              </th>
              <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                Duration
              </th>
              <th className="tw-px-6 tw-py-3 tw-text-right tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="tw-bg-white tw-divide-y tw-divide-gray-200">
            {isLoading || isFetching ? (
              [...Array(3)].map((_, index) => (
                <tr key={`skeleton-${index}`}>
                  <td className="tw-px-6 tw-py-4" colSpan={5}>
                    <div className="tw-h-4 tw-bg-gray-100 tw-rounded tw-animate-pulse" />
                  </td>
                </tr>
              ))
            ) : (
              sortedSessions.map((session) => {
                const active = isSessionActive(session);
                return (
                  <tr
                    key={session.id}
                    className={`tw-border-l-4 ${
                      active
                        ? 'tw-border-primary tw-bg-purple-50/60 hover:tw-bg-purple-100'
                        : 'tw-border-transparent hover:tw-bg-gray-50'
                    } tw-transition-colors`}
                  >
                    <td className="tw-px-6 tw-py-4 tw-text-sm tw-font-medium tw-text-gray-900">
                      <div className="tw-flex tw-items-center tw-gap-2">
                        <span>{session.subject || 'Untitled session'}</span>
                        {active && (
                          <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-primary/10 tw-text-primary tw-text-xs tw-font-semibold tw-px-2 tw-py-0.5">
                            Active
                          </span>
                        )}
                      </div>
                    </td>
                  <td className="tw-px-6 tw-py-4 tw-text-sm tw-text-gray-600">{session.mentor?.name || '-'}</td>
                  <td className="tw-px-6 tw-py-4 tw-text-sm tw-text-gray-600">{formatDate(session.date)}</td>
                  <td className="tw-px-6 tw-py-4 tw-text-sm tw-text-gray-600">{session.durationMinutes || 60} min</td>
                  <td className="tw-px-6 tw-py-4 tw-text-right">
                    <div className="tw-inline-flex tw-items-center tw-gap-2">
                      <button
                        type="button"
                        onClick={() => showDetailsToast(session)}
                        className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-gray-200 tw-bg-white tw-text-sm tw-font-semibold tw-px-4 tw-py-2 hover:tw-border-primary hover:tw-text-primary focus:tw-ring-2 focus:tw-ring-offset-2 focus:tw-ring-primary"
                      >
                        View details
                      </button>
                      <button
                        type="button"
                        onClick={() => openCancelModal(session)}
                        className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-red-200 tw-bg-white tw-text-sm tw-font-semibold tw-text-red-700 tw-px-4 tw-py-2 hover:tw-bg-red-50 focus:tw-ring-2 focus:tw-ring-offset-2 focus:tw-ring-red-200"
                      >
                        Cancel
                      </button>
                    </div>
                    <p className="tw-mt-1 tw-text-[11px] tw-uppercase tw-tracking-wide tw-text-gray-400">Mentor completes</p>
                  </td>
                  </tr>
                );
              })
            )}
            {showEmpty && (
              <tr>
                <td className="tw-px-6 tw-py-6 tw-text-sm tw-text-gray-500" colSpan={5}>
                  No upcoming sessions. When your mentor schedules a meeting it will appear here.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {cancelTarget && (
        <div
          className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-bg-black/40 tw-p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-session-title"
        >
          <div className="tw-w-full tw-max-w-xl tw-rounded-2xl tw-bg-white tw-shadow-2xl tw-p-6">
            <div className="tw-flex tw-items-start tw-justify-between tw-gap-4 tw-mb-4">
              <div>
                <h3 id="cancel-session-title" className="tw-text-xl tw-font-bold tw-text-gray-900">
                  Cancel session
                </h3>
                <p className="tw-text-sm tw-text-gray-500 tw-mt-1">
                  {cancelTarget.subject || 'Untitled session'} with {cancelTarget.mentor?.name || 'your mentor'}
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
              <div>
                <label htmlFor="cancel-session-reason" className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                  Reason for cancellation
                </label>
                <textarea
                  id="cancel-session-reason"
                  value={cancelReason}
                  onChange={(event) => {
                    setCancelReason(event.target.value);
                    if (cancelError) {
                      setCancelError(null);
                    }
                  }}
                  placeholder="Share why you are cancelling this session"
                  maxLength={500}
                  required
                  rows={4}
                  className="tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary"
                />
                <p className="tw-mt-1 tw-text-xs tw-text-gray-500">{cancelReason.length}/500</p>
              </div>

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
                  disabled={cancelSession.isLoading}
                  className="tw-rounded-lg tw-bg-red-600 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-white hover:tw-bg-red-700 disabled:tw-opacity-70"
                >
                  {cancelSession.isLoading ? 'Cancelling...' : 'Confirm cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpcomingSessionsTable;

