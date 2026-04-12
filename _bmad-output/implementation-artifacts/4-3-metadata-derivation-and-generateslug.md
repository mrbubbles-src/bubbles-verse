---
story_id: '4.3'
story_key: '4-3-metadata-derivation-and-generateslug'
epic: 'Epic 4 — Content Authoring Editor'
status: ready-for-dev
created: 2026-04-12
---

# Story 4.3 — Metadata Derivation and `generateSlug`

## User Story

As a developer,
I want the editor to auto-derive the title and slug from content, with manual override support,
So that authors don't need to type metadata they've already written in the editor.

---

## Context

When an author types a heading level 1 block, the title field auto-populates. The slug auto-generates from the title. Once an author manually edits the slug, auto-generation stops for that session — the manual value is preserved even if the title changes.

`generateSlug` is also exported as a standalone tree-shakeable utility.

This behavior must be ported from `to-be-integrated/` first, otherwise from `portal-ref`. Do not design a new slug or metadata-derivation algorithm unless the user explicitly approves a deviation.

**Prerequisite:** Stories 4.1 and 4.2 complete.

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

- Metadata and slug behavior in `to-be-integrated/` if present
- Equivalent metadata and slug behavior in `portal-ref`
- Export wiring in `packages/markdown-editor`

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
Given an editor with a heading level-1 block
When the block content changes
Then the title field is automatically updated to the H1 text

Given a title that was auto-derived from the H1
When the title changes
Then the slug field is automatically updated using the designated reference implementation's slug behavior

Given a slug that has been manually edited by the author
When the title or H1 changes afterward
Then the slug is no longer auto-updated — the manual value is preserved

Given import { generateSlug } from '@bubbles/markdown-editor'
When called with any string
Then it preserves the designated reference implementation's slug output behavior
And unit tests cover the designated reference implementation's real edge cases
```

---

## Implementation Guide

### 1. Reference-First Extraction

Inspect `to-be-integrated/` first and port the exact title-derivation and slug behavior.

If the implementation is not available there, inspect `portal-ref` and port the behavior from there.

Do not invent a new slug algorithm, normalization rule set, or manual-override flow. Preserve the edge cases and output shape of the reference implementation unless the user explicitly approves a deviation.

### 2. `generateSlug()` Utility

Port the slug utility from the designated reference implementation and preserve:

- normalization rules
- transliteration rules
- special-character handling
- empty-input behavior
- duplicate separator handling
- output casing

Do not invent or simplify a slug algorithm in the story implementation.

### 3. `getHeaderLevelOneTitle()` Utility

Port the reference utility or inline logic used to derive the title from editor content.

Preserve the same source of truth for the derived title, including:

- which block types are eligible
- which heading level is used
- how missing titles are handled
- how rich text or inline markup is normalized before use

### 4. Manual Override Flag — `slugManuallyEdited`

Preserve the exact reference behavior for manual slug override flow:

- when auto-derivation starts
- when auto-derivation stops
- what counts as a manual override
- whether manual override can be reset
- how edit mode behaves compared with create mode

### 5. EditorJS `onChange` → Title Derivation

Preserve the same trigger points and update flow used by the reference implementation for:

- deriving title from editor content
- syncing title into form state
- syncing slug from title while auto-derivation is still active

### 6. Public Exports

Mirror the reference export surface for slug-related utilities. Only expose what the reference package or agreed package API exposes.

### 7. Unit Tests for `generateSlug`

Add tests that prove parity with the designated reference implementation rather than asserting a newly invented rule set.

Cover the reference edge cases that actually exist in the source implementation, including any normalization, transliteration, empty-state, and manual-override behavior that the reference already handles.

---

## Anti-Patterns to Avoid

- **Do not design a new slug algorithm.**
- **Do not change manual-override flow** without first verifying it against the designated reference implementation.
- **Do not export additional slug utilities** unless the reference or agreed package API requires them.

---

## Verification Checklist

- [ ] Title derivation behavior matches the designated reference implementation
- [ ] Slug generation behavior matches the designated reference implementation
- [ ] Manual override behavior matches the designated reference implementation
- [ ] Export surface matches the designated reference implementation or agreed package API
- [ ] Tests cover the actual reference edge cases
- [ ] `bun run test` passes

---

## Dev Notes

_To be filled in during implementation._
