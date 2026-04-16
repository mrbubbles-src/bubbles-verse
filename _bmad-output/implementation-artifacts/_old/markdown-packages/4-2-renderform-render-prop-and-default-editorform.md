---
story_id: '4.2'
story_key: '4-2-renderform-render-prop-and-default-editorform'
epic: 'Epic 4 — Content Authoring Editor'
status: done
created: 2026-04-12
---

# Story 4.2 — `renderForm` Render Prop and Default `<EditorForm>`

## User Story

As a developer,
I want to inject a custom metadata form via `renderForm` or fall back to the default `<EditorForm>`,
So that each product area can define its own fields without touching the package.

---

## Context

Different apps need different metadata forms — Vault entries have categories, Portfolio projects have tech stack tags, etc. The `renderForm` render prop lets each app define its own form while receiving full editor state as typed props. When no `renderForm` is provided, the default `<EditorForm>` renders instead.

**Critical:** The package never handles navigation. `onSuccess` is the only post-submit hook. No router calls anywhere in this package.

**Fields in `<EditorForm>`:** `title` (auto-derived from H1 — Story 4.3), `slug` (auto-generated — Story 4.3), `description`, `tags`, `status` (`published` | `unpublished`).

**Fields NOT in `<EditorForm>` (explicitly removed from lms-ref):** `level`, `difficulty`, `duration`, `order`, `versionBump`, `reasonType`, `reasonText`, `ticketId` — all LMS-specific.

This behavior must be ported from `to-be-integrated/` first, otherwise from `portal-ref`, while preserving the explicitly documented LMS-specific removals.

**Prerequisite:** Story 4.1 (editor wrapper) complete.

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

- Render form and default form implementation in `to-be-integrated/` if present
- Equivalent form implementation in `portal-ref`
- LMS-specific field removals as documented in this story

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
- reintroducing LMS-specific fields without user approval

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
Given <MarkdownEditor renderForm={(props) => <MyForm {...props} />} />
When the editor renders
Then MyForm receives editorOutput, editorContent, editorReady, isEditMode, initialData
     as typed props — all fully typed with no any

Given <MarkdownEditor /> without renderForm
When the editor renders
Then the default <EditorForm> is shown with fields:
     title (auto from H1), slug (auto-generated, manually overridable),
     description, tags, and published | unpublished status

Given <MarkdownEditor imageUploader={fn} onSuccess={fn} />
When a form is submitted
Then onSuccess is called with the serialized data
And the package never handles routing or navigation internally
```

---

## Implementation Guide

### 1. `EditorRenderFormProps` — Full Typed Interface

Port the form-related types from the designated reference implementation and keep them fully typed.

Preserve the same state surface passed into custom forms unless the agreed package API explicitly requires a naming adjustment.

### 2. Render Prop Integration in `<MarkdownEditor>`

Port the render-prop integration behavior from the designated reference implementation, including:

- when custom form rendering is used
- what props are passed into it
- how the default form is selected as fallback
- how editor state flows into the form layer

### 3. Default `<EditorForm>`

Port the default form behavior from the designated reference implementation, including:

- which fields exist
- submit payload shape
- how editor output and serialized content are passed through
- what stays app-controlled vs package-controlled

Do not invent a new default form shape, validation library choice, or field set unless the reference already uses it or the user approves a deviation.

### 4. No Router — Ever

Preserve the reference boundary for submission side effects. If the reference delegates navigation and app-specific behavior through callbacks, keep that contract.

### 5. Exported `<EditorForm>`

Mirror the reference export surface for the default form and related types.

---

## Anti-Patterns to Avoid

- **Do not design a new form contract** if the designated reference implementation already defines one.
- **Do not move app-owned side effects into the package** unless the reference already does so.
- **Do not add or remove fields** unless the designated reference implementation or accepted criteria require it.

---

## Verification Checklist

- [ ] Render-prop behavior matches the designated reference implementation
- [ ] Default form behavior and field set match the designated reference implementation
- [ ] Submission contract matches the designated reference implementation
- [ ] `EditorForm`, `EditorRenderFormProps`, and related types are exported only if the designated reference implementation or agreed package API requires it
- [ ] `bun run typecheck` passes (no `any`)

---

## Dev Notes

_To be filled in during implementation._

## Tasks / Subtasks

- [x] Task 1: Extend the shared `MarkdownEditor` API with typed form hooks and edit-mode state (AC: 1, 3)
  - [x] Add `renderForm`, `onSuccess`, `isEditMode`, and normalized `initialData` support to the public types
  - [x] Keep the editor wrapper responsible for editor state only; no router or persistence logic moved into the package
  - [x] Pass `editorOutput`, `editorContent`, `editorReady`, `isEditMode`, and normalized `initialData` into custom forms

- [x] Task 2: Add the default exported `<EditorForm>` fallback with the required field set (AC: 2, 3)
  - [x] Export `EditorForm` from `@bubbles/markdown-editor`
  - [x] Keep the default form limited to title, slug, description, tags, and `published | unpublished` status
  - [x] Preserve the reference title/slug behavior used by the package form layer without reintroducing LMS-only fields

- [x] Task 3: Add package-local regression coverage and documentation for the new form surface (AC: 1, 2, 3)
  - [x] Add jsdom/RTL coverage for custom render-form props, default form fallback, and the `onSuccess` submit payload
  - [x] Update package README and CHANGELOG for the new form API
  - [x] Verify package and monorepo test, lint, and typecheck commands pass

## Dev Agent Record

### Debug Log

- 2026-04-12: Loaded `bmad-dev-story`, BMAD config, sprint status, Story 4.2, Story 4.1, Story 4.3, and the `to-be-integrated/` plus `portal-ref` editor/form references to confirm the exact extraction scope.
- 2026-04-12: Initialized Next DevTools MCP, read the Next.js docs index, and verified the repo’s current Next.js documentation baseline before editing any code in this session.
- 2026-04-12: Added jsdom/RTL test support to `@bubbles/markdown-editor`, wrote failing Story 4.2 component tests first, then implemented the form surface until the new tests passed.
- 2026-04-12: Verified with `bun run --cwd packages/markdown-editor test`, `bun run --cwd packages/markdown-editor typecheck`, `bun run --cwd packages/markdown-editor lint src tests --max-warnings=0`, `bun run typecheck`, `bun run lint`, and `bun run test`.

### Completion Notes

- Extended `MarkdownEditor` with typed `renderForm`, `onSuccess`, `isEditMode`, and normalized `initialData` support while keeping the package free of navigation and persistence side effects.
- Added the exported default `EditorForm` fallback with the scoped Story 4.2 field set: title, slug, description, tags, and `published | unpublished` status.
- Preserved the reference title/slug derivation behavior inside the form layer using internal slug/title helpers, without exporting the utility surface ahead of Story 4.3.
- Added jsdom/RTL regression coverage for custom form props, default form fallback, and serialized submit payloads, and updated package-local documentation to match the new API.

## File List

- \_bmad-output/implementation-artifacts/4-2-renderform-render-prop-and-default-editorform.md
- \_bmad-output/implementation-artifacts/sprint-status.yaml
- bun.lock
- packages/markdown-editor/CHANGELOG.md
- packages/markdown-editor/README.md
- packages/markdown-editor/package.json
- packages/markdown-editor/src/components/editor-form.tsx
- packages/markdown-editor/src/components/markdown-editor.tsx
- packages/markdown-editor/src/index.ts
- packages/markdown-editor/src/lib/editor-content.ts
- packages/markdown-editor/src/lib/slug-utils.ts
- packages/markdown-editor/src/types/editor.ts
- packages/markdown-editor/tests/editor/markdown-editor-form.test.tsx
- packages/markdown-editor/vitest.config.ts
- packages/markdown-editor/vitest.setup.ts

## Change Log

- 2026-04-12: Development started.
- 2026-04-12: Added the Story 4.2 form surface: typed `renderForm`, exported `EditorForm`, normalized edit-mode `initialData`, serialized `onSuccess` payloads, package-local component tests, and updated package documentation.

## Status

review
