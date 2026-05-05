import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const paddingMap = {
  none: '',
  sm: 'tw-p-3',
  md: 'tw-p-5',
  lg: 'tw-p-6',
};

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = false,
  padding = 'md',
  onClick,
}) => {
  return (
    <div
      className={`
        tw-rounded-xl tw-border tw-border-[var(--border-color)] tw-bg-[var(--surface-card)]
        tw-shadow-[var(--shadow-sm)] tw-transition-all tw-duration-200
        ${hover ? 'hover:tw-shadow-[var(--shadow-md)] hover:tw--translate-y-0.5 tw-cursor-pointer' : ''}
        ${paddingMap[padding]}
        ${className}
      `.trim()}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
};

export default Card;
