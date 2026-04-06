import React, { useMemo, useState } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { useAchievements } from '../../shared/hooks/useAchievements';
import { Achievement } from '../../shared/services/achievementService';

type FilterStatus = 'all' | 'unlocked' | 'in_progress' | 'locked';

const AchievementSkeleton: React.FC = () => (
  <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-p-6 tw-animate-pulse">
    <div className="tw-h-16 tw-w-16 tw-bg-gray-200 tw-rounded-lg tw-mb-4"></div>
    <div className="tw-h-5 tw-bg-gray-200 tw-rounded tw-mb-2 tw-w-3/4"></div>
    <div className="tw-h-4 tw-bg-gray-200 tw-rounded tw-mb-4 tw-w-full"></div>
    <div className="tw-h-2 tw-bg-gray-200 tw-rounded tw-w-full"></div>
  </div>
);

const AchievementCard: React.FC<{ achievement: Achievement; index: number }> = ({ achievement, index }) => {
  const isUnlocked = achievement.status === 'unlocked';
  const iLocked = achievement.status === 'locked';
  const isInProgress = achievement.status === 'in_progress';
  const bgColor = achievement.color || 'bg-blue-50';
  const borderColor = achievement.status === 'locked' ? 'border-gray-300' : 'border-transparent';

  return (
    <div
      key={achievement.id}
      className={`tw-rounded-lg tw-shadow-sm tw-overflow-hidden tw-transition-all duration-200 hover:tw-shadow-md tw-border tw-${borderColor} ${bgColor}`}
      style={{
        animation: `slideIn 0.5s ease-out ${index * 50}ms forwards`,
        opacity: 0,
      }}
    >
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div className="tw-p-6">
        {/* Icon */}
        <div className="tw-text-4xl tw-mb-4">
          {achievement.icon || '🏆'}
        </div>

        {/* Title & Description */}
        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-mb-2">
          {achievement.title}
        </h3>
        <p className="tw-text-sm tw-text-gray-600 tw-mb-4">
          {achievement.description}
        </p>

        {/* Progress Bar (if in progress) */}
        {isInProgress && achievement.progress && (
          <div className="tw-mb-4">
            <div className="tw-flex tw-justify-between tw-items-center tw-mb-1">
              <span className="tw-text-xs tw-font-medium tw-text-gray-600">
                Progress
              </span>
              <span className="tw-text-xs tw-font-semibold tw-text-gray-700">
                {achievement.progress.current} / {achievement.progress.target}
                {achievement.progress.unit && ` ${achievement.progress.unit}`}
              </span>
            </div>
            <div className="tw-w-full tw-bg-gray-300 tw-rounded-full tw-h-2">
              <div
                className="tw-bg-blue-500 tw-h-2 tw-rounded-full tw-transition-all duration-300"
                style={{
                  width: `${Math.min((achievement.progress.current / achievement.progress.target) * 100, 100)}%`,
                }}
              ></div>
            </div>
          </div>
        )}

        {/* Status Badge & Earned Date Row */}
        <div className="tw-flex tw-items-center tw-justify-between tw-gap-2">
          <div className="tw-flex-1">
            <span
              className={`tw-inline-block tw-px-3 tw-py-1 tw-rounded-full tw-text-xs tw-font-semibold ${
                isUnlocked
                  ? 'tw-bg-green-100 tw-text-green-700'
                  : isInProgress
                  ? 'tw-bg-blue-100 tw-text-blue-700'
                  : 'tw-bg-gray-200 tw-text-gray-700'
              }`}
            >
              {achievement.status.replace('_', ' ')}
            </span>
          </div>
          {isUnlocked && achievement.rewardPoints && (
            <div className="tw-text-right">
              <p className="tw-text-sm tw-font-semibold tw-text-amber-600">
                +{achievement.rewardPoints} pts
              </p>
            </div>
          )}
        </div>

        {/* Earned Date */}
        {isUnlocked && achievement.earnedAt && (
          <p className="tw-text-xs tw-text-gray-500 tw-mt-3">
            Earned {new Date(achievement.earnedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        )}
      </div>
    </div>
  );
};

const MentorAchievementsPage: React.FC = () => {
  const { data: achievements = [], isLoading, error } = useAchievements();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const errorMessage = error ? (error as any).message || 'Failed to load achievements' : '';

  const filteredAndSorted = useMemo(() => {
    let filtered = achievements;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter((a) => a.status === filterStatus);
    }

    // Sort: unlocked > in_progress > locked, then by earned date or title
    return filtered.sort((a, b) => {
      const statusOrder: Record<string, number> = {
        'unlocked': 0,
        'in_progress': 1,
        'locked': 2,
      };
      const aOrder = statusOrder[a.status];
      const bOrder = statusOrder[b.status];

      if (aOrder !== bOrder) return aOrder - bOrder;

      // If both unlocked, sort by earned date (most recent first)
      if (a.status === 'unlocked' && b.status === 'unlocked' && a.earnedAt && b.earnedAt) {
        return new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime();
      }

      // Default: alphabetical by title
      return a.title.localeCompare(b.title);
    });
  }, [achievements, filterStatus]);

  const filterCounts = useMemo(() => {
    return {
      all: achievements.length,
      unlocked: achievements.filter((a) => a.status === 'unlocked').length,
      in_progress: achievements.filter((a) => a.status === 'in_progress').length,
      locked: achievements.filter((a) => a.status === 'locked').length,
    };
  }, [achievements]);

  const getFilterCount = (key: FilterStatus): number => {
    return filterCounts[key];
  };

  return (
    <DashboardLayout>
      <div className="tw-max-w-7xl tw-mx-auto tw-px-4 sm:tw-px-6 lg:tw-px-8 tw-py-8 tw-space-y-8">
        {/* Header */}
        <header>
          <p className="tw-text-xs tw-font-semibold tw-text-primary tw-uppercase">Achievements</p>
          <h1 className="tw-text-3xl tw-font-bold tw-text-gray-900">Your Achievements</h1>
          <p className="tw-text-sm tw-text-gray-600 tw-mt-2">
            Track your progress and unlock achievements as you grow in your mentoring journey.
          </p>
        </header>

        {/* Filter Tabs */}
        <div className="tw-flex tw-gap-2 tw-border-b tw-border-gray-200 tw-overflow-x-auto">
          {[
            { key: 'all' as FilterStatus, label: 'All' },
            { key: 'unlocked' as FilterStatus, label: 'Unlocked' },
            { key: 'in_progress' as FilterStatus, label: 'In Progress' },
            { key: 'locked' as FilterStatus, label: 'Locked' },
          ].map((tab) => (
            <button
              key={String(tab.key)}
              onClick={() => setFilterStatus(tab.key)}
              className={filterStatus === tab.key ? 'tw-px-4 tw-py-2 tw-font-medium tw-text-sm tw-border-b-2 tw-transition-colors tw-text-primary tw-border-primary' : 'tw-px-4 tw-py-2 tw-font-medium tw-text-sm tw-border-b-2 tw-transition-colors tw-text-gray-600 tw-border-transparent hover:tw-text-gray-900'}
            >
              {tab.label}
              <span className="tw-ml-2 tw-text-xs tw-font-semibold tw-text-gray-500">
                ({getFilterCount(tab.key)})
              </span>
            </button>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-3 xl:tw-grid-cols-4 tw-gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <AchievementSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg tw-p-4">
            <p className="tw-text-sm tw-font-medium tw-text-red-800">
              {errorMessage}
            </p>
          </div>
        )}

        {/* Content */}
        {!isLoading && !error && (
          <>
            {/* Empty State */}
            {filteredAndSorted.length === 0 ? (
              <div className="tw-text-center tw-py-12">
                <p className="tw-text-4xl tw-mb-4">🎯</p>
                <p className="tw-text-lg tw-font-medium tw-text-gray-900 tw-mb-1">
                  No achievements yet
                </p>
                <p className="tw-text-sm tw-text-gray-600">
                  {filterStatus === 'all'
                    ? 'Complete sessions and goals to earn achievements!'
                    : `No ${filterStatus.replace('_', ' ')} achievements at this time.`}
                </p>
              </div>
            ) : (
              /* Achievement Grid */
              <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-3 xl:tw-grid-cols-4 tw-gap-6">
                {filteredAndSorted.map((achievement, index) => (
                  <AchievementCard key={achievement.id} achievement={achievement} index={index} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MentorAchievementsPage;
