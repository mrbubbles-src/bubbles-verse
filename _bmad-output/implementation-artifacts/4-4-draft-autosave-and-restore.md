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

### 1. localStorage Keys

```ts
// Draft key convention — scoped to prevent cross-mode collisions
const DRAFT_KEYS = {
  create: '@bubbles/markdown-editor:draft:create',
  edit: '@bubbles/markdown-editor:draft:edit',
} as const;
```

If multiple editor instances exist on different pages, consider scoping by route — but for v1, the two keys are sufficient.

### 2. Draft Shape

```ts
interface EditorDraft {
  content: OutputData;
  formValues: {
    title: string;
    slug: string;
    description: string;
    tags: string[];
    status: 'published' | 'unpublished';
  };
  savedAt: number; // timestamp for display/debug purposes
}
```

### 3. `useDraftAutosave` Hook

```ts
// hooks/use-draft-autosave.ts
'use client';

import { useEffect, useRef } from 'react';

/**
 * Automatically saves editor draft to localStorage.
 * Does nothing after submit (controlled by draftDisabledRef).
 * Internal hook — not exported from the package.
 */
export function useDraftAutosave(
  draft: EditorDraft | null,
  isEditMode: boolean
) {
  const draftDisabledRef = useRef(false);

  useEffect(() => {
    if (!draft || draftDisabledRef.current) return;

    const key = isEditMode ? DRAFT_KEYS.edit : DRAFT_KEYS.create;

    try {
      localStorage.setItem(
        key,
        JSON.stringify({ ...draft, savedAt: Date.now() })
      );
    } catch {
      // localStorage full or unavailable — fail silently
    }
  }, [draft, isEditMode]);

  /** Call this after successful submit to prevent stale draft persistence. */
  function disableDraftSaving() {
    draftDisabledRef.current = true;
  }

  return { disableDraftSaving };
}
```

### 4. Draft Restore on Mount

Restore happens in the editor initialization effect, before EditorJS mounts:

```ts
function loadDraft(isEditMode: boolean): EditorDraft | null {
  const key = isEditMode ? DRAFT_KEYS.edit : DRAFT_KEYS.create;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as EditorDraft;
  } catch {
    return null; // corrupted or unavailable — fail silently
  }
}

// In the editor's useEffect:
const draft = loadDraft(isEditMode);
if (draft) {
  // Pass draft.content as initialData to EditorJS
  // Populate form fields from draft.formValues
}
```

**Priority:** If `initialData` is provided (edit mode) AND a draft exists, restore the **draft** (more recent). The `initialData` prop represents the last saved server state; the draft is the user's unsaved work.

### 5. Disable After Submit

Wire `disableDraftSaving` to the `onSuccess` flow in `<EditorForm>`:

```ts
const { disableDraftSaving } = useDraftAutosave(currentDraft, isEditMode);

async function handleSubmit(formData: FormValues) {
  disableDraftSaving(); // disable before calling onSuccess
  onSuccess(payload); // app navigates away — no more saves after this
}
```

### 6. Multi-tab Note (out of scope)

v1 is last-write-wins. If two tabs edit the same draft simultaneously, the last save wins. No conflict resolution is needed. Do not add it.

---

## Anti-Patterns to Avoid

- **Do not export `useDraftAutosave`.** Internal hook only (per API contract: "Internal only (not exported)").
- **Do not use `sessionStorage`.** Drafts must survive tab close → use `localStorage`.
- **Do not save post-submit state.** `draftDisabledRef.current = true` before calling `onSuccess`.
- **Do not crash on localStorage errors** (quota exceeded, private browsing mode). Always wrap in try/catch.

---

## Verification Checklist

- [ ] Create mode saves to `@bubbles/markdown-editor:draft:create`
- [ ] Edit mode saves to `@bubbles/markdown-editor:draft:edit`
- [ ] Draft restores on mount (both content and form values)
- [ ] Draft NOT saved after `disableDraftSaving()` called
- [ ] `useDraftAutosave` NOT exported from `src/index.ts`
- [ ] localStorage errors handled silently (try/catch)

---

## Dev Notes

_To be filled in during implementation._
