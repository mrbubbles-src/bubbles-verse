---
story_id: "2.3"
story_key: "2-3-renderer-css-stylesheet-renderer-css"
epic: "Epic 2 — MDX Renderer & Default Components"
status: ready-for-dev
created: 2026-04-12
---

# Story 2.3 — Renderer CSS Stylesheet (`renderer.css`)

## User Story

As a developer,
I want a standalone `renderer.css` I can import to style rendered MDX content,
So that I get correct typography, block styles, and syntax highlighting without any editor CSS.

---

## Context

`renderer.css` is the only CSS file in `@bubbles/markdown-renderer`. It provides:
1. Typography and block styles for rendered MDX content
2. The `--sh-*` CSS variable definitions that drive Shiki CSS Variables Mode syntax highlighting
3. Dark mode support via the `.dark` class on any ancestor element (consistent with the monorepo's `next-themes` dark mode strategy)

All CSS must reference only custom properties from `@bubbles/ui/globals.css` — no hardcoded colors. This means it works automatically in any app that already imports `@bubbles/ui/globals.css` (all bubbles-verse apps do).

The `--sh-*` variable definitions that currently live in `apps/the-coding-vault/app/globals.css` will be **removed** in Epic 5 once this file provides them.

**Prerequisite:** Stories 2.1 and 2.2 complete.

---

## Acceptance Criteria

```gherkin
Given import '@bubbles/markdown-renderer/styles/renderer' in an app
When MDX content is rendered via <MdxRenderer>
Then all block styles (typography, code blocks, alerts, toggles) are applied
And --sh-* syntax token variables and --code-bg are defined in renderer.css
And syntax highlighting adapts to light/dark mode via the .dark class on a parent element
And all CSS uses only @bubbles/ui/globals.css custom properties — no hardcoded colors
And importing renderer.css loads no editor toolbar or preview pane styles
```

---

## Implementation Guide

### 1. Shiki CSS Variables Mode — Required `--sh-*` Variables

Shiki CSS Variables Mode requires these CSS custom properties to be defined. Map them to Catppuccin Latte (light) and Catppuccin Mocha (dark):

```css
/* renderer.css */

/* ── Syntax Highlighting: Catppuccin Latte (light) ── */
:root {
  --sh-keyword:    var(--ctp-latte-mauve);
  --sh-string:     var(--ctp-latte-green);
  --sh-comment:    var(--ctp-latte-overlay1);
  --sh-function:   var(--ctp-latte-blue);
  --sh-number:     var(--ctp-latte-peach);
  --sh-operator:   var(--ctp-latte-sky);
  --sh-type:       var(--ctp-latte-yellow);
  --sh-variable:   var(--ctp-latte-text);
  --sh-deleted:    var(--ctp-latte-red);
  --sh-inserted:   var(--ctp-latte-green);
  --sh-changed:    var(--ctp-latte-yellow);
  --code-bg:       var(--ctp-latte-base);
}

/* ── Syntax Highlighting: Catppuccin Mocha (dark) ── */
.dark {
  --sh-keyword:    var(--ctp-mocha-mauve);
  --sh-string:     var(--ctp-mocha-green);
  --sh-comment:    var(--ctp-mocha-overlay1);
  --sh-function:   var(--ctp-mocha-blue);
  --sh-number:     var(--ctp-mocha-peach);
  --sh-operator:   var(--ctp-mocha-sky);
  --sh-type:       var(--ctp-mocha-yellow);
  --sh-variable:   var(--ctp-mocha-text);
  --sh-deleted:    var(--ctp-mocha-red);
  --sh-inserted:   var(--ctp-mocha-green);
  --sh-changed:    var(--ctp-mocha-yellow);
  --code-bg:       var(--ctp-mocha-base);
}
```

**Note:** The `--ctp-latte-*` and `--ctp-mocha-*` custom properties are defined in `@bubbles/ui/globals.css`. These are Catppuccin palette tokens already available in all apps. Verify exact variable names by checking `packages/ui/src/styles/globals.css`.

### 2. Block Styles

Add CSS for each rendered block type. Reference portal-ref and lms-ref for the exact styles. All colors via CSS vars:

```css
/* ── Code Blocks ── */
.markdown-renderer pre {
  background-color: var(--code-bg);
  border-radius: var(--radius);
  padding: 1rem;
  overflow-x: auto;
}

.markdown-renderer code {
  font-family: var(--font-mono);
  font-size: 0.875rem;
}

/* ── Alerts ── */
.markdown-renderer .alert-info    { border-left: 4px solid var(--info);    background: var(--info-bg);    }
.markdown-renderer .alert-success { border-left: 4px solid var(--success); background: var(--success-bg); }
.markdown-renderer .alert-warning { border-left: 4px solid var(--warning); background: var(--warning-bg); }
.markdown-renderer .alert-danger  { border-left: 4px solid var(--danger);  background: var(--danger-bg);  }

/* ── Toggle / Details ── */
.markdown-renderer details summary { cursor: pointer; font-weight: 600; }

/* ... additional block styles from reference implementation ... */
```

**The above is a starting template.** Populate the full styles from the reference implementation in `lms-ref` — don't invent styles from scratch.

### 3. Verify Available CSS Variables

Before writing CSS, check what custom properties are available in `@bubbles/ui/globals.css`:

```
packages/ui/src/styles/globals.css
```

Use only variables that exist there. Do not guess variable names — verify them.

### 4. No Editor Styles

This file must contain **zero** styles that relate to:
- EditorJS toolbar or blocks
- Split-pane preview layout
- Import modal
- Form fields

Those belong in `editor.css` and `preview.css` (Story 4.6).

### 5. The Coding Vault Migration Note

Once this file is complete, `apps/the-coding-vault/app/globals.css` contains duplicate `--sh-*` variable definitions. Those will be removed in Story 5.1. Do NOT remove them now — the Vault needs them until Story 5.1.

---

## Anti-Patterns to Avoid

- **No hardcoded hex/rgb colors.** Every color value must be a CSS custom property.
- **No editor/toolbar styles** in this file.
- **Do not use `@bubbles/ui/globals.css` as a CSS import** inside renderer.css — reference its variables only. The app loads `globals.css`; the package just uses the variables.

---

## Verification Checklist

- [ ] `--sh-*` variables defined for both `:root` (Latte) and `.dark` (Mocha) themes
- [ ] `--code-bg` defined for both themes
- [ ] Code blocks use `var(--code-bg)` for background
- [ ] Alert block styles cover all 4 types
- [ ] Toggle/details styled
- [ ] No hardcoded color values
- [ ] No editor/toolbar CSS
- [ ] Dark mode works by toggling `.dark` class on a parent element

---

## Dev Notes

_To be filled in during implementation._
