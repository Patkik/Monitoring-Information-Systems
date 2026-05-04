import React, { useMemo, useState } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { useAchievements } from '../../shared/hooks/useAchievements';
import { Achievement } from '../../shared/services/achievementService';

type FilterStatus = 'all' | 'unlocked' | 'in_progress' | 'locked';

const filterTabs: { key: FilterStatus; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'unlocked', label: 'Unlocked' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'locked', label: 'Locked' },
];

const AchievementSkeleton: React.FC = () => (
    <div className="tw-bg-white tw-rounded-xl tw-border tw-border-gray-100 tw-p-6 tw-animate-pulse">
        <div className="tw-flex tw-items-start tw-gap-4 tw-mb-4">
            <div className="tw-w-12 tw-h-12 tw-bg-gray-100 tw-rounded-xl tw-flex-shrink-0" />
            <div className="tw-flex-1">
                <div className="tw-h-4 tw-bg-gray-100 tw-rounded tw-mb-2 tw-w-3/4" />
                <div className="tw-h-3 tw-bg-gray-100 tw-rounded tw-w-full" />
            </div>
        </div>
        <div className="tw-h-1.5 tw-bg-gray-100 tw-rounded-full tw-w-full" />
    </div>
);

const statusConfig = {
    unlocked:    { label: 'Unlocked',    bg: 'tw-bg-emerald-50', text: 'tw-text-emerald-700', dot: 'tw-bg-emerald-400' },
    in_progress: { label: 'In Progress', bg: 'tw-bg-blue-50',    text: 'tw-text-blue-700',    dot: 'tw-bg-blue-400'    },
    locked:      { label: 'Locked',      bg: 'tw-bg-gray-100',   text: 'tw-text-gray-500',    dot: 'tw-bg-gray-300'    },
};

const getProgressWidthClass = (progressPct: number) => {
    if (progressPct >= 100) return 'tw-w-full';
    if (progressPct >= 75) return 'tw-w-3/4';
    if (progressPct >= 50) return 'tw-w-1/2';
    if (progressPct >= 25) return 'tw-w-1/3';
    if (progressPct > 0) return 'tw-w-1/4';
    return 'tw-w-0';
};

const AchievementCard: React.FC<{ achievement: Achievement }> = ({ achievement }) => {
    const isUnlocked = achievement.status === 'unlocked';
    const isInProgress = achievement.status === 'in_progress';
    const isLocked = achievement.status === 'locked';
    const cfg = statusConfig[achievement.status] ?? statusConfig.locked;
    const progressPct = achievement.progress
        ? Math.min((achievement.progress.current / achievement.progress.target) * 100, 100)
        : 0;
    const progressWidthClass = getProgressWidthClass(progressPct);

    return (
        <div
            className={`tw-bg-white tw-rounded-xl tw-border tw-shadow-sm tw-overflow-hidden tw-transition-all tw-duration-200 hover:tw-shadow-md hover:tw-border-primary/30 ${
                isLocked ? 'tw-border-gray-100 tw-opacity-70' : 'tw-border-gray-100'
            }`}
        >
            {/* Top accent bar for unlocked */}
            {isUnlocked && <div className="tw-h-0.5 tw-bg-gradient-to-r tw-from-primary tw-to-purple-400" />}

            <div className="tw-p-5">
                {/* Icon + Status row */}
                <div className="tw-flex tw-items-start tw-justify-between tw-mb-4">
                    <div className={`tw-text-3xl tw-w-12 tw-h-12 tw-flex tw-items-center tw-justify-center tw-rounded-xl tw-bg-gray-50 ${isLocked ? 'tw-grayscale' : ''}`}>
                        {achievement.icon || '🏆'}
                    </div>
                    <span className={`tw-inline-flex tw-items-center tw-gap-1.5 tw-px-2.5 tw-py-1 tw-rounded-full tw-text-xs tw-font-semibold ${cfg.bg} ${cfg.text}`}>
                        <span className={`tw-w-1.5 tw-h-1.5 tw-rounded-full ${cfg.dot}`} />
                        {cfg.label}
                    </span>
                </div>

                {/* Title & Description */}
                <h3 className={`tw-text-sm tw-font-bold tw-mb-1 ${isLocked ? 'tw-text-gray-500' : 'tw-text-gray-900'}`}>
                    {achievement.title}
                </h3>
                <p className="tw-text-xs tw-text-gray-500 tw-leading-relaxed tw-mb-4">
                    {achievement.description}
                </p>

                {/* Progress bar */}
                {isInProgress && achievement.progress && (
                    <div className="tw-mb-4">
                        <div className="tw-flex tw-justify-between tw-items-center tw-mb-1.5">
                            <span className="tw-text-xs tw-text-gray-400">Progress</span>
                            <span className="tw-text-xs tw-font-semibold tw-text-gray-600">
                                {achievement.progress.current}/{achievement.progress.target}
                                {achievement.progress.unit ? ` ${achievement.progress.unit}` : ''}
                            </span>
                        </div>
                        <div className="tw-w-full tw-bg-gray-100 tw-rounded-full tw-h-1.5">
                            <div
                                className={`tw-bg-primary tw-h-1.5 tw-rounded-full tw-transition-all tw-duration-500 ${progressWidthClass}`}
                            />
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="tw-flex tw-items-center tw-justify-between tw-pt-3 tw-border-t tw-border-gray-50">
                    {isUnlocked && achievement.earnedAt ? (
                        <p className="tw-text-xs tw-text-gray-400">
                            Earned {new Date(achievement.earnedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                    ) : (
                        <span />
                    )}
                    {isUnlocked && achievement.rewardPoints && (
                        <span className="tw-text-xs tw-font-bold tw-text-amber-600 tw-bg-amber-50 tw-px-2 tw-py-0.5 tw-rounded-full">
                            +{achievement.rewardPoints} pts
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

const MentorAchievementsPage: React.FC = () => {
    const { data: achievements = [], isLoading, error } = useAchievements();
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const errorMessage = error ? (error as any).message || 'Failed to load achievements' : '';

    const filterCounts = useMemo(() => ({
        all:         achievements.length,
        unlocked:    achievements.filter((a) => a.status === 'unlocked').length,
        in_progress: achievements.filter((a) => a.status === 'in_progress').length,
        locked:      achievements.filter((a) => a.status === 'locked').length,
    }), [achievements]);

    const filteredAndSorted = useMemo(() => {
        const statusOrder: Record<string, number> = { unlocked: 0, in_progress: 1, locked: 2 };
        let list = filterStatus === 'all' ? achievements : achievements.filter((a) => a.status === filterStatus);
        return [...list].sort((a, b) => {
            if (statusOrder[a.status] !== statusOrder[b.status]) return statusOrder[a.status] - statusOrder[b.status];
            if (a.status === 'unlocked' && b.status === 'unlocked' && a.earnedAt && b.earnedAt)
                return new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime();
            return a.title.localeCompare(b.title);
        });
    }, [achievements, filterStatus]);

    return (
        <DashboardLayout>
            <div className="tw-max-w-7xl tw-mx-auto tw-px-4 sm:tw-px-6 lg:tw-px-8 tw-py-10 tw-space-y-8">

                {/* ── Header ── */}
                <header className="tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-end sm:tw-justify-between tw-gap-4">
                    <div className="tw-pl-4 tw-border-l-4 tw-border-primary">
                        <p className="tw-text-xs tw-font-bold tw-tracking-widest tw-text-primary tw-uppercase tw-mb-1">
                            Achievements
                        </p>
                        <h1 className="tw-text-3xl tw-font-bold tw-text-gray-900 tw-leading-tight">
                            Your Achievements
                        </h1>
                        <p className="tw-text-sm tw-text-gray-500 tw-mt-1">
                            Track milestones as you grow in your mentoring journey.
                        </p>
                    </div>

                    {/* Summary pills */}
                    {!isLoading && !error && (
                        <div className="tw-flex tw-items-center tw-gap-3">
                            <div className="tw-text-center tw-px-4 tw-py-2 tw-bg-white tw-rounded-xl tw-border tw-border-gray-100 tw-shadow-sm">
                                <p className="tw-text-xl tw-font-bold tw-text-emerald-600">{filterCounts.unlocked}</p>
                                <p className="tw-text-xs tw-text-gray-400 tw-font-medium">Unlocked</p>
                            </div>
                            <div className="tw-text-center tw-px-4 tw-py-2 tw-bg-white tw-rounded-xl tw-border tw-border-gray-100 tw-shadow-sm">
                                <p className="tw-text-xl tw-font-bold tw-text-blue-600">{filterCounts.in_progress}</p>
                                <p className="tw-text-xs tw-text-gray-400 tw-font-medium">In Progress</p>
                            </div>
                        </div>
                    )}
                </header>

                {/* ── Filter Tabs ── */}
                <div className="tw-flex tw-gap-1 tw-bg-gray-100 tw-rounded-xl tw-p-1 tw-w-fit">
                    {filterTabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setFilterStatus(tab.key)}
                            className={`tw-px-4 tw-py-2 tw-rounded-lg tw-text-sm tw-font-semibold tw-transition-all tw-whitespace-nowrap ${
                                filterStatus === tab.key
                                    ? 'tw-bg-white tw-text-primary tw-shadow-sm'
                                    : 'tw-text-gray-500 hover:tw-text-gray-800'
                            }`}
                        >
                            {tab.label}
                            <span className={`tw-ml-1.5 tw-text-xs ${filterStatus === tab.key ? 'tw-text-primary/60' : 'tw-text-gray-400'}`}>
                                {filterCounts[tab.key]}
                            </span>
                        </button>
                    ))}
                </div>

                {/* ── Loading ── */}
                {isLoading && (
                    <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-3 xl:tw-grid-cols-4 tw-gap-5">
                        {Array.from({ length: 8 }).map((_, i) => <AchievementSkeleton key={i} />)}
                    </div>
                )}

                {/* ── Error ── */}
                {error && (
                    <div className="tw-bg-red-50 tw-border tw-border-red-100 tw-rounded-xl tw-p-4">
                        <p className="tw-text-sm tw-font-medium tw-text-red-700">{errorMessage}</p>
                    </div>
                )}

                {/* ── Content ── */}
                {!isLoading && !error && (
                    filteredAndSorted.length === 0 ? (
                        <div className="tw-bg-white tw-rounded-xl tw-border tw-border-gray-100 tw-py-16 tw-text-center">
                            <p className="tw-text-4xl tw-mb-4">🎯</p>
                            <p className="tw-text-base tw-font-bold tw-text-gray-800 tw-mb-1">No achievements yet</p>
                            <p className="tw-text-sm tw-text-gray-400">
                                {filterStatus === 'all'
                                    ? 'Complete sessions and goals to earn your first achievement.'
                                    : `No ${filterStatus.replace('_', ' ')} achievements right now.`}
                            </p>
                        </div>
                    ) : (
                        <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-3 xl:tw-grid-cols-4 tw-gap-5">
                            {filteredAndSorted.map((achievement) => (
                                <AchievementCard key={achievement.id} achievement={achievement} />
                            ))}
                        </div>
                    )
                )}
            </div>
        </DashboardLayout>
    );
};

export default MentorAchievementsPage;
