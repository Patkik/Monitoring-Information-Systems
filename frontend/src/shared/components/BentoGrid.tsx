import React from 'react';

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * BentoGrid Component (Phase 2)
 * Provides a responsive, dense grid layout for card-based content.
 * Uses CSS Grid with auto-fit and grid-auto-flow: dense for optimal packing.
 * Cards automatically adjust based on viewport size.
 * 
 * Usage:
 * ```tsx
 * <BentoGrid>
 *   <BentoItem span="auto">Card 1</BentoItem>
 *   <BentoItem span="2x">Wider Card</BentoItem>
 *   <BentoItem span="2y">Taller Card</BentoItem>
 * </BentoGrid>
 * ```
 */
export const BentoGrid: React.FC<BentoGridProps> = ({ children, className = '' }) => {
  return (
    <div className={`grid-bento ${className}`}>
      {children}
    </div>
  );
};

interface BentoItemProps {
  children: React.ReactNode;
  span?: 'auto' | '2x' | '2y' | '2x2';
  className?: string;
  onClick?: () => void;
}

/**
 * BentoItem Component (Phase 2)
 * Individual card in a BentoGrid with configurable span/size.
 * 
 * Props:
 * - span: Controls card size
 *   - 'auto': Default size (1x1)
 *   - '2x': Spans 2 columns (wider)
 *   - '2y': Spans 2 rows (taller)
 *   - '2x2': Feature card (spans 2x2)
 */
export const BentoItem: React.FC<BentoItemProps> = ({
  children,
  span = 'auto',
  className = '',
  onClick,
}) => {
  const spanClass = span === 'auto' ? '' : `grid-bento-item-${span}`;
  const itemClassName = `grid-bento-item grid-item-transition ${spanClass} ${className}`;

  if (onClick) {
    return (
      <button
        type="button"
        className={itemClassName}
        onClick={onClick}
      >
        {children}
      </button>
    );
  }

  return (
    <div
      className={itemClassName}
    >
      {children}
    </div>
  );
};

export default BentoGrid;
