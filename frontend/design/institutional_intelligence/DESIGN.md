---
name: Institutional Intelligence
colors:
  surface: '#10131a'
  surface-dim: '#10131a'
  surface-bright: '#363941'
  surface-container-lowest: '#0b0e15'
  surface-container-low: '#191b23'
  surface-container: '#1d2027'
  surface-container-high: '#272a31'
  surface-container-highest: '#32353c'
  on-surface: '#e1e2ec'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#e1e2ec'
  inverse-on-surface: '#2e3038'
  outline: '#8c909f'
  outline-variant: '#424754'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e6a'
  primary-container: '#4d8eff'
  on-primary-container: '#00285d'
  inverse-primary: '#005ac2'
  secondary: '#44e2cd'
  on-secondary: '#003731'
  secondary-container: '#03c6b2'
  on-secondary-container: '#004d44'
  tertiary: '#b7c8e1'
  on-tertiary: '#213145'
  tertiary-container: '#8292aa'
  on-tertiary-container: '#1a2b3e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#62fae3'
  secondary-fixed-dim: '#3cddc7'
  on-secondary-fixed: '#00201c'
  on-secondary-fixed-variant: '#005047'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#10131a'
  on-background: '#e1e2ec'
  surface-variant: '#32353c'
typography:
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: '0'
  body-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: '0'
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: '0'
  label-sm:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-desktop: 32px
  margin-mobile: 16px
  container-max: 1440px
---

## Brand & Style

This design system is engineered for high-stakes decision-making environments, where data density must be balanced with visual clarity. The brand personality is authoritative, precise, and technologically advanced. It targets institutional investors, analysts, and policy-makers who require a "command center" experience that feels premium and reliable.

The aesthetic blends **Corporate Modern** with **Subtle Glassmorphism**. It utilizes a deep oceanic foundation to reduce eye strain during long periods of terminal usage, while employing "electric" accents to draw focus to critical market movements. The result is a high-performance interface that feels like a modern evolution of classic financial terminals—shifting from the heavy, monochromatic legacy systems to a more fluid, layered, and multi-dimensional digital workspace.

## Colors

The palette is anchored in a hierarchy of deep blues to establish structural depth. The primary background (#0f172a) provides the "Midnight" base, while the surface color (#1e293b) defines functional containers.

- **Primary (Electric Blue):** Used for primary actions, active states, and bullish trends.
- **Secondary (Technical Teal):** Reserved for data visualizations, specialized metrics, and secondary success indicators.
- **Accents (Soft Slate):** Used for borders, non-critical metadata, and icon backgrounds to prevent visual clutter.
- **Semantic Logic:** Financial data follows a strict "Blue-Scale" logic for neutral information, using #3b82f6 for upward momentum and #f43f5e for downward risk, ensuring high contrast against the navy background.

## Typography

This design system utilizes **Manrope** for its balance of geometric modernism and professional legibility. To maintain a "terminal" feel for technical data, a monospaced font is introduced for numerical grids and ticker feeds.

- **Headlines:** Set with tighter letter-spacing to feel compact and institutional.
- **Data Display:** For tables and fluctuating metrics, use `data-mono` (JetBrains Mono) to ensure tabular figures align perfectly, allowing for quick scanning of decimal points.
- **Labels:** Small labels use uppercase with increased tracking (0.05em) to provide clear section headers within dense information panels.
- **Contrast:** Primary text uses #f8fafc (95% white) for maximum readability against dark backgrounds, while secondary text uses #94a3b8 to deprioritize less critical info.

## Layout & Spacing

The layout philosophy follows a **Fluid Grid** model with a strict 4px baseline rhythm. Given the data-heavy nature of the platform, the design prioritizes "Information Density" over excessive whitespace.

- **Grid:** A 12-column grid is used for the main dashboard. Sidebar navigation is fixed at 240px (collapsed to 64px).
- **Density:** Components use a "Compact" vertical rhythm. Gutters are kept at a tight 16px to maximize the visible data on a single screen.
- **Responsive Behavior:** On mobile, complex 12-column tables reflow into card-based views or simplified "sparkline" summaries. High-level KPIs remain persistent at the top of the viewport.

## Elevation & Depth

Depth is communicated through **Tonal Layering** and **Glassmorphism** rather than traditional shadows, which can feel muddy on deep navy backgrounds.

- **Surface Tiers:** Background is #0f172a. Primary containers/cards sit on #1e293b. Elevated modals or hover states use #334155.
- **Glassmorphism:** For overlays (dropdowns, tooltips, and fixed headers), use a background blur (12px) combined with a semi-transparent fill of the surface color (80% opacity).
- **Borders:** Instead of shadows, use 1px "inner glows" or borders. Use #334155 for standard containers and a subtle Electric Blue #3b82f6 at 20% opacity for focused or active elements.

## Shapes

The shape language is **Soft (0.25rem)**, leaning towards a precise, architectural feel. 

- **Components:** Buttons and input fields use a 4px (0.25rem) radius.
- **Containers:** Main dashboard cards and data tables use an 8px (0.5rem) radius to differentiate them from smaller interactive elements.
- **Indicators:** Status pills and "active" markers use a fully rounded (pill) shape to provide a visual contrast against the otherwise rectilinear grid.

## Components

- **Buttons:** Primary buttons are solid #3b82f6 with white text. Secondary buttons are ghost-style with a #334155 border. Hover states should trigger a subtle outer glow using the primary color.
- **Data Tables:** Headers should be sticky with a #0f172a background and a bottom border of #1e293b. Row stripes are unnecessary; use a subtle hover highlight (#334155) instead.
- **Inputs:** Dark fills (#0f172a) with 1px borders (#334155). On focus, the border shifts to #3b82f6 with a 2px outer glow.
- **Glass Cards:** Used for global filters or secondary widgets. Apply `backdrop-filter: blur(10px)` with a very thin #ffffff10 border.
- **Chips/Badges:** Small, low-saturation backgrounds (e.g., #3b82f6 at 15% opacity) with high-saturation text for categorized metadata.
- **Charts:** Use a custom "Technical Teal" and "Electric Blue" palette. Avoid gradients in charts to maintain data integrity and precise reading of values.