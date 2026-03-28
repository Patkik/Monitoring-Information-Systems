# Spatial Design & Layout Reference Guide

## Spacing Systems

### Base Unit Approach
- Choose a base unit: 4px, 8px, or 16px
- Scale multiples: 1x, 2x, 3x, 4x, 6x, 8x, 12x
- Example (8px base):
  - 8px (1x): Small gaps, padding in buttons
  - 16px (2x): Padding in cards, small margins
  - 24px (3x): Vertical spacing between sections
  - 32px (4x): Major section spacing
  - 64px (8x): Page-level spacing

### Token Naming
```css
--space-xs: 4px;    /* Micro spacing */
--space-sm: 8px;    /* Small spacing */
--space-md: 16px;   /* Medium (default) */
--space-lg: 24px;   /* Large spacing */
--space-xl: 32px;   /* Extra large */
--space-2xl: 48px;  /* 2x Extra large */
--space-3xl: 64px;  /* 3x Extra large */
```

## Layout Grids

### CSS Grid System
- **12-column grid**: Most versatile (2, 3, 4, 6 divisions)
- **Column gap**: 16px (small) to 24px (large)
- **Container padding**: Matches gutter size

### Responsive Breakpoints
```
Mobile:     0px - 640px
Tablet:     640px - 1024px
Desktop:    1024px+
Wide:       1440px+
```

### Grid Examples
```css
/* 12-column grid */
display: grid;
grid-template-columns: repeat(12, 1fr);
gap: 16px;
padding: 16px;

/* Responsive: 1 col mobile, 2 tablet, 3 desktop */
grid-template-columns: 1fr;

@media (min-width: 640px) {
  grid-template-columns: repeat(2, 1fr);
}

@media (min-width: 1024px) {
  grid-template-columns: repeat(3, 1fr);
}
```

## Alignment & Distribution

### Vertical Alignment
- **Top-aligned**: Lists, dense tables
- **Center-aligned**: Isolated components, cards
- **Baseline-aligned**: Text with icons or images
- **Space-between**: Balanced separation

### Horizontal Distribution
- **Start**: Tight, progressive disclosure
- **Center**: Emphasis, featured content
- **End**: Secondary actions
- **Space-around**: Even distribution
- **Space-between**: Anchored edges, pairs

## Visual Hierarchy Through Space

### White Space (Negative Space)
- **Micro spacing**: 2-4px (relationships)
- **Small spacing**: 8-16px (related content)
- **Medium spacing**: 24-32px (distinct sections)
- **Large spacing**: 48-64px+ (major divisions)

### Gestalt Principles
- **Proximity**: Related elements close together
- **Alignment**: Creates visual structure
- **Repetition**: Consistent spacing builds rhythm
- **Contrast**: Varied spacing emphasizes importance

## Container & Component Spacing

### Padding (Internal)
- **Small components**: 8px - 12px
- **Medium components**: 16px - 20px
- **Large containers**: 24px - 32px
- **Page sections**: 32px - 64px

### Margin (External)
- Between components: 16px - 24px
- Between sections: 32px - 64px
- Between page sections: 64px - 128px

### Gap (Between Children)
- Flex/Grid gap: Same as padding or smaller
- Consistent within component
- Related to component size

## Common Layout Patterns

### Card Layout
```
┌─────────────────────┐
│   16px padding      │
│   ┌───────────────┐ │
│   │  Image        │ │
│   └───────────────┘ │
│   16px gap          │
│   ┌───────────────┐ │
│   │ Title         │ │
│   └───────────────┘ │
│   8px gap           │
│   ┌───────────────┐ │
│   │ Description   │ │
│   └───────────────┘ │
│   16px padding      │
└─────────────────────┘
```

### Section Layout
```
64px vertical space
[Section Header]
24px vertical gap
[Grid of Cards/Content]
64px vertical space
[Next Section]
```

### Sidebar Layout
- Main content: 2/3 width
- Sidebar: 1/3 width
- Gutter: 24px - 32px
- Responsive: Stack on mobile/tablet

## Common Mistakes

❌ **Inconsistent spacing** (16px, 20px, 22px)
✓ Use a spacing scale with clear steps

❌ **Too much visual density** (no breathing room)
✓ Increase margin/padding between elements

❌ **Cramped containers** (no internal padding)
✓ Add breathing room inside cards/containers

❌ **Alignment chaos** (random positions)
✓ Use consistent grid or flex alignment

❌ **Ignored whitespace** (every pixel filled)
✓ Whitespace creates focus and hierarchy

❌ **Unequal gaps** (visually unbalanced)
✓ Use consistent spacing scale

## Tools & Techniques

### CSS Layout Methods
- **Flexbox**: 1D layouts, alignment, distribution
- **Grid**: 2D layouts, complex compositions
- **Absolute/Fixed**: Overlays, toasts, popovers
- **Float**: Legacy, avoid for new layouts

### Debugging
- Add background colors to containers
- Use DevTools grid overlay
- Check responsive breakpoints
- Verify padding vs. margin usage

### Performance
- Use CSS Grid/Flexbox, not tables
- Minimize reflow with layout containment
- Use `contain: layout` for isolated components
- Test on actual devices

## Design Tools Integration

### Figma Spacing
- Set up 8px baseline grid
- Create spacing variables
- Document in design system
- Export token styles

### Implementation
- Use CSS custom properties
- Maintain 1:1 with design tokens
- Version with design changes
- Test on real content
