---
story_id: '3.1'
story_key: '3-1-core-serializer-block-type-handlers'
epic: 'Epic 3 — EditorJS → MDX Serializer'
status: review
created: 2026-04-12
---

# Story 3.1 — Core Serializer — Block Type Handlers

## User Story

As a developer,
I want `serializeToMdx()` exported from `@bubbles/markdown-editor` covering all 15 block types,
So that EditorJS output is converted to valid MDX I can store and render.

---

## Context

The serializer is the bridge between EditorJS JSON output and the MDX strings stored in the database and rendered by `<MdxRenderer>`. It's the most critical piece of the entire package.

**Two diverging reference implementations must be merged:**

- `portal-ref`: all 15 block type handlers, including `inlineCode`, `strikethrough`, `annotation`, `InlineHotkey`
- `lms-ref`: `headingAnchorIdsByBlockId` option for TOC generation

The final serializer = all handlers from `to-be-integrated/` first, otherwise from `portal-ref`, plus the explicitly documented `headingAnchorIdsByBlockId` addition from `lms-ref` handled in Story 3.4.

The serializer must be **tree-shakeable** — importable without loading React or EditorJS.

**Prerequisite:** Story 1.2 (editor scaffold) complete.

---

## Mandatory Implementation Contract

- Follow `AGENTS.md` for every implementation decision in this story.
- Port the existing working implementation from the designated reference source as the default path.
- Use `to-be-integrated/` first when the relevant implementation exists there.
- If the relevant implementation is not present in `to-be-integrated/`, use `portal-ref` for the serializer baseline and only use `lms-ref` for explicitly documented additions.
- Do not rewrite, redesign, or replace a working reference implementation with a newly authored one unless this story explicitly documents an approved exception.
- If a reference implementation and this story appear to conflict, preserve the reference behavior and escalate the conflict instead of inventing a new solution.

### Primary Reference Source

`to-be-integrated/`

### Fallback Reference Source

`portal-ref` for the baseline serializer, with explicitly documented `lms-ref` additions only

### Reference Files / Modules

- Serializer implementation in `to-be-integrated/` if present
- Equivalent serializer implementation in `portal-ref`
- `lms-ref` only for the separately documented heading-anchor behavior

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
Given EditorJS OutputData with any combination of blocks
When serializeToMdx(blocks) is called
Then paragraph, header, list (ordered/unordered/checklist), code, quote, alert,
     delimiter, toggle, table, embed, image, inlineCode, strikethrough,
     annotation, InlineHotkey all produce correct MDX output
And every block is wrapped in <div data-block-id="{blockId}"> for scroll targeting
And toggle blocks recursively serialize their nested child blocks
And table blocks produce correctly padded GFM markdown tables with optional heading separator
And the function is tree-shakeable — importable standalone without loading EditorJS or React
```

---

## Implementation Guide

### 1. Reference-First Extraction

Inspect `to-be-integrated/` first and port the serializer module layout, handler boundaries, and output behavior from there.

If the relevant implementation is not available there, inspect `portal-ref` and port the behavior from there.

Do not invent a new serializer architecture, handler taxonomy, wrapper strategy, or export surface unless the user explicitly approves a deviation.

### 2. File and Module Placement

Use the reference implementation to determine:

- serializer file layout
- handler file boundaries
- public vs internal modules
- exported vs non-exported helpers

Only adapt file placement as needed for the monorepo package structure.

### 3. Block Handler Scope

Port the exact set of block handlers supported by the designated reference implementation.

Do not expand, shrink, rename, or reinterpret the supported block set based on preference. If the reference supports a block type, preserve it. If the reference omits a block type, do not add one unless the story or user explicitly requires it.

### 4. Wrapper and Metadata Behavior

Preserve the exact wrapper behavior used by the reference serializer, including any block container elements, metadata attributes, or per-block identifiers used by downstream features such as preview mapping or scroll sync.

If the reference wraps every block, keep that behavior. If it applies wrapper behavior selectively, preserve that behavior instead. Do not normalize this on your own.

### 5. Nested and Structured Blocks

Preserve the exact handling of nested or structured content from the reference implementation, including recursive serialization, list nesting, table formatting, embeds, alerts, and other compound block output.

Where the reference includes normalization or cleanup helpers for specific block types, port those helpers rather than designing new ones.

### 6. Public API Surface

Mirror the reference serializer API as closely as possible:

- main serializer entry point
- option names and option behavior
- exported constants and helpers
- internal-only helpers that should remain unexported

Only adapt naming or exports where explicitly required by the agreed package API.

---

## Anti-Patterns to Avoid

- **Do not replace the reference serializer structure with a new one** because it seems cleaner or more generic.
- **Do not hardcode a new canonical block taxonomy** unless the reference already does so.
- **Do not change wrapper behavior or metadata attributes** without first verifying them against the reference implementation.
- **Do not author new helper behavior** where the reference already has working handling for the same case.

---

## Verification Checklist

- [ ] Supported block handlers match the designated reference implementation
- [ ] Wrapper and metadata behavior match the designated reference implementation
- [ ] Nested and structured block output matches the designated reference implementation
- [ ] Public serializer API matches the designated reference implementation unless an approved deviation exists
- [ ] No new serializer architecture was introduced without user approval
- [ ] `bun run typecheck` passes

---

## Dev Notes

_To be filled in during implementation._

## Tasks / Subtasks

- [x] Task 1: Port the reference serializer block handlers into `@bubbles/markdown-editor` (AC: all)
  - [x] Add typed serializer input and block/list helper types
  - [x] Port paragraph, header, list, code, quote, alert, delimiter, toggle, table, embed, and image handling from the reference serializer
  - [x] Preserve block wrapper behavior with `<div data-block-id="...">` for every serialized block
  - [x] Preserve recursive toggle serialization and table padding behavior from the reference implementation

- [x] Task 2: Expose the serializer through the package public API and package-local docs (AC: all)
  - [x] Export `serializeToMdx` from `packages/markdown-editor/src/index.ts`
  - [x] Keep the serializer tree-shakeable by avoiding React and EditorJS runtime imports
  - [x] Update the package README with serializer usage
  - [x] Update the package CHANGELOG with the new export

- [x] Task 3: Add regression tests and run implementation validations (AC: all)
  - [x] Add serializer unit tests in `packages/markdown-editor/__tests__/`
  - [x] Run `bun install` to sync the package test dependency
  - [x] Run `bun run --cwd packages/markdown-editor test`
  - [x] Run `bun run --cwd packages/markdown-editor typecheck`
  - [x] Run `bun run typecheck`
  - [x] Run `bun run lint`

## Dev Agent Record

### Debug Log

- 2026-04-12: Loaded `bmad-dev-story` workflow, BMAD config, sprint status, and Story 3.1 context. Confirmed the first `ready-for-dev` story is `3-1-core-serializer-block-type-handlers`.
- 2026-04-12: Initialized Next.js DevTools MCP per repo rules, then inspected `to-be-integrated/` and `portal-ref` to confirm the serializer baseline and wrapper behavior.
- 2026-04-12: Verified the primary reference serializer lives in `to-be-integrated/md-editor/markdown-editor/editor/convert-editor-js-to-mdx.tsx` and that inline EditorJS tools are preserved as inline HTML within text blocks, not as standalone block handlers.
- 2026-04-12: Added package-local serializer modules, exported `serializeToMdx`, and adapted the emitted MDX component names from the reference `Modules*` names to the package API `Markdown*` names already established by `@bubbles/markdown-renderer`.
- 2026-04-12: Added package serializer tests, synced the new Vitest dependency with `bun install`, and validated package + monorepo typecheck/lint after fixing TypeScript narrowing issues in the serializer implementation.

### Completion Notes

- `@bubbles/markdown-editor` now exports a standalone `serializeToMdx()` utility that converts EditorJS block output into the MDX dialect consumed by `@bubbles/markdown-renderer`.
- The serializer preserves the reference wrapper behavior (`data-block-id`), recursive toggle handling, padded GFM table output, checklist component output, and final `<br>` sanitization.
- Inline EditorJS tools (`inlineCode`, `strikethrough`, `annotation`, `InlineHotkey`) continue to flow through as inline HTML embedded inside text-based blocks, matching the inspected reference implementation.
- Validation passed with package tests, package typecheck, monorepo typecheck, and monorepo lint.

### File List

- `packages/markdown-editor/package.json`
- `packages/markdown-editor/README.md`
- `packages/markdown-editor/CHANGELOG.md`
- `packages/markdown-editor/src/index.ts`
- `packages/markdown-editor/src/lib/serialize-to-mdx.ts`
- `packages/markdown-editor/src/lib/serializer-utils.ts`
- `packages/markdown-editor/src/types/serializer.ts`
- `packages/markdown-editor/__tests__/serialize-to-mdx.test.ts`
- `_bmad-output/implementation-artifacts/3-1-core-serializer-block-type-handlers.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `bun.lock`

## Change Log

- 2026-04-12: Ported the core EditorJS-to-MDX serializer into `@bubbles/markdown-editor` and exposed it as the package's first runtime utility export.
- 2026-04-12: Added serializer regression tests plus package-local README and changelog updates for the new API surface.

## Status

review
