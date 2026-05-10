import React from 'react';
import type { SnapshotTrendPoint } from '../../shared/services/mentorFeedbackService';
import { useProgressDashboard } from '../../shared/hooks/useGoals';
import { useMenteeProgressSnapshot } from '../../shared/hooks/useMentorFeedback';

const ProgressDashboard: React.FC<{ menteeId?: string | null }> = ({ menteeId }) => {
  // If a menteeId prop is passed (mentor/admin context), fetch that mentee's snapshot.
  // Otherwise fall back to the logged-in mentee snapshot.
  const query = menteeId ? useMenteeProgressSnapshot(menteeId) : useProgressDashboard();
  const { data: snapshot, isLoading, isError, refetch } = query as any;

  if (isLoading) {
    return (
      <div className="tw-flex tw-justify-center tw-items-center tw-p-6">
        <div className="tw-animate-spin tw-h-6 tw-w-6 tw-border-b-2 tw-border-blue-500 tw-rounded-full" />
      </div>
    );
  }

  if (isError || !snapshot) {
    return (
      <div className="tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg tw-p-4">
        <div className="tw-text-red-700 tw-font-medium">Failed to load progress.</div>
        <button onClick={() => refetch()} className="tw-mt-2 tw-text-sm tw-text-red-600 hover:tw-text-red-800">Retry</button>
      </div>
    );
  }

  const ratingAvg = snapshot.ratingAvg ?? 0;
  const ratingDisplay = ratingAvg.toFixed(2);
  const ratingCount = snapshot.ratingCount ?? 0;
  const milestonesReached = snapshot.milestones?.reached ?? 0;
  const milestoneUpdatedLabel = formatDateTime(snapshot.milestones?.lastUpdatedAt);
  const lastUpdatedLabel = formatDateTime(snapshot.lastUpdated);
  const monthlyTrend = snapshot.monthlyTrend || [];

  return (
    <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-6 tw-shadow-sm tw-space-y-6">
      <div className="tw-flex tw-items-center tw-justify-between">
        <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900">Progress Dashboard</h2>
        <button
          onClick={() => refetch()}
          className="tw-text-sm tw-bg-gray-100 hover:tw-bg-gray-200 tw-text-gray-700 tw-rounded tw-px-3 tw-py-1"
        >
          Refresh
        </button>
      </div>
      <section aria-label="Mentor feedback snapshot">
        <h3 className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Mentor Feedback Snapshot</h3>
        <div className="tw-grid tw-grid-cols-2 tw-gap-3">
          <Stat label="Avg Rating" value={`${ratingDisplay}/5`} />
          <Stat label="Feedback" value={ratingCount} />
          <Stat label="Milestones" value={milestonesReached} />
          <Stat label="Updated" value={lastUpdatedLabel} />
        </div>
        <div className="tw-mt-2 tw-text-xs tw-text-gray-500">Last milestone: {milestoneUpdatedLabel}</div>
      </section>

      <section aria-label="Monthly rating trend">
        <h3 className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Monthly Rating Trend</h3>
        {monthlyTrend.length === 0 && (
          <div className="tw-text-xs tw-text-gray-500">No mentor feedback yet.</div>
        )}
        {monthlyTrend.length > 0 && (
          <div className="tw-space-y-2">
            {monthlyTrend.map((trend: SnapshotTrendPoint) => {
              const clamped = Math.max(0, Math.min(5, trend.avg));
              const filledSegments = Math.round((clamped / 5) * 10);
              return (
                <div key={trend.month} className="tw-flex tw-items-center tw-gap-2">
                  <div className="tw-w-16 tw-shrink-0 tw-text-xs tw-font-medium tw-text-gray-600 tw-truncate">
                    {formatMonthLabel(trend.month)}
                  </div>
                  <div className="tw-flex-1 tw-flex tw-items-center tw-gap-2 tw-min-w-0">
                    <div className="tw-h-2 tw-w-full tw-rounded-full tw-bg-gray-100 tw-overflow-hidden">
                      <div className="tw-flex tw-h-full tw-w-full tw-gap-[2px]">
                        {Array.from({ length: 10 }).map((_, index) => (
                          <span
                            key={`${trend.month}-${index}`}
                            className={`tw-h-full tw-flex-1 tw-rounded-full ${index < filledSegments ? 'tw-bg-blue-500' : 'tw-bg-gray-200'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="tw-shrink-0 tw-text-right tw-text-[11px] tw-text-gray-600">
                      <span className="tw-font-semibold tw-text-gray-900">{trend.avg.toFixed(1)}</span>
                      <span className="tw-block tw-text-[10px] tw-text-gray-400">{trend.count}×</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      
    </div>
  );
};

const Stat: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="tw-bg-gray-50 tw-rounded-lg tw-p-3 tw-border tw-border-gray-100 tw-flex tw-flex-col tw-gap-0.5">
    <div className="tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-gray-400">{label}</div>
    <div className="tw-text-base tw-font-bold tw-text-gray-900 tw-truncate">{value}</div>
  </div>
);

const Th: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <th scope="col" className="tw-text-left tw-text-xs tw-font-semibold tw-text-gray-700 tw-px-3 tw-py-2">{children}</th>
);
const Td: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <td className="tw-px-3 tw-py-2 tw-text-xs tw-text-gray-700">{children}</td>
);

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  } catch {
    return date.toLocaleString();
  }
};

const formatMonthLabel = (monthKey: string) => {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!year || !month) {
    return monthKey || '—';
  }

  const date = new Date(Date.UTC(year, month - 1, 1));
  try {
    return new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' }).format(date);
  } catch {
    return `${date.toLocaleString('default', { month: 'short' })} ${year}`;
  }
};

export default React.memo(ProgressDashboard);
