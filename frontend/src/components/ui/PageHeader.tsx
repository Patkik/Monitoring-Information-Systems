import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  breadcrumbs?: Array<{ label: string; path?: string }>;
  actions?: React.ReactNode;
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, badge, breadcrumbs, actions, className = '' }) => {
  return (
    <div className={`tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-center sm:tw-justify-between tw-gap-3 tw-mb-6 ${className}`}>
      <div className="tw-min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="tw-mb-2">
            <ol className="tw-flex tw-items-center tw-space-x-2 tw-text-sm tw-text-[var(--text-tertiary)]">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  <li>
                    {crumb.path ? (
                      <a href={crumb.path} className="hover:tw-text-[var(--text-primary)] tw-transition-colors">
                        {crumb.label}
                      </a>
                    ) : (
                      <span className="tw-text-[var(--text-secondary)]">{crumb.label}</span>
                    )}
                  </li>
                  {index < breadcrumbs.length - 1 && (
                    <li>
                      <svg className="tw-h-4 tw-w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </li>
                  )}
                </React.Fragment>
              ))}
            </ol>
          </nav>
        )}
        <div className="tw-flex tw-items-center tw-gap-3">
          <h1 className="tw-text-xl tw-font-semibold tw-text-[var(--text-primary)] tw-tracking-[-0.025em] tw-leading-tight">
            {title}
          </h1>
          {badge && (
            <span className="tw-inline-flex tw-items-center tw-px-2.5 tw-py-0.5 tw-rounded-full tw-text-xs tw-font-medium tw-bg-primary/10 tw-text-primary">
              {badge}
            </span>
          )}
        </div>
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
