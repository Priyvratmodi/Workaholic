---
name: Taskflow Dark Theme
colors:
  surface: '#101418'
  surface-dim: '#101418'
  surface-bright: '#363a3e'
  surface-container-lowest: '#0b0f12'
  surface-container-low: '#181c20'
  surface-container: '#1c2024'
  surface-container-high: '#262a2e'
  surface-container-highest: '#313539'
  on-surface: '#e0e3e8'
  on-surface-variant: '#c1c6d4'
  inverse-surface: '#e0e3e8'
  inverse-on-surface: '#2d3135'
  outline: '#8b919e'
  outline-variant: '#414752'
  surface-tint: '#a8c8ff'
  primary: '#a8c8ff'
  on-primary: '#003062'
  primary-container: '#579dff'
  on-primary-container: '#003468'
  inverse-primary: '#005eb4'
  secondary: '#cabeff'
  on-secondary: '#311e7a'
  secondary-container: '#4a3a94'
  on-secondary-container: '#bcaeff'
  tertiary: '#5cdda5'
  on-tertiary: '#003824'
  tertiary-container: '#23b17d'
  on-tertiary-container: '#003c27'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#a8c8ff'
  on-primary-fixed: '#001b3c'
  on-primary-fixed-variant: '#00468a'
  secondary-fixed: '#e6deff'
  secondary-fixed-dim: '#cabeff'
  on-secondary-fixed: '#1c0062'
  on-secondary-fixed-variant: '#483892'
  tertiary-fixed: '#7afabf'
  tertiary-fixed-dim: '#5cdda5'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#101418'
  on-background: '#e0e3e8'
  surface-variant: '#313539'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-lg: 1.5rem
  margin: 1rem
  margin-md: 1.5rem
  margin-lg: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system is engineered for high-density, cognitive-ease project management and workflow orchestration. Tailored for software engineers, product managers, and modern knowledge teams, the interface delivers maximum clarity under prolonged daily exposure.

The aesthetic blends **Modern Technical Minimalism** with **Deep Tonal Layering**. It trades bright neon distractions for calibrated charcoal depths, using precise blue focal points to anchor user attention during complex multi-stage tasks.

- **Personality:** Decisive, frictionless, architectural, dependable.
- **Visual Stance:** Restrained deep dark surfaces, crisp micro-borders, purposeful functional color accents, and immaculate typographic hierarchy.
- **Emotional Response:** Calm mastery, clarity under high task density, and zero eye fatigue.

## Colors

The palette is engineered strictly for dark-mode productivity, using an elevation ladder built on subtle charcoal steps rather than dramatic opacity shifts.

### Surfaces & Backgrounds
- **Canvas / Root Page:** `#1D2125` — The deep foundation layer.
- **List / Swimlane Column:** `#22272B` — Subtle step up for group containment.
- **Card / Surface Default:** `#2C333A` — The primary interactive unit.
- **Card Surface Hover:** `#333B44` — Responsive visual lift.
- **Borders & Dividers:** `#38414A` — Structural definition without heavy contrast.

### Typography & Icons
- **Text Primary (Headings, titles):** `#FFFFFF`
- **Text Secondary (Body, metadata, descriptions):** `#B6C2CF`
- **Muted Icons & Sub-labels:** `#8C9BAB`

### Functional Accents
- **Primary Brand / Action:** `#579DFF` (Active states, key CTAs, selected tabs)
- **Success / Complete:** `#4BCE97`
- **Warning / In Progress:** `#F5CD47`
- **Danger / Blocked:** `#F87168`
- **Discovery / Milestones (Violet):** `#9F8FEF`

## Typography

Typographic scale is constructed with `Inter`, optimized for scanability and high information density. 

- **Weight Discipline:** Restrict to `400` (Regular) for body and metadata, `500` (Medium) for interactive tags and buttons, and `600` (Semi-bold) for card titles and section heads. Avoid `700+` to preserve visual refinement in dark mode.
- **Letter Spacing:** Apply tight micro-tracking (`-0.01em` to `-0.02em`) on headers to anchor titles firmly; apply slightly open tracking (`+0.02em` to `+0.04em`) on uppercase badges and compact metadata labels for maximum legibility at small sizes.

## Layout & Spacing

The layout operates on a strict **8px base grid** (with a secondary 4px step for micro-elements such as tags and compact badge padding).

### Layout Structure
- **Kanban / Multi-Column View:** Fluid horizontal arrangement with fixed or min-max column widths (`minmax(280px, 340px)`). Horizontal scroll is contained within the board canvas while primary navigation remains fixed.
- **Grid Gutters:** `1rem` (16px) between list columns; `0.75rem` (12px) vertical gaps between cards inside columns.
- **Responsive Adaptations:**
  - **Desktop (1024px+):** Full multi-column view with simultaneous sidebars and utility panels.
  - **Tablet (768px – 1023px):** Horizontal swipeable column view; collapsible navigation sidebar to an icon rail.
  - **Mobile (<768px):** Single-column stacked mode with segmented column switchers, reducing outer margin to `1rem` (16px) and component gap to `0.5rem` (8px).

## Elevation & Depth

Visual hierarchy in this system relies on subtle luminance steps paired with diffuse, cool-tinted dark shadows.

- **Level 0 (Canvas):** `#1D2125` — Flat baseline.
- **Level 1 (Structural Containers / Columns):** `#22272B` — Delimited by a 1px solid border in `#38414A` without drop shadow.
- **Level 2 (Interactive Cards / Dropdowns):** `#2C333A` with border `1px solid #38414A` and ambient shadow:
  - `box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.24);`
- **Level 3 (Hovered / Dragged Cards & Modals):** `#333B44` with intensified elevation:
  - `box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.5), 0 2px 6px -1px rgba(0, 0, 0, 0.3);`
  - Dragged states include a subtle highlight border: `1px solid #579DFF`.

## Shapes

The design system maintains a balanced, contemporary corner geometry calibrated between 8px and 12px:

- **Standard Elements (8px / `0.5rem`):** Applied to cards, form inputs, buttons, and popover menus.
- **Container Elements (12px / `0.75rem`):** Applied to parent list columns, modal dialogs, and slide-over drawers.
- **Micro Tags & Chips (4px / `0.25rem` or full pill):** Priority tags, status pills, and user avatar wrappers.

## Components

### Buttons
- **Primary:** Background `#579DFF`, text `#1D2125` (or `#091E42` high-contrast dark), font-weight `600`, border-radius `8px`. Hover: brightness 108%. Active: brightness 95%.
- **Secondary / Ghost:** Background `transparent`, text `#B6C2CF`, border `1px solid #38414A`. Hover: background `#333B44`, text `#FFFFFF`.
- **Subtle / Icon Only:** Text `#8C9BAB`, border none. Hover: background `#2C333A`, text `#FFFFFF`.

### Cards (Task Items)
- **Background:** `#2C333A` with border `1px solid #38414A`.
- **Corner Radius:** `8px` (`rounded`).
- **Padding:** `12px` to `16px`.
- **Hover Behavior:** Transition `background-color 150ms ease, box-shadow 150ms ease`; surface shifts to `#333B44`.
- **Structure:** Title in `#FFFFFF` (`body-md`, `font-weight: 500`), sub-elements (assignee avatar, checklist progress, due date badge) anchored at bottom with `#8C9BAB`.

### List Columns (Kanban Swimlanes)
- **Background:** `#22272B`.
- **Border:** `1px solid #38414A`.
- **Corner Radius:** `12px` (`rounded-lg`).
- **Header:** Sticky top with uppercase title (`label-sm`), item counter badge (`#2C333A` background, `#B6C2CF` text), and quick-add task trigger.

### Input Fields & Search
- **Default State:** Background `#1D2125`, border `1px solid #38414A`, text `#FFFFFF`, placeholder `#8C9BAB`, radius `8px`.
- **Focus State:** Border `1px solid #579DFF`, box-shadow `0 0 0 2px rgba(87, 157, 255, 0.25)`. Outline none.

### Status Badges & Chips
- Compact pills with `4px` radius and `label-sm` typography:
  - **Success:** Background `rgba(75, 206, 151, 0.15)`, text `#4BCE97`.
  - **Warning:** Background `rgba(245, 205, 71, 0.15)`, text `#F5CD47`.
  - **Danger:** Background `rgba(248, 113, 104, 0.15)`, text `#F87168`.
  - **Feature / Purple:** Background `rgba(159, 143, 239, 0.15)`, text `#9F8FEF`.

### Checkboxes & Selection
- **Box:** Size `16px x 16px`, background `#22272B`, border `1.5px solid #38414A`, radius `4px`.
- **Checked:** Background `#579DFF`, border-color `#579DFF`, white check glyph.

### Additional Suggested Component: Progress Indicator Bar
- **Track:** Background `#22272B`, border `1px solid #38414A`, height `6px`, radius full.
- **Fill:** `#4BCE97` or `#579DFF` with smooth CSS transition width.