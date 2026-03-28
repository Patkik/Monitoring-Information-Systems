import React from 'react';
import type { MentorSession } from '../../../shared/services/sessionsService';
import { formatDate, getParticipantList, deriveAttendanceBadge } from './sessionUtils';

interface MentorSessionListProps {
    isLoading: boolean;
    isFetching: boolean;
    filteredSessions: MentorSession[];
    showEmpty: boolean;
    setSelectedSession: (session: MentorSession) => void;
}

const MentorSessionList: React.FC<MentorSessionListProps> = ({
    isLoading,
    isFetching,
    filteredSessions,
    showEmpty,
    setSelectedSession,
}) => {
    return (
        <div className="tw-overflow-x-auto">
            <table className="tw-min-w-full tw-divide-y tw-divide-gray-200">
                <thead className="tw-bg-gray-50">
                    <tr>
                        <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">Session</th>
                        <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">Schedule</th>
                        <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">Location & capacity</th>
                        <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">Attendance</th>
                        <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">Status</th>
                        <th className="tw-px-6 tw-py-3 tw-text-right tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="tw-bg-white tw-divide-y tw-divide-gray-200">
                    {isLoading || isFetching ? (
                        [...Array(3)].map((_, index) => (
                            <tr key={`loading-${index}`}>
                                <td className="tw-px-6 tw-py-4" colSpan={6}>
                                    <div className="tw-h-4 tw-bg-gray-100 tw-rounded tw-animate-pulse" />
                                </td>
                            </tr>
                        ))
                    ) : (
                        filteredSessions.map((session) => {
                            const participants = getParticipantList(session);
                            const visibleParticipants = participants.slice(0, 3);
                            const overflow = participants.length - visibleParticipants.length;

                            return (
                                <tr key={session.id} className="hover:tw-bg-gray-50">
                                    <td className="tw-px-6 tw-py-4 tw-align-top">
                                        <div className="tw-text-sm tw-font-semibold tw-text-gray-900">{session.subject}</div>
                                        <div className="tw-mt-2 tw-flex tw-flex-wrap tw-gap-1">
                                            {visibleParticipants.length ? (
                                                visibleParticipants.map((participant) => (
                                                    <span
                                                        key={`${session.id}-${participant.id}`}
                                                        className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-gray-100 tw-text-gray-700 tw-text-xs tw-font-medium tw-px-3 tw-py-1"
                                                    >
                                                        {participant.name}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="tw-text-xs tw-text-gray-500">No participants yet</span>
                                            )}
                                            {overflow > 0 ? (
                                                <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-gray-100 tw-text-gray-600 tw-text-xs tw-font-medium tw-px-3 tw-py-1">+{overflow} more</span>
                                            ) : null}
                                        </div>
                                    </td>
                                    <td className="tw-px-6 tw-py-4 tw-align-top">
                                        <div className="tw-text-sm tw-text-gray-900">{formatDate(session.date)}</div>
                                        <p className="tw-text-xs tw-text-gray-500">{session.durationMinutes || 60} min</p>
                                    </td>
                                    <td className="tw-px-6 tw-py-4 tw-align-top">
                                        <div className="tw-text-sm tw-text-gray-900">{session.room || 'Room TBA'}</div>
                                        <p className="tw-text-xs tw-text-gray-500">
                                            {`${session.participantCount ?? 0}/${session.capacity ?? session.participantCount ?? 0} seats`}
                                        </p>
                                        <span
                                            className={`tw-inline-flex tw-items-center tw-gap-1 tw-text-[11px] tw-font-semibold tw-rounded-full tw-px-2 tw-py-0.5 tw-mt-2 ${
                                                session.isGroup ? 'tw-bg-blue-50 tw-text-blue-700' : 'tw-bg-purple-50 tw-text-purple-700'
                                            }`}
                                        >
                                            {session.isGroup ? 'Group session' : '1:1 session'}
                                        </span>
                                    </td>
                                    <td className="tw-px-6 tw-py-4 tw-align-top">
                                        {(() => {
                                            const badge = deriveAttendanceBadge(session);
                                            return (
                                                <span
                                                    className={`tw-inline-flex tw-items-center tw-gap-1 tw-text-xs tw-font-semibold tw-rounded-full tw-px-3 tw-py-1 ${badge.classes}`}
                                                >
                                                    {badge.label}
                                                </span>
                                            );
                                        })()}
                                    </td>
                                    <td className="tw-px-6 tw-py-4 tw-align-top">
                                        {(() => {
                                            const status = session.status || (session.attended ? 'completed' : 'upcoming');
                                            if (status === 'completed') {
                                                return (
                                                    <span className="tw-inline-flex tw-items-center tw-gap-1 tw-text-xs tw-font-semibold tw-text-green-700 tw-bg-green-50 tw-rounded-full tw-px-3 tw-py-1">
                                                        <span aria-hidden="true">●</span> Completed
                                                    </span>
                                                );
                                            }
                                            if (status === 'overdue') {
                                                return (
                                                    <span className="tw-inline-flex tw-items-center tw-gap-1 tw-text-xs tw-font-semibold tw-text-red-700 tw-bg-red-50 tw-rounded-full tw-px-3 tw-py-1">
                                                        <span aria-hidden="true">●</span> Needs update
                                                    </span>
                                                );
                                            }
                                            return (
                                                <span className="tw-inline-flex tw-items-center tw-gap-1 tw-text-xs tw-font-semibold tw-text-amber-700 tw-bg-amber-50 tw-rounded-full tw-px-3 tw-py-1">
                                                    <span aria-hidden="true">●</span> Upcoming
                                                </span>
                                            );
                                        })()}
                                        {session.feedbackDue ? (
                                            <div className="tw-mt-2">
                                                <span className="tw-inline-flex tw-items-center tw-gap-1 tw-text-[11px] tw-font-semibold tw-rounded-full tw-bg-blue-50 tw-text-blue-700 tw-px-2 tw-py-0.5">
                                                    Awaiting mentee feedback
                                                </span>
                                            </div>
                                        ) : null}
                                    </td>
                                    <td className="tw-px-6 tw-py-4 tw-align-top tw-text-right">
                                        <div className="tw-flex tw-items-center tw-justify-end">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedSession(session)}
                                                className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-gray-200 tw-bg-white tw-text-sm tw-font-semibold tw-text-gray-700 tw-px-3 tw-py-2 hover:tw-bg-gray-50 focus:tw-ring-2 focus:tw-ring-offset-2 focus:tw-ring-gray-200"
                                            >
                                                View details
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                    {showEmpty && (
                        <tr>
                            <td className="tw-px-6 tw-py-6 tw-text-sm tw-text-gray-500" colSpan={6}>
                                No sessions match your filters. Try another search.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default MentorSessionList;