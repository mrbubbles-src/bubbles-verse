---
story_id: '4.6'
story_key: '4-6-import-from-markdown-modal-and-editor-css'
epic: 'Epic 4 — Content Authoring Editor'
status: ready-for-dev
created: 2026-04-12
---

# Story 4.6 — Import-from-Markdown Modal and Editor CSS

## User Story

As a developer (and as a content author),
I want to import existing Markdown into the editor and have correct editor styles,
So that migrating existing content is easy and the editor looks right out of the box.

---

## Context

Two deliverables in this story:

1. **Import modal** — paste Markdown, convert to EditorJS blocks, replace editor content
2. **Editor and preview CSS** — `editor.css` and `preview.css` stylesheets for the editor interface

CSS files are already scaffolded as empty placeholders (Story 1.2). This story fills them with actual styles.

**Prerequisite:** Stories 4.1–4.5 complete (full editor operational).

---

## Mandatory Implementation Directives

- Follow `AGENTS.md` for every implementation decision in this story.
- If relevant code already exists in `portal-ref` or `lms-ref` or `to-be-integrated`, reuse that working code first and port it cleanly into the target package or app.
- Adapt reference code only as needed for this monorepo plan, package boundaries, typing, naming, and acceptance criteria.
- Do not rewrite or redesign working reference code unnecessarily when a clean extraction or transfer is sufficient.

## Acceptance Criteria

```gherkin
Given the import modal is opened
When a Markdown string is pasted and confirmed
Then the editor content is replaced with the converted EditorJS blocks

Given import '@bubbles/markdown-editor/styles/editor' and
      import '@bubbles/markdown-editor/styles/preview' in an app
When <MarkdownEditor> renders
Then EditorJS toolbar, block styles, and split-pane layout are correctly styled
And all CSS uses only @bubbles/ui/globals.css custom properties — no hardcoded colors
And editor and preview CSS are separate files — apps can import only what they need
```

---

## Implementation Guide

### 1. Import Modal Component

```tsx
// components/import-modal.tsx

import { Dialog, DialogContent, DialogHeader } from '@bubbles/ui/shadcn/dialog';

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (markdownContent: string) => void;
}

export function ImportModal({ open, onClose, onImport }: ImportModalProps) {
  const [value, setValue] = useState('');

  function handleConfirm() {
    if (value.trim()) {
      onImport(value);
      onClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>Import Markdown</DialogHeader>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Paste Markdown here..."
          rows={15}
        />
        <div>
          <button onClick={onClose}>Cancel</button>
          <button onClick={handleConfirm}>Import</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### 2. Markdown → EditorJS Block Conversion

Use the `markdownToBlocks` utility (from `@editorjs/editorjs` ecosystem or implement inline). If no suitable package exists, a basic converter handles the common cases:

```ts
// utils/markdown-to-blocks.ts

import type { OutputData } from '@editorjs/editorjs';

/**
 * Converts a Markdown string to EditorJS OutputData blocks.
 * Handles: headings, paragraphs, lists, code blocks, blockquotes.
 * For richer conversion, consider @editorjs/paste-handler or similar.
 */
export function markdownToBlocks(markdown: string): OutputData {
  // parse markdown lines into EditorJS block objects
  // ...
}
```

Check portal-ref for the existing implementation — use it verbatim if present.

### 3. Replace Editor Content

When the author confirms the import, replace the current EditorJS content:

```ts
async function handleImport(markdown: string) {
  const data = markdownToBlocks(markdown);
  await editorRef.current?.render(data);
  const newOutput = await editorRef.current?.save();
  if (newOutput) setEditorOutput(newOutput);
}
```

### 4. `editor.css` — EditorJS Toolbar and Layout

Fill `packages/markdown-editor/src/styles/editor.css` with styles for:

```css
/* @bubbles/markdown-editor — editor styles */

/* ── EditorJS toolbar overrides ── */
.ce-toolbar {
  /* ... */
}
.ce-block {
  /* ... */
}

/* ── Split-pane layout ── */
.markdown-editor-split-pane {
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 100%;
  gap: var(--spacing-4);
}

.editor-pane {
  overflow-y: auto;
  border-right: 1px solid var(--border);
}

/* ── Import button ── */
.import-markdown-btn {
  /* ... */
}
```

All colors via `@bubbles/ui/globals.css` custom properties only. Source the complete styles from portal-ref — do not invent styles from scratch.

### 5. `preview.css` — Preview Pane

Fill `packages/markdown-editor/src/styles/preview.css` with styles for the preview wrapper:

```css
/* @bubbles/markdown-editor — preview pane styles */

.preview-pane {
  overflow-y: auto;
  padding: var(--spacing-4);
}

/* No editor toolbar or block creation styles here */
```

The content typography styles are in `@bubbles/markdown-renderer/styles/renderer` — import both in the app.

### 6. Separate CSS Files

The package exports three separate CSS entry points (scaffolded in Story 1.2):

- `@bubbles/markdown-editor/styles/editor` — EditorJS toolbar, block styles, layout
- `@bubbles/markdown-editor/styles/preview` — preview pane wrapper
- `@bubbles/markdown-renderer/styles/renderer` — rendered content typography + syntax highlighting

An app that only renders content (no editing) imports only `renderer`. An app using the full editor imports all three.

---

## Anti-Patterns to Avoid

- **No hardcoded colors** in any CSS file.
- **No editor styles in `preview.css`** and vice versa — keep them cleanly separated.
- **Do not add content typography styles to `editor.css` or `preview.css`** — those belong in `renderer.css`.
- **Use `@bubbles/ui/shadcn/dialog`** for the modal — do not build a custom modal from scratch.

---

## Verification Checklist

- [ ] Import modal opens, accepts Markdown, replaces editor content on confirm
- [ ] `editor.css` styles EditorJS toolbar and split-pane layout
- [ ] `preview.css` styles the preview pane wrapper
- [ ] Both CSS files use only CSS custom properties from `@bubbles/ui/globals.css`
- [ ] No hardcoded color values
- [ ] `editor.css` and `preview.css` are separate — apps can import only one

---

## Dev Notes

_To be filled in during implementation._
