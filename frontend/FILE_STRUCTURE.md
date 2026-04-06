# Design System File Structure Reference

## Phase 1-3 Deliverables

This document maps all new files created during Phases 1-3 of the MERN refactor.

### Directory Structure

```
frontend/
├── src/
│   ├── styles/
│   │   ├── theme.css                 ✓ Phase 1: Complete design system variables
│   │   └── golden-grid.css           ✓ Phase 2: Golden ratio grid system
│   ├── shared/
│   │   ├── context/
│   │   │   └── ThemeContext.tsx       ✓ Phase 3: Dark mode context provider
│   │   └── components/
│   │       ├── ThemeToggle.tsx        ✓ Phase 1: Dark mode toggle button
│   │       ├── BentoGrid.tsx          ✓ Phase 2: Bento grid components
│   │       ├── Layouts.tsx            ✓ Phase 2: Layout components
│   │       └── index.ts               ✓ Phase 2: Component exports
│   ├── styles.css                    ✓ Updated: Added imports
│   └── main.tsx                       ✓ Updated: Added ThemeProvider wrapper
├── DESIGN_SYSTEM_GUIDE.md             ✓ Phase 3: Complete developer guide
└── FILE_STRUCTURE.md                  ✓ This file
```

---

## File Details & Purpose

### Core Design System Files

#### `frontend/src/styles/theme.css` (400+ lines)
**Purpose:** Complete CSS variable system for the entire design system
**Status:** ✓ Complete & Production-Ready
**Contains:**
- Light mode `:root` color variables
- Dark mode `[data-theme='dark']` color variables
- Typography scales (1.618 golden ratio)
- Spacing system (4px baseline)
- Border radius system
- Shadow/elevation system
- Z-index scale
- Layout ratio variables (1fr, 1.618fr)
- Responsive breakpoints
- CSS transitions and animations

**Key Colors:**
- Primary: `--color-primary-50` through `--color-primary-900` (HSL 265, 85%)
- Neutral: `--color-neutral-0` through `--color-neutral-900`
- Semantic: `--color-success`, `--color-warning`, `--color-error`, `--color-info`

**Layout Variables:**
- `--sidebar-fraction: 1fr`
- `--main-content-fraction: 1.618fr`

**Usage in Components:**
```tsx
style={{ 
  backgroundColor: 'var(--color-primary-500)',
  padding: 'var(--spacing-6)',
  borderRadius: 'var(--radius-lg)'
}}
```

---

#### `frontend/src/styles/golden-grid.css` (250+ lines)
**Purpose:** CSS Grid and Flex layout classes implementing 1.618 golden ratio
**Status:** ✓ Complete & Production-Ready
**Contains:**
- Two-column golden layouts: `.grid-golden-sidebar-main`
- Three-column golden layouts: `.grid-golden-3col`
- Bento grid (dense 2D): `.grid-bento`
- Bento item spans: `.grid-bento-item-2x`, `.grid-bento-item-2y`, `.grid-bento-item-2x2`
- Flex golden layouts: `.flex-golden-row`, `.flex-golden-col`
- Semantic wrappers: `.dashboard-layout`, `.dashboard-sidebar`, `.card-grid`
- Responsive media queries (mobile/tablet/desktop)
- Utility alignment classes
- Transitions and animations

**Key Classes:**
```css
.grid-golden-sidebar-main       /* Sidebar (1fr) + Main (1.618fr) */
.grid-bento                     /* Dense 2D grid for cards */
.grid-bento-item                /* Individual bento card */
.grid-bento-item-2x             /* Spans 2 columns */
.grid-bento-item-2y             /* Spans 2 rows */
.grid-bento-item-2x2            /* Feature card (2×2) */
.dashboard-layout               /* Full-page layout */
.card-grid                      /* Responsive card grid */
```

---

#### `frontend/src/shared/context/ThemeContext.tsx` (160+ lines)
**Purpose:** React Context for global dark mode management
**Status:** ✓ Complete & Production-Ready
**Exports:**
- `ThemeProvider`: Wrapper component (use in main.tsx - already done ✓)
- `useTheme()`: Hook to access theme state and toggle function

**Functionality:**
- Initializes theme: localStorage → OS preference → 'light'
- Prevents theme flash on page load
- Syncs preference to backend: `PATCH /api/users/preferences`
- Listens to OS theme changes (media query)
- Persists to localStorage
- TypeScript interfaces: `Theme`, `ThemeContextType`

**Usage in Components:**
```tsx
const { theme, toggleTheme } = useTheme();
```

---

### React Components (For UI Building)

#### `frontend/src/shared/components/ThemeToggle.tsx` (50+ lines)
**Purpose:** Reusable button component to toggle light/dark theme
**Status:** ✓ Complete & Production-Ready
**Exports:** `ThemeToggle` component
**Features:**
- Sun icon (light mode)
- Moon icon (dark mode)
- Smooth rotation animation between icons
- Uses lucide-react for icons
- Styled with CSS variables
- Accessible (ARIA labels)

**Usage:**
```tsx
import { ThemeToggle } from '@/shared/components';

<ThemeToggle />
```

---

#### `frontend/src/shared/components/BentoGrid.tsx` (70+ lines)
**Purpose:** React components for bento grid card layout
**Status:** ✓ Complete & Production-Ready
**Exports:**
- `BentoGrid`: Container component
- `BentoItem`: Individual card with span control

**Props:**
```tsx
<BentoItem span="auto" | "2x" | "2y" | "2x2" onClick={handler} />
```

**Usage:**
```tsx
<BentoGrid>
  <BentoItem span="auto">Card 1</BentoItem>
  <BentoItem span="2x">Wide Card</BentoItem>
  <BentoItem span="2x2">Feature Card</BentoItem>
</BentoGrid>
```

**Benefits:**
- Automatic dense packing with `grid-auto-flow: dense`
- Responsive (cards collapse on mobile)
- Accessible (keyboard navigation)
- Smooth animations

---

#### `frontend/src/shared/components/Layouts.tsx` (250+ lines)
**Purpose:** Pre-built layout component library using golden ratio
**Status:** ✓ Complete & Production-Ready
**Exports:**
- `SidebarMainLayout`: Two-column with sidebar (1fr) + main (1.618fr)
- `ThreeColumnLayout`: Three-column with optional center focus
- `DashboardLayout`: Full-page layout with sticky sidebar
- `CardGrid`: Responsive grid for uniform cards
- `FlexRow`: Horizontal flex container with semantic props
- `FlexCol`: Vertical flex container with semantic props
- `Container`: Centered max-width container

**Features:**
- Golden ratio proportions built-in
- Responsive (mobile-first)
- Semantic prop names: `gap`, `align`, `justify`
- Full TypeScript support
- No CSS needed - uses layout CSS variables

**Usage Examples:**

```tsx
// Two-column layout
<SidebarMainLayout 
  sidebar={<Nav />} 
  main={<Content />} 
  sidebarSticky={true}
/>

// Flex layout
<FlexCol gap="lg" align="stretch">
  <Input />
  <Button>Submit</Button>
</FlexCol>

// Card grid
<CardGrid columns={3}>
  {items.map(item => <Card key={item.id}>{item.name}</Card>)}
</CardGrid>

// Bento grid
<BentoGrid>
  <BentoItem span="2x">Featured content</BentoItem>
  <BentoItem span="auto">Card 1</BentoItem>
</BentoGrid>
```

---

#### `frontend/src/shared/components/index.ts` (30+ lines)
**Purpose:** Barrel export file for easy importing
**Status:** ✓ Complete & Production-Ready
**Exports:** All theme, grid, and layout components

**Usage:**
```tsx
import { 
  ThemeToggle, 
  BentoGrid, 
  BentoItem,
  SidebarMainLayout,
  FlexRow,
  FlexCol 
} from '@/shared/components';
```

---

### Configuration Files (Updated)

#### `frontend/src/styles.css` (Updated)
**Changes Made:**
- Added: `@import './styles/theme.css';`
- Added: `@import './styles/golden-grid.css';`

**Purpose:** Main stylesheet entry point
**Status:** ✓ Updated & Working
**Contains:**
- Design system imports (theme + grid)
- Tailwind directives (@tailwind base/components/utilities)

---

#### `frontend/src/main.tsx` (Updated)
**Changes Made:**
- Added: `import { ThemeProvider } from './shared/context/ThemeContext';`
- Wrapped App with: `<ThemeProvider>...</ThemeProvider>`

**Purpose:** Application root entry point
**Status:** ✓ Updated & Working
**Provider Stack (after update):**
```tsx
<QueryClientProvider>
  <ThemeProvider>           ← NEW
    <ToastProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ToastProvider>
  </ThemeProvider>          ← NEW
  <ReactQueryDevtools />
</QueryClientProvider>
```

---

### Documentation

#### `frontend/DESIGN_SYSTEM_GUIDE.md` (500+ lines)
**Purpose:** Complete developer guide for using the design system
**Status:** ✓ Complete & Production-Ready
**Sections:**
1. Quick start (theme, toggle, hook usage)
2. Design system colors (primary, neutral, semantic)
3. Typography system (golden ratio scales)
4. Layout system (2-col, 3-col, bento, flex)
5. Dark mode support and CSS variables
6. Spacing and border radius
7. Shadow/elevation system
8. Responsive behavior
9. Component migration guide
10. Best practices
11. Testing instructions
12. Component checklist for Phase 4-5

**Usage:** Share with team for onboarding and reference

---

#### `frontend/FILE_STRUCTURE.md` (This File)
**Purpose:** Map all new files and their purposes
**Status:** ✓ Reference Document

---

## Import Paths Quick Reference

### To Use Theme Context
```tsx
import { useTheme } from '@/shared/context/ThemeContext';
```

### To Use Components
```tsx
import { 
  ThemeToggle,
  BentoGrid,
  BentoItem,
  SidebarMainLayout,
  ThreeColumnLayout,
  DashboardLayout,
  CardGrid,
  FlexRow,
  FlexCol,
  Container
} from '@/shared/components';
```

### To Use CSS Classes in HTML/JSX
```tsx
// Direct class names
<div className="grid-golden-sidebar-main">
  <aside>Sidebar</aside>
  <main>Main</main>
</div>

// Or with style prop
<div style={{ display: 'grid', gridTemplateColumns: 'var(--sidebar-fraction) var(--main-content-fraction)' }}>
```

### To Use CSS Variables in Styles
```tsx
<div style={{
  backgroundColor: 'var(--color-primary-500)',
  padding: 'var(--spacing-6)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-md)',
  fontSize: 'var(--font-h3)'
}}>
```

---

## Statistics

### Code Added
- **CSS Variables:** 400+ lines (theme.css)
- **CSS Grid/Flex:** 250+ lines (golden-grid.css)
- **React Components:** 350+ lines (UI components)
- **Documentation:** 500+ lines (guides)
- **Total:** 1500+ lines of production code

### Components Created
- ✓ 1 Context Provider
- ✓ 1 Theme Toggle Component
- ✓ 2 Grid Components (BentoGrid, BentoItem)
- ✓ 7 Layout Components
- ✓ 1 Component Index/Barrel

### CSS Variables
- ✓ 45+ Color variables (primary, neutral, semantic)
- ✓ 15+ Typography variables
- ✓ 10+ Spacing variables
- ✓ 7+ Border radius variables
- ✓ 6+ Shadow variables
- ✓ 2+ Layout ratio variables
- ✓ Total: 85+ CSS variables

### Responsive Breakpoints
- ✓ Mobile (< 768px)
- ✓ Tablet (768px - 1024px)
- ✓ Desktop (> 1024px)

---

## Phase Status

| Phase | Task | Status | Notes |
|-------|------|--------|-------|
| 1 | CSS Variables (Colors, Typography, Spacing) | ✅ Complete | theme.css 400+ lines |
| 1 | Theme Context (Dark Mode) | ✅ Complete | ThemeContext.tsx ready |
| 2 | Golden Ratio Grids | ✅ Complete | golden-grid.css 250+ lines |
| 2 | Bento Grid Components | ✅ Complete | BentoGrid.tsx & Layouts.tsx |
| 3 | Dark Mode Provider Integration | ✅ Complete | Wrapped in main.tsx |
| 3 | Theme Toggle Button | ✅ Complete | ThemeToggle.tsx |
| 4 | Component Refactoring | ⏳ Pending | Button, Input, Card, etc. |
| 5 | Framer Motion Animations | ⏳ Pending | Requires npm install |
| 6 | Socket.io Real-Time | ⏳ Pending | Backend integration needed |
| 7 | Landing Page Scroll | ⏳ Pending | Requires Lenis library |
| 8 | Performance Optimization | ⏳ Pending | Code splitting, lazy loading |

---

## Next Actions

### For Developers Using This System

1. **Review DESIGN_SYSTEM_GUIDE.md** - Full onboarding
2. **Run the app** - Toggle theme, verify dark mode works
3. **Create a test page** - Use SidebarMainLayout + BentoGrid
4. **Migrate a component** - Replace hardcoded colors with CSS variables
5. **Submit feedback** - Report any issues or suggestions

### For Continuing Implementation

1. **Phase 4:** Refactor Button, Input, Card components
2. **Phase 5:** Install framer-motion and create animation hooks
3. **Phase 6:** Upgrade backend to Socket.io
4. **Phase 7:** Create landing page with scroll animations
5. **Phase 8:** Performance audits and optimizations

---

## Support

For questions or issues:
1. Check DESIGN_SYSTEM_GUIDE.md first
2. Review theme.css for available variables
3. Check golden-grid.css for layout options
4. Reference component examples in Layouts.tsx

---

**Last Updated:** Phase 1-3 Complete ✓
**Created By:** MERN Refactor Orchestrator
**Status:** Ready for Production & Phase 4
