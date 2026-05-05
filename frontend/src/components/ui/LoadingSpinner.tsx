import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const sizeMap = {
  sm: 'tw-h-4 tw-w-4 tw-border-2',
  md: 'tw-h-6 tw-w-6 tw-border-2',
  lg: 'tw-h-10 tw-w-10 tw-border-[3px]',
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className = '', label }) => {
  return (
    <div className={`tw-flex tw-items-center tw-justify-center tw-gap-3 ${className}`} role="status">
      <div
        className={`
          tw-animate-spin tw-rounded-full
          tw-border-[var(--border-color)] tw-border-t-primary
          ${sizeMap[size]}
        `.trim()}
      />
      {label && (
        <span className="tw-text-[13px] tw-text-[var(--text-tertiary)]">{label}</span>
      )}
      <span className="tw-sr-only">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;
