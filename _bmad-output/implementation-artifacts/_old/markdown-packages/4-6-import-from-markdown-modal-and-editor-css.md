---
story_id: '4.6'
story_key: '4-6-import-from-markdown-modal-and-editor-css'
epic: 'Epic 4 — Content Authoring Editor'
status: done
created: 2026-04-12
---

# Story 4.6 — Import-from-Markdown Modal and Editor CSS

## User Story

As a developer (and as a content author),
I want to import existing Markdown into the editor and have correct editor styles,
So that migrating existing content is easy and the editor looks right out of the box.

---

## Context

Two deliverables in this story:

1. **Import modal** — paste Markdown, convert to EditorJS blocks, replace editor content
2. **Editor and preview CSS** — `editor.css` and `preview.css` stylesheets for the editor interface

CSS files are already scaffolded as empty placeholders (Story 1.2). This story fills them with actual styles.

Port the import modal and editor/preview styling from `to-be-integrated/` first, otherwise from `portal-ref`.

**Prerequisite:** Stories 4.1–4.5 complete (full editor operational).

---

## Mandatory Implementation Contract

- Follow `AGENTS.md` for every implementation decision in this story.
- Port the existing working implementation from the designated reference source as the default path.
- Use `to-be-integrated/` first when the relevant implementation exists there.
- If the relevant implementation is not present in `to-be-integrated/`, use `portal-ref`.
- Do not rewrite, redesign, or replace a working reference implementation with a newly authored one unless this story explicitly documents an approved exception.
- If a reference implementation and this story appear to conflict, preserve the reference behavior and escalate the conflict instead of inventing a new solution.

### Primary Reference Source

`to-be-integrated/`

### Fallback Reference Source

`portal-ref`

### Reference Files / Modules

- Import modal implementation in `to-be-integrated/` if present
- Equivalent import modal and editor/preview styles in `portal-ref`
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
Given the import modal is opened
When a Markdown string is pasted and confirmed
Then the editor content is replaced with the converted EditorJS blocks

Given import '@bubbles/markdown-editor/styles/editor' and
      import '@bubbles/markdown-editor/styles/preview' in an app
When <MarkdownEditor> renders
Then EditorJS toolbar, block styles, and split-pane layout are correctly styled
And all CSS uses only @bubbles/ui/globals.css custom properties — no hardcoded colors
And editor and preview CSS are separate files — apps can import only what they need
```

---

## Implementation Guide

### 1. Reference-First Extraction

Inspect `to-be-integrated/` first and port the import-modal behavior, markdown-import flow, and editor CSS structure from there.

If the relevant implementation is not available there, inspect `portal-ref` and port the behavior from there.

Do not redesign modal composition, markdown conversion strategy, editor replacement flow, or CSS entry-point structure unless the user explicitly approves a deviation.

### 2. Import UX and Markdown Conversion

Preserve the exact reference behavior for:

- modal open/close flow
- confirm/cancel behavior
- markdown-to-block conversion path
- how imported content replaces current editor content

If the reference already uses a specific converter or helper, port that helper rather than inventing a fallback implementation in the story.

### 3. CSS Structure

Port the exact CSS file split and style responsibilities from the designated reference implementation, including:

- editor-only styles
- preview-wrapper styles
- renderer-content styles that remain in the renderer package

Only adapt token wiring or import paths for the monorepo.

### 4. Public Style Entry Points

Preserve the designated reference implementation's CSS entry-point contract so apps can import only the parts they need.

---

## Anti-Patterns to Avoid

- **Do not invent a new markdown-import flow** if the designated reference implementation already defines one.
- **Do not mix editor, preview, and renderer style responsibilities** if the designated reference implementation keeps them separate.
- **Do not make new modal-library or converter choices** unless they come from the designated reference implementation.
- **No hardcoded colors** in any CSS file.

---

## Verification Checklist

- [ ] Import modal behavior matches the designated reference implementation
- [ ] Markdown conversion and editor replacement behavior match the designated reference implementation
- [ ] CSS file split matches the designated reference implementation
- [ ] CSS entry-point contract matches the designated reference implementation or agreed package API
- [ ] No hardcoded color values

---

## Dev Notes

_To be filled in during implementation._

## Tasks / Subtasks

- [x] Port the portal-ref file-based markdown import modal into `@bubbles/markdown-editor`
- [x] Port the markdown-to-EditorJS conversion helper used by the import flow
- [x] Integrate import replacement into `MarkdownEditor` so imported blocks replace current content
- [x] Fill `editor.css` with editor-only toolbar, block, popover, and import-modal styles using UI tokens only
- [x] Keep `preview.css` separate for preview wrapper and highlight responsibilities
- [x] Add and update regression tests for conversion, modal import flow, warnings, and replacement behavior
- [x] Update package-scoped documentation and changelog

## Dev Agent Record

### Completion Notes

- Implemented the import behavior to match `portal-ref`: dashed drop surface, import button, modal file picker, conversion preview, warnings, and destructive replacement confirmation.
- Ported the markdown conversion helper into the package and kept the EditorJS replacement flow aligned with the reference implementation.
- Populated `editor.css` and `preview.css` with the split responsibilities required by the story while keeping renderer-only styling in `@bubbles/markdown-renderer`.
- Replaced hardcoded modal/editor colors with `@bubbles/ui/globals.css` custom properties and derived token mappings.

### Debug Log

- Added missing package dependencies required by the imported markdown conversion flow and refreshed the lockfile with `bun install`.
- Stubbed `HTMLDialogElement.showModal()`/`close()` in Vitest setup so the import modal can be exercised in jsdom.
- Verified package quality gates with:
  - `bun run --cwd packages/markdown-editor typecheck`
  - `bun run --cwd packages/markdown-editor test`
  - `bun run --cwd packages/markdown-editor lint src tests --max-warnings=0`

## File List

- `bun.lock`
- `packages/markdown-editor/package.json`
- `packages/markdown-editor/README.md`
- `packages/markdown-editor/CHANGELOG.md`
- `packages/markdown-editor/src/components/import-markdown-modal.tsx`
- `packages/markdown-editor/src/components/markdown-editor.tsx`
- `packages/markdown-editor/src/components/preview-pane.tsx`
- `packages/markdown-editor/src/lib/convert-markdown-to-editor-js.ts`
- `packages/markdown-editor/src/styles/editor.css`
- `packages/markdown-editor/src/styles/preview.css`
- `packages/markdown-editor/tests/editor/convert-markdown-to-editor-js.test.ts`
- `packages/markdown-editor/tests/editor/markdown-editor-form.test.tsx`
- `packages/markdown-editor/vitest.setup.ts`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-04-13: Ported the portal-ref markdown import modal and conversion flow into `@bubbles/markdown-editor`, added editor/preview stylesheet parity, and covered the new behavior with package-level tests.

## Status

review
