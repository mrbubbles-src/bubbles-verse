---
story_id: '2.2'
story_key: '2-2-mdxrenderer-component'
epic: 'Epic 2 — MDX Renderer & Default Components'
status: ready-for-dev
created: 2026-04-12
---

# Story 2.2 — `<MdxRenderer>` Component

## User Story

As a developer,
I want a `<MdxRenderer>` component that compiles and renders stored MDX at runtime,
So that I can display rich content with a single import and no editor dependency.

---

## Context

`<MdxRenderer>` is the primary public component of `@bubbles/markdown-renderer`. This story is an extraction story: port the existing renderer behavior from the designated reference source into the package and preserve its runtime rendering behavior unless the user explicitly approves a deviation.

Use `to-be-integrated/` first. If the relevant implementation is not present there, fall back to `lms-ref`.

**Prerequisite:** Story 2.1 (default components) complete.

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

- Renderer implementation in `to-be-integrated/` if present
- Equivalent renderer implementation in `lms-ref`
- Package wiring in `packages/markdown-renderer`

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
Given a stored MDX string and <MdxRenderer> imported from @bubbles/markdown-renderer
When I render <MdxRenderer content={mdxString} />
Then the MDX is compiled and rendered using the same runtime pipeline behavior as the designated reference implementation
And all default Markdown* components are available automatically without manual registration
And a developer can override or extend individual components via the components prop map
And compilation errors are caught and surfaced as an error state — never thrown to the React error boundary
And @bubbles/markdown-renderer has zero dependency on @bubbles/markdown-editor
```

---

## Implementation Guide

### 1. Public Props and API Surface

Port the prop interface and public API from the designated reference implementation.

Preserve:

- required vs optional props
- extension/override behavior for default components
- public component name and export shape
- any supported error or fallback props, if present

### 2. Reference-First Extraction

Inspect the renderer implementation in `to-be-integrated/` first and port it into `packages/markdown-renderer`.

If the implementation is not available there, inspect `lms-ref` and port that behavior instead.

Do not choose a different MDX compilation library, rendering flow, or component boundary unless the user explicitly approves a deviation.

### 3. Runtime MDX Pipeline

Port the same runtime MDX pipeline used by the reference implementation.

Do not redefine the compilation, evaluation, hydration, or render flow in the story. The designated reference implementation is the source of truth.

### 4. Error Handling — Never Throw

Preserve the reference error-handling behavior as closely as possible while meeting the acceptance criteria: compilation errors must render a graceful error state and must never be rethrown to the React error boundary.

### 5. File Location

`packages/markdown-renderer/src/mdx-renderer.tsx`

Export from `src/index.ts` as part of the public API.

---

## Anti-Patterns to Avoid

- **Never rethrow compilation errors** to the React error boundary — always catch and render error state.
- **Never import from `@bubbles/markdown-editor`.** The renderer has zero editor dependency (FR26, NFR validation).
- **Do not replace the reference MDX pipeline with a new one** unless the user explicitly approves the deviation.
- **Do not hardcode the defaultComponents map inline** in this file — import from `./components` to keep them tree-shakeable.

---

## Verification Checklist

- [ ] `<MdxRenderer content={...} />` renders MDX without manual component registration
- [ ] Public props and component override behavior match the designated reference implementation
- [ ] Compilation error renders error state, does not throw
- [ ] No import from `@bubbles/markdown-editor` anywhere in `packages/markdown-renderer`
- [ ] Runtime MDX pipeline matches the designated reference implementation
- [ ] `bun run typecheck` passes

---

## Dev Notes

_To be filled in during implementation._
