---
story_id: '4.5'
story_key: '4-5-live-split-pane-mdx-preview-with-scroll-sync'
epic: 'Epic 4 — Content Authoring Editor'
status: ready-for-dev
created: 2026-04-12
---

# Story 4.5 — Live Split-Pane MDX Preview with Scroll Sync

## User Story

As a developer (and as a content author),
I want a live split-pane preview with bidirectional scroll sync,
So that I can see the rendered output while writing without switching views.

---

## Context

The preview pane renders the live `editorContent` (MDX string from Story 4.2) using `<MdxRenderer>` from `@bubbles/markdown-renderer`. Scroll sync relies on `data-block-id` attributes that the serializer adds to every block (Story 3.1) and that `<MdxRenderer>` preserves.

Two hooks handle scroll sync: `useScrollSync` (bidirectional coordinator) and `usePreviewScroll` (preview pane scroll logic). Both are internal — not exported.

This story must port the preview and scroll-sync behavior from `to-be-integrated/` first, otherwise from `portal-ref`. Do not redesign the preview pipeline or synchronization strategy unless the user explicitly approves a deviation.

**NFR1:** Preview updates within a perceptible response time — no artificial debounce.

**Prerequisite:** Stories 3.1, 4.1, 4.2 complete.

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

- Live preview implementation in `to-be-integrated/` if present
- Equivalent live preview implementation in `portal-ref`
- Scroll-sync hooks and related internal modules in the same reference source

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
Given content being authored in the editor pane
When any block changes
Then the MDX preview pane updates with no perceptible delay

Given an author scrolling in the editor pane
When the scroll position changes
Then the preview pane scrolls to the corresponding block

Given an author scrolling in the preview pane
When the scroll position changes
Then the editor pane scrolls to the corresponding block

And every block in the preview is addressable by EditorJS block ID via data-block-id attribute
```

---

## Implementation Guide

### 1. Reference-First Extraction

Inspect `to-be-integrated/` first and port the exact preview and scroll-sync behavior.

If the implementation is not available there, inspect `portal-ref` and port the behavior from there.

Do not invent a new preview pipeline, update strategy, or scroll-mapping approach unless the user explicitly approves a deviation.

### 2. Split-Pane Layout

Port the exact editor/preview layout structure from the designated reference implementation, including:

- pane structure
- mount points
- wrapper elements
- CSS hooks and class naming where relevant

Do not redesign the split-pane DOM structure unless the user explicitly approves a deviation.

### 3. Scroll Sync — How It Works

Port the exact scroll-sync strategy from the designated reference implementation, including:

- how blocks are identified across panes
- which pane drives which updates
- how scroll feedback loops are prevented
- whether hooks, refs, listeners, or helper utilities are internal or exported

Do not substitute a newly designed synchronization algorithm just because it seems cleaner.

### 4. Block Position Lookup

Preserve the exact lookup and mapping behavior used by the reference implementation:

- block selectors or identifiers
- visible-block detection rules
- scroll target resolution
- offset handling
- scrolling behavior

If the reference implementation relies on serializer-provided metadata, preserve that contract rather than replacing it.

### 5. Preview Updates — No Debounce

Preserve the preview update and re-render behavior from the reference implementation. Do not assume a specific MDX runtime pipeline beyond what the designated reference source already uses.

### 6. Internal Hooks — Not Exported

Mirror the reference package boundary for any preview or scroll-sync hooks and helpers. If the reference keeps them internal, keep them internal.

---

## Anti-Patterns to Avoid

- **Do not redesign preview layout or scroll-sync strategy** away from the designated reference implementation.
- **Do not invent new block-mapping rules** if the reference already defines them.
- **Do not expose internal hooks or helpers** unless the reference or agreed package API does so.
- **Do not add debouncing or alternate update timing** unless the reference already uses it or the user approves the change.

---

## Verification Checklist

- [ ] Preview update timing matches the designated reference implementation
- [ ] Cross-pane block mapping matches the designated reference implementation
- [ ] Scroll-sync behavior matches the designated reference implementation in both directions, if supported there
- [ ] Internal vs public hook boundaries match the designated reference implementation
- [ ] Preview and scroll-sync behavior match the designated reference implementation

---

## Dev Notes

_To be filled in during implementation._
