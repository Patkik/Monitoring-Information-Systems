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

  const cardGridColsClassMap: Record<1 | 2 | 3 | 4 | 5 | 6, string> = {
    1: 'tw-grid-cols-1',
    2: 'tw-grid-cols-1 sm:tw-grid-cols-2',
    3: 'tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-3',
    4: 'tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-4',
    5: 'tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-3 xl:tw-grid-cols-5',
    6: 'tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-3 xl:tw-grid-cols-6',
  };

  return (
    <div className={`card-grid tw-grid tw-gap-6 ${cardGridColsClassMap[safeColumns as 1 | 2 | 3 | 4 | 5 | 6]} ${className}`.trim()}>
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
  sm: 'tw-gap-2',
  md: 'tw-gap-4',
  lg: 'tw-gap-6',
  xl: 'tw-gap-8',
};

const alignMap = {
  start: 'tw-items-start',
  center: 'tw-items-center',
  end: 'tw-items-end',
  stretch: 'tw-items-stretch',
};

const justifyMap = {
  start: 'tw-justify-start',
  center: 'tw-justify-center',
  end: 'tw-justify-end',
  between: 'tw-justify-between',
  around: 'tw-justify-around',
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
    <div className={`layout-flex-row-base ${gapMap[gap]} ${alignMap[align]} ${justifyMap[justify]} ${className}`.trim()}>
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
    <div className={`layout-flex-col-base ${gapMap[gap]} ${alignMap[align]} ${justifyMap[justify]} ${className}`.trim()}>
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
  sm: 'tw-max-w-screen-sm',
  md: 'tw-max-w-screen-md',
  lg: 'tw-max-w-screen-lg',
  xl: 'tw-max-w-screen-xl',
  '2xl': 'tw-max-w-screen-2xl',
  full: 'tw-max-w-full',
};

const paddingMap = {
  sm: 'tw-p-4',
  md: 'tw-p-6',
  lg: 'tw-p-8',
  xl: 'tw-p-12',
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
    <div className={`layout-container-base tw-mx-auto tw-w-full ${maxWidthMap[maxWidth]} ${paddingMap[padding]} ${className}`.trim()}>
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
