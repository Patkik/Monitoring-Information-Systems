# Typography Reference Guide

## Type Scale

### Modular Scale Ratios
- **1.125 (Minor Second)**: Conservative, subtle progression
- **1.25 (Major Third)**: Balanced, versatile
- **1.333 (Perfect Fourth)**: Bold, dramatic
- **1.5 (Perfect Fifth)**: Very strong contrast
- **1.618 (Golden Ratio)**: Mathematical elegance

### Base Sizes
- **Body text**: 16px / 1rem (minimum for readability)
- **Caption**: 12px / 0.75rem
- **Secondary**: 14px / 0.875rem

### Scale Example (1.25 ratio)
```
Caption:     12px
Secondary:   14px
Body:        16px
Subheading:  20px
Heading:     25px
Display:     31px
```

## Font Pairing Strategies

### Serif + Sans-Serif (High Contrast)
- Serif for headings (elegant, traditional)
- Sans-serif for body (modern, readable)
- Example: Georgia + Inter, Garamond + Helvetica

### Single Family (Multiple Weights)
- Use 3-4 weights: Regular, Medium, Semibold, Bold
- Example: Inter, Roboto, Open Sans

### Geometric + Humanist (Both Sans)
- Geometric (Montserrat, Poppins) for headings
- Humanist (Calibre, Roboto) for body
- Creates distinct hierarchy without serif contrast

## Line Height Guidelines

| Context | Line Height | Example |
|---------|------------|---------|
| Headings | 1.1 - 1.2 | Tight, confident |
| Body | 1.5 - 1.7 | Comfortable reading |
| Captions | 1.4 - 1.5 | Slightly relaxed |
| Monospace | 1.6 - 1.8 | Code blocks |

## Letter Spacing

- **Default**: 0 (normal)
- **Display text**: 0.05em to 0.1em (opens it up)
- **All caps**: 0.15em to 0.3em (prevents cramping)
- **Small caps**: 0.1em (spacious)
- **Body**: -0.01em to 0em (slightly tighter)

## Web Font Loading

### font-display Property
- **auto**: Default, may cause FOIT
- **swap**: Shows fallback immediately, swaps when loaded (recommended)
- **fallback**: Brief FOIT, longer timeout
- **optional**: FOIT, may not swap if loaded too late

### Metric Matching
Use fallbacks with matching metrics to prevent layout shift:
```css
font-family: "Poppins", "Segoe UI", sans-serif;
```

## Accessibility

### Contrast Ratios (WCAG)
- **Normal text**: 4.5:1 (AA standard)
- **Large text** (18px+ or 14px+ bold): 3:1
- **Enhanced**: 7:1 (AAA standard)

### Sizing
- Minimum 16px for body text
- Support 200% zoom without horizontal scroll
- Use relative units (rem, em, %)

## Common Mistakes

❌ **Too many font families** (more than 3)
✓ Use 1-2 families with multiple weights

❌ **Arbitrary font sizes** (14px, 15px, 16px)
✓ Use modular scale with consistent ratios

❌ **Body text below 16px**
✓ Always 16px minimum

❌ **Poor contrast** (light gray on white)
✓ Maintain 4.5:1 minimum

❌ **Line lengths > 80 characters**
✓ Use `max-width: 65ch` for body text

❌ **Disabled zoom** (`user-scalable=no`)
✓ Always allow user zoom

❌ **Using pixels for font-size**
✓ Use `rem` for flexibility

## Tools & Resources

- **Google Fonts**: https://fonts.google.com
- **Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Type Scale Generator**: https://typescale.com
- **Font Pairing Guide**: https://fontpair.co
