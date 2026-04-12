---
story_id: '2.1'
story_key: '2-1-default-mdx-block-components-markdown'
epic: 'Epic 2 — MDX Renderer & Default Components'
status: review
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

## Tasks / Subtasks

- [x] Port the reference `Modules*` renderer components from `to-be-integrated/lms-mdrender` into `packages/markdown-renderer` as `Markdown*` components.
- [x] Preserve the reference MDX component registry behavior via a typed `defaultComponents` export and `useMDXComponents()`.
- [x] Add the required package dependencies, image asset, and internal helper/types needed by the extracted components.
- [x] Add package tests for the default registry, link behavior, and checklist rendering.
- [x] Update package-local README and CHANGELOG entries for the new renderer surface.
- [x] Verify `bun run typecheck` from the monorepo root and package-level `test` / `lint`.

## Dev Agent Record

### Debug Log

- `bun install`
- `cd packages/markdown-renderer && bun run typecheck`
- `cd packages/markdown-renderer && bun run test`
- `cd packages/markdown-renderer && bun run lint .`
- `bun run typecheck`

### Completion Notes

- Ported the reference alert, checklist, code block, embed, image, link, and toggle components into `@bubbles/markdown-renderer`.
- Added a typed `defaultComponents` registry with the reference HTML element styling and `Markdown*` MDX component mappings.
- Added package-local Vitest coverage for the exported registry plus the link and checklist behaviors.
- Kept the extraction aligned with the `to-be-integrated/lms-mdrender` behavior, adapting only monorepo import paths and the `Modules*` to `Markdown*` rename.

## File List

- `bun.lock`
- `_bmad-output/implementation-artifacts/2-1-default-mdx-block-components-markdown.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `packages/markdown-renderer/CHANGELOG.md`
- `packages/markdown-renderer/README.md`
- `packages/markdown-renderer/package.json`
- `packages/markdown-renderer/src/index.ts`
- `packages/markdown-renderer/src/assets/rocket-icon.png`
- `packages/markdown-renderer/src/components/markdown-alerts.tsx`
- `packages/markdown-renderer/src/components/markdown-checklist.tsx`
- `packages/markdown-renderer/src/components/markdown-code/copy-code.tsx`
- `packages/markdown-renderer/src/components/markdown-code/markdown-code-block.tsx`
- `packages/markdown-renderer/src/components/markdown-embed.tsx`
- `packages/markdown-renderer/src/components/markdown-image/markdown-cld-image.tsx`
- `packages/markdown-renderer/src/components/markdown-image/markdown-image.tsx`
- `packages/markdown-renderer/src/components/markdown-link.tsx`
- `packages/markdown-renderer/src/components/markdown-toggle.tsx`
- `packages/markdown-renderer/src/default-components.tsx`
- `packages/markdown-renderer/src/lib/utils.tsx`
- `packages/markdown-renderer/src/types/assets.d.ts`
- `packages/markdown-renderer/src/types/checklist.ts`
- `packages/markdown-renderer/src/types/mdx-components.ts`
- `packages/markdown-renderer/vitest.config.ts`
- `packages/markdown-renderer/vitest.setup.ts`
- `packages/markdown-renderer/__tests__/default-components.test.tsx`
- `packages/markdown-renderer/__tests__/markdown-checklist.test.tsx`
- `packages/markdown-renderer/__tests__/markdown-link.test.tsx`

## Change Log

- 2026-04-12: Ported the default `Markdown*` MDX block component set, exported the typed `defaultComponents` registry, and added package verification tests.

## Status

review
