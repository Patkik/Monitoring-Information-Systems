import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action, className = '' }) => {
  return (
    <div className={`tw-flex tw-flex-col tw-items-center tw-justify-center tw-py-12 tw-px-6 tw-text-center ${className}`}>
      {icon && (
        <div className="tw-w-12 tw-h-12 tw-rounded-full tw-bg-[var(--surface-tertiary)] tw-flex tw-items-center tw-justify-center tw-text-[var(--text-muted)] tw-mb-4">
          {icon}
        </div>
      )}
      <h3 className="tw-text-sm tw-font-semibold tw-text-[var(--text-primary)] tw-mb-1">
        {title}
      </h3>
      {description && (
        <p className="tw-text-[13px] tw-text-[var(--text-tertiary)] tw-max-w-xs">
          {description}
        </p>
      )}
      {action && <div className="tw-mt-4">{action}</div>}
    </div>
  );
};

export default EmptyState;
