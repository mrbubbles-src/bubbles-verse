# @bubbles/markdown-editor

Shared markdown editor package for bubbles-verse apps.

## Current Scope

This package now ships:

- the standalone `serializeToMdx()` utility
- the shared `MarkdownEditor` wrapper around EditorJS
- stylesheet exports and the shared EditorJS plugin dependency surface

## Available Imports

```ts
import {
  DEFAULT_PLUGIN_KEYS,
  MarkdownEditor,
  serializeToMdx,
} from '@bubbles/markdown-editor';

import '@bubbles/markdown-editor/styles/editor';
import '@bubbles/markdown-editor/styles/preview';
```

## `MarkdownEditor`

Shared client wrapper around the reference EditorJS setup from
`to-be-integrated/`.

- keeps the reference StrictMode cleanup guard to avoid double initialization
- enables the full 15-tool surface by default
- accepts `plugins` to subset the toolbar without changing the canonical order
- forwards image uploads through an app-provided `imageUploader`
- forwards saved editor state through `onChange`

```tsx
<MarkdownEditor />
```

```tsx
<MarkdownEditor
  imageUploader={uploadImage}
  plugins={['paragraph', 'header', 'list', 'image']}
/>
```

## `serializeToMdx`

Converts EditorJS `OutputData` into the MDX dialect consumed by
`@bubbles/markdown-renderer`.

The serializer preserves the current security boundary from the reference
implementation:

- escapes `{` and `}` before MDX serialization
- only expands allowlisted inline component shortcodes
- rejects malformed shortcode JSON props and falls back to plain text
- normalizes `<br>` tags to `<br />` in the final MDX output
- optionally accepts `headingAnchorIdsByBlockId` so heading wrapper elements
  expose stable hash targets for TOC links

Serializer regression coverage lives in `tests/serializer/` with shared block
fixtures in `tests/serializer/fixtures/blocks.ts`.

```ts
const mdx = serializeToMdx({
  blocks: [
    {
      id: 'intro',
      type: 'paragraph',
      data: { text: 'Hello <span class="inline-code">world</span>' },
    },
  ],
});
```

```ts
const mdxWithAnchors = serializeToMdx(
  {
    blocks: [
      {
        id: 'intro-heading',
        type: 'header',
        data: { level: 2, text: 'Intro' },
      },
    ],
  },
  {
    headingAnchorIdsByBlockId: {
      'intro-heading': 'intro-heading-anchor',
    },
  }
);
```

## Tests

Run the package suite directly:

```bash
bun run --cwd packages/markdown-editor test
```

Or from the monorepo root:

```bash
bun run test
```
