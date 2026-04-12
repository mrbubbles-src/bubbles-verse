---
story_id: "3.4"
story_key: "3-4-headinganchoridsbybblockid-option"
epic: "Epic 3 — EditorJS → MDX Serializer"
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

The `lms-ref` reference implementation has this feature. It allows apps to pass a pre-populated map of `{ blockId: anchorId }`, which the serializer uses to add `id="..."` attributes to rendered headings — enabling deep-linking from a Table of Contents.

This is an additive option on the existing `serializeToMdx()` signature. When omitted, behavior is identical to the base Story 3.1 implementation.

**Prerequisite:** Story 3.1 complete (base serializer).

---

## Mandatory Implementation Directives

- Follow `AGENTS.md` for every implementation decision in this story.
- If relevant code already exists in `portal-ref` or `lms-ref`, reuse that working code first and port it cleanly into the target package or app.
- Adapt reference code only as needed for this monorepo plan, package boundaries, typing, naming, and acceptance criteria.
- Do not rewrite or redesign working reference code unnecessarily when a clean extraction or transfer is sufficient.

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
      .filter(b => b.type === 'header')
      .map(b => [b.id, generateSlug(b.data.text)])
  );
}

const anchorMap = buildAnchorMap(editorData.blocks);
const mdx = serializeToMdx(editorData, { headingAnchorIdsByBlockId: anchorMap });
```

The serializer doesn't generate the map — it just applies it. Document this in the README.

### 4. No Regression Test

Add to `serialize-to-mdx.test.ts`:

```ts
it('headingAnchorIdsByBlockId — applies anchor id to matching header', () => {
  const result = serializeToMdx(
    { blocks: [{ id: 'h1', type: 'header', data: { text: 'Section', level: 2 } }] },
    { headingAnchorIdsByBlockId: { h1: 'section' } }
  );
  expect(result).toContain('id="section"');
});

it('headingAnchorIdsByBlockId — no option → standard markdown heading', () => {
  const result = serializeToMdx(
    { blocks: [{ id: 'h1', type: 'header', data: { text: 'Section', level: 2 } }] }
  );
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
