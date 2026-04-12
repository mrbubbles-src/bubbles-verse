---
story_id: '3.1'
story_key: '3-1-core-serializer-block-type-handlers'
epic: 'Epic 3 — EditorJS → MDX Serializer'
status: ready-for-dev
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

### 1. File Location

```
packages/markdown-editor/src/serializer/
├── index.ts              # exports serializeToMdx and DEFAULT_ALLOWED_MDX_COMPONENTS
├── serialize-to-mdx.ts   # main function
├── block-handlers.ts     # handler per block type
├── security.ts           # escapeMdxBraces, allowlist (Story 3.2)
└── types.ts              # EditorJS block type interfaces (no any)
```

### 2. Function Signature

```ts
import type { OutputData } from '@editorjs/editorjs';

interface SerializeOptions {
  headingAnchorIdsByBlockId?: Record<string, string>; // Story 3.4
  allowedComponents?: string[]; // extends DEFAULT_ALLOWED_MDX_COMPONENTS
}

/**
 * Serializes EditorJS OutputData blocks to a valid MDX string.
 * Every block is wrapped in <div data-block-id="{id}"> for scroll sync targeting.
 */
export function serializeToMdx(
  data: OutputData,
  options?: SerializeOptions
): string;
```

### 3. Block-Wrapping Pattern

Every block output must be wrapped:

```ts
function wrapBlock(blockId: string, content: string): string {
  return `<div data-block-id="${blockId}">\n\n${content}\n\n</div>`;
}
```

### 4. All 15 Block Type Handlers

| Block Type         | EditorJS Tool                   | Expected MDX Output                                   |
| ------------------ | ------------------------------- | ----------------------------------------------------- |
| `paragraph`        | default                         | `<p>` or raw text with inline formatting              |
| `header`           | `@editorjs/header`              | `# text` / `## text` etc. by level                    |
| `list` (unordered) | `@editorjs/list`                | `- item`                                              |
| `list` (ordered)   | `@editorjs/list`                | `1. item`                                             |
| `list` (checklist) | `@editorjs/list`                | `- [ ] item` / `- [x] item`                           |
| `code`             | `@calumk/editorjs-codecup`      | ` ```lang\n...\n``` `                                 |
| `quote`            | `@editorjs/quote`               | `> text\n> — caption`                                 |
| `alert`            | `editorjs-alert`                | `<MarkdownAlerts type="info">...</MarkdownAlerts>`    |
| `delimiter`        | `@coolbytes/editorjs-delimiter` | `---`                                                 |
| `toggle`           | `editorjs-toggle-block`         | `<MarkdownToggle summary="...">` + recursive children |
| `table`            | `@editorjs/table`               | GFM markdown table with padding                       |
| `embed`            | `@editorjs/embed`               | `<MarkdownEmbed url="..." />`                         |
| `image`            | `@editorjs/image`               | `<MarkdownImage src="..." alt="..." />`               |
| `inlineCode`       | `@editorjs/inline-code`         | `` `code` `` inline                                   |
| `strikethrough`    | `@sotaproject/strikethrough`    | `~~text~~`                                            |
| `annotation`       | `editorjs-annotation`           | `<mark>text</mark>` or custom component               |
| `InlineHotkey`     | `editorjs-inline-hotkey`        | `<kbd>key</kbd>`                                      |

**Verify exact data shapes** by inspecting portal-ref's serializer output for each block type — the EditorJS JSON structure varies by plugin version.

### 5. Toggle — Recursive Serialization

Toggle blocks contain nested blocks as children. The handler must recursively call `serializeToMdx` (or the block array serializer):

```ts
function handleToggle(block: ToggleBlock, options: SerializeOptions): string {
  const childContent = block.data.items
    .map((child) => serializeBlock(child, options))
    .join('\n\n');

  return `<MarkdownToggle summary="${escapeMdxBraces(block.data.text)}">\n\n${childContent}\n\n</MarkdownToggle>`;
}
```

### 6. Table — GFM Formatting

Tables need column padding for readability. Build the header row, separator row, and data rows. Use `withHeadings` flag from EditorJS table data:

```ts
// [header row]
// |---|---|---|
// [data rows]
```

If `withHeadings: false`, the first row is data, not a header — still output a valid GFM table (use empty header row).

### 7. `normalizeAlertMessage()`

Alert blocks from EditorJS may contain HTML artifacts. Strip them before serialization:

```ts
function normalizeAlertMessage(html: string): string {
  // Remove <br>, <b>, <i>, etc. — keep text content only
  return html.replace(/<[^>]+>/g, '').trim();
}
```

### 8. Tree-Shakeability

The serializer is exported from `src/index.ts` as a named export. It imports no React, no EditorJS runtime — only TypeScript types from EditorJS (`import type`). This makes it usable in server environments and tree-shakeable:

```ts
// src/index.ts
export { serializeToMdx } from './serializer';
export { DEFAULT_ALLOWED_MDX_COMPONENTS } from './serializer/security';
export { generateSlug } from './utils/generate-slug'; // Story 4.3
```

---

## Anti-Patterns to Avoid

- **No `any` in block type interfaces.** Define proper interfaces for each block's `data` shape.
- **Do not import EditorJS runtime** (`import EditorJS from '@editorjs/editorjs'`) in the serializer. Only `import type` for types.
- **Do not skip the `data-block-id` wrapper.** Every block, every type — even delimiters.
- **Do not use raw string concatenation without `escapeMdxBraces`.** All user text content goes through the escape function (Story 3.2 — implement together or apply after).

---

## Verification Checklist

- [ ] All 15 block types have handlers
- [ ] Every block output wrapped in `<div data-block-id="...">`
- [ ] Toggle blocks recursively serialize children
- [ ] Table blocks produce valid GFM tables
- [ ] No React or EditorJS runtime import (types only)
- [ ] `bun run typecheck` passes

---

## Dev Notes

_To be filled in during implementation._
