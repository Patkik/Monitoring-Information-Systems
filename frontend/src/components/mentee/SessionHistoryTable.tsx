import React, { useMemo, useState } from 'react';
import { useMenteeSessions } from '../../shared/hooks/useMenteeSessions';
import type { MenteeSession } from '../../shared/services/sessionsService';

type SortKey = 'subject' | 'mentor' | 'date';

const normalizeText = (value?: string | null) => (typeof value === 'string' ? value : '');

const isHistorySession = (session: MenteeSession) => {
  if (session.attended) {
    return true;
  }

  if (session.status) {
    return session.status === 'completed' || session.status === 'cancelled';
  }

  return false;
};

const SessionHistoryTable: React.FC = () => {
  const [sortBy, setSortBy] = useState<SortKey>('date');
  const { data: sessions = [], isLoading, isError, refetch } = useMenteeSessions();

  const historySessions = useMemo(
    () => sessions.filter((session) => isHistorySession(session)),
    [sessions]
  );

  const sortedSessions = useMemo(() => {
    return [...historySessions].sort((a, b) => {
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
        case 'date':
        default:
          return new Date(b.completedAt || b.date).getTime() - new Date(a.completedAt || a.date).getTime();
      }
    });
  }, [historySessions, sortBy]);

  const showEmpty = !isLoading && sortedSessions.length === 0;

  return (
    <div className="tw-bg-white tw-rounded-lg tw-shadow-md tw-p-6">
      <div className="tw-flex tw-justify-between tw-items-center tw-mb-6">
        <h2 className="tw-text-2xl tw-font-bold tw-text-gray-900">Session History</h2>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          className="tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary"
        >
          <option value="date">Sort by Date</option>
          <option value="subject">Sort by Subject</option>
          <option value="mentor">Sort by Mentor</option>
        </select>
      </div>

      {isError && (
        <div className="tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg tw-p-4 tw-text-sm tw-text-red-700 tw-flex tw-items-center tw-justify-between tw-mb-4" role="alert">
          <span>Unable to load session history.</span>
          <button onClick={() => refetch()} className="tw-text-xs tw-font-semibold tw-underline">
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
                Date
              </th>
              <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                Status
              </th>
              <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                Feedback
              </th>
            </tr>
          </thead>
          <tbody className="tw-bg-white tw-divide-y tw-divide-gray-200">
            {isLoading && (
              [...Array(4)].map((_, index) => (
                <tr key={`history-skeleton-${index}`}>
                  <td className="tw-px-6 tw-py-4" colSpan={5}>
                    <div className="tw-h-4 tw-bg-gray-100 tw-rounded tw-animate-pulse" />
                  </td>
                </tr>
              ))
            )}
            {!isLoading &&
              sortedSessions.map((session: MenteeSession) => (
                <tr key={session.id} className="hover:tw-bg-gray-50">
                  <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap tw-text-sm tw-font-medium tw-text-gray-900">
                    {session.subject || 'Untitled session'}
                  </td>
                  <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap tw-text-sm tw-text-gray-600">
                    {session.mentor?.name || '-'}
                  </td>
                  <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap tw-text-sm tw-text-gray-600">
                    {new Date(session.completedAt || session.date).toLocaleString()}
                  </td>
                  <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap">
                    <span
                      className={`tw-inline-flex tw-px-2 tw-py-1 tw-text-xs tw-font-semibold tw-rounded-full ${
                        session.status === 'completed'
                          ? 'tw-bg-green-50 tw-text-green-700'
                          : session.status === 'cancelled'
                            ? 'tw-bg-gray-100 tw-text-gray-700'
                          : session.status === 'overdue'
                            ? 'tw-bg-red-50 tw-text-red-700'
                            : 'tw-bg-amber-50 tw-text-amber-700'
                      }`}
                    >
                      {session.status === 'completed'
                        ? 'Completed'
                        : session.status === 'cancelled'
                          ? 'Cancelled'
                          : session.status === 'overdue'
                            ? 'Needs update'
                            : 'Scheduled'}
                    </span>
                  </td>
                  <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap tw-text-sm tw-text-primary">
                    <div className="tw-flex tw-flex-col tw-gap-1">
                      <span
                        className={`tw-inline-flex tw-px-2 tw-py-0.5 tw-text-xs tw-font-semibold tw-rounded-full ${
                          session.feedbackSubmitted
                            ? 'tw-bg-green-50 tw-text-green-700'
                            : session.feedbackDue
                              ? 'tw-bg-blue-50 tw-text-blue-700'
                              : 'tw-bg-gray-100 tw-text-gray-600'
                        }`}
                      >
                        {session.feedbackSubmitted
                          ? 'Feedback submitted'
                          : session.feedbackDue
                            ? 'Awaiting your feedback'
                            : 'Feedback window closed'}
                      </span>
                      <span className="tw-text-xs tw-text-gray-600">
                        {session.tasksCompleted ? `${session.tasksCompleted} task${session.tasksCompleted === 1 ? '' : 's'} logged` : 'No tasks recorded'}
                      </span>
                      {session.notes ? (
                        <span className="tw-text-xs tw-text-gray-500">Notes: {session.notes}</span>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            {showEmpty && (
              <tr>
                <td className="tw-px-6 tw-py-6 tw-text-sm tw-text-gray-500" colSpan={5}>
                  Completed and cancelled sessions will appear here once you start logging them.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SessionHistoryTable;

