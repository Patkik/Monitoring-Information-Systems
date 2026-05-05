import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:
    'tw-bg-primary tw-text-white hover:tw-bg-primary-700 active:tw-scale-[0.97] tw-shadow-sm hover:tw-shadow-md',
  secondary:
    'tw-bg-[var(--surface-card)] tw-text-[var(--text-primary)] tw-border tw-border-[var(--border-color)] hover:tw-bg-[var(--surface-hover)] active:tw-scale-[0.97]',
  ghost:
    'tw-bg-transparent tw-text-[var(--text-secondary)] hover:tw-bg-[var(--surface-hover)] hover:tw-text-[var(--text-primary)]',
  danger:
    'tw-bg-red-600 tw-text-white hover:tw-bg-red-700 active:tw-scale-[0.97] tw-shadow-sm',
  success:
    'tw-bg-emerald-600 tw-text-white hover:tw-bg-emerald-700 active:tw-scale-[0.97] tw-shadow-sm',
};

const sizeStyles: Record<Size, string> = {
  sm: 'tw-h-8 tw-px-3 tw-text-xs tw-gap-1.5 tw-rounded-lg',
  md: 'tw-h-9 tw-px-4 tw-text-[13px] tw-gap-2 tw-rounded-lg',
  lg: 'tw-h-10 tw-px-5 tw-text-sm tw-gap-2 tw-rounded-xl',
};

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled,
  className = '',
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <button
      className={`
        tw-inline-flex tw-items-center tw-justify-center tw-font-medium
        tw-transition-all tw-duration-150 tw-ease-out tw-select-none
        disabled:tw-opacity-50 disabled:tw-cursor-not-allowed disabled:tw-pointer-events-none
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'tw-w-full' : ''}
        ${className}
      `.trim()}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <svg className="tw-animate-spin tw-h-4 tw-w-4" fill="none" viewBox="0 0 24 24">
          <circle className="tw-opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="tw-opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : icon && iconPosition === 'left' ? (
        <span className="tw-flex-shrink-0">{icon}</span>
      ) : null}
      {children && <span>{children}</span>}
      {!loading && icon && iconPosition === 'right' ? (
        <span className="tw-flex-shrink-0">{icon}</span>
      ) : null}
    </button>
  );
};

export default Button;
