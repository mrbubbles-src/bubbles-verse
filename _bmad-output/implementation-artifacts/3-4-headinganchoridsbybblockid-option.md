---
story_id: '3.4'
story_key: '3-4-headinganchoridsbybblockid-option'
epic: 'Epic 3 — EditorJS → MDX Serializer'
status: review
created: 2026-04-12
---

# Story 3.4 — `headingAnchorIdsByBlockId` Option

## User Story

As a developer,
I want `serializeToMdx()` to optionally generate heading anchor IDs keyed by block ID,
So that I can build TOC navigation that links to specific headings in rendered content.

---

## Context

The `to-be-integrated/` reference implementation has this feature if present, otherwise `lms-ref` does. It allows apps to pass a pre-populated map of `{ blockId: anchorId }`, which the serializer uses to add `id="..."` attributes to rendered headings — enabling deep-linking from a Table of Contents.

This is an additive option on the existing `serializeToMdx()` signature. When omitted, behavior is identical to the base Story 3.1 implementation.

**Prerequisite:** Story 3.1 complete (base serializer).

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

- Heading-anchor serializer behavior in `to-be-integrated/` if present
- Equivalent heading-anchor implementation in `lms-ref`
- Serializer integration points in `packages/markdown-editor/src/serializer`

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
Given EditorJS output containing header blocks
When serializeToMdx(blocks, { headingAnchorIdsByBlockId: map }) is called
Then each header block uses its mapped anchor ID as an id attribute in the rendered heading

Given the same call without the option
When serializeToMdx(blocks) is called
Then output is identical to base behavior — no regression
And the option type is fully typed with no any
```

---

## Implementation Guide

### 1. The Option is Already in the Signature

The `SerializeOptions` interface from Story 3.1 already includes this field:

```ts
interface SerializeOptions {
  headingAnchorIdsByBlockId?: Record<string, string>;
  allowedComponents?: string[];
}
```

### 2. Header Handler — Apply Anchor ID

Port the reference behavior for applying heading anchor IDs when the option is provided.

Preserve:

- option name and type
- which block types consume the option
- output shape when an anchor exists
- output shape when no anchor exists

Do not invent a different anchor-rendering strategy unless the reference already uses it or the user approves a deviation.

### 3. Map Population — App Responsibility

Preserve the exact reference boundary between app responsibility and serializer responsibility.

If the reference builds the map outside the serializer, keep that behavior. If the reference handles part of this internally, preserve that instead.

### 4. No Regression Test

Add tests that prove parity with the designated reference implementation for:

- header output with anchor option present
- header output with anchor option absent
- any fallback behavior the reference already supports

---

## Anti-Patterns to Avoid

- **Do not move anchor-generation responsibility** unless the designated reference implementation already does so.
- **Do not change base heading behavior** when the option is omitted.
- **Do not design a new anchor format or generation flow** in this story.

---

## Verification Checklist

- [ ] Anchor-option behavior matches the designated reference implementation
- [ ] App vs serializer responsibility matches the designated reference implementation
- [ ] Tests cover with-option and without-option behavior
- [ ] Option typing remains explicit and fully typed
- [ ] `bun run test` passes

---

## Dev Notes

_To be filled in during implementation._

## Tasks / Subtasks

- [x] Task 1: Extend the serializer API with the typed heading-anchor option (AC: 1, 2)
  - [x] Add the `SerializeOptions` type with `headingAnchorIdsByBlockId`
  - [x] Export the option type from the package public API
  - [x] Keep the option fully typed with no `any`

- [x] Task 2: Port the reference heading-anchor wrapper behavior from `lms-ref` (AC: 1, 2)
  - [x] Apply mapped anchor ids on wrapped serialized blocks using the reference `id` + `className="topic-anchor-target"` attributes
  - [x] Preserve existing output when the option is omitted
  - [x] Forward the option through recursive toggle serialization

- [x] Task 3: Add regression coverage and update package-local docs (AC: 1, 2)
  - [x] Add tests for header output with the option present
  - [x] Add tests for compatibility when the option is absent
  - [x] Add a recursive toggle test proving nested heading anchors still resolve
  - [x] Update the package README and CHANGELOG for the new option
  - [x] Run package and monorepo validation commands successfully

## Dev Agent Record

### Implementation Plan

- Inspect `to-be-integrated/` first and only fall back if the heading-anchor implementation is missing there.
- Match the inspected `lms-ref` behavior exactly by attaching the anchor metadata to the wrapper `<div data-block-id="...">`, not by inventing a new heading markup shape.
- Keep anchor-map generation outside the serializer and only consume the provided `blockId -> anchorId` lookup in `serializeToMdx()`.

### Debug Log

- 2026-04-12: Loaded BMAD config, sprint status, and Story 3.4. Confirmed the first `ready-for-dev` story was `3-4-headinganchoridsbybblockid-option`.
- 2026-04-12: Inspected `to-be-integrated/` first and confirmed it does not contain the heading-anchor serializer implementation required by this story.
- 2026-04-12: Loaded `lms-ref/components/utility/convert-editor-js-to-mdx.tsx` and its unit tests, then verified the reference behavior adds `id` and `className="topic-anchor-target"` to the wrapper block container.
- 2026-04-12: Added failing regression tests for anchored header wrappers, no-option compatibility, and recursive toggle propagation before implementing the serializer patch.
- 2026-04-12: Extended the package serializer types/API, ported the reference wrapper behavior, updated package docs, and validated package + monorepo test/lint/typecheck commands.

### Completion Notes

- `serializeToMdx()` now accepts an optional, fully typed `headingAnchorIdsByBlockId` map and exports that option type through `@bubbles/markdown-editor`.
- The serializer now matches the inspected `lms-ref` behavior by adding `id="..." className="topic-anchor-target"` to the wrapped block container when a mapped anchor id is provided.
- Existing serializer output remains unchanged when the option is omitted, and recursive toggle serialization now forwards the same options so nested heading wrappers can receive anchor ids too.
- Validation passed with `bun run --cwd packages/markdown-editor test`, `bun run --cwd packages/markdown-editor typecheck`, `bun run test`, `bun run lint`, and `bun run typecheck`.
- `bun run test` still emits pre-existing `it-counts` warnings about `act(...)` and jsdom canvas support, but the suite exits successfully and required no changes for this story.

### File List

- `packages/markdown-editor/src/lib/serialize-to-mdx.ts`
- `packages/markdown-editor/src/types/serializer.ts`
- `packages/markdown-editor/src/index.ts`
- `packages/markdown-editor/tests/serializer/serialize-to-mdx.test.ts`
- `packages/markdown-editor/README.md`
- `packages/markdown-editor/CHANGELOG.md`
- `_bmad-output/implementation-artifacts/3-4-headinganchoridsbybblockid-option.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-04-12: Added the optional `headingAnchorIdsByBlockId` serializer API and exported its typed option surface from `@bubbles/markdown-editor`.
- 2026-04-12: Ported the reference heading-anchor wrapper behavior from `lms-ref`, added regression tests for anchored headings and recursive toggle propagation, and updated the package docs.

## Status

review
