---
name: Taskflow Fluid Precision
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#464553'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#777585'
  outline-variant: '#c7c4d6'
  surface-tint: '#4e4ec9'
  primary: '#4241bc'
  on-primary: '#ffffff'
  primary-container: '#5b5bd6'
  on-primary-container: '#edeaff'
  inverse-primary: '#c1c1ff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#754900'
  on-tertiary: '#ffffff'
  tertiary-container: '#965e00'
  on-tertiary-container: '#ffe8d1'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c1c1ff'
  on-primary-fixed: '#0a006b'
  on-primary-fixed-variant: '#3533b0'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.015em
  title-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: -0.005em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.02em
  mono-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-board: 1.25rem
  margin: 1.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style
The design system targets software engineers, product managers, and modern knowledge teams demanding radical focus, speed, and spatial clarity. The aesthetic merges precision productivity software (Linear, Notion) with fluid, ambient depth. The visual narrative balances utilitarian discipline—monospaced metadata, tight alignment, zero decorative clutter—with an ethereal, weightless workspace created via translucent glass panes, restrained micro-gradients, and tactile feedback.

The interface evokes hyper-focus, frictionless velocity, and calm order under cognitive load. Visual hierarchy is established through surface luminosity and crisp typography rather than dense chrome or solid bounding boxes.

## Colors
The palette balances an authoritative electric indigo primary with utility accents for states, pipelines, and tags:
- **Primary (`#5B5BD6`):** Drives primary actions, active navigational states, drag insertion indicators, and focused inputs.
- **Accents:**
  - Emerald (`#10B981`): Completed workflows, positive health metrics, active sprints.
  - Amber (`#F59E0B`): Blockers, pending reviews, medium-priority tags.
  - Rose (`#F43F5E`): Urgent/P0 escalations, overdue deadlines, destructive dialogs.
  - Sky (`#0EA5E9`): In-progress indicators, linked issue refs, automated bot badges.
- **Canvas & Surface System:** 
  The canvas is rendered with a fixed radial micro-gradient transitioning from soft icy blue (`#F0F4FF`) at the top-left to pale lavender-violet (`#FAF5FF`) at the bottom-right.
  Board list containers employ translucent frosted milky white (`rgba(255, 255, 255, 0.65)`), while interactive task cards rest on pure crystalline white (`#FFFFFF`) to project elevated hierarchy.

## Typography
Typographic scale emphasizes tight, information-dense layouts without sacrificing legibility. Tracking is tightened systematically on headings (`-0.025em`) to produce a sleek, contemporary editorial demeanor. 

- Use `title-md` specifically for Kanban card headers and column labels.
- Use `mono-sm` for system identifiers, git commit hashes, issue keys (e.g., `TSK-1042`), and cycle timers.
- `label-sm` is strictly set in small-caps or uppercase for badge pills and workflow state tokens to preserve distinct visual categorization against task descriptions.

## Layout & Spacing
Built on a strict 8px metric base with 4px sub-grid increments.

- **Board Layout:** Kanban columns run along an horizontal fluid flex container using `gutter-board` (20px) separation. Each column adheres to an optimal minimum width of `304px` and maximum width of `360px`, scrolling horizontally offscreen with snapping enabled on smaller widths.
- **Vertical Card Stacking:** Tasks inside columns leverage `space-sm` (8px) gaps. Inner task card contents use `space-md` (12px) padding to retain dense visibility.
- **Breakpoints & Adaptation:**
  - **Desktop (≥ 1280px):** Permanent left tool rail (64px collapsed / 240px expanded), full multi-column horizontal display, multi-pane overlay modals.
  - **Tablet (768px – 1279px):** Auto-collapsing navigation rail, 2.5 visible columns with edge peek.
  - **Mobile (< 768px):** Single-column focus mode with an anchored top horizontal segment controller to slide between lane stages; global margin scales down to `margin-mobile` (16px).

## Elevation & Depth
Depth relies on frosted translucent surfaces, subtle refraction borders, and multi-layered soft shadows:

- **Board Columns (Backdrop Glass):** 
  Constructed using `background: rgba(255, 255, 255, 0.65)`, backdrop blur filter `blur(16px) saturate(180%)`, and an ultra-thin perimeter outline `1px solid rgba(255, 255, 255, 0.8)`. No directional shadow is applied to columns; depth is derived from surface contrast against the ambient gradient canvas.
- **Resting Task Cards:** 
  Opaque white `background: #FFFFFF` framed with `1px solid rgba(226, 232, 240, 0.7)`. Uses a custom double-stop ambient shadow: `0 1px 3px 0 rgba(0, 0, 0, 0.02), 0 4px 20px -2px rgba(91, 91, 214, 0.06)`.
- **Hovered Task Cards:** 
  Micro-translate of `-1px` on the Y-axis with shadow blooming to `0 8px 24px -4px rgba(91, 91, 214, 0.12)`.
- **Dragged Task Cards:** 
  Rotates `2deg` with scale `1.03`, elevating with shadow `0 20px 32px -8px rgba(15, 23, 42, 0.14), 0 0 0 1px rgba(91, 91, 214, 0.3)`.
- **Modals & Drawers:** 
  Layered over `rgba(15, 23, 42, 0.25)` blur backdrops with elevation shadow `0 24px 48px -12px rgba(15, 23, 42, 0.18)`.

## Shapes
A disciplined curvature model defines the spatial character:
- Standard task cards use an explicit `12px` radius (`rounded-lg`), blending structural stability with soft modern tactile edges.
- Kanban column containers adopt `16px` radius (`rounded-xl`) to establish a distinct outer enclosure.
- Badges, priority tags, status pills, and user avatars enforce fully circular profiles (`rounded-full` / 9999px) to contrast against rectilinear card bounds.
- Floating command palettes and task detail overlays scale to `16px` corner rounding.

## Components

### Buttons
- **Primary:** Solid `#5B5BD6` background with pure white text, 8px border radius, `0 1px 2px rgba(0,0,0,0.05)` shadow. On hover: background `#4C4CC4`, subtle scale highlight. Focus ring: `2px solid rgba(91, 91, 214, 0.4)` with 2px offset.
- **Secondary / Ghost:** Transparent background, text `#0F172A`, hover fill `rgba(15, 23, 42, 0.04)`.
- **Subtle Icon Button:** 28x28px dimension, 6px radius, neutral-500 fill, transitioning to neutral-900 on hover with `rgba(0,0,0,0.04)` fill.

### Cards (Task Units)
- Rendered in opaque white with 12px radius and 12px internal padding.
- Structure: Top row contains ticket identifier (`mono-sm` in slate-400) and priority badge. Middle row displays task title (`title-md` in slate-900, max 2 lines). Bottom row clusters contextual metadata: subtask counters, attachment indicators, due date status, and trailing assignee avatars (20px circular stack).

### Status Pills & Chips
- Fully rounded pills (`height: 22px`, `padding: 0 8px`).
- Built with high-legibility pastel backgrounds and saturated foreground text:
  - Backlog / Default: `rgba(100, 116, 139, 0.1)` with `#475569`.
  - Planning (Sky): `rgba(14, 165, 233, 0.12)` with `#0284C7`.
  - In Progress (Indigo): `rgba(91, 91, 214, 0.12)` with `#5B5BD6`.
  - Quality Review (Amber): `rgba(245, 158, 11, 0.12)` with `#D97706`.
  - Completed (Emerald): `rgba(16, 185, 129, 0.12)` with `#059669`.
  - Blocked (Rose): `rgba(244, 63, 94, 0.12)` with `#E11D48`.

### Input Fields & Search Bars
- Background `rgba(255, 255, 255, 0.8)`, border `1px solid rgba(226, 232, 240, 0.8)`, 8px radius.
- Height: 36px for global search and inline card creation fields.
- Active focus state: `background: #FFFFFF`, border color `#5B5BD6`, ring `3px rgba(91, 91, 214, 0.15)`.

### Checklists & Subtask Items
- Checkboxes: 16x16px rounded squares with 4px corner radius. Border `#CBD5E1`. Checked state transitions seamlessly to solid `#5B5BD6` featuring an animated SVG checkmark in white.
- Completed subtask labels receive strikethrough styling and drop opacity to 50%.

### Board Columns
- Minimum width 304px, background `rgba(255, 255, 255, 0.65)` with backdrop filter `blur(16px)`.
- Header consists of column name, card count badge (`background: rgba(15, 23, 42, 0.06)`, text slate-600, pill shape), quick-add `+` trigger, and column settings overflow menu.
- Bottom drop-zone features a dotted guide border on card drag-over with `#5B5BD6` tinting.