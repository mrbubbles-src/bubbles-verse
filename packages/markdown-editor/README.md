# @bubbles/markdown-editor

Shared markdown editor package for bubbles-verse apps.

## Current Scope

This package now ships:

- the standalone `serializeToMdx()` utility
- the standalone `generateSlug()` utility from the shared metadata flow
- the shared `MarkdownEditor` wrapper around EditorJS plus metadata form hooks
- a live split-pane MDX preview with block-aware bidirectional scroll sync
- the exported default `EditorForm` fallback for app-agnostic entry metadata
- stylesheet exports and the shared EditorJS plugin dependency surface

## Available Imports

```ts
import {
  DEFAULT_PLUGIN_KEYS,
  EditorForm,
  MarkdownEditor,
  generateSlug,
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
- restores mode-specific drafts from localStorage on mount
- autosaves create/edit drafts to the reference storage keys while authors type
- renders a live MDX preview through `@bubbles/markdown-renderer`
- keeps editor and preview scroll positions aligned by shared block ids
- renders a custom metadata form through `renderForm`, or falls back to `EditorForm`
- forwards image uploads through an app-provided `imageUploader`
- forwards saved editor state through `onChange`
- returns serialized submit payloads through `onSuccess`

```tsx
<MarkdownEditor />
```

```tsx
<MarkdownEditor
  imageUploader={uploadImage}
  onSuccess={(entry) => saveEntry(entry)}
  plugins={['paragraph', 'header', 'list', 'image']}
/>
```

```tsx
<MarkdownEditor
  initialData={{
    content: existingEntry.editorContent,
    description: existingEntry.description,
    slug: existingEntry.slug,
    status: existingEntry.status,
    tags: existingEntry.tags,
    title: existingEntry.title,
  }}
  isEditMode
  onSuccess={(entry) => saveEntry(entry)}
  renderForm={({ editorContent, editorOutput, editorReady, initialData }) => (
    <VaultEntryForm
      editorContent={editorContent}
      editorOutput={editorOutput}
      editorReady={editorReady}
      initialData={initialData}
    />
  )}
/>
```

### Default `EditorForm`

`MarkdownEditor` renders `EditorForm` automatically when `renderForm` is not
provided.

- title is derived from the first H1 block in the editor content
- slug auto-follows the derived title until the author edits it manually
- description, tags, and status (`published` | `unpublished`) stay package-level
- create mode uses `topic-editor-create-draft`; edit mode uses `topic-editor-edit-draft`
- successful submits clear the active draft and stop stale post-submit rewrites
- submit calls `onSuccess` with `{ title, slug, description, tags, status, editorContent, serializedContent, isEditMode }`

You can also import and render the default form directly:

```tsx
<EditorForm
  editorContent={editorContent}
  editorOutput={editorOutput}
  editorReady={editorReady}
  initialData={initialData}
  isEditMode={isEditMode}
  onSuccess={(entry) => saveEntry(entry)}
/>
```

## `generateSlug`

Use the exported helper when an app needs the exact same slug normalization as
the package form.

```ts
const slug = generateSlug('Grüß&nbsp;Gott');
// "gruess-gott"
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

Type-check and lint the package directly:

```bash
bun run --cwd packages/markdown-editor typecheck
bun run --cwd packages/markdown-editor lint src tests --max-warnings=0
```

Or from the monorepo root:

```bash
bun run test
```
