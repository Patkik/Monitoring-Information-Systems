import React, { useMemo, useState } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import { useAchievements } from '../../shared/hooks/useAchievements';
import { Achievement } from '../../shared/services/achievementService';
import { Card, PageHeader, EmptyState, LoadingSpinner } from '../../components/ui';

type FilterStatus = 'all' | 'unlocked' | 'in_progress' | 'locked';

const filterTabs: { key: FilterStatus; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'unlocked', label: 'Unlocked' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'locked', label: 'Locked' },
];

const AchievementSkeleton: React.FC = () => (
    <Card className="tw-p-6 tw-animate-pulse">
        <div className="tw-flex tw-items-start tw-gap-4 tw-mb-4">
            <div className="tw-w-12 tw-h-12 tw-bg-[var(--surface-hover)] tw-rounded-xl tw-flex-shrink-0" />
            <div className="tw-flex-1">
                <div className="tw-h-4 tw-bg-[var(--surface-hover)] tw-rounded tw-mb-2 tw-w-3/4" />
                <div className="tw-h-3 tw-bg-[var(--surface-hover)] tw-rounded tw-w-full" />
            </div>
        </div>
        <div className="tw-h-1.5 tw-bg-[var(--surface-hover)] tw-rounded-full tw-w-full" />
    </Card>
);

const statusConfig = {
    unlocked:    { label: 'Unlocked',    bg: 'tw-bg-emerald-50 dark:tw-bg-emerald-950/30', text: 'tw-text-emerald-700 dark:tw-text-emerald-400', dot: 'tw-bg-emerald-400 dark:tw-bg-emerald-500' },
    in_progress: { label: 'In Progress', bg: 'tw-bg-blue-50 dark:tw-bg-blue-950/30',    text: 'tw-text-blue-700 dark:tw-text-blue-400',    dot: 'tw-bg-blue-400 dark:tw-bg-blue-500'    },
    locked:      { label: 'Locked',      bg: 'tw-bg-[var(--surface-secondary)]',   text: 'tw-text-[var(--text-secondary)]',    dot: 'tw-bg-[var(--text-muted)]'    },
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
        <Card
            className={`tw-overflow-hidden tw-transition-all tw-duration-200 hover:tw-shadow-[var(--shadow-md)] hover:tw-border-primary/30 ${
                isLocked ? 'tw-opacity-70' : ''
            }`}
        >
            {/* Top accent bar for unlocked */}
            {isUnlocked && <div className="tw-h-0.5 tw-bg-gradient-to-r tw-from-primary tw-to-purple-400" />}

            <div className="tw-p-5">
                {/* Icon + Status row */}
                <div className="tw-flex tw-items-start tw-justify-between tw-mb-4">
                    <div className={`tw-text-3xl tw-w-12 tw-h-12 tw-flex tw-items-center tw-justify-center tw-rounded-xl tw-bg-[var(--surface-secondary)] ${isLocked ? 'tw-grayscale tw-opacity-50' : ''}`}>
                        {achievement.icon || '🏆'}
                    </div>
                    <span className={`tw-inline-flex tw-items-center tw-gap-1.5 tw-px-2.5 tw-py-1 tw-rounded-full tw-text-xs tw-font-semibold ${cfg.bg} ${cfg.text}`}>
                        <span className={`tw-w-1.5 tw-h-1.5 tw-rounded-full ${cfg.dot}`} />
                        {cfg.label}
                    </span>
                </div>

                {/* Title & Description */}
                <h3 className={`tw-text-sm tw-font-bold tw-mb-1 ${isLocked ? 'tw-text-[var(--text-secondary)]' : 'tw-text-[var(--text-primary)]'}`}>
                    {achievement.title}
                </h3>
                <p className="tw-text-xs tw-text-[var(--text-secondary)] tw-leading-relaxed tw-mb-4">
                    {achievement.description}
                </p>

                {/* Progress bar */}
                {isInProgress && achievement.progress && (
                    <div className="tw-mb-4">
                        <div className="tw-flex tw-justify-between tw-items-center tw-mb-1.5">
                            <span className="tw-text-xs tw-text-[var(--text-muted)]">Progress</span>
                            <span className="tw-text-xs tw-font-semibold tw-text-[var(--text-secondary)]">
                                {achievement.progress.current}/{achievement.progress.target}
                                {achievement.progress.unit ? ` ${achievement.progress.unit}` : ''}
                            </span>
                        </div>
                        <div className="tw-w-full tw-bg-[var(--surface-secondary)] tw-rounded-full tw-h-1.5">
                            <div
                                className={`tw-bg-primary tw-h-1.5 tw-rounded-full tw-transition-all tw-duration-500 ${progressWidthClass}`}
                            />
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="tw-flex tw-items-center tw-justify-between tw-pt-3 tw-border-t tw-border-[var(--border-color)]">
                    {isUnlocked && achievement.earnedAt ? (
                        <p className="tw-text-xs tw-text-[var(--text-muted)]">
                            Earned {new Date(achievement.earnedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                    ) : (
                        <span />
                    )}
                    {isUnlocked && achievement.rewardPoints && (
                        <span className="tw-text-xs tw-font-bold tw-text-amber-600 dark:tw-text-amber-400 tw-bg-amber-50 dark:tw-bg-amber-950/30 tw-px-2 tw-py-0.5 tw-rounded-full">
                            +{achievement.rewardPoints} pts
                        </span>
                    )}
                </div>
            </div>
        </Card>
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
        <AdminLayout>
            <div className="tw-space-y-6">

                {/* ── Header ── */}
                <header className="tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-end sm:tw-justify-between tw-gap-4">
                    <PageHeader 
                      title="Your Achievements" 
                      description="Track milestones as you grow in your mentoring journey." 
                      breadcrumbs={[
                        { label: 'Dashboard', path: '/mentor/dashboard' },
                        { label: 'Achievements', path: '/mentor/achievements' }
                      ]}
                    />

                    {/* Summary pills */}
                    {!isLoading && !error && (
                        <div className="tw-flex tw-items-center tw-gap-3">
                            <Card className="tw-text-center tw-px-4 tw-py-2 tw-min-w-[100px]">
                                <p className="tw-text-xl tw-font-bold tw-text-emerald-600 dark:tw-text-emerald-400">{filterCounts.unlocked}</p>
                                <p className="tw-text-xs tw-text-[var(--text-secondary)] tw-font-medium">Unlocked</p>
                            </Card>
                            <Card className="tw-text-center tw-px-4 tw-py-2 tw-min-w-[100px]">
                                <p className="tw-text-xl tw-font-bold tw-text-blue-600 dark:tw-text-blue-400">{filterCounts.in_progress}</p>
                                <p className="tw-text-xs tw-text-[var(--text-secondary)] tw-font-medium">In Progress</p>
                            </Card>
                        </div>
                    )}
                </header>

                {/* ── Filter Tabs ── */}
                <div className="tw-flex tw-gap-1 tw-bg-[var(--surface-secondary)] tw-border tw-border-[var(--border-color)] tw-rounded-xl tw-p-1 tw-w-fit">
                    {filterTabs.map((tab) => {
                        const count = filterCounts[tab.key] as number;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setFilterStatus(tab.key)}
                                className={`tw-px-4 tw-py-2 tw-rounded-lg tw-text-sm tw-font-semibold tw-transition-all tw-whitespace-nowrap ${
                                    filterStatus === tab.key
                                        ? 'tw-bg-[var(--surface-card)] tw-text-primary tw-shadow-[var(--shadow-sm)] tw-border tw-border-[var(--border-color)]'
                                        : 'tw-text-[var(--text-secondary)] hover:tw-text-[var(--text-primary)]'
                                }`}
                            >
                                {tab.label}
                                <span className={`tw-ml-1.5 tw-text-xs ${filterStatus === tab.key ? 'tw-text-primary/60' : 'tw-text-[var(--text-muted)]'}`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* ── Loading ── */}
                {isLoading && (
                    <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-3 xl:tw-grid-cols-4 tw-gap-5">
                        {Array.from({ length: 8 }).map((_, i) => <AchievementSkeleton key={i} />)}
                    </div>
                )}

                {/* ── Error ── */}
                {!!error && (
                    <div className="tw-bg-red-50 dark:tw-bg-red-950/20 tw-border tw-border-red-100 dark:tw-border-red-900/50 tw-rounded-xl tw-p-4">
                        <p className="tw-text-sm tw-font-medium tw-text-red-700 dark:tw-text-red-400">{errorMessage}</p>
                    </div>
                )}

                {/* ── Content ── */}
                {!isLoading && !error && (
                    filteredAndSorted.length === 0 ? (
                        <EmptyState 
                          title="No achievements yet" 
                          description={filterStatus === 'all'
                            ? 'Complete sessions and goals to earn your first achievement.'
                            : `No ${filterStatus.replace('_', ' ')} achievements right now.`}
                          icon="🏆"
                        />
                    ) : (
                        <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-3 xl:tw-grid-cols-4 tw-gap-5">
                            {filteredAndSorted.map((achievement) => (
                                <AchievementCard key={achievement.id} achievement={achievement} />
                            ))}
                        </div>
                    )
                )}
            </div>
        </AdminLayout>
    );
};

export default MentorAchievementsPage;
