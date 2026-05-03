---
name: Intellect Editorial
colors:
  surface: '#faf9fe'
  surface-dim: '#dad9de'
  surface-bright: '#faf9fe'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f8'
  surface-container: '#eeedf2'
  surface-container-high: '#e8e7ec'
  surface-container-highest: '#e3e2e7'
  on-surface: '#1a1c1f'
  on-surface-variant: '#43474f'
  inverse-surface: '#2f3034'
  inverse-on-surface: '#f1f0f5'
  outline: '#747780'
  outline-variant: '#c4c6d0'
  surface-tint: '#405f91'
  primary: '#001736'
  on-primary: '#ffffff'
  primary-container: '#002b5b'
  on-primary-container: '#7594ca'
  inverse-primary: '#a9c7ff'
  secondary: '#006b5f'
  on-secondary: '#ffffff'
  secondary-container: '#8df5e4'
  on-secondary-container: '#007165'
  tertiary: '#2f0c00'
  on-tertiary: '#ffffff'
  tertiary-container: '#4f1c02'
  on-tertiary-container: '#cd805d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#a9c7ff'
  on-primary-fixed: '#001b3d'
  on-primary-fixed-variant: '#264778'
  secondary-fixed: '#8df5e4'
  secondary-fixed-dim: '#70d8c8'
  on-secondary-fixed: '#00201c'
  on-secondary-fixed-variant: '#005048'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb596'
  on-tertiary-fixed: '#360f00'
  on-tertiary-fixed-variant: '#713619'
  background: '#faf9fe'
  on-background: '#1a1c1f'
  surface-variant: '#e3e2e7'
typography:
  h1:
    fontFamily: Noto Serif KR
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.4'
    letterSpacing: -0.02em
  h2:
    fontFamily: Noto Serif KR
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.4'
    letterSpacing: -0.01em
  h3:
    fontFamily: Noto Serif KR
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.5'
    letterSpacing: '0'
  body-lg:
    fontFamily: Pretendard
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.8'
    letterSpacing: -0.01em
  body-md:
    fontFamily: Pretendard
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  ui-label:
    fontFamily: Pretendard
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.02em
  data-num:
    fontFamily: Pretendard
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: '0'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  grid_columns: '12'
  grid_gutter: 24px
  grid_margin: auto
---

## Brand & Style

This design system establishes a high-authority bridge between traditional journalism and modern data science. The personality is intellectual, precise, and dependable—evoking the feeling of a premium financial terminal merged with a prestige news publication.

The visual style follows a **Corporate / Modern** aesthetic with a strong emphasis on editorial clarity. It utilizes high-density information layouts that remain legible through generous line-heights and intentional white space. The interface prioritizes content hierarchy, ensuring that complex marketing research feels accessible yet rigorous. The result is a "Digital News meets Data Intelligence" environment that commands professional trust.

## Colors

The palette is anchored by **Zinsight Blue**, a deep navy that signals institutional stability and authority. **Intel Emerald** serves as a functional secondary color, used for growth indicators, data highlights, and call-to-action accents to suggest "insight" and "vitality."

The neutral scale is designed for long-form reading. The background uses a soft **Paper White** to reduce eye strain compared to pure white, while **Surface Card White** provides clear containment for data modules. Text hierarchy is strictly enforced through **Deep Ebony** for maximum legibility in body copy and **Slate Gray** for metadata and secondary UI labels.

## Typography

The typography system uses a dual-font approach to differentiate "Story" from "Data." 

**Headlines (Noto Serif KR):** Used for article titles and major section headers. The serif typeface conveys a sense of traditional editorial credibility and prestige.

**Body & UI (Pretendard/Inter):** Used for all functional UI elements, data tables, and long-form body text. This sans-serif provides the "Intelligence" half of the brand—clean, efficient, and highly readable at small scales. 

*Note: For the body text, maintain a line-height between 1.6 and 1.8 to ensure comfortable reading of dense research papers.*

## Layout & Spacing

This design system employs a **12-column fixed grid** for desktop, centering the content to maintain an editorial feel. The spacing is built on an **8px base unit**, ensuring mathematical harmony across all components.

Layouts should prioritize "High-Density Data" modules alongside "Wide-Measure Reading" areas. Use the 24px gutter to separate data sidebars from the main content stream. Margin sizes should scale with screen width but cap at a max-content width of 1280px to prevent excessive line lengths in research articles.

## Elevation & Depth

Depth is conveyed through **Tonal Layering** and **Subtle Shadows**. Elements do not appear "heavy"; rather, they feel like light sheets of paper floating just above the surface.

- **Level 0 (Background):** Paper White (#F9FAFB).
- **Level 1 (Cards/Surface):** Surface White (#FFFFFF) with a 1px border (#E2E8F0).
- **Level 2 (Floating):** Used for hovered cards or dropdowns. Apply an ambient shadow: `0 8px 24px rgba(0, 43, 91, 0.06)`. Note the subtle blue tint in the shadow to maintain brand cohesion.
- **Level 3 (Overlay):** Modals and heavy navigation. Shadow: `0 16px 40px rgba(0, 0, 0, 0.08)`.

## Shapes

The shape language balances approachability with professional rigor. 

- **Cards:** 12px radius creates a modern, sophisticated container for complex data.
- **Buttons:** A tighter 6px radius signals a more "functional" and "precise" tool-like feel.
- **Chips/Tags:** 100px (Pill) radius is used for categories and metadata tags to distinguish them clearly from interactive buttons and structural containers.

## Components

**Buttons**
- **Primary:** Solid Zinsight Blue with White text. 6px radius.
- **Secondary:** Outlined with Soft Divide border, Deep Ebony text.
- **Tertiary:** Intel Emerald text, no background, used for "View Analysis" or "Details."

**Input Fields**
- Use a 1px border in Soft Divide. When focused, the border shifts to Zinsight Blue with a subtle 2px outer glow. Labels are always placed above the field in Slate Gray.

**Cards & Modules**
- Cards are the primary vehicle for data. Use a 1px Soft Divide border. Header sections within cards should have a subtle 1px bottom border to separate the title from the data visualization.

**Chips & Data Tags**
- Small, pill-shaped tags using light tints of secondary colors (e.g., Intel Emerald at 10% opacity) with high-contrast text for status or category indicators.

**Data Visualizations**
- Charts should primarily use Zinsight Blue and Intel Emerald. Use Slate Gray for grid lines and axis labels to ensure the data remains the focal point.

**Additional Components**
- **The "Insight" Block:** A specialized callout box with an Intel Emerald left-border accent used to highlight key takeaways in a research report.
- **Data Table:** High-density, minimalist tables with zebra-striping using the Background Paper White on even rows.