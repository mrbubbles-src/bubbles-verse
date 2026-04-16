---
story_id: '4.4'
story_key: '4-4-draft-autosave-and-restore'
epic: 'Epic 4 — Content Authoring Editor'
status: done
created: 2026-04-12
---

# Story 4.4 — Draft Autosave and Restore

## User Story

As a developer (and as a content author),
I want the editor to automatically save drafts to localStorage and restore them on page load,
So that work is never lost when a tab is closed or refreshed.

---

## Context

Two separate localStorage keys — one for create mode, one for edit mode. This prevents a create-mode draft from overwriting an edit-mode draft or vice versa. The `draftDisabledRef` flag prevents saving after a successful submit, so stale post-submit state doesn't persist as a false "draft".

The reference implementation uses `useDraftAutosave` hook in `portal-ref`. This hook ships with the package (internal, not exported).

This behavior must be ported from `to-be-integrated/` first, otherwise from `portal-ref`.

**Prerequisite:** Stories 4.1–4.3 complete (editor state and form state available).

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

- Draft autosave implementation in `to-be-integrated/` if present
- Equivalent `useDraftAutosave` implementation in `portal-ref`
- Integration points in `packages/markdown-editor`

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
Given an author writing content in create mode
When content or form fields change
Then the draft is automatically saved to a create-mode localStorage key

Given an author editing existing content in edit mode
When content or form fields change
Then the draft is saved to a separate edit-mode localStorage key

Given a page load when a draft exists for the current mode
When <MarkdownEditor> mounts
Then the draft is restored automatically — editor content and form fields reflect the saved draft

Given a successful form submit
When onSuccess fires
Then draft saving is disabled — the draft is not overwritten with stale post-submit state
```

---

## Implementation Guide

### 1. Reference-First Extraction

Inspect `to-be-integrated/` first and port the draft autosave and restore behavior from there.

If the relevant implementation is not available there, inspect `portal-ref` and port the behavior from there.

Do not redesign key naming, draft shape, persistence timing, restore precedence, or post-submit behavior unless the user explicitly approves a deviation.

### 2. Storage Keys and Draft Shape

Preserve the exact storage keys and stored draft shape from the designated reference implementation.

If the reference scopes drafts by mode, route, content id, or another keying strategy, keep that strategy.

### 3. Save and Restore Flow

Port the exact reference behavior for:

- when drafts are written
- when drafts are restored
- how corrupted or unavailable storage is handled
- how draft state interacts with initial server state

Do not invent a new restore-precedence model.

### 4. Post-Submit and Multi-Tab Behavior

Preserve the designated reference implementation's behavior for:

- disabling or clearing draft persistence after submit
- multi-tab behavior, if any
- internal vs public hook boundaries

---

## Anti-Patterns to Avoid

- **Do not design a new draft persistence contract** if the designated reference implementation already defines one.
- **Do not change storage medium, keys, or draft shape** without verifying them against the designated reference implementation.
- **Do not change post-submit or restore-precedence behavior** without approval.
- **Do not expose internal draft hooks** unless the designated reference implementation or agreed package API does so.

---

## Verification Checklist

- [ ] Storage keys and draft shape match the designated reference implementation
- [ ] Save and restore timing match the designated reference implementation
- [ ] Restore precedence matches the designated reference implementation
- [ ] Post-submit behavior matches the designated reference implementation
- [ ] Internal vs public hook boundaries match the designated reference implementation

---

## Dev Notes

Ported from the primary reference source:

- `to-be-integrated/md-editor/markdown-editor/editor/hooks/use-draft-autosave.ts`
- `to-be-integrated/md-editor/markdown-editor/lib/topic-draft-storage.ts`
- `to-be-integrated/md-editor/markdown-editor/editor/editor-form.tsx`

Package-specific integration adjustments:

- keep the reference storage keys and event names unchanged
- keep draft persistence internal to `@bubbles/markdown-editor`
- load the stored draft before exposing the package form surface, so the
  default form does not overwrite an existing edit draft during first mount
- sync restored editor content into an already-created EditorJS instance via
  `render()` when the resolved initial payload changes after mount

## Tasks / Subtasks

- [x] Port the reference draft storage helpers and autosave behavior into the package internals
- [x] Restore create-mode and edit-mode drafts on `<MarkdownEditor>` mount using separate localStorage keys
- [x] Preserve post-submit behavior by clearing the active draft and preventing stale rewrites after successful submit
- [x] Add regression coverage plus package-local documentation and changelog updates

## Dev Agent Record

### Implementation Plan

- Port the reference localStorage contract into internal package helpers first.
- Add a non-exported autosave hook for the default package form.
- Resolve the current-mode draft before rendering the package form surface.
- Re-render EditorJS with restored content when the effective initial payload changes.
- Add regression tests for restore, mode-specific keys, and post-submit clearing.

### Debug Log

- 2026-04-12: Read BMAD config, sprint status, and the full story file.
- 2026-04-12: Verified the primary reference implementation in `to-be-integrated/`; fallback `portal-ref` was not needed.
- 2026-04-12: Ported draft storage, autosave, restore, and post-submit clearing into `packages/markdown-editor`.
- 2026-04-12: Added package tests for create/edit restore, mode-specific draft keys, and submit-time draft clearing.
- 2026-04-12: Verified `bun run test`, `bun run typecheck`, and `bun run lint src tests --max-warnings=0` in `packages/markdown-editor`.

### Completion Notes

- Kept the reference storage keys `topic-editor-create-draft` and `topic-editor-edit-draft` plus their browser events unchanged.
- Added an internal `useDraftAutosave` hook and draft storage helpers without expanding the public package API.
- Delayed form rendering until the current-mode draft is resolved, which prevents the default edit form from overwriting a stored draft on first mount.
- Synced restored editor content into the live EditorJS instance so the editor body and metadata form stay aligned after restore.
- Added regression coverage for create-mode restore, edit-mode restore, edit-key writes, and post-submit draft clearing.

## File List

- `packages/markdown-editor/src/lib/draft-storage.ts`
- `packages/markdown-editor/src/hooks/use-draft-autosave.ts`
- `packages/markdown-editor/src/lib/load-editorjs.ts`
- `packages/markdown-editor/src/components/editor-form.tsx`
- `packages/markdown-editor/src/components/markdown-editor.tsx`
- `packages/markdown-editor/tests/editor/editor-form-metadata.test.tsx`
- `packages/markdown-editor/tests/editor/markdown-editor-form.test.tsx`
- `packages/markdown-editor/README.md`
- `packages/markdown-editor/CHANGELOG.md`

## Change Log

- 2026-04-12: Implemented Story 4.4 draft autosave and restore parity in `@bubbles/markdown-editor`.

## Status

review
