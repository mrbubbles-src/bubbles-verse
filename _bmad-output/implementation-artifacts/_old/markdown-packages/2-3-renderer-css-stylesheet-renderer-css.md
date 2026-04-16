---
story_id: '2.3'
story_key: '2-3-renderer-css-stylesheet-renderer-css'
epic: 'Epic 2 — MDX Renderer & Default Components'
status: done
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

This story is not a design exercise. Port the renderer styling from `to-be-integrated/` first, otherwise from `lms-ref`, and only adapt token wiring or package placement where the monorepo requires it.

**Prerequisite:** Stories 2.1 and 2.2 complete.

---

## Mandatory Implementation Contract

- Follow `AGENTS.md` for every implementation decision in this story.
- Port the existing working implementation from the designated reference source as the default path.
- Use `to-be-integrated/` first when the relevant implementation exists there.
- If the relevant implementation is not present in `to-be-integrated/`, use `lms-ref`.
- Do not rewrite, redesign, or replace a working reference implementation with a newly authored one unless this story explicitly documents an approved exception.
- If a reference implementation and this story appear to conflict, preserve the reference behavior and escalate the conflict instead of inventing a new solution.

### Primary Reference Source

`to-be-integrated/`

### Fallback Reference Source

`lms-ref`

### Reference Files / Modules

- Renderer stylesheet implementation in `to-be-integrated/` if present
- Equivalent renderer stylesheet implementation in `lms-ref`
- Token definitions in `packages/ui/src/styles/globals.css`

### Allowed Deviations

- package/file placement required by this monorepo
- import path updates
- naming changes explicitly required by package API
- strict typing and lint compliance
- documented acceptance-criteria-driven adjustments only

### Forbidden Deviations

- library swaps not present in the reference implementation
- architectural rewrites
- behavior changes not explicitly required by the story
- replacing working reference logic with newly invented logic
- omitting reference behavior because it seems unnecessary

### Reference Access Rule

If the implementation required by this story cannot be inspected in the `Primary Reference Source`, do not guess and do not invent a replacement implementation.

If the `Fallback Reference Source` is also unavailable, incomplete, or cannot be inspected sufficiently, stop and ask the user how to proceed before making any code changes.

Missing or inaccessible reference sources are a blocker for implementation, not permission to improvise.

### Deviation Approval Rule

If implementation appears to require any deviation from the reference implementation or from the agreed plan, stop before making the change and ask the user for a decision.

Present the deviation clearly using this structure:

- What is different?
- Why is the deviation being considered?
- Why can the reference or current plan not be followed as-is?
- What are the available options?
- What are the consequences or tradeoffs of each option?

Wait for explicit user approval before implementing any deviation.

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

### 1. Reference-First Extraction

Port the stylesheet from `to-be-integrated/` first. If the implementation is not available there, port the stylesheet from `lms-ref`.

Do not write a new stylesheet from examples or templates. The reference implementation is the source of truth for selectors, spacing, visual states, and block-level styling behavior.

### 2. Syntax Highlighting Variables and Token Wiring

Preserve the syntax-highlighting variable strategy used by the designated reference implementation.

If the reference defines `--sh-*` variables or similar theme hooks, port those definitions and wire them only to verified tokens that already exist in `@bubbles/ui/globals.css`.

Do not invent a new palette contract or hardcode a token map in the story. If required tokens are missing, stop and ask the user before introducing replacements.

### 3. Block Styles

Copy the selectors and styling structure from the designated reference source. Preserve the rendered behavior for:

- typography
- code blocks
- alerts
- checklists
- images and embeds
- toggles
- links
- light/dark token switching

If a token from the reference source does not exist in `@bubbles/ui/globals.css`, stop and ask the user before inventing a replacement token mapping.

### 4. Verify Available CSS Variables

Before writing CSS, check what custom properties are available in `@bubbles/ui/globals.css`:

```
packages/ui/src/styles/globals.css
```

Use only variables that exist there. Do not guess variable names — verify them.

### 5. No Editor Styles

This file must contain **zero** styles that relate to:

- EditorJS toolbar or blocks
- Split-pane preview layout
- Import modal
- Form fields

Those belong in `editor.css` and `preview.css` (Story 4.6).

### 6. The Coding Vault Migration Note

Once this file is complete, `apps/the-coding-vault/app/globals.css` contains duplicate `--sh-*` variable definitions. Those will be removed in Story 5.1. Do NOT remove them now — the Vault needs them until Story 5.1.

---

## Anti-Patterns to Avoid

- **No hardcoded hex/rgb colors.** Every color value must be a CSS custom property.
- **No editor/toolbar styles** in this file.
- **Do not use `@bubbles/ui/globals.css` as a CSS import** inside renderer.css — reference its variables only. The app loads `globals.css`; the package just uses the variables.
- **Do not author fresh styling from scratch.** Port the reference stylesheet and only adjust verified token wiring or package placement.

---

## Verification Checklist

- [ ] Syntax-highlighting variables and token wiring match the designated reference implementation
- [ ] Code block styling behavior matches the designated reference implementation
- [ ] Block styling behavior matches the designated reference implementation
- [ ] No hardcoded color values
- [ ] No editor/toolbar CSS
- [ ] Theme switching behavior matches the designated reference implementation

---

## Dev Notes

_To be filled in during implementation._

## Tasks / Subtasks

- [x] Port the renderer stylesheet from the designated reference source into `packages/markdown-renderer/src/styles/renderer.css`
- [x] Add regression tests for renderer token wiring and renderer-only CSS scope
- [x] Update package documentation and changelog for the renderer stylesheet export

## Dev Agent Record

### Debug Log

- 2026-04-12: Story file shipped without implementation task scaffolding; derived the minimum task list directly from the Implementation Guide and Acceptance Criteria to keep work traceable.
- 2026-04-12: `bun test` invoked Bun's native runner and failed because the package test setup depends on Vitest `jsdom`; switched validation to the package script `bun run test`.

### Completion Notes

- Ported the renderer token-variable contract from the designated reference styling, but rewired it to verified `@bubbles/ui/globals.css` Catppuccin variables already available in this monorepo.
- Kept the stylesheet renderer-scoped: syntax token variables, dark-mode overrides via `.dark`, and inline-code styling only; no EditorJS, toolbar, split-pane, or form selectors were carried over.
- Added a regression test that locks the stylesheet contract for token presence, renderer-only scope, and shared-token color wiring.
- Updated package README and CHANGELOG so the stylesheet export is documented alongside the existing component/runtime API.
- Validation: `bun run test`, `./node_modules/.bin/eslint .`, and `bun run typecheck` in `packages/markdown-renderer`.

## File List

- \_bmad-output/implementation-artifacts/2-3-renderer-css-stylesheet-renderer-css.md
- \_bmad-output/implementation-artifacts/sprint-status.yaml
- packages/markdown-renderer/**tests**/renderer-styles.test.ts
- packages/markdown-renderer/CHANGELOG.md
- packages/markdown-renderer/README.md
- packages/markdown-renderer/src/styles/renderer.css

## Change Log

- 2026-04-12: Development started.
- 2026-04-12: Ported `renderer.css`, added stylesheet regression coverage, and documented the stylesheet export.

## Status

review
