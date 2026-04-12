---
story_id: '4.4'
story_key: '4-4-draft-autosave-and-restore'
epic: 'Epic 4 — Content Authoring Editor'
status: ready-for-dev
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

_To be filled in during implementation._
