# @bubbles/markdown-editor

Shared markdown editor package for bubbles-verse apps.

## Current Scope

This package now ships:

- the standalone `serializeToMdx()` utility
- the standalone `generateSlug()` utility from the shared metadata flow
- the shared `MarkdownEditor` wrapper around EditorJS plus metadata form hooks
- the portal-ref markdown import modal and markdown-to-EditorJS conversion flow
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
- imports `.md`, `.mdx`, and `.markdown` files through the portal-ref modal flow
- previews converted block counts, image placeholders, and import warnings
- renders a live MDX preview through a reference-style local compile step
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

The editor header includes the same import affordances as `portal-ref`:

- drag a `.md`, `.mdx`, or `.markdown` file onto the dashed drop surface
- or use the import button to open the modal file picker
- review converted block counts and warnings before replacing the current entry

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

For editor UX parity with the working references, the split-pane preview keeps
its last successful compiled output mounted while the next MDX update compiles.
Scroll re-sync runs from a stable compiled version instead of the raw MDX
string, which avoids transient preview collapse and editor scroll jumps during
block insertion.

The serializer preserves the current security boundary from the reference
implementation:

- escapes `{` and `}` before MDX serialization
- only expands explicitly allowlisted inline component shortcodes
- rejects malformed shortcode JSON props and falls back to plain text
- normalizes `<br>` tags to `<br />` in the final MDX output
- optionally accepts `headingAnchorIdsByBlockId` so heading wrapper elements
  expose stable hash targets for TOC links

Legacy demo shortcodes such as `FormBeispiel` are intentionally not part of the
shared package contract.

String props for embedded MDX components are serialized as MDX expressions so
quotes in captions, embed URLs, and image metadata do not break the generated
output. Table cells are normalized before GFM row construction so pipes and
newlines cannot corrupt the table shape.

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
