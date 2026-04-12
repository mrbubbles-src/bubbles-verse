---
story_id: '3.4'
story_key: '3-4-headinganchoridsbybblockid-option'
epic: 'Epic 3 — EditorJS → MDX Serializer'
status: ready-for-dev
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

In `block-handlers.ts`, update the `header` handler to use the map when available:

```ts
function handleHeader(block: HeaderBlock, options: SerializeOptions): string {
  const level = block.data.level ?? 2;
  const text = escapeMdxBraces(block.data.text);
  const prefix = '#'.repeat(level);

  const anchorId = options.headingAnchorIdsByBlockId?.[block.id];

  if (anchorId) {
    // MDX-compatible heading with id attribute
    return `<h${level} id="${anchorId}">${text}</h${level}>`;
  }

  return `${prefix} ${text}`;
}
```

**Note on MDX heading syntax:** Markdown `# Heading` doesn't support `id` attributes directly. Use JSX heading element (`<h2 id="...">`) when an anchor ID is needed. This is valid in MDX.

### 3. Map Population — App Responsibility

The `headingAnchorIdsByBlockId` map is **built by the app**, not the serializer. A typical pattern:

```ts
// App-side: generate anchors from EditorJS output before serializing
function buildAnchorMap(blocks: Block[]): Record<string, string> {
  return Object.fromEntries(
    blocks
      .filter((b) => b.type === 'header')
      .map((b) => [b.id, generateSlug(b.data.text)])
  );
}

const anchorMap = buildAnchorMap(editorData.blocks);
const mdx = serializeToMdx(editorData, {
  headingAnchorIdsByBlockId: anchorMap,
});
```

The serializer doesn't generate the map — it just applies it. Document this in the README.

### 4. No Regression Test

Add to `serialize-to-mdx.test.ts`:

```ts
it('headingAnchorIdsByBlockId — applies anchor id to matching header', () => {
  const result = serializeToMdx(
    {
      blocks: [
        { id: 'h1', type: 'header', data: { text: 'Section', level: 2 } },
      ],
    },
    { headingAnchorIdsByBlockId: { h1: 'section' } }
  );
  expect(result).toContain('id="section"');
});

it('headingAnchorIdsByBlockId — no option → standard markdown heading', () => {
  const result = serializeToMdx({
    blocks: [{ id: 'h1', type: 'header', data: { text: 'Section', level: 2 } }],
  });
  expect(result).toContain('## Section');
  expect(result).not.toContain('id=');
});
```

---

## Anti-Patterns to Avoid

- **Do not auto-generate the anchor map inside `serializeToMdx`.** Keeping generation outside the serializer means the app controls anchor format (slug, UUID, etc.).
- **Do not break base behavior** when the option is omitted — the `?.` optional chaining on the map access ensures this.

---

## Verification Checklist

- [ ] Header handler applies `id` attribute when map entry exists
- [ ] No `id` attribute output when option is omitted
- [ ] Two tests added: with map, without map
- [ ] Option type is `Record<string, string>` (no `any`)
- [ ] `bun run test` passes

---

## Dev Notes

_To be filled in during implementation._
