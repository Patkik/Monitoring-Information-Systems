import React, { useEffect, useState } from 'react';
import type { MenteeSession } from '../../shared/services/sessionsService';
import { fetchMentorFeedbackForSession, type MentorFeedbackRecord } from '../../shared/services/mentorFeedbackService';

interface SessionDetailModalProps {
  session: MenteeSession | null;
  isOpen: boolean;
  onClose: () => void;
}

const SessionDetailModal: React.FC<SessionDetailModalProps> = ({ session, isOpen, onClose }) => {
  const [feedback, setFeedback] = useState<MentorFeedbackRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !session?.id) {
      setFeedback(null);
      setError(null);
      return;
    }

    const loadFeedback = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const feedbackData = await fetchMentorFeedbackForSession(session.id);
        setFeedback(feedbackData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load mentor feedback.');
        setFeedback(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadFeedback();
  }, [isOpen, session?.id]);

  if (!isOpen || !session) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-bg-black tw-bg-opacity-50 tw-p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div className="tw-bg-white tw-rounded-2xl tw-shadow-xl tw-max-w-2xl tw-w-full tw-max-h-[90vh] tw-overflow-y-auto">
        {/* Header */}
        <div className="tw-sticky tw-top-0 tw-bg-white tw-border-b tw-border-gray-200 tw-px-6 tw-py-4 tw-flex tw-justify-between tw-items-center">
          <h2 className="tw-text-2xl tw-font-bold tw-text-gray-900">Session Details</h2>
          <button
            onClick={onClose}
            className="tw-text-gray-500 hover:tw-text-gray-700 tw-text-2xl tw-leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="tw-px-6 tw-py-6 tw-space-y-6">
          {/* Session Overview */}
          <div>
            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-mb-4">Session Overview</h3>
            <div className="tw-bg-gray-50 tw-rounded-lg tw-p-4 tw-space-y-3">
              <div className="tw-flex tw-justify-between tw-items-start">
                <span className="tw-text-sm tw-text-gray-600">Subject:</span>
                <span className="tw-text-sm tw-font-medium tw-text-gray-900">{session.subject || 'Untitled'}</span>
              </div>
              <div className="tw-flex tw-justify-between tw-items-start">
                <span className="tw-text-sm tw-text-gray-600">Mentor:</span>
                <span className="tw-text-sm tw-font-medium tw-text-gray-900">{session.mentor?.name || '-'}</span>
              </div>
              <div className="tw-flex tw-justify-between tw-items-start">
                <span className="tw-text-sm tw-text-gray-600">Date:</span>
                <span className="tw-text-sm tw-font-medium tw-text-gray-900">
                  {new Date(session.date).toLocaleString()}
                </span>
              </div>
              <div className="tw-flex tw-justify-between tw-items-start">
                <span className="tw-text-sm tw-text-gray-600">Duration:</span>
                <span className="tw-text-sm tw-font-medium tw-text-gray-900">{session.durationMinutes} minutes</span>
              </div>
              <div className="tw-flex tw-justify-between tw-items-start">
                <span className="tw-text-sm tw-text-gray-600">Attended:</span>
                <span className="tw-text-sm tw-font-medium tw-text-gray-900">
                  {session.attended ? '✓ Yes' : '✗ No'}
                </span>
              </div>
              {session.tasksCompleted !== undefined && (
                <div className="tw-flex tw-justify-between tw-items-start">
                  <span className="tw-text-sm tw-text-gray-600">Tasks Completed:</span>
                  <span className="tw-text-sm tw-font-medium tw-text-gray-900">{session.tasksCompleted}</span>
                </div>
              )}
              {session.notes && (
                <div className="tw-pt-2 tw-border-t tw-border-gray-200">
                  <span className="tw-text-sm tw-text-gray-600">Notes:</span>
                  <p className="tw-text-sm tw-text-gray-900 tw-mt-1">{session.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Mentor Feedback */}
          <div>
            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-mb-4">Mentor Feedback</h3>
            {isLoading && (
              <div className="tw-bg-gray-50 tw-rounded-lg tw-p-4">
                <div className="tw-space-y-3">
                  <div className="tw-h-4 tw-bg-gray-200 tw-rounded tw-animate-pulse" />
                  <div className="tw-h-4 tw-bg-gray-200 tw-rounded tw-animate-pulse" />
                </div>
              </div>
            )}
            {error && (
              <div className="tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg tw-p-4">
                <p className="tw-text-sm tw-text-red-800">{error}</p>
              </div>
            )}
            {!isLoading && !error && !feedback && (
              <div className="tw-bg-gray-50 tw-rounded-lg tw-p-4">
                <p className="tw-text-sm tw-text-gray-600">
                  Mentor feedback is not yet available for this session.
                </p>
              </div>
            )}
            {!isLoading && !error && feedback && (
              <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-4 tw-space-y-4">
                {/* Rating */}
                <div>
                  <span className="tw-text-sm tw-font-medium tw-text-gray-700">Rating:</span>
                  <div className="tw-flex tw-items-center tw-gap-2 tw-mt-1">
                    <div className="tw-flex tw-gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`tw-text-xl ${
                            star <= feedback.rating ? 'tw-text-yellow-400' : 'tw-text-gray-300'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="tw-text-sm tw-font-medium tw-text-gray-900">
                      {feedback.rating}/5
                    </span>
                  </div>
                </div>

                {/* Competencies */}
                {feedback.competencies && feedback.competencies.length > 0 && (
                  <div>
                    <span className="tw-text-sm tw-font-medium tw-text-gray-700">Competencies:</span>
                    <div className="tw-mt-2 tw-space-y-2">
                      {feedback.competencies.map((comp, idx) => (
                        <div key={idx} className="tw-bg-white tw-rounded tw-p-3">
                          <div className="tw-flex tw-justify-between tw-items-start">
                            <span className="tw-text-sm tw-font-medium tw-text-gray-900">{comp.skillKey}</span>
                            <span className="tw-text-xs tw-font-semibold tw-text-blue-600 tw-bg-blue-100 tw-px-2 tw-py-1 tw-rounded">
                              Level {comp.level}/5
                            </span>
                          </div>
                          {comp.notes && (
                            <p className="tw-text-xs tw-text-gray-600 tw-mt-1">{comp.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comment */}
                {feedback.comment && (
                  <div>
                    <span className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                      Comments:
                    </span>
                    <div className="tw-bg-white tw-rounded tw-p-3 tw-text-sm tw-text-gray-700 tw-leading-relaxed">
                      {feedback.comment}
                    </div>
                  </div>
                )}

                <div className="tw-text-xs tw-text-gray-600 tw-pt-2 tw-border-t tw-border-blue-200">
                  Feedback provided on {new Date(feedback.createdAt).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="tw-sticky tw-bottom-0 tw-bg-gray-50 tw-border-t tw-border-gray-200 tw-px-6 tw-py-4 tw-flex tw-justify-end">
          <button
            onClick={onClose}
            className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-gray-300 tw-text-sm tw-font-semibold tw-text-gray-900 tw-px-4 tw-py-2 hover:tw-bg-gray-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionDetailModal;
