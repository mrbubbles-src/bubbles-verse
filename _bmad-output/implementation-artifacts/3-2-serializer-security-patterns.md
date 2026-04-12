---
story_id: '3.2'
story_key: '3-2-serializer-security-patterns'
epic: 'Epic 3 — EditorJS → MDX Serializer'
status: ready-for-dev
created: 2026-04-12
---

# Story 3.2 — Serializer Security Patterns

## User Story

As a developer,
I want the serializer to enforce security boundaries on user-authored content,
So that no JSX injection, invalid shortcodes, or malformed props reach the MDX output.

---

## Context

This story defines the serializer security boundary that already exists in the reference implementation. Port the security behavior from `to-be-integrated/` first, otherwise from `portal-ref`, and preserve that boundary unless the user explicitly approves a deviation.

Without the reference sanitization behavior, a malicious user could:

- Inject JSX via brace expressions (`{process.env.SECRET}`)
- Insert arbitrary MDX components via shortcode syntax
- Pass malformed prop strings that bypass JSON parsing

These security functions are part of `src/serializer/security.ts` in `@bubbles/markdown-editor`. They must be applied by the block handlers in Story 3.1 — implement together or immediately after.

**Prerequisite:** Story 3.1 in progress or complete (security functions are used by block handlers).

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

- Serializer security implementation in `to-be-integrated/` if present
- Equivalent serializer security implementation in `portal-ref`
- Integration points in `packages/markdown-editor/src/serializer`

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
Given user-authored text containing {, }, or MDX-like expressions
When serializeToMdx() processes the content
Then the designated reference implementation's escaping behavior is applied before serialization

Given a paragraph containing [[ComponentName]] or <ComponentName /> shortcode syntax
When the serializer processes it
Then inline component handling matches the designated reference implementation
And any allowlist extension behavior matches the designated reference implementation

Given a shortcode with JSON props [[Component {"key":"value"}]]
When the serializer processes it
Then prop parsing, validation, and fallback behavior match the designated reference implementation

Given block content containing <br> tags
When serialization completes
Then post-processing sanitization matches the designated reference implementation
```

---

## Implementation Guide

### 1. File Location

`packages/markdown-editor/src/serializer/security.ts`

### 2. Reference-First Extraction

Inspect `to-be-integrated/` first and port the exact serializer security behavior into `packages/markdown-editor/src/serializer/security.ts`.

If the implementation is not available there, inspect `portal-ref` and port the behavior from there.

Only if both sources are unavailable or there is a verified gap may you escalate to the user. Do not silently author a new security model.

### 3. `escapeMdxBraces()`

Port the text-escaping behavior used by the designated reference implementation.

If the reference exposes a helper such as `escapeMdxBraces`, preserve its name, scope, and behavior unless the user explicitly approves a change.

Apply the reference escaping behavior to the same text fields and serialization stages that the reference implementation uses. Do not widen or narrow coverage on your own.

### 4. `DEFAULT_ALLOWED_MDX_COMPONENTS`

If the reference serializer defines a default MDX component allowlist, port that allowlist exactly:

- preserve the same exported constant name if present
- preserve the same default entries
- preserve the same extension rules, if any

Do not invent a new allowlist contract, merge policy, or default component set.

### 5. Allowlist Enforcement Helper

If the reference implementation includes allowlist merge or validation helpers, port those helpers and preserve their behavior.

### 6. `tryParseInlineComponent()`

If the reference implementation parses inline MDX components or shortcode-like content, port the exact accepted syntax, validation rules, fallback behavior, and failure handling.

Do not define new shortcode grammars, prop parsing rules, or component parsing helpers unless the reference already does so or the user approves a deviation.

### 7. `<br>` → `<br />` Sanitization Pass

If the reference serializer performs post-processing or sanitization passes, preserve those passes exactly:

- same stage in the serialization flow
- same transformations
- same scope

Do not add new sanitization passes or remove existing ones without user approval.

### 8. Integration with Block Handlers

Preserve the same integration points used by the reference implementation:

- pre-serialization escaping
- inline component validation, if present
- post-processing sanitization, if present

The designated reference implementation is the source of truth for where these protections are applied.

---

## Anti-Patterns to Avoid

- **Do not silently author a new serializer security model.**
- **Do not change escaping, allowlisting, or sanitization behavior** without first verifying it against the designated reference implementation.
- **Do not add or remove parsing rules** just because they seem safer or simpler.
- **If a real security gap appears to exist, stop and ask the user before deviating.**

---

## Verification Checklist

- [ ] Escaping behavior matches the designated reference implementation
- [ ] Allowlist behavior matches the designated reference implementation
- [ ] Inline component parsing behavior matches the designated reference implementation, if present there
- [ ] Post-processing sanitization matches the designated reference implementation, if present there
- [ ] No new security model was introduced without user approval
- [ ] `bun run typecheck` passes (no `any`)

---

## Dev Notes

_To be filled in during implementation._
