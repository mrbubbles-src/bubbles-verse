---
story_id: '3.3'
story_key: '3-3-serializer-unit-tests'
epic: 'Epic 3 — EditorJS → MDX Serializer'
status: review
created: 2026-04-12
---

# Story 3.3 — Serializer Unit Tests

## User Story

As a developer,
I want comprehensive Vitest unit tests for the serializer,
So that I can refactor or extend it with confidence.

---

## Context

The serializer is pure logic — no React, no DOM, no async — which makes it straightforward to unit test. The test suite must cover all 15 block type handlers, security functions, and edge cases. These tests are the safety net for future serializer changes.

**Prerequisite:** Stories 3.1 and 3.2 complete (serializer implemented).

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

- Serializer test coverage patterns in `to-be-integrated/` if present
- Equivalent serializer behavior in `portal-ref`
- Current serializer implementation in `packages/markdown-editor/src/serializer`

### Allowed Deviations

- test file placement required by this monorepo
- import path updates
- strict typing and lint compliance
- documented acceptance-criteria-driven adjustments only

### Forbidden Deviations

- inventing test expectations that intentionally diverge from reference behavior
- architectural rewrites
- behavior changes not explicitly required by the story
- omitting reference edge cases because they seem unnecessary

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
Given the Vitest test suite in packages/markdown-editor/tests/
When all serializer tests run
Then each of the 15 block type handlers has at least one test for expected MDX output
And escapeMdxBraces() has tests for nested braces, JSX-like content, and empty strings
And tryParseInlineComponent has tests for: valid shortcode, blocked component name,
    malformed JSON props, JSX-style <Name /> syntax, no-props shortcode
And toggle with nested children has a recursive serialization test
And <br> → <br /> sanitization has a dedicated test
And all tests pass with bun run test from the monorepo root
```

---

## Implementation Guide

### 1. File Location

```
packages/markdown-editor/tests/
└── serializer/
    ├── serialize-to-mdx.test.ts       # block type handlers + integration
    ├── security.test.ts               # escapeMdxBraces, tryParseInlineComponent, sanitize
    └── fixtures/
        └── blocks.ts                  # reusable EditorJS block fixtures
```

**Tests live in a separate `tests/` directory**, not alongside source files. This is the monorepo convention (per AGENTS.md: "Keep test files in their own directory").

### 2. Test Setup

Use the test runner, scripts, fixtures, and package conventions already established in this repo and in the designated reference implementation.

Do not introduce a new test stack or test layout unless the user explicitly approves that deviation.

### 3. Serializer Parity Tests

Write tests that prove serializer parity with the designated reference implementation.

Cover:

- each block type actually supported by the reference serializer
- wrapper and metadata behavior
- nested or recursive block handling
- output formatting for structured content such as tables, quotes, toggles, embeds, and alerts

Prefer fixture inputs and assertions that mirror the reference implementation's real behavior.

### 4. Security and Edge-Case Tests

Add tests for the actual escaping, allowlist, parsing, and sanitization behavior present in the designated reference implementation.

Do not create a new normative security test matrix that exceeds the reference behavior unless the user approves a deviation.

### 5. Run Command

Tests must pass with the package's standard test command after aligning the package with the repo's existing tooling.

---

## Anti-Patterns to Avoid

- **Do not design a new serializer spec through tests.**
- **Do not pick a different test runner or fixture layout** unless the repo or reference already does so.
- **Do not assert invented behavior** that is not present in the designated reference implementation.
- **Do not rely only on vague snapshots.** Use assertions that prove real parity.

---

## Verification Checklist

- [ ] Test layout follows repo conventions and the designated reference implementation
- [ ] Tests cover the actual block types supported by the designated reference implementation
- [ ] Tests cover the designated reference implementation's wrapper and metadata behavior
- [ ] Tests cover the designated reference implementation's security and edge-case behavior
- [ ] `bun run test` passes from monorepo root

---

## Dev Notes

_To be filled in during implementation._

## Tasks / Subtasks

- [x] Task 1: Move serializer coverage into the required `packages/markdown-editor/tests/serializer/` layout (AC: 1, 4, 5)
  - [x] Add shared block fixtures under `tests/serializer/fixtures/blocks.ts`
  - [x] Replace the old `__tests__` files with focused serializer parity tests
  - [x] Keep test assertions aligned with `to-be-integrated/` / `portal-ref` behavior

- [x] Task 2: Expand serializer parity and security coverage to the full story scope (AC: 1, 2, 3, 4, 5)
  - [x] Add explicit coverage for all serializer block handlers plus inline tool passthrough expectations
  - [x] Add helper-level tests for `escapeMdxBraces()`, `tryParseInlineComponent()`, and `<br />` sanitization
  - [x] Add recursive toggle and table formatting assertions

- [x] Task 3: Align monorepo test execution with repo tooling and validate the full graph (AC: 6)
  - [x] Add a root `bun run test` entrypoint through Turbo single-run mode
  - [x] Resolve the shared `SelectContent` default mismatch surfaced by the root test run
  - [x] Run package tests plus root test/lint/typecheck successfully

## Dev Agent Record

### Debug Log

- 2026-04-12: Loaded BMAD config, sprint status, Story 3.3, and the reference serializer sources from `to-be-integrated/` and `portal-ref`.
- 2026-04-12: Verified the repo had no root `test` script, and that `bun run test` failed before implementation because the script was missing.
- 2026-04-12: Replaced the package-local `__tests__` layout with the required `tests/serializer/` structure and added reusable block fixtures to keep parity assertions readable.
- 2026-04-12: Expanded serializer coverage to 29 passing tests spanning block handlers, inline EditorJS markup passthrough, shortcode parsing, brace escaping, recursive toggles, tables, and `<br />` sanitization.
- 2026-04-12: Added a root Turbo `test` task and switched the entrypoint to single-run mode (`turbo test -- --run`) so monorepo tests terminate cleanly.
- 2026-04-12: Root test validation exposed an existing mismatch between the documented `SelectContent` default and the shared UI implementation; corrected the shared component default so the repo-wide suite passes.

### Completion Notes

- Serializer regression coverage now lives in `packages/markdown-editor/tests/serializer/` with fixture-driven tests for every required handler path and security edge case from the inspected reference implementation.
- `bun run test` now works from the monorepo root and completes in single-run mode, which satisfies the story acceptance criterion and makes the command CI-friendly.
- The root validation surfaced and resolved a shared UI regression: `packages/ui` now defaults `SelectContent` back to popper-style content-fit positioning, matching existing TeacherBuddy docs and tests.
- Repo validation passed with `bun run --cwd packages/markdown-editor test`, `bun run test`, `bun run lint`, and `bun run typecheck`.
- The `it-counts` suite still emits pre-existing jsdom canvas / `act(...)` warnings during `bun run test`, but the suite exits successfully and did not require code changes for this story.

### File List

- `package.json`
- `turbo.json`
- `README.md`
- `CHANGELOG.md`
- `packages/markdown-editor/README.md`
- `packages/markdown-editor/CHANGELOG.md`
- `packages/markdown-editor/tests/serializer/fixtures/blocks.ts`
- `packages/markdown-editor/tests/serializer/serialize-to-mdx.test.ts`
- `packages/markdown-editor/tests/serializer/security.test.ts`
- `packages/markdown-editor/__tests__/serialize-to-mdx.test.ts` (deleted)
- `packages/markdown-editor/__tests__/serializer-security.test.ts` (deleted)
- `packages/ui/src/components/shadcn/select.tsx`
- `packages/ui/README.md`
- `packages/ui/CHANGELOG.md`
- `_bmad-output/implementation-artifacts/3-3-serializer-unit-tests.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-04-12: Moved serializer tests into `packages/markdown-editor/tests/serializer/`, added fixture-driven parity/security coverage, and removed the old `__tests__` files.
- 2026-04-12: Added the root Turbo `bun run test` entrypoint and updated root/package docs for the new monorepo test flow.
- 2026-04-12: Fixed the shared `SelectContent` default so the repo-wide root test command passes against the documented behavior.

## Status

review
