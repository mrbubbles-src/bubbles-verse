---
story_id: '2.1'
story_key: '2-1-default-mdx-block-components-markdown'
epic: 'Epic 2 — MDX Renderer & Default Components'
status: ready-for-dev
created: 2026-04-12
---

# Story 2.1 — Default MDX Block Components (`Markdown*`)

## User Story

As a developer,
I want a complete set of default `Markdown*` components exported from `@bubbles/markdown-renderer`,
So that stored MDX renders correctly without writing any custom components.

---

## Context

These components are the visual output of EditorJS blocks after serialization. They live in `@bubbles/markdown-renderer` and have zero dependency on `@bubbles/markdown-editor`. Each component corresponds to one or more block types from the serializer.

The reference implementation exists in `to-be-integrated/` first, otherwise in `lms-ref` — components are named `Modules*` there. Rename everything to `Markdown*` during extraction.

**Prerequisite:** Story 1.1 (renderer scaffold) complete.

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

- Renderer component implementations in `to-be-integrated/` if present
- Equivalent `Modules*` implementations in `lms-ref`
- Package wiring in `packages/markdown-renderer`

### Allowed Deviations

- package/file placement required by this monorepo
- import path updates
- renaming `Modules*` to `Markdown*`
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
Given @bubbles/markdown-renderer is installed
When I import the default components
Then MarkdownAlerts, MarkdownCodeBlock, MarkdownChecklist, MarkdownImage,
     MarkdownEmbed, MarkdownToggle, MarkdownLink are all exported individually
     and as a combined defaultComponents map
And each component preserves the rendering behavior of the designated reference implementation
And code block rendering and theme behavior preserve the designated reference implementation
And alert and toggle behavior preserve the designated reference implementation
And all components are fully typed with no any
```

---

## Implementation Guide

### 1. Reference-First Extraction

Inspect `to-be-integrated/` first and port the existing default Markdown block components into `packages/markdown-renderer`.

If the relevant implementation is not available there, inspect `lms-ref` and port the behavior from there.

Do not redesign component structure, prop contracts, rendering strategy, icon choices, or syntax-highlighting approach unless the user explicitly approves a deviation.

### 2. Component Set and Boundaries

Preserve the exact default component set from the designated reference implementation, including:

- component names
- component boundaries
- helper components used internally
- which components are public vs internal

If the reference implementation exposes a combined `defaultComponents` map, preserve that behavior.

### 3. Props and Typing

Port the prop contracts from the designated reference implementation and keep them fully typed.

Only adapt type names or import locations where required by the monorepo package structure.

### 4. Rendering Behavior

Preserve the rendering behavior of each reference component, including:

- alert rendering
- checklist rendering
- image and embed rendering
- toggle behavior
- link behavior
- code block rendering and syntax-highlighting strategy

Do not swap in a new highlighting library, code-rendering flow, or icon system unless the reference already uses it or the user approves a deviation.

### 5. File Layout and Public Exports

Use the reference implementation to determine:

- file layout under `src/`
- component re-export structure
- public exports from `src/index.ts`
- prop-type re-exports, if present

Only adapt file placement for package organization.

### 6. Dependency Alignment

Add only the dependencies actually required by the designated reference implementation and the agreed package API.

Do not add libraries purely because they seem convenient if the reference implementation already solves the problem differently.

---

## Anti-Patterns to Avoid

- **Do not invent a new default component set.**
- **Do not replace the reference code-block rendering strategy** with a new one without approval.
- **Do not introduce editor-package coupling** if the reference renderer is independent.
- **Do not make new icon, styling, or dependency choices** unless they come from the designated reference implementation.

---

## Verification Checklist

- [ ] Default component set matches the designated reference implementation
- [ ] Public exports match the designated reference implementation or agreed package API
- [ ] Prop contracts are fully typed and match the designated reference implementation
- [ ] Rendering behavior for each default component matches the designated reference implementation
- [ ] Dependency choices align with the designated reference implementation
- [ ] `bun run typecheck` passes

---

## Dev Notes

_To be filled in during implementation._
