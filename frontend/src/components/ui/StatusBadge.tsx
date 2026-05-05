import React from 'react';

type Variant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary';
type Size = 'sm' | 'md';

interface StatusBadgeProps {
  label: string;
  variant?: Variant;
  size?: Size;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<Variant, string> = {
  success: 'tw-bg-emerald-50 tw-text-emerald-700 dark:tw-bg-emerald-950 dark:tw-text-emerald-400',
  warning: 'tw-bg-amber-50 tw-text-amber-700 dark:tw-bg-amber-950 dark:tw-text-amber-400',
  error: 'tw-bg-red-50 tw-text-red-700 dark:tw-bg-red-950 dark:tw-text-red-400',
  info: 'tw-bg-blue-50 tw-text-blue-700 dark:tw-bg-blue-950 dark:tw-text-blue-400',
  neutral: 'tw-bg-[var(--surface-tertiary)] tw-text-[var(--text-secondary)]',
  primary: 'tw-bg-purple-50 tw-text-purple-700 dark:tw-bg-purple-950 dark:tw-text-purple-400',
};

const dotColors: Record<Variant, string> = {
  success: 'tw-bg-emerald-500',
  warning: 'tw-bg-amber-500',
  error: 'tw-bg-red-500',
  info: 'tw-bg-blue-500',
  neutral: 'tw-bg-gray-400',
  primary: 'tw-bg-purple-500',
};

const sizeStyles: Record<Size, string> = {
  sm: 'tw-text-[11px] tw-px-2 tw-py-0.5',
  md: 'tw-text-xs tw-px-2.5 tw-py-1',
};

const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'sm',
  dot = false,
  className = '',
}) => {
  return (
    <span
      className={`
        tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-full tw-font-medium tw-leading-none tw-whitespace-nowrap
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `.trim()}
    >
      {dot && (
        <span className={`tw-w-1.5 tw-h-1.5 tw-rounded-full ${dotColors[variant]}`} />
      )}
      {label}
    </span>
  );
};

export default StatusBadge;
