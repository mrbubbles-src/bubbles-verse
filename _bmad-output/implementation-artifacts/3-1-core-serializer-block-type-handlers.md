---
story_id: "3.1"
story_key: "3-1-core-serializer-block-type-handlers"
epic: "Epic 3 — EditorJS → MDX Serializer"
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

The final serializer = all handlers from `portal-ref` + `headingAnchorIdsByBlockId` option from `lms-ref`. Story 3.4 adds the option; this story implements the 15 handlers.

The serializer must be **tree-shakeable** — importable without loading React or EditorJS.

**Prerequisite:** Story 1.2 (editor scaffold) complete.

---

## Mandatory Implementation Directives

- Follow `AGENTS.md` for every implementation decision in this story.
- If relevant code already exists in `portal-ref` or `lms-ref`, reuse that working code first and port it cleanly into the target package or app.
- Adapt reference code only as needed for this monorepo plan, package boundaries, typing, naming, and acceptance criteria.
- Do not rewrite or redesign working reference code unnecessarily when a clean extraction or transfer is sufficient.

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
  allowedComponents?: string[];                        // extends DEFAULT_ALLOWED_MDX_COMPONENTS
}

/**
 * Serializes EditorJS OutputData blocks to a valid MDX string.
 * Every block is wrapped in <div data-block-id="{id}"> for scroll sync targeting.
 */
export function serializeToMdx(data: OutputData, options?: SerializeOptions): string;
```

### 3. Block-Wrapping Pattern

Every block output must be wrapped:

```ts
function wrapBlock(blockId: string, content: string): string {
  return `<div data-block-id="${blockId}">\n\n${content}\n\n</div>`;
}
```

### 4. All 15 Block Type Handlers

| Block Type | EditorJS Tool | Expected MDX Output |
|---|---|---|
| `paragraph` | default | `<p>` or raw text with inline formatting |
| `header` | `@editorjs/header` | `# text` / `## text` etc. by level |
| `list` (unordered) | `@editorjs/list` | `- item` |
| `list` (ordered) | `@editorjs/list` | `1. item` |
| `list` (checklist) | `@editorjs/list` | `- [ ] item` / `- [x] item` |
| `code` | `@calumk/editorjs-codecup` | ` ```lang\n...\n``` ` |
| `quote` | `@editorjs/quote` | `> text\n> — caption` |
| `alert` | `editorjs-alert` | `<MarkdownAlerts type="info">...</MarkdownAlerts>` |
| `delimiter` | `@coolbytes/editorjs-delimiter` | `---` |
| `toggle` | `editorjs-toggle-block` | `<MarkdownToggle summary="...">` + recursive children |
| `table` | `@editorjs/table` | GFM markdown table with padding |
| `embed` | `@editorjs/embed` | `<MarkdownEmbed url="..." />` |
| `image` | `@editorjs/image` | `<MarkdownImage src="..." alt="..." />` |
| `inlineCode` | `@editorjs/inline-code` | `` `code` `` inline |
| `strikethrough` | `@sotaproject/strikethrough` | `~~text~~` |
| `annotation` | `editorjs-annotation` | `<mark>text</mark>` or custom component |
| `InlineHotkey` | `editorjs-inline-hotkey` | `<kbd>key</kbd>` |

**Verify exact data shapes** by inspecting portal-ref's serializer output for each block type — the EditorJS JSON structure varies by plugin version.

### 5. Toggle — Recursive Serialization

Toggle blocks contain nested blocks as children. The handler must recursively call `serializeToMdx` (or the block array serializer):

```ts
function handleToggle(block: ToggleBlock, options: SerializeOptions): string {
  const childContent = block.data.items
    .map(child => serializeBlock(child, options))
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
