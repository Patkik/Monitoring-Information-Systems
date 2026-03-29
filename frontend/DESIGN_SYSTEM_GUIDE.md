# MERN Refactor Design System - Phase 1-2 Implementation Guide

## Overview

This guide covers the completed Phases 1-3 of the MERN modernization refactor and provides instructions for developers to integrate the design system into existing and new components.

**Completed Phases:**
- ✅ Phase 1: Design System CSS Variables (Light & Dark Mode)
- ✅ Phase 2: Golden Ratio Grid System (Bento Grid, Layouts)
- ✅ Phase 3: Dark Mode Context Provider

**Upcoming Phases:**
- Phase 4: Component Refactoring (Button, Card, Input)
- Phase 5: Framer Motion Animations
- Phase 6: Socket.io Real-Time Upgrade
- Phase 7: Landing Page Scroll Animations
- Phase 8: Performance Optimization

---

## Quick Start: Using the Design System

### 1. Theme Provider (Already Integrated ✓)

The `ThemeProvider` is already wrapped around your entire app in `main.tsx`. It automatically:
- Initializes theme from localStorage
- Falls back to OS dark mode preference
- Syncs preference to backend (`PATCH /api/users/preferences`)
- Prevents theme flash on page load

### 2. Theme Toggle Button

Add the theme toggle to your Header:

```tsx
import { ThemeToggle } from '@/shared/components';

export const Header = () => {
  return (
    <header className="flex justify-between items-center">
      <h1>My App</h1>
      <ThemeToggle />
    </header>
  );
};
```

### 3. Using Theme Hook in Components

```tsx
import { useTheme } from '@/shared/context/ThemeContext';

export const MyComponent = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={toggleTheme}>Toggle</button>
    </div>
  );
};
```

---

## Design System Colors

All colors are applied via CSS variables. Never hardcode colors in components.

### Primary Color Scale (Purple)

```css
:root {
  --color-primary-50: hsl(265, 85%, 96%);   /* Lightest */
  --color-primary-100: hsl(265, 85%, 88%);
  --color-primary-200: hsl(265, 85%, 80%);
  --color-primary-300: hsl(265, 85%, 72%);
  --color-primary-400: hsl(265, 85%, 58%);
  --color-primary-500: hsl(265, 85%, 45%);  /* BRAND COLOR */
  --color-primary-600: hsl(265, 85%, 38%);
  --color-primary-700: hsl(265, 85%, 30%);
  --color-primary-800: hsl(265, 85%, 22%);
  --color-primary-900: hsl(265, 85%, 14%);  /* Darkest */
}
```

### Neutral Colors (Grays)

```css
--color-neutral-0: #ffffff;        /* White */
--color-neutral-50: hsl(265, 18%, 94%);
--color-neutral-100: hsl(265, 18%, 88%);
/* ... continues through 100-900 ... */
--color-neutral-900: #0f0f0f;      /* Near black */
```

### Semantic Color Aliases

Use these instead of raw colors:

```css
--color-success: hsl(142, 72%, 29%);  /* Green */
--color-warning: hsl(38, 92%, 50%);   /* Orange */
--color-error: hsl(0, 84%, 60%);      /* Red */
--color-info: hsl(217, 91%, 60%);     /* Blue */

/* Surfaces & Text */
--surface-background: var(--color-neutral-0);
--surface-raised: var(--color-neutral-50);
--surface-hover: var(--color-neutral-100);
--text-primary: var(--color-neutral-900);
--text-secondary: var(--color-neutral-600);
--text-tertiary: var(--color-neutral-500);
--border-default: var(--color-neutral-200);
```

### Styling Components with CSS Variables

**Example 1: Button with Primary Color**

```tsx
export const Button = () => {
  return (
    <button
      style={{
        backgroundColor: 'var(--color-primary-500)',
        color: 'var(--color-neutral-0)',
        padding: 'var(--spacing-3) var(--spacing-6)',
        borderRadius: 'var(--radius-md)',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      Click Me
    </button>
  );
};
```

**Example 2: Card with Semantic Colors**

```tsx
export const Card = () => {
  return (
    <div
      style={{
        backgroundColor: 'var(--surface-background)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-6)',
        color: 'var(--text-primary)',
      }}
    >
      Card content
    </div>
  );
};
```

---

## Typography System

Golden ratio typography scales (1.618× multiplier):

```css
--font-base: 16px;
--font-sm: 14px;        /* 16 / 1.143 */
--font-lg: 18px;        /* 16 * 1.125 */
--font-h6: 21px;        /* base * 1.309 */
--font-h5: 25px;        /* base * 1.563 */
--font-h4: 32px;        /* base * 2 */
--font-h3: 26px;        /* 42 / 1.618 - adjusted */
--font-h2: 42px;        /* base * 2.618 */
--font-h1: 68px;        /* base * 4.236 */
--font-display: 110px;  /* base * 6.854 */
```

### Using Typography in Components

With Tailwind CSS, use `text-` classes:

```tsx
// Or use inline styles with CSS variables
<h1 style={{ fontSize: 'var(--font-h1)' }}>Heading</h1>
<p style={{ fontSize: 'var(--font-base)' }}>Body text</p>
```

---

## Layout System (Golden Ratio)

The 1.618 golden ratio is applied to layout proportions:

### Two-Column: Sidebar + Main

```tsx
import { SidebarMainLayout } from '@/shared/components';

export const Dashboard = () => {
  return (
    <SidebarMainLayout
      sidebar={<Sidebar />}
      main={<MainContent />}
      sidebarSticky={true}
    />
  );
};
```

**CSS Classes:**
- `grid-golden-sidebar-main` - Sidebar on left, main on right
- `grid-golden-sidebar-main-reverse` - Main on left, sidebar on right

**Proportions:**
- Sidebar: `1fr` (baseline width)
- Main Content: `1.618fr` (1.618× wider)

### Three-Column Layout

```tsx
import { ThreeColumnLayout } from '@/shared/components';

export const Dashboard = () => {
  return (
    <ThreeColumnLayout
      left={<LeftSidebar />}
      center={<MainContent />}
      right={<RightPanel />}
      centerFocus={false}
    />
  );
};
```

**Proportions:**
- Standard: Each column is `1fr`, `1.618fr`, `1fr`
- Center Focus: `1fr`, `1.236 * 1.618fr`, `1fr` (center is emphasized)

### Bento Grid (Dense 2D Layout)

```tsx
import { BentoGrid, BentoItem } from '@/shared/components';

export const Dashboard = () => {
  return (
    <BentoGrid>
      <BentoItem span="auto">Regular Card</BentoItem>
      <BentoItem span="2x">Wide Card (2 columns)</BentoItem>
      <BentoItem span="2y">Tall Card (2 rows)</BentoItem>
      <BentoItem span="2x2">Feature Card (2x2)</BentoItem>
    </BentoGrid>
  );
};
```

**Available Spans:**
- `auto` - Default 1×1 size
- `2x` - Spans 2 columns (wider)
- `2y` - Spans 2 rows (taller)
- `2x2` - Feature card (2 columns × 2 rows)

### Card Grid (Uniform Cards)

```tsx
import { CardGrid } from '@/shared/components';

export const CardList = () => {
  return (
    <CardGrid columns={3}>
      {items.map(item => (
        <Card key={item.id}>{item.name}</Card>
      ))}
    </CardGrid>
  );
};
```

### Flex Layouts

```tsx
import { FlexRow, FlexCol } from '@/shared/components';

export const Form = () => {
  return (
    <FlexCol gap="lg" align="stretch">
      <input placeholder="Name" />
      <input placeholder="Email" />
      <FlexRow gap="md" justify="between">
        <button>Cancel</button>
        <button>Submit</button>
      </FlexRow>
    </FlexCol>
  );
};
```

**Props:**
- `gap`: `'sm'`, `'md'`, `'lg'`, `'xl'`
- `align`: `'start'`, `'center'`, `'end'`, `'stretch'`
- `justify`: `'start'`, `'center'`, `'end'`, `'between'`, `'around'`

---

## Dark Mode Support

Components automatically support dark mode via CSS variables. No conditional logic needed!

### Light Mode (Default)

```css
:root {
  --surface-background: #ffffff;
  --text-primary: #0f0f0f;
  --color-neutral-200: hsl(265, 18%, 90%);
}
```

### Dark Mode

```css
[data-theme='dark'] {
  --surface-background: #121215;
  --text-primary: #ffffff;
  --color-neutral-200: hsl(265, 18%, 30%);
}
```

**Component Example:**

```tsx
// This component automatically works in both themes!
export const Card = () => {
  return (
    <div
      style={{
        backgroundColor: 'var(--surface-background)',
        color: 'var(--text-primary)',
        border: `1px solid var(--border-default)`,
      }}
    >
      This card adapts to light/dark automatically
    </div>
  );
};
```

---

## Spacing System

Consistent spacing based on 4px baseline:

```css
--spacing-0: 0;
--spacing-1: 4px;
--spacing-2: 8px;
--spacing-3: 12px;
--spacing-4: 16px;
--spacing-6: 24px;
--spacing-8: 32px;
--spacing-12: 48px;
--spacing-16: 64px;
--spacing-24: 96px;
--spacing-32: 128px;
```

**Usage:**

```tsx
<div style={{ padding: 'var(--spacing-6)', gap: 'var(--spacing-4)' }}>
  Content
</div>
```

---

## Border Radius System

Semantic radius sizes for consistent curves:

```css
--radius-none: 0;
--radius-xs: 2px;
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-2xl: 24px;
--radius-full: 9999px;  /* Pill/circle shapes */
```

---

## Shadow System (Elevation)

Elevation system with semantic names:

```css
--shadow-xs: 0 1px 2px ...;
--shadow-sm: 0 2px 4px ...;
--shadow-md: 0 4px 8px ...;
--shadow-lg: 0 8px 16px ...;
--shadow-xl: 0 12px 24px ...;
--shadow-2xl: 0 16px 32px ...;
```

**Usage:**

```tsx
<div style={{ boxShadow: 'var(--shadow-md)' }}>
  Elevated card
</div>
```

---

## Responsive Behavior

All layout components are responsive by default:

### Mobile (< 768px)
- Grid layouts stack to single column
- Bento items collapse to 1×1 size
- Padding reduced
- Typography scaled down

### Tablet (768px - 1024px)
- Grid layouts show 2 columns
- Sidebar width adjusted

### Desktop (> 1024px)
- Full layout with all golden ratio proportions
- All bento spans active

**CSS Media Queries (automatic in theme.css):**

```css
@media (max-width: 767px) {
  /* Mobile adjustments */
}

@media (min-width: 768px) {
  /* Tablet+ adjustments */
}
```

---

## Migration Guide: Converting Existing Components

### Step 1: Replace Hardcoded Colors

**Before:**
```tsx
<div style={{ backgroundColor: '#8856e0', color: '#ffffff' }}>
```

**After:**
```tsx
<div style={{ 
  backgroundColor: 'var(--color-primary-500)', 
  color: 'var(--color-neutral-0)' 
}}>
```

### Step 2: Use Layout Components

**Before:**
```tsx
<div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr' }}>
  <Sidebar />
  <Main />
</div>
```

**After:**
```tsx
<SidebarMainLayout sidebar={<Sidebar />} main={<Main />} />
```

### Step 3: Apply Spacing Variables

**Before:**
```tsx
<div style={{ padding: '24px', gap: '16px' }}>
```

**After:**
```tsx
<div style={{ padding: 'var(--spacing-6)', gap: 'var(--spacing-4)' }}>
```

### Step 4: Use Semantic Colors

**Before:**
```tsx
<button style={{ backgroundColor: '#22c55e' }}>  {/* Green */}
```

**After:**
```tsx
<button style={{ backgroundColor: 'var(--color-success)' }}>
```

---

## Best Practices

1. **Always use CSS variables** - Never hardcode colors, sizes, or spacing
2. **Use layout components** - Don't write custom grids for common layouts
3. **Leverage golden ratio** - Proportions are pre-calculated and tested
4. **Dark mode is free** - Write once, works in both modes
5. **Responsive first** - All components work on mobile by default
6. **Semantic naming** - Use `--surface-background` not `--bg-color-1`
7. **Type safe** - Use TypeScript interfaces for all component props

---

## Testing Design System

### Verify Color System

```bash
# Check that all CSS variables load
Open DevTools → Elements → Select any element → Computed
Look for --color-primary-500 and other variables
```

### Test Dark Mode Toggle

1. Open app in browser
2. Find ThemeToggle button (sun/moon icon)
3. Click to toggle
4. Verify colors change
5. Refresh page - theme persists
6. Close DevTools and toggle OS dark mode - app respects it

### Responsive Testing

1. Open DevTools → Device Toggle (Ctrl+Shift+M)
2. Test on device sizes:
   - iPhone SE (375px)
   - iPad (768px)
   - Desktop (1440px)
3. Verify layouts stack and adjust correctly

---

## Component Checklist for Phase 4-5 Refactoring

When refactoring components in Phase 4, ensure:

- ✅ Uses CSS variables for all colors
- ✅ Responsive (mobile first)
- ✅ Dark mode compatible
- ✅ Uses layout components or golden-grid classes
- ✅ Proper TypeScript types
- ✅ Semantic spacing and sizing
- ✅ Accessible (alt text, ARIA labels, keyboard nav)
- ✅ Tested in light and dark modes
- ✅ No inline CSS where possible (use classes)

---

## Next Steps

**Phase 4 (Week 4-5): Component Refactoring**
- Refactor Button, Input, Card, Badge, Alert components
- Apply animation hooks from Phase 5
- Update all form components

**Phase 5 (Week 5-6): Framer Motion Animations**
- Install: `npm install framer-motion`
- Create animation presets (fadeInUp, scaleIn, etc.)
- Apply to modals, buttons, cards

**Phase 6 (Week 6-7): Socket.io Real-Time**
- Upgrade from Pusher to Socket.io
- Implement live collaboration features
- Add presence indicators

**Phase 7 (Week 7-8): Landing Page**
- Scroll animations with Lenis
- Hero section with parallax
- Feature showcase with auto-scroll

**Phase 8 (Week 8): Performance**
- Code splitting and lazy loading
- Image optimization
- Bundle analysis and tree-shaking

---

## Support & Questions

For questions about the design system, please refer to:
- `frontend/src/styles/theme.css` - Color system
- `frontend/src/styles/golden-grid.css` - Layout grid
- `frontend/src/shared/context/ThemeContext.tsx` - Dark mode
- `frontend/src/shared/components/` - Component implementations

---

**Last Updated:** Phase 1-3 Complete ✓
**Status:** Ready for Phase 4 Component Refactoring
