import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: string; positive: boolean };
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, trend, className = '' }) => {
  return (
    <div
      className={`
        tw-rounded-xl tw-border tw-border-[var(--border-color)] tw-bg-[var(--surface-card)]
        tw-p-5 tw-shadow-[var(--shadow-sm)]
        tw-transition-all tw-duration-200 hover:tw-shadow-[var(--shadow-md)] hover:tw--translate-y-0.5
        ${className}
      `.trim()}
    >
      <div className="tw-flex tw-items-start tw-justify-between">
        <div className="tw-space-y-2">
          <p className="tw-text-[12px] tw-font-medium tw-text-[var(--text-tertiary)] tw-uppercase tw-tracking-wider">
            {label}
          </p>
          <p className="tw-text-2xl tw-font-bold tw-text-[var(--text-primary)] tw-tracking-tight">
            {value}
          </p>
          {trend && (
            <p className={`tw-text-xs tw-font-medium ${trend.positive ? 'tw-text-emerald-600 dark:tw-text-emerald-400' : 'tw-text-red-600 dark:tw-text-red-400'}`}>
              {trend.positive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        {icon && (
          <div className="tw-flex-shrink-0 tw-w-10 tw-h-10 tw-rounded-lg tw-bg-purple-50 dark:tw-bg-purple-950 tw-flex tw-items-center tw-justify-center tw-text-primary">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
