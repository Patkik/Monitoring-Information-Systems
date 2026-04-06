import React from 'react';
import { useMenteeProgress } from '../../shared/hooks/useMenteeProgress';

interface MenteeProgressModalProps {
    open: boolean;
    onClose: () => void;
    menteeId: string;
    menteeName?: string;
    menteeAvatar?: string | null;
}

const SkeletonLoader: React.FC = () => (
    <div className="tw-space-y-6">
        {/* Header Skeleton */}
        <div className="tw-flex tw-items-center tw-gap-4">
            <div className="tw-w-16 tw-h-16 tw-rounded-full tw-bg-gray-200 tw-animate-pulse" />
            <div className="tw-flex-1 tw-space-y-2">
                <div className="tw-h-5 tw-bg-gray-200 tw-rounded tw-w-1/3 tw-animate-pulse" />
                <div className="tw-h-4 tw-bg-gray-200 tw-rounded tw-w-1/4 tw-animate-pulse" />
            </div>
        </div>

        {/* Progress Skeleton */}
        <div className="tw-p-4 tw-bg-gray-50 tw-rounded-lg tw-space-y-3">
            <div className="tw-h-4 tw-bg-gray-200 tw-rounded tw-w-1/3 tw-animate-pulse" />
            <div className="tw-h-8 tw-bg-gray-200 tw-rounded tw-w-1/2 tw-animate-pulse" />
        </div>

        {/* Milestones Skeleton */}
        <div className="tw-p-4 tw-bg-gray-50 tw-rounded-lg tw-space-y-3">
            <div className="tw-h-4 tw-bg-gray-200 tw-rounded tw-w-1/3 tw-animate-pulse" />
            <div className="tw-h-6 tw-bg-gray-200 tw-rounded tw-w-1/4 tw-animate-pulse" />
        </div>

        {/* Sessions Skeleton */}
        <div className="tw-p-4 tw-bg-gray-50 tw-rounded-lg tw-space-y-3">
            <div className="tw-h-4 tw-bg-gray-200 tw-rounded tw-w-1/3 tw-animate-pulse" />
            {[...Array(3)].map((_, i) => (
                <div key={i} className="tw-h-10 tw-bg-gray-200 tw-rounded tw-animate-pulse" />
            ))}
        </div>
    </div>
);

const MenteeProgressModal: React.FC<MenteeProgressModalProps> = ({
    open,
    onClose,
    menteeId,
    menteeName = 'Mentee',
    menteeAvatar,
}) => {
    const { data: progressData, isLoading, error } = useMenteeProgress(menteeId);

    if (!open) return null;

    const calculateGoalStats = () => {
        if (!progressData?.goals) return { completed: 0, inProgress: 0, paused: 0 };
        return {
            completed: progressData.goals.filter((g) => g.status === 'completed').length,
            inProgress: progressData.goals.filter((g) => g.status === 'active').length,
            paused: progressData.goals.filter((g) => g.status === 'paused').length,
        };
    };

    const goalStats = calculateGoalStats();
    const topCompetencies = progressData?.competencies?.slice(0, 5) || [];

    return (
        <div className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-bg-black/50">
            {/* Backdrop */}
            <div className="tw-absolute tw-inset-0" onClick={onClose} />

            {/* Modal Container */}
            <div className="tw-relative tw-w-full tw-h-full md:tw-w-auto md:tw-h-auto md:tw-max-w-2xl tw-bg-white tw-flex tw-flex-col tw-shadow-2xl md:tw-rounded-2xl">
                {/* Header */}
                <div className="tw-flex tw-items-center tw-justify-between tw-p-6 tw-border-b tw-border-gray-200 tw-flex-shrink-0">
                    <div className="tw-flex tw-items-center tw-gap-4 tw-flex-1 tw-min-w-0">
                        {menteeAvatar && (
                            <img
                                src={menteeAvatar}
                                alt={menteeName}
                                className="tw-w-12 tw-h-12 tw-rounded-full tw-object-cover tw-flex-shrink-0"
                            />
                        )}
                        {!menteeAvatar && (
                            <div className="tw-w-12 tw-h-12 tw-rounded-full tw-bg-gradient-to-r tw-from-primary tw-to-purple-500 tw-flex tw-items-center tw-justify-center tw-text-white tw-font-semibold tw-flex-shrink-0">
                                {menteeName.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className="tw-flex-1 tw-min-w-0">
                            <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-truncate">
                                {menteeName}
                            </h2>
                            <p className="tw-text-sm tw-text-gray-500">Progress overview</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="tw-text-gray-400 hover:tw-text-gray-600 tw-transition-colors tw-flex-shrink-0 tw-ml-4"
                        aria-label="Close modal"
                    >
                        <svg className="tw-w-6 tw-h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="tw-flex-1 tw-overflow-y-auto tw-p-6">
                    {isLoading && <SkeletonLoader />}

                    {error && (
                        <div className="tw-p-4 tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg">
                            <p className="tw-text-sm tw-text-red-800 tw-font-medium">
                                {error.message || 'Failed to load mentee progress'}
                            </p>
                            <p className="tw-text-sm tw-text-red-700 tw-mt-1">
                                Please try again later or contact support if the problem persists.
                            </p>
                        </div>
                    )}

                    {!isLoading && !error && progressData && (
                        <div className="tw-space-y-6">
                            {/* Overall Progress Section */}
                            <div className="tw-bg-gradient-to-r tw-from-primary/10 tw-to-purple-500/10 tw-rounded-lg tw-p-6 tw-border tw-border-primary/20">
                                <p className="tw-text-sm tw-text-gray-600 tw-font-medium tw-mb-2">Overall Progress</p>
                                <div className="tw-flex tw-items-end tw-gap-4">
                                    <div className="tw-flex-1">
                                        <div className="tw-text-5xl tw-font-bold tw-text-primary">
                                            {Math.round(progressData.averageProgress)}%
                                        </div>
                                    </div>
                                    <div className="tw-flex-1 tw-h-32 tw-bg-gray-200 tw-rounded-lg tw-overflow-hidden">
                                        <div
                                            className="tw-h-full tw-bg-gradient-to-r tw-from-primary tw-to-purple-500 tw-transition-all"
                                            style={{ width: `${progressData.averageProgress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Milestones */}
                            <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-4">
                                <h3 className="tw-text-sm tw-font-semibold tw-text-gray-900 tw-mb-3">
                                    Milestones
                                </h3>
                                <div className="tw-flex tw-items-center tw-gap-8">
                                    <div>
                                        <p className="tw-text-2xl tw-font-bold tw-text-primary">
                                            {progressData.milestonesAchieved}/{progressData.totalMilestones}
                                        </p>
                                        <p className="tw-text-xs tw-text-gray-500 tw-mt-1">Achieved</p>
                                    </div>
                                    <div className="tw-flex-1 tw-h-2 tw-bg-gray-200 tw-rounded-full tw-overflow-hidden">
                                        <div
                                            className="tw-h-full tw-bg-gradient-to-r tw-from-green-400 tw-to-emerald-600"
                                            style={{
                                                width: `${progressData.totalMilestones > 0
                                                    ? (progressData.milestonesAchieved / progressData.totalMilestones) * 100
                                                    : 0
                                                }%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Goals Summary */}
                            <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-4">
                                <h3 className="tw-text-sm tw-font-semibold tw-text-gray-900 tw-mb-3">
                                    Goals Status
                                </h3>
                                <div className="tw-grid tw-grid-cols-3 tw-gap-3">
                                    <div className="tw-text-center tw-p-3 tw-bg-green-50 tw-rounded-lg">
                                        <p className="tw-text-lg tw-font-bold tw-text-green-700">
                                            {goalStats.completed}
                                        </p>
                                        <p className="tw-text-xs tw-text-green-600 tw-mt-1">Completed</p>
                                    </div>
                                    <div className="tw-text-center tw-p-3 tw-bg-blue-50 tw-rounded-lg">
                                        <p className="tw-text-lg tw-font-bold tw-text-blue-700">
                                            {goalStats.inProgress}
                                        </p>
                                        <p className="tw-text-xs tw-text-blue-600 tw-mt-1">In Progress</p>
                                    </div>
                                    <div className="tw-text-center tw-p-3 tw-bg-yellow-50 tw-rounded-lg">
                                        <p className="tw-text-lg tw-font-bold tw-text-yellow-700">
                                            {goalStats.paused}
                                        </p>
                                        <p className="tw-text-xs tw-text-yellow-600 tw-mt-1">Paused</p>
                                    </div>
                                </div>
                            </div>

                            {/* Session Trends */}
                            {progressData.sessionsTrend && progressData.sessionsTrend.length > 0 && (
                                <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-4">
                                    <h3 className="tw-text-sm tw-font-semibold tw-text-gray-900 tw-mb-3">
                                        Session Trends (Past 8 Weeks)
                                    </h3>
                                    <div className="tw-overflow-x-auto">
                                        <table className="tw-w-full tw-text-sm">
                                            <thead className="tw-border-b tw-border-gray-200">
                                                <tr>
                                                    <th className="tw-text-left tw-py-2 tw-px-2 tw-font-semibold tw-text-gray-700">
                                                        Week
                                                    </th>
                                                    <th className="tw-text-center tw-py-2 tw-px-2 tw-font-semibold tw-text-gray-700">
                                                        Scheduled
                                                    </th>
                                                    <th className="tw-text-center tw-py-2 tw-px-2 tw-font-semibold tw-text-gray-700">
                                                        Attended
                                                    </th>
                                                    <th className="tw-text-center tw-py-2 tw-px-2 tw-font-semibold tw-text-gray-700">
                                                        Tasks
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="tw-divide-y tw-divide-gray-200">
                                                {progressData.sessionsTrend.map((point, idx) => (
                                                    <tr key={idx} className="hover:tw-bg-gray-50">
                                                        <td className="tw-py-2 tw-px-2 tw-text-gray-700">
                                                            {point.week}
                                                        </td>
                                                        <td className="tw-py-2 tw-px-2 tw-text-center tw-text-gray-600">
                                                            {point.sessions}
                                                        </td>
                                                        <td className="tw-py-2 tw-px-2 tw-text-center tw-text-green-600 tw-font-semibold">
                                                            {point.attended}
                                                        </td>
                                                        <td className="tw-py-2 tw-px-2 tw-text-center tw-text-blue-600 tw-font-semibold">
                                                            {point.tasksCompleted}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Top Competencies */}
                            {topCompetencies.length > 0 && (
                                <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-4">
                                    <h3 className="tw-text-sm tw-font-semibold tw-text-gray-900 tw-mb-3">
                                        Top Competencies
                                    </h3>
                                    <div className="tw-space-y-3">
                                        {topCompetencies.map((competency, idx) => (
                                            <div key={idx} className="tw-space-y-1">
                                                <div className="tw-flex tw-items-center tw-justify-between">
                                                    <p className="tw-text-sm tw-font-medium tw-text-gray-900">
                                                        {competency.label || competency.skillKey}
                                                    </p>
                                                    <span className="tw-text-xs tw-font-semibold tw-text-gray-600">
                                                        Level {competency.level}/5
                                                    </span>
                                                </div>
                                                <div className="tw-w-full tw-h-2 tw-bg-gray-200 tw-rounded-full tw-overflow-hidden">
                                                    <div
                                                        className="tw-h-full tw-bg-gradient-to-r tw-from-indigo-400 tw-to-indigo-600"
                                                        style={{ width: `${(competency.level / 5) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer - Responsive Close Button */}
                {!isLoading && (
                    <div className="tw-border-t tw-border-gray-200 tw-bg-gray-50 tw-p-4 tw-flex-shrink-0">
                        <button
                            onClick={onClose}
                            className="tw-w-full tw-px-4 tw-py-2 tw-rounded-lg tw-text-sm tw-font-medium tw-text-gray-700 tw-bg-white tw-border tw-border-gray-300 hover:tw-bg-gray-50 tw-transition-colors focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary"
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MenteeProgressModal;
