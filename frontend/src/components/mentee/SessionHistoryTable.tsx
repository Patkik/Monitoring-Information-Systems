import React, { useEffect, useMemo, useState } from 'react';
import { useMenteeSessions } from '../../shared/hooks/useMenteeSessions';
import { useFlagSessionFeedback, useSessionFeedback, useSubmitSessionFeedback } from '../../shared/hooks/useSessionFeedback';
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

type EditFeedbackModalProps = {
  session: MenteeSession;
  onClose: () => void;
};

const EditFeedbackModal: React.FC<EditFeedbackModalProps> = ({ session, onClose }) => {
  const { data: feedback, isLoading, isError, error, refetch } = useSessionFeedback(session.id);
  const submitFeedback = useSubmitSessionFeedback();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (feedback) {
      setRating(feedback.rating);
      setComment(feedback.text || '');
    }
  }, [feedback]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!feedback) {
      setFormError('No existing feedback was found for this session.');
      return;
    }

    if (rating < 1 || rating > 5) {
      setFormError('Please choose a rating from 1 to 5 stars.');
      return;
    }

    setFormError(null);

    try {
      await submitFeedback.mutateAsync({
        mode: 'update',
        sessionId: session.id,
        rating,
        text: comment.trim() || undefined,
      });
      setSuccessMessage('Feedback updated successfully.');
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (submissionError: any) {
      setFormError(submissionError?.response?.data?.message || 'Unable to update feedback. Please try again.');
    }
  };

  return (
    <div className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-bg-gray-900/60 tw-p-4">
      <div className="tw-w-full tw-max-w-lg tw-rounded-2xl tw-bg-white tw-shadow-xl" role="dialog" aria-modal="true" aria-label="Edit feedback">
        <div className="tw-flex tw-items-start tw-justify-between tw-gap-4 tw-border-b tw-border-gray-100 tw-px-6 tw-py-4">
          <div>
            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900">Edit feedback</h3>
            <p className="tw-text-sm tw-text-gray-500">{session.subject || 'Untitled session'}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="tw-rounded-lg tw-px-2 tw-py-1 tw-text-sm tw-font-medium tw-text-gray-500 hover:tw-bg-gray-100 hover:tw-text-gray-700"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="tw-space-y-4 tw-px-6 tw-py-5">
          {isLoading ? (
            <div className="tw-h-20 tw-animate-pulse tw-rounded-lg tw-bg-gray-100" />
          ) : null}

          {isError ? (
            <div className="tw-rounded-lg tw-border tw-border-red-200 tw-bg-red-50 tw-p-3 tw-text-sm tw-text-red-700">
              <p>{(error as any)?.response?.data?.message || 'Unable to load existing feedback.'}</p>
              <button type="button" onClick={() => refetch()} className="tw-mt-2 tw-font-semibold tw-underline">
                Retry
              </button>
            </div>
          ) : null}

          {!isLoading && !isError && !feedback ? (
            <div className="tw-rounded-lg tw-border tw-border-amber-200 tw-bg-amber-50 tw-p-3 tw-text-sm tw-text-amber-800">
              Existing feedback could not be found for this session.
            </div>
          ) : null}

          <label className="tw-block">
            <span className="tw-text-sm tw-font-medium tw-text-gray-700">Rating (1-5)</span>
            <input
              type="number"
              min={1}
              max={5}
              value={rating || ''}
              onChange={(event) => setRating(Number(event.target.value))}
              className="tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary"
              disabled={isLoading || submitFeedback.isLoading}
              required
            />
          </label>

          <label className="tw-block">
            <span className="tw-text-sm tw-font-medium tw-text-gray-700">Comment</span>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={4}
              placeholder="Share details about the session"
              className="tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary"
              disabled={isLoading || submitFeedback.isLoading}
            />
          </label>

          {formError ? (
            <p className="tw-rounded-lg tw-border tw-border-red-200 tw-bg-red-50 tw-px-3 tw-py-2 tw-text-sm tw-text-red-700" role="alert">
              {formError}
            </p>
          ) : null}

          {successMessage ? (
            <p className="tw-rounded-lg tw-border tw-border-green-200 tw-bg-green-50 tw-px-3 tw-py-2 tw-text-sm tw-text-green-700" role="status">
              {successMessage}
            </p>
          ) : null}

          <div className="tw-flex tw-items-center tw-justify-end tw-gap-3">
            <button
              type="button"
              onClick={onClose}
              className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-gray-700 hover:tw-bg-gray-50"
              disabled={submitFeedback.isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-primary tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-white hover:tw-opacity-95 disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
              disabled={isLoading || isError || !feedback || submitFeedback.isLoading}
            >
              {submitFeedback.isLoading ? 'Updating...' : 'Update feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

type FlagFeedbackModalProps = {
  session: MenteeSession;
  onClose: () => void;
};

const FlagFeedbackModal: React.FC<FlagFeedbackModalProps> = ({ session, onClose }) => {
  const { data: feedback, isLoading, isError, error, refetch } = useSessionFeedback(session.id);
  const flagFeedback = useFlagSessionFeedback();
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!feedback?.id) {
      setFormError('Feedback record could not be found for this session.');
      return;
    }

    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setFormError('Please enter a reason before flagging this feedback.');
      return;
    }

    setFormError(null);
    try {
      await flagFeedback.mutateAsync({
        feedbackId: feedback.id,
        reason: trimmedReason,
      });
      setSuccessMessage('Feedback marked for admin review.');
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (submissionError: any) {
      setFormError(submissionError?.response?.data?.message || 'Unable to flag feedback. Please try again.');
    }
  };

  return (
    <div className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-bg-gray-900/60 tw-p-4">
      <div className="tw-w-full tw-max-w-lg tw-rounded-2xl tw-bg-white tw-shadow-xl" role="dialog" aria-modal="true" aria-label="Flag feedback">
        <div className="tw-flex tw-items-start tw-justify-between tw-gap-4 tw-border-b tw-border-gray-100 tw-px-6 tw-py-4">
          <div>
            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900">Flag feedback</h3>
            <p className="tw-text-sm tw-text-gray-500">{session.subject || 'Untitled session'}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="tw-rounded-lg tw-px-2 tw-py-1 tw-text-sm tw-font-medium tw-text-gray-500 hover:tw-bg-gray-100 hover:tw-text-gray-700"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="tw-space-y-4 tw-px-6 tw-py-5">
          {isLoading ? <div className="tw-h-16 tw-animate-pulse tw-rounded-lg tw-bg-gray-100" /> : null}

          {isError ? (
            <div className="tw-rounded-lg tw-border tw-border-red-200 tw-bg-red-50 tw-p-3 tw-text-sm tw-text-red-700">
              <p>{(error as any)?.response?.data?.message || 'Unable to load feedback details.'}</p>
              <button type="button" onClick={() => refetch()} className="tw-mt-2 tw-font-semibold tw-underline">
                Retry
              </button>
            </div>
          ) : null}

          {!isLoading && !isError && !feedback ? (
            <div className="tw-rounded-lg tw-border tw-border-amber-200 tw-bg-amber-50 tw-p-3 tw-text-sm tw-text-amber-800">
              Existing feedback could not be found for this session.
            </div>
          ) : null}

          <label className="tw-block">
            <span className="tw-text-sm tw-font-medium tw-text-gray-700">Reason for flagging</span>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={4}
              required
              placeholder="Describe why this feedback should be reviewed by admins"
              className="tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary"
              disabled={isLoading || flagFeedback.isLoading}
            />
          </label>

          {formError ? (
            <p className="tw-rounded-lg tw-border tw-border-red-200 tw-bg-red-50 tw-px-3 tw-py-2 tw-text-sm tw-text-red-700" role="alert">
              {formError}
            </p>
          ) : null}

          {successMessage ? (
            <p className="tw-rounded-lg tw-border tw-border-green-200 tw-bg-green-50 tw-px-3 tw-py-2 tw-text-sm tw-text-green-700" role="status">
              {successMessage}
            </p>
          ) : null}

          <div className="tw-flex tw-items-center tw-justify-end tw-gap-3">
            <button
              type="button"
              onClick={onClose}
              className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-gray-300 tw-bg-white tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-gray-700 hover:tw-bg-gray-50"
              disabled={flagFeedback.isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-amber-600 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-white hover:tw-bg-amber-700 disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
              disabled={isLoading || isError || !feedback || flagFeedback.isLoading}
            >
              {flagFeedback.isLoading ? 'Flagging...' : 'Flag feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SessionHistoryTable: React.FC = () => {
  const [sortBy, setSortBy] = useState<SortKey>('date');
  const [editingSession, setEditingSession] = useState<MenteeSession | null>(null);
  const [flaggingSession, setFlaggingSession] = useState<MenteeSession | null>(null);
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
                      {session.feedbackSubmitted ? (
                        <div className="tw-mt-1 tw-flex tw-items-center tw-gap-3">
                          <button
                            type="button"
                            onClick={() => setEditingSession(session)}
                            className="tw-text-xs tw-font-semibold tw-text-primary hover:tw-underline"
                          >
                            Edit feedback
                          </button>
                          <button
                            type="button"
                            onClick={() => setFlaggingSession(session)}
                            className="tw-text-xs tw-font-semibold tw-text-amber-700 hover:tw-underline"
                          >
                            Flag feedback
                          </button>
                        </div>
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

      {editingSession ? (
        <EditFeedbackModal session={editingSession} onClose={() => setEditingSession(null)} />
      ) : null}

      {flaggingSession ? (
        <FlagFeedbackModal session={flaggingSession} onClose={() => setFlaggingSession(null)} />
      ) : null}
    </div>
  );
};

export default SessionHistoryTable;

