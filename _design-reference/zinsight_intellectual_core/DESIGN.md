---
name: Zinsight Intellectual Core
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#43474e'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#74777f'
  outline-variant: '#c4c6cf'
  surface-tint: '#476083'
  primary: '#000613'
  on-primary: '#ffffff'
  primary-container: '#001f3f'
  on-primary-container: '#6f88ad'
  inverse-primary: '#afc8f0'
  secondary: '#005eb2'
  on-secondary: '#ffffff'
  secondary-container: '#4597fe'
  on-secondary-container: '#002e5d'
  tertiary: '#030607'
  on-tertiary: '#ffffff'
  tertiary-container: '#1b1f21'
  on-tertiary-container: '#838789'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d4e3ff'
  primary-fixed-dim: '#afc8f0'
  on-primary-fixed: '#001c3a'
  on-primary-fixed-variant: '#2f486a'
  secondary-fixed: '#d5e3ff'
  secondary-fixed-dim: '#a7c8ff'
  on-secondary-fixed: '#001b3b'
  on-secondary-fixed-variant: '#004788'
  tertiary-fixed: '#e0e3e5'
  tertiary-fixed-dim: '#c4c7c9'
  on-tertiary-fixed: '#181c1e'
  on-tertiary-fixed-variant: '#434749'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display-xl:
    fontFamily: Newsreader
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-lg:
    fontFamily: Newsreader
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.7'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.4'
spacing:
  unit: 4px
  gutter: 24px
  margin-edge: 40px
  container-max: 1280px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

This design system is built upon the principles of **Editorial Minimalism** and **Corporate Intelligence**. It is designed to facilitate deep focus, positioning Zinsight as a definitive authority in marketing research and media analysis. The brand personality is intellectual, precise, and institutional, echoing the credibility of high-end financial news terminals and global research firms.

The visual style rejects superfluous decoration in favor of structural integrity. It utilizes a "grid-first" philosophy where the arrangement of information itself creates the aesthetic. By leveraging significant whitespace and hairline dividers, the UI directs the user’s attention toward data and insights without cognitive overload. The emotional response is one of calm confidence and analytical clarity.

## Colors

The color strategy for this design system prioritizes legibility and professional rigor. 
- **Deep Navy (#001F3F)** serves as the primary anchor, used for global navigation, primary headings, and brand-heavy elements to evoke reliability and depth.
- **Electric Blue (#0074D9)** acts as the functional accent, reserved for interactive states, call-to-actions, and data highlights that require immediate attention.
- The neutral palette is expanded with a range of cool grays. Backgrounds utilize a pristine white or a very subtle tertiary tint (#F4F7F9) to define different content zones without using heavy borders. 

The overall palette is leaning heavily into high-contrast ratios to meet accessibility standards for long-form reading and complex data visualization.

## Typography

The typographic system utilizes a hybrid serif-sans approach to balance editorial authority with functional clarity. 

- **Newsreader** is the choice for long-form article headlines and pull-quotes. Its classic, authoritative strokes provide the "Intelligence Hub" feel, making deep-dive reports feel like prestige journalism.
- **Inter** is the workhorse for the UI, data tables, and body text. It is chosen for its exceptional readability in Korean and English, especially at small sizes in data-dense environments.

For Korean text, line heights are increased by approximately 10-15% compared to standard English settings to ensure that complex characters have sufficient breathing room. Tracking is slightly tightened for headlines and opened for small labels to maintain a professional, polished rhythm.

## Layout & Spacing

This design system employs a **Fixed-Fluid Hybrid Grid**. The primary content container is capped at 1280px to maintain optimal line lengths for reading, while the layout fluidly adjusts for smaller viewports. 

A 12-column grid is the standard for dashboards and reports, allowing for flexible arrangements of 2, 3, 4, or 6-unit modules. Spacing is governed by a strict 4px/8px base-unit system. 

The "Line & Whitespace" philosophy is executed here: instead of using background cards to separate sections, the system uses generous vertical padding (stack-lg) and subtle 1px horizontal rules. This creates an open, "airy" feel even when the page is densely packed with information.

## Elevation & Depth

To maintain a minimalist and professional aesthetic, this design system avoids heavy drop shadows and skeletal depth. Hierarchy is established through **Low-Contrast Outlines** and **Tonal Layering**.

- **Surface Levels:** The primary background is white (Level 0). Secondary content areas, such as sidebars or meta-data sections, use a subtle off-white or cool-gray fill (Level 1).
- **Borders:** Instead of shadows, use 1px borders in a light gray (#E1E4E8). This creates a "blueprint" feel that looks precise and engineered.
- **Selective Elevation:** Only use soft, ambient shadows for temporary floating elements like dropdown menus or tooltips. These shadows should have a large blur radius (16px+) and very low opacity (5-10%) to avoid breaking the flat, professional aesthetic.

## Shapes

The shape language of this design system is **Sharp (0)**. 

All UI elements—including buttons, input fields, and card containers—feature 0px corner radii. This architectural, squared-off approach reinforces the feeling of a professional research portal and a data-driven terminal. It conveys a sense of stability, precision, and seriousness that rounded "consumer-grade" corners often lack. 

Structural lines should be consistently 1px in width. When grouping related data points, use subtle vertical bars (accented in Deep Navy) rather than rounded containers to denote sections.

## Components

Components in this design system are characterized by their utilitarian elegance and high information density.

- **Buttons:** Primary buttons are solid Deep Navy with white text, using sharp corners. Secondary buttons use a 1px Navy border with no fill. The "Electric Blue" is used exclusively for "Active" states or critical "New" badges.
- **Data Tables:** The core of the intelligence hub. Tables use 1px horizontal dividers only (no vertical lines). Header rows are set in `label-sm` (Inter, Bold) with a subtle gray background.
- **Input Fields:** Minimalist design with only a bottom-border in the default state, shifting to a full Deep Navy outline on focus. Labels always sit above the field in `label-sm`.
- **Chips/Tags:** Used for categories and keywords. These are rectangular with no rounded corners, using a light gray fill and Deep Navy text.
- **Report Cards:** No shadows. A 1px gray border defines the boundary. The headline always uses `headline-md` (Inter) for functional summaries or `headline-lg` (Newsreader) for editorial features.
- **Interactive Charts:** Data visualizations should utilize the Primary Navy and Secondary Electric Blue for contrast, supported by a sequence of muted grays for multi-series data.