# @bubbles/markdown-editor

Shared markdown editor package for bubbles-verse apps.

## Current Scope

This package now ships the standalone `serializeToMdx()` utility plus the
stylesheet exports and EditorJS plugin dependency surface. Higher-level editor
components land in later stories.

## Available Imports

```ts
import { serializeToMdx } from '@bubbles/markdown-editor';
import '@bubbles/markdown-editor/styles/editor';
import '@bubbles/markdown-editor/styles/preview';
```

## `serializeToMdx`

Converts EditorJS `OutputData` into the MDX dialect consumed by
`@bubbles/markdown-renderer`.

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
