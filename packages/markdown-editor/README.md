# @bubbles/markdown-editor

Shared markdown editor package for bubbles-verse apps.

## Current Scope

This package now ships:

- the standalone `serializeToMdx()` utility
- shared slug helpers for segment and path normalization
- the shared `MarkdownEditor` wrapper around EditorJS plus metadata form hooks
- the portal-ref markdown import modal and markdown-to-EditorJS conversion flow
- a live split-pane MDX preview with block-aware bidirectional scroll sync
- the exported default `EditorForm` fallback for app-agnostic entry metadata
- thin shared helpers for EditorJS image uploads and signed Cloudinary uploads
- stylesheet exports and the shared EditorJS plugin dependency surface

## Available Imports

```ts
import {
  createEditorImageUploader,
  DEFAULT_PLUGIN_KEYS,
  EditorForm,
  generateSlug,
  joinSlugSegments,
  MarkdownEditor,
  normalizeSlugPath,
  serializeToMdx,
  slugifySegment,
} from '@bubbles/markdown-editor';

import '@bubbles/markdown-editor/styles/editor';
import '@bubbles/markdown-editor/styles/preview';

import {
  createEditorImageUploadResponse,
  isUploadFile,
  resolveCloudinaryErrorResponse,
  uploadEditorImageToCloudinary,
} from '@bubbles/markdown-editor/cloudinary-upload';
import { createCloudinaryUploadRoute } from '@bubbles/markdown-editor/cloudinary-upload-route';
```

## `MarkdownEditor`

Shared client wrapper around the reference EditorJS setup from
`to-be-integrated/`.

- keeps EditorJS mounts stable across React dev lifecycles with explicit
  teardown/re-init sequencing
- tears down and recreates EditorJS explicitly when real configuration changes require it
- avoids replaying the same initial document back into a freshly mounted
  EditorJS instance, which prevents DOM teardown races in live app mounts
- enables the full 15-tool surface by default
- accepts `plugins` to subset the toolbar without changing the canonical order
- restores mode-specific drafts from localStorage on mount
- autosaves create/edit drafts to the reference storage keys while authors type
- accepts optional `draftStorageScope` so apps can isolate drafts per record
- imports `.md`, `.mdx`, and `.markdown` files through the portal-ref modal flow
- previews converted block counts, image placeholders, and import warnings
- renders a live MDX preview through a reference-style local compile step
- uses a client-safe preview component registry so markdown image blocks work
  inside the client-rendered editor preview
- keeps editor and preview scroll positions aligned by shared block ids
- renders a custom metadata form through `renderForm`, or falls back to `EditorForm`
- forwards image uploads through an app-provided `imageUploader`
- forwards saved editor state through `onChange`
- returns serialized submit payloads through `onSuccess`
- lets the default form derive path-like slugs through `slugStrategy`

```tsx
<MarkdownEditor />
```

```tsx
<MarkdownEditor
  draftStorageScope="vault-entry:create"
  imageUploader={uploadImage}
  onSuccess={(entry) => saveEntry(entry)}
  plugins={['paragraph', 'header', 'list', 'image']}
  slugStrategy={({ context, title }) => [context?.section, title]}
  slugStrategyContext={{ section: 'vault' }}
/>
```

The editor header includes the same import affordances as `portal-ref`:

- drag a `.md`, `.mdx`, or `.markdown` file onto the dashed drop surface
- or use the import button to open the modal file picker
- review converted block counts and warnings before replacing the current entry

```tsx
<MarkdownEditor
  draftStorageScope={`vault-entry:${existingEntry.id}`}
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

- field state is managed through `react-hook-form`
- the default package form is composed with shadcn/ui `Field` primitives
- title is derived from the first H1 block in the editor content
- slug auto-follows the derived title until the author edits it manually
- slugs are normalized as paths, so app strategies can safely return
  `section/title`-style values
- description, tags, and status (`published` | `unpublished`) stay package-level
- create mode uses `topic-editor-create-draft`; edit mode uses `topic-editor-edit-draft`
- `draftStorageScope` appends a stable suffix like `vault-entry:<id>` when one
  app needs isolated local drafts per entity
- successful submits clear the active draft and stop stale post-submit rewrites
- loading a new `initialData` session resets form-local overrides instead of relying on a remount key
- apps can shape the default-form slug through `slugStrategy` and optional
  `slugStrategyContext`
- submit calls `onSuccess` with `{ title, slug, description, tags, status, editorContent, serializedContent, isEditMode }`
- the package TypeScript config also checks `tests/`, so local editor warnings in
  test files should match `tsc --noEmit`

Use the package form when your app only needs shared entry metadata:

- `title`
- `description`
- `slug`
- `status`
- `tags`

Use `renderForm` when your app needs extra domain-specific fields such as:

- category trees
- product- or project-specific metadata
- review or workflow states
- anything beyond the shared metadata contract

`renderForm` only replaces the **Metadatenformular**. It does not replace the
shared EditorJS shell, import flow, preview, serializer, or renderer contract.

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

## Slug helpers

Use the exported helpers when an app needs the exact same slug normalization as
the package form.

```ts
const slug = generateSlug('Grüß&nbsp;Gott');
// "gruess-gott"
```

```ts
const pathSlug = joinSlugSegments(['2026', '04', 'Grüß Gott']);
// "2026/04/gruess-gott"
```

Typical app-side strategy patterns:

```ts
const blogSlug = ({ context, title }: MarkdownEditorSlugStrategyInput) => [
  String(context?.year ?? ''),
  String(context?.month ?? ''),
  title,
];
```

```ts
const vaultSlug = ({ context, title }: MarkdownEditorSlugStrategyInput) => [
  String(context?.mainCategory ?? ''),
  String(context?.subCategory ?? ''),
  title,
];
```

```ts
const portfolioSlug = ({ title }: MarkdownEditorSlugStrategyInput) => [
  'projects',
  title,
];
```

These strategies stay app-owned. The package only normalizes segments and joins
the final path safely.

## Bild-Uploads

Für neue Integrationen ist der Ziel-Schnitt:

- eine app-lokale Next-Route pro App
- ein kleiner Shared-Client-Uploader aus dem Package
- ein kleiner Shared-Cloudinary-Helper aus dem Package

Die Shared-Helper erwarten die Repo-Standard-Env-Variablen:

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
NEXT_PUBLIC_CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

### Client-Uploader

```ts
const uploadImage = createEditorImageUploader({
  endpoint: '/api/image-upload',
  imageFolder: 'vault/editor',
});
```

Der Client-Helper normalisiert Blob-basierte EditorJS-Uploads vor dem `fetch`
zu echten `File`-Objekten mit stabilem Dateinamen. Das hält den Multipart-Body
näher am Referenzpfad und vermeidet Unterschiede zwischen Datei-, Clipboard-
und Drag-and-drop-Uploads.

Der Server-Helper nutzt den offiziell signierten Cloudinary Upload-API-Request
direkt per `fetch`, statt sich auf den SDK-Streampfad zu verlassen. Das ist im
Monorepo wichtig, weil dieselbe Datei unter Bun über den SDK-Streampfad als
unsigned fehlklassifiziert werden konnte, während der signierte REST-Upload
stabil funktioniert.

Die vollständigen technischen Findings dazu stehen in
[documentation/image-upload-findings.md](./documentation/image-upload-findings.md).

### App-lokale Route

Minimaler Route-Handler mit app-seitiger Folder-Validierung:

```ts
import { NextResponse } from 'next/server';

import {
  createEditorImageUploadResponse,
  isUploadFile,
  resolveCloudinaryErrorResponse,
  uploadEditorImageToCloudinary,
} from '@bubbles/markdown-editor/cloudinary-upload';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('image');
    const folder = formData.get('imageFolder');

    if (!isUploadFile(file)) {
      return NextResponse.json(
        { message: 'No file uploaded.', success: 0 },
        { status: 400 }
      );
    }

    if (typeof folder !== 'string' || !folder.trim()) {
      return NextResponse.json(
        { message: 'Missing imageFolder field.', success: 0 },
        { status: 400 }
      );
    }

    const uploadResult = await uploadEditorImageToCloudinary(file, {
      folder,
    });

    return NextResponse.json(createEditorImageUploadResponse(uploadResult));
  } catch (error) {
    const { message, status } = resolveCloudinaryErrorResponse(error);
    return NextResponse.json({ message, success: 0 }, { status });
  }
}
```

`createCloudinaryUploadRoute` stays available as a convenience wrapper when an
app wants the same behavior with even less route code, but die bevorzugte
Richtung ist die app-lokale dünne Route plus Shared-Helper.

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
