import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, actions, className = '' }) => {
  return (
    <div className={`tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-center sm:tw-justify-between tw-gap-3 tw-mb-6 ${className}`}>
      <div className="tw-min-w-0">
        <h1 className="tw-text-xl tw-font-semibold tw-text-[var(--text-primary)] tw-tracking-[-0.025em] tw-leading-tight">
          {title}
        </h1>
        {description && (
          <p className="tw-mt-1 tw-text-[13px] tw-text-[var(--text-tertiary)] tw-leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="tw-flex tw-items-center tw-gap-2 tw-flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
