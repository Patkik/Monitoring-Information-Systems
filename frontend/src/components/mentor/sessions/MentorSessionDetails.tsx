import React from 'react';
import type { MentorSession } from '../../../shared/services/sessionsService';
import { formatDate, deriveAttendanceBadge } from './sessionUtils';
import ProgressDashboard from '../../mentee/ProgressDashboard';

interface MentorSessionDetailsProps {
    selectedSession: MentorSession | null;
    feedbackSession: MentorSession | null;
    setSelectedSession: (session: MentorSession | null) => void;
    banner: { type: 'success' | 'error'; message: string } | null;
    setBanner: React.Dispatch<React.SetStateAction<{ type: 'success' | 'error'; message: string } | null>>;
    handleOpenChat: (threadId?: string | null) => void;
    openCompletionModal: (session: MentorSession) => void;
    openCancelModal: (session: MentorSession) => void;
    openAttendanceModal: (session: MentorSession) => void;
    cancellationReady: boolean;
    attendanceReady: boolean;
    setFeedbackSession: (session: MentorSession | null) => void;
    setFeedbackOpen: (open: boolean) => void;
}

const MentorSessionDetails: React.FC<MentorSessionDetailsProps> = ({
    selectedSession,
    feedbackSession,
    setSelectedSession,
    banner,
    setBanner,
    handleOpenChat,
    openCompletionModal,
    openCancelModal,
    openAttendanceModal,
    cancellationReady,
    attendanceReady,
    setFeedbackSession,
    setFeedbackOpen,
}) => {
    return (
        <aside className="tw-hidden lg:tw-block lg:tw-col-span-1">
            {selectedSession ? (
                <div className="tw-sticky tw-top-6 tw-space-y-4">
                    <div className="tw-bg-white tw-rounded-xl tw-border tw-border-gray-100 tw-p-4">
                        <div className="tw-flex tw-justify-between tw-items-start">
                            <div>
                                <h3 className="tw-text-sm tw-font-semibold tw-text-gray-900">{selectedSession.subject}</h3>
                                <p className="tw-text-xs tw-text-gray-500">Mentee: {selectedSession.mentee?.name || selectedSession.participants?.[0]?.name || '—'}</p>
                                <p className="tw-text-xs tw-text-gray-400 tw-mt-2">{formatDate(selectedSession.date)}</p>
                            </div>
                            <button
                                onClick={() => setSelectedSession(null)}
                                aria-label="Close details"
                                className="tw-text-gray-400 hover:tw-text-gray-600"
                            >
                                ×
                            </button>
                        </div>

                        {banner && (
                            <div
                                role="status"
                                className={`tw-mt-3 tw-rounded-md tw-border tw-p-2 tw-text-sm ${
                                    banner.type === 'success'
                                        ? 'tw-bg-green-50 tw-border-green-200 tw-text-green-800'
                                        : 'tw-bg-red-50 tw-border-red-200 tw-text-red-700'
                                }`}
                            >
                                <div className="tw-flex tw-justify-between tw-items-center">
                                    <span>{banner.message}</span>
                                    <button onClick={() => setBanner(null)} className="tw-text-xs tw-uppercase tw-font-semibold">
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="tw-mt-3 tw-flex tw-flex-wrap tw-gap-2">
                            <div className="tw-text-xs tw-text-gray-500">{selectedSession.room || 'Room TBA'}</div>
                            <div className="tw-text-xs tw-text-gray-500">• {selectedSession.durationMinutes || 60} min</div>
                        </div>

                        <div className="tw-mt-4">
                            <div className="tw-text-xs tw-text-gray-500 tw-mb-2">Attendance</div>
                            {(() => {
                                const badge = deriveAttendanceBadge(selectedSession);
                                return (
                                    <div className="tw-flex tw-items-center tw-gap-2">
                                        <span className={`tw-inline-flex tw-items-center tw-gap-1 tw-text-xs tw-font-semibold tw-rounded-full tw-px-3 tw-py-1 ${badge.classes}`}>
                                            {badge.label}
                                        </span>
                                        {badge.participantName ? (
                                            <span className="tw-text-xs tw-text-gray-500">{badge.participantName}</span>
                                        ) : null}
                                    </div>
                                );
                            })()}
                        </div>

                        <div className="tw-mt-4 tw-flex tw-flex-col tw-gap-2">
                            <button
                                type="button"
                                onClick={() => handleOpenChat(selectedSession.chatThreadId)}
                                disabled={!selectedSession.chatThreadId}
                                className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-gray-200 tw-bg-white tw-text-sm tw-font-semibold tw-text-gray-700 tw-px-3 tw-py-2 hover:tw-bg-gray-50 disabled:tw-opacity-50"
                            >
                                Open chat
                            </button>

                            <button
                                type="button"
                                onClick={() => openCompletionModal(selectedSession)}
                                className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-primary tw-text-white tw-text-sm tw-font-semibold tw-px-3 tw-py-2 hover:tw-bg-primary/90"
                            >
                                {selectedSession.attended ? 'Update' : 'Mark complete'}
                            </button>

                            <button
                                type="button"
                                onClick={() => openCancelModal(selectedSession)}
                                disabled={!cancellationReady}
                                title={
                                    cancellationReady
                                        ? undefined
                                        : 'Only upcoming sessions that have not started can be cancelled.'
                                }
                                className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-red-200 tw-bg-red-50 tw-text-sm tw-font-semibold tw-text-red-700 tw-px-3 tw-py-2 hover:tw-bg-red-100 disabled:tw-opacity-60 disabled:tw-cursor-not-allowed"
                            >
                                Cancel session
                            </button>

                            <button
                                type="button"
                                onClick={() => openAttendanceModal(selectedSession)}
                                aria-disabled={!attendanceReady}
                                title={attendanceReady ? undefined : 'Attendance opens at the session start time.'}
                                className={`tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-gray-200 tw-bg-white tw-text-sm tw-font-semibold tw-text-gray-700 tw-px-3 tw-py-2 hover:tw-bg-gray-50 ${
                                    attendanceReady ? '' : 'tw-opacity-60 tw-cursor-not-allowed'
                                }`}
                            >
                                Attendance
                            </button>

                            {!attendanceReady && (
                                <p className="tw-text-[11px] tw-text-gray-500 tw-text-center tw-leading-4">
                                    Attendance unlocks once the scheduled start time arrives.
                                </p>
                            )}

                            {((selectedSession.status || (selectedSession.attended ? 'completed' : 'upcoming')) === 'completed') && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFeedbackSession(selectedSession);
                                        setFeedbackOpen(true);
                                    }}
                                    className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-gray-200 tw-bg-white tw-text-sm tw-font-semibold tw-text-gray-700 tw-px-3 tw-py-2 hover:tw-bg-gray-50"
                                >
                                    Give feedback
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="tw-hidden lg:tw-block">
                        <div className="tw-mt-4 tw-bg-white tw-rounded-xl tw-border tw-border-gray-100 tw-p-4">
                            <ProgressDashboard menteeId={selectedSession.mentee?.id || (selectedSession.participants?.[0]?.id ?? null)} />
                        </div>
                    </div>
                </div>
            ) : feedbackSession ? (
                <div className="tw-sticky tw-top-6">
                    <ProgressDashboard menteeId={feedbackSession.mentee?.id || (feedbackSession.participants?.[0]?.id ?? null)} />
                </div>
            ) : (
                <div className="tw-bg-white tw-rounded-xl tw-border tw-border-gray-100 tw-p-4 tw-text-sm tw-text-gray-500">
                    Select a session (click View details) to view the mentee's progress snapshot + session actions here.
                </div>
            )}
        </aside>
    );
};

export default MentorSessionDetails;