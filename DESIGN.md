---
name: bubbles-verse
description: Personal product lab for reusable, Catppuccin-based web interfaces.
colors:
  latte-base: 'oklch(0.9578 0.0058 264.53)'
  latte-mantle: 'oklch(0.9335 0.0087 264.52)'
  latte-crust: 'oklch(0.906 0.0117 264.51)'
  latte-text: 'oklch(0.4355 0.043 279.33)'
  latte-subtext: 'oklch(0.5471 0.0343 279.08)'
  latte-surface: 'oklch(0.8575 0.0145 268.48)'
  latte-mauve: 'oklch(0.5547 0.2503 297.02)'
  latte-red: 'oklch(0.5505 0.2155 19.81)'
  latte-blue: 'oklch(0.5586 0.2255 262.09)'
  latte-green: 'oklch(0.625 0.1772 140.44)'
  mocha-base: 'oklch(0.2429 0.0304 283.91)'
  mocha-mantle: 'oklch(0.2155 0.0254 284.06)'
  mocha-crust: 'oklch(0.1828 0.0204 284.2)'
  mocha-text: 'oklch(0.8787 0.0426 272.28)'
  mocha-subtext: 'oklch(0.751 0.0396 273.93)'
  mocha-surface: 'oklch(0.324 0.0319 281.98)'
  mocha-mauve: 'oklch(0.7871 0.1187 304.77)'
  mocha-red: 'oklch(0.7556 0.1297 2.76)'
  mocha-blue: 'oklch(0.7664 0.1113 259.88)'
  mocha-green: 'oklch(0.8577 0.1092 142.72)'
typography:
  display:
    fontFamily: 'Montserrat, system-ui, sans-serif'
    fontSize: 'clamp(4rem, 11vw, 5rem)'
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: 'normal'
  headline:
    fontFamily: 'Montserrat, system-ui, sans-serif'
    fontSize: '2.25rem'
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: 'normal'
  title:
    fontFamily: 'Montserrat, system-ui, sans-serif'
    fontSize: '1.25rem'
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: 'normal'
  body:
    fontFamily: 'Poppins, system-ui, sans-serif'
    fontSize: '1rem'
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: 'normal'
  label:
    fontFamily: 'Poppins, system-ui, sans-serif'
    fontSize: '0.75rem'
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: '0.12em'
rounded:
  sm: 'calc(0.45rem - 4px)'
  md: 'calc(0.45rem - 2px)'
  lg: '0.45rem'
  xl: 'calc(0.45rem + 4px)'
  '2xl': 'calc(0.45rem + 8px)'
spacing:
  xs: '0.25rem'
  sm: '0.5rem'
  md: '1rem'
  lg: '1.5rem'
  xl: '2rem'
components:
  button-primary:
    backgroundColor: '{colors.mocha-mauve}'
    textColor: '{colors.mocha-base}'
    rounded: '{rounded.md}'
    padding: '0.375rem 0.75rem'
    height: '2rem'
  button-outline:
    backgroundColor: 'transparent'
    textColor: '{colors.mocha-text}'
    rounded: '{rounded.md}'
    padding: '0.375rem 0.75rem'
    height: '2rem'
  card:
    backgroundColor: '{colors.mocha-mantle}'
    textColor: '{colors.mocha-text}'
    rounded: '{rounded.lg}'
    padding: '1rem'
  input:
    backgroundColor: '{colors.mocha-surface}'
    textColor: '{colors.mocha-text}'
    rounded: '{rounded.md}'
    padding: '0.25rem 0.75rem'
    height: '2rem'
---

# Design System: bubbles-verse

## 1. Overview

**Creative North Star: "Personal Product Lab"**

bubbles-verse is a living design system for personal products, not a locked brand manual. It should feel simple, modern, cool, and clear, with enough playfulness to feel human when the app invites it. Current screens are allowed to evolve; this file captures the shared foundation that should survive redesigns.

The system is built around reusable shadcn-based primitives from `@bubbles/ui`, Catppuccin Latte and Mocha tokens, compact interaction states, and project-level variation. Apps can become denser, softer, more playful, or more tool-like as needed, but they should still feel connected through color logic, typography, accessibility, and component behavior.

Key Characteristics:

- Catppuccin Latte for light mode and Catppuccin Mocha for dark mode.
- shadcn primitives are the base; custom reusable components compose around them.
- Modern compact controls with 44px touch hitboxes.
- Product-first clarity with room for app-specific personality.
- Cards, shadows, and density are tools, not defaults.

## 2. Colors

The palette is Catppuccin-first: soft tinted neutrals, mauve as the shared accent, and semantic color pulled from the existing Latte and Mocha ramps.

### Primary

- **Lab Mauve** (`oklch(0.5547 0.2503 297.02)` in Latte, `oklch(0.7871 0.1187 304.77)` in Mocha): Primary actions, focus rings, active navigation, selected states, and small moments of identity.

### Secondary

- **Surface Stack** (`latte-surface-*`, `mocha-surface-*`): Secondary controls, muted areas, grouped tool surfaces, chips, inputs, and hover states.

### Tertiary

- **Chart Signals** (blue, green, yellow, peach, mauve): Progress, status, charts, XP, editor metadata, and project-specific accents. Use deliberately so each project can find its own mood without breaking the shared system.

### Neutral

- **Latte Paper** (`oklch(0.9578 0.0058 264.53)`): Light-mode background.
- **Mocha Desk** (`oklch(0.2429 0.0304 283.91)`): Dark-mode background.
- **Mantle Surface** (`latte-mantle`, `mocha-mantle`): Cards, popovers, dialogs, and raised panels.
- **Readable Ink** (`latte-text`, `mocha-text`): Main text.
- **Quiet Ink** (`latte-subtext-*`, `mocha-subtext-*`): Supporting text, metadata, table labels, descriptions.

### Named Rules

**The Catppuccin Spine Rule.** Start with the existing Catppuccin tokens in `packages/ui/src/styles/globals.css`; add or adjust colors only when an app has a real product reason.

**The Mauve Rarity Rule.** Mauve is the shared signature, not wallpaper. Use it for decisions, current state, and focus, then let neutrals do the heavy lifting.

## 3. Typography

**Display Font:** Montserrat with system fallback
**Body Font:** Poppins with system fallback
**Label/Mono Font:** Fira Code for code and technical UI

**Character:** Montserrat gives headings a confident, personal product feel; Poppins keeps body copy soft and readable. Fira Code should mark technical content without turning general UI into a terminal.

### Hierarchy

- **Display** (800, `clamp(4rem, 11vw, 5rem)`, 0.95): Dominant dashboard numbers, hero-like app moments, and rare high-emphasis states.
- **Headline** (700, `2.25rem`, 1.15): Page titles, major sections, and legal/document pages.
- **Title** (600, `1.25rem`, 1.25): Cards, dialogs, sheets, sidebars, and grouped controls.
- **Body** (400-500, `1rem`, 1.625): Main copy, app instructions, form descriptions, and readable content. Keep long copy around 65-75ch.
- **Label** (600, `0.75rem`, uppercase when useful): Table headers, metadata, section labels, status context, and compact navigation hints.

### Named Rules

**The Readable First Rule.** Type can be playful in project moments, but primary workflows must stay scan-friendly and readable without study.

## 4. Elevation

bubbles-verse uses a flexible mix of tonal layering, subtle rings, and occasional shadows. Default product UI should prefer background contrast and borders; tactile shadows are welcome for overlays, active tools, app-specific moments, and surfaces that genuinely need depth.

### Shadow Vocabulary

- **Bubbles Shadow** (`0 1px 2px 0 var(--shadow-color), 0 0 0 1px var(--border)`): Small reusable surface lift, especially for compact tools.
- **Bubbles Inset Shadow** (`inset 0 1px 2px 0 var(--shadow-color), inset 0 0 0 1px var(--border)`): Pressed or inset surfaces.
- **Overlay Shadow** (`shadow-lg` or equivalent): Sheets, dialogs, popovers, and temporary layers.
- **Tonal Layering** (`bg-card`, `bg-muted`, `ring-foreground/10`, `border-border`): The default way to separate persistent surfaces.

### Named Rules

**The Use-Case Elevation Rule.** Flat, soft, and tactile are all valid. Choose based on the app and component role, not because one global style is mandatory.

## 5. Components

Components should feel reusable first, then expressive by composition. shadcn files in `@bubbles/ui` are the primitive base and should not be edited unless there is a specific reason discussed first.

### Buttons

- **Shape:** Medium radius (`rounded-md`, derived from `--radius: 0.45rem`).
- **Primary:** `bg-primary text-primary-foreground`, compact default height `2rem`, app-level CTAs may opt into larger heights such as `h-11` or `h-12`.
- **Hover / Focus:** Hover uses opacity or muted fill; focus uses `border-ring` plus `ring-2 ring-ring/30`. Active non-popup buttons translate down by `1px`.
- **Secondary / Ghost / Tertiary:** Outline and ghost variants keep the surface quiet; link variant is reserved for inline navigation.

### Chips

- **Style:** Rounded-full, compact, semibold text, semantic variants for status (`draft`, `published`, `destructive`, `outline`).
- **State:** Use as short metadata or filters, not as paragraphs in pill form.

### Cards / Containers

- **Corner Style:** `rounded-lg`, with `rounded-xl` or `rounded-2xl` only for app shells and larger branded surfaces.
- **Background:** `bg-card` with text in `text-card-foreground`.
- **Shadow Strategy:** Usually ring or tonal layering; use `--bubbles-shadow` when the card is an interactive tool or truly needs tactile lift.
- **Border:** Prefer `ring-1 ring-foreground/10` or `border-border`.
- **Internal Padding:** Default card padding is `1rem`; small cards use tighter `0.75rem` structure.

### Inputs / Fields

- **Style:** `h-8`, `rounded-md`, `border-input`, `bg-input/20` in light mode and `dark:bg-input/30` in dark mode.
- **Focus:** `border-ring` with `ring-2 ring-ring/30`.
- **Error / Disabled:** Destructive border and ring for invalid states; disabled inputs reduce opacity and remove pointer interaction.

### Navigation

- **Style:** Sidebar navigation uses inset shadcn sidebar primitives, `bg-sidebar`, compact icon collapse, and active states via sidebar accent tokens.
- **Typography:** Main sidebar items use `text-base font-medium`; nested items use smaller compact sizing.
- **Mobile:** Sidebar becomes a sheet; bottom navigation is valid for mobile-first app workflows like `it-counts`.

### Management Tables

Management tables are editorial and scannable: full-width, responsive overflow, uppercase tracking for headers, generous row padding, and neutral hover states. Use them for admin-style lists instead of forcing dense card grids.

### Dialogs and Sheets

Dialogs and sheets are temporary layers with popover color, close icon buttons, subtle rings, and focused content. Use sheets for progressive workflows when they preserve context; do not make modal surfaces the first answer for every interaction.

## 6. Do's and Don'ts

### Do:

- **Do** build new reusable components on top of `@bubbles/ui` shadcn primitives.
- **Do** keep Catppuccin Latte and Mocha as the default theme spine.
- **Do** let individual apps vary density, playfulness, and elevation based on their real workflow.
- **Do** use cards with intent for grouped objects, repeated items, and framed tools.
- **Do** keep navigation, copy, and hierarchy understandable without expert context.
- **Do** respect WCAG AA, keyboard access, responsive behavior, and reduced motion.

### Don't:

- **Don't** create card-heavy layouts where every piece of content becomes the same rounded box.
- **Don't** rewrite shadcn primitive files directly unless the reason has been discussed.
- **Don't** drift into generic SaaS dashboards, corporate blue defaults, overdesigned marketing gloss, or decorative complexity.
- **Don't** use side-stripe borders, gradient text, decorative glassmorphism, hero-metric templates, identical card grids, or modal-first interaction design.
- **Don't** treat this design system as frozen; update it when the shared visual foundation actually changes.
