import React from 'react';

/**
 * Layout Components (Phase 2)
 * Pre-built golden ratio layout wrappers for common UI patterns.
 * All use the 1.618 fibonacci proportions defined in theme.css
 */

/* ===================================
   SIDEBAR + MAIN LAYOUT
   =================================== */

interface SidebarMainLayoutProps {
  sidebar: React.ReactNode;
  main: React.ReactNode;
  reverse?: boolean;
  sidebarSticky?: boolean;
  className?: string;
}

/**
 * SidebarMainLayout
 * Two-column layout with sidebar (1fr) and main content (1.618fr)
 * 
 * Props:
 * - sidebar: Left/right sidebar content
 * - main: Main content area
 * - reverse: If true, swaps sidebar and main positions
 * - sidebarSticky: If true, sidebar sticks on scroll (mobile aware)
 */
export const SidebarMainLayout: React.FC<SidebarMainLayoutProps> = ({
  sidebar,
  main,
  reverse = false,
  sidebarSticky = true,
  className = '',
}) => {
  const gridClass = reverse
    ? 'grid-golden-sidebar-main-reverse'
    : 'grid-golden-sidebar-main';

  return (
    <div className={`${gridClass} ${className}`}>
      <aside className={sidebarSticky ? 'dashboard-sidebar' : ''}>
        {sidebar}
      </aside>
      <section className="dashboard-main">{main}</section>
    </div>
  );
};

/* ===================================
   THREE-COLUMN LAYOUT
   =================================== */

interface ThreeColumnLayoutProps {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
  centerFocus?: boolean;
  className?: string;
}

/**
 * ThreeColumnLayout
 * Three-column layout with optional center focus (wider center)
 * 
 * Props:
 * - left, center, right: Column content
 * - centerFocus: If true, center column is wider (1.236 * 1.618)
 */
export const ThreeColumnLayout: React.FC<ThreeColumnLayoutProps> = ({
  left,
  center,
  right,
  centerFocus = false,
  className = '',
}) => {
  const gridClass = centerFocus
    ? 'grid-golden-3col-center'
    : 'grid-golden-3col';

  return (
    <div className={`${gridClass} ${className}`}>
      <aside>{left}</aside>
      <section>{center}</section>
      <aside>{right}</aside>
    </div>
  );
};

/* ===================================
   DASHBOARD LAYOUT (Semantic Wrapper)
   =================================== */

interface DashboardLayoutProps {
  sidebar: React.ReactNode;
  main: React.ReactNode;
  className?: string;
}

/**
 * DashboardLayout
 * Full-page dashboard layout with sticky sidebar navigation.
 * Optimal for admin panels, dashboards, and app layouts.
 */
export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  sidebar,
  main,
  className = '',
}) => {
  return (
    <div className={`dashboard-layout ${className}`}>
      <aside className="dashboard-sidebar">{sidebar}</aside>
      <main className="dashboard-main">{main}</main>
    </div>
  );
};

/* ===================================
   CARD GRID (Flex-based)
   =================================== */

interface CardGridProps {
  children: React.ReactNode;
  columns?: number;
  className?: string;
}

/**
 * CardGrid
 * Responsive grid for uniform-sized cards.
 * Uses minmax(18rem, 1fr) for automatic columns on viewport width.
 */
export const CardGrid: React.FC<CardGridProps> = ({
  children,
  columns = 3,
  className = '',
}) => {
  const safeColumns = Number.isFinite(columns)
    ? Math.min(Math.max(Math.floor(columns), 1), 6)
    : 3;

  return (
    <div
      className={`card-grid ${className}`.trim()}
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(calc((100% - ((var(--spacing-6)) * ${safeColumns - 1})) / ${safeColumns}), 1fr))`,
      }}
    >
      {children}
    </div>
  );
};

/* ===================================
   FLEX LAYOUTS (Directional)
   =================================== */

interface FlexRowProps {
  children: React.ReactNode;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  className?: string;
}

const gapMap = {
  sm: 'var(--spacing-2)',
  md: 'var(--spacing-4)',
  lg: 'var(--spacing-6)',
  xl: 'var(--spacing-8)',
};

const justifyMap = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
};

/**
 * FlexRow
 * Horizontal flex container with semantic prop names
 */
export const FlexRow: React.FC<FlexRowProps> = ({
  children,
  gap = 'lg',
  align = 'center',
  justify = 'start',
  className = '',
}) => {
  return (
    <div
      className={`layout-flex-row-base ${className}`.trim()}
      style={{
        gap: gapMap[gap],
        alignItems: align,
        justifyContent: justifyMap[justify],
      }}
    >
      {children}
    </div>
  );
};

interface FlexColProps {
  children: React.ReactNode;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  className?: string;
}

/**
 * FlexCol
 * Vertical flex container with semantic prop names
 */
export const FlexCol: React.FC<FlexColProps> = ({
  children,
  gap = 'lg',
  align = 'stretch',
  justify = 'start',
  className = '',
}) => {
  return (
    <div
      className={`layout-flex-col-base ${className}`.trim()}
      style={{
        gap: gapMap[gap],
        alignItems: align,
        justifyContent: justifyMap[justify],
      }}
    >
      {children}
    </div>
  );
};

/* ===================================
   CONTAINER (Semantic Wrapper)
   =================================== */

interface ContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const maxWidthMap = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  full: '100%',
};

const paddingMap = {
  sm: 'var(--spacing-4)',
  md: 'var(--spacing-6)',
  lg: 'var(--spacing-8)',
  xl: 'var(--spacing-12)',
};

/**
 * Container
 * Centered max-width container with responsive padding
 */
export const Container: React.FC<ContainerProps> = ({
  children,
  maxWidth = 'lg',
  padding = 'lg',
  className = '',
}) => {
  return (
    <div
      className={`layout-container-base ${className}`.trim()}
      style={{
        maxWidth: maxWidthMap[maxWidth],
        padding: paddingMap[padding],
      }}
    >
      {children}
    </div>
  );
};

export default {
  SidebarMainLayout,
  ThreeColumnLayout,
  DashboardLayout,
  CardGrid,
  FlexRow,
  FlexCol,
  Container,
};
