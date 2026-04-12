---
story_id: "4.1"
story_key: "4-1-editorjs-wrapper-with-configurable-plugin-subset"
epic: "Epic 4 — Content Authoring Editor"
status: ready-for-dev
created: 2026-04-12
---

# Story 4.1 — EditorJS Wrapper with Configurable Plugin Subset

## User Story

As a developer,
I want `<MarkdownEditor>` with all 15 block types available and a `plugins` prop for subsetting,
So that I can activate only the blocks relevant to each use case.

---

## Context

`<MarkdownEditor>` wraps EditorJS with a React lifecycle bridge. The most critical challenge is React 18 StrictMode's double-mount behavior — EditorJS must not initialize twice. The `cleanupHasRunOnceRef` pattern from `portal-ref/editor.tsx:175` solves this and must be preserved exactly.

The `plugins` prop controls which block types appear in the toolbar. Default: all 15. App passes a `PluginKey[]` array to activate a subset.

**Prerequisite:** Story 1.2 (editor scaffold with all plugins) complete.

---

## Acceptance Criteria

```gherkin
Given <MarkdownEditor> rendered without a plugins prop
When EditorJS initializes
Then all 15 block types are available in the toolbar
And EditorJS initializes without blocking the UI thread
And the cleanupHasRunOnceRef pattern prevents double-initialization under React 18 StrictMode

Given <MarkdownEditor plugins={['paragraph', 'header', 'list', 'image']} />
When EditorJS initializes
Then only the specified block types appear in the toolbar — unused plugins are not loaded
```

---

## Implementation Guide

### 1. File Location

```
packages/markdown-editor/src/
├── components/
│   ├── markdown-editor.tsx       # main component
│   └── editor-core.tsx           # EditorJS initialization logic (internal)
├── hooks/
│   ├── use-editor-instance.ts    # EditorJS lifecycle hook
│   └── ...
├── types/
│   └── editor-types.ts           # PluginKey, EditorRenderFormProps, etc.
└── index.ts
```

### 2. `PluginKey` Type

```ts
// types/editor-types.ts
export type PluginKey =
  | 'paragraph'
  | 'header'
  | 'list'
  | 'code'
  | 'quote'
  | 'alert'
  | 'delimiter'
  | 'toggle'
  | 'table'
  | 'embed'
  | 'image'
  | 'inlineCode'
  | 'strikethrough'
  | 'annotation'
  | 'InlineHotkey';
```

### 3. `<MarkdownEditor>` Props (this story's subset)

```ts
// Full props are added across Stories 4.1–4.6
interface MarkdownEditorProps {
  plugins?: PluginKey[];                              // defaults to all 15
  imageUploader: (file: File) => Promise<{ success: 1; file: { url: string } }>;
  onSuccess: (data: unknown) => void;
  renderForm?: (props: EditorRenderFormProps) => React.ReactNode;
  initialData?: TopicEditorDraft;
  isEditMode?: boolean;
  allowedComponents?: string[];
}
```

### 4. EditorJS Initialization — `cleanupHasRunOnceRef` Pattern

This is the most critical implementation detail. Copy from `portal-ref/editor.tsx:175` exactly:

```ts
// hooks/use-editor-instance.ts
'use client';

import { useEffect, useRef } from 'react';
import type EditorJS from '@editorjs/editorjs';

export function useEditorInstance(/* ... */) {
  const editorRef = useRef<EditorJS | null>(null);
  const cleanupHasRunOnceRef = useRef(false);  // React 18 StrictMode guard

  useEffect(() => {
    if (editorRef.current) return;  // already initialized

    // Dynamically import EditorJS to avoid SSR issues (deferred init, NFR3)
    import('@editorjs/editorjs').then(({ default: EditorJS }) => {
      const tools = buildToolConfig(plugins, imageUploader);
      
      editorRef.current = new EditorJS({
        holder: holderId,
        tools,
        data: initialData?.content,
        // ... other config
      });
    });

    return () => {
      // React 18 StrictMode calls cleanup twice on mount.
      // First cleanup: cleanupHasRunOnceRef is false → skip, set to true.
      // Second cleanup (real unmount): cleanupHasRunOnceRef is true → destroy.
      if (!cleanupHasRunOnceRef.current) {
        cleanupHasRunOnceRef.current = true;
        return;
      }
      editorRef.current?.destroy();
      editorRef.current = null;
    };
  }, []);  // intentionally empty deps — EditorJS manages its own state

  return editorRef;
}
```

**DO NOT modify this pattern.** It solves a known React 18 StrictMode double-initialization bug that would cause EditorJS to mount twice and corrupt state.

### 5. Plugin Tool Config Builder

```ts
// builds the EditorJS `tools` config object from PluginKey[]
function buildToolConfig(
  pluginKeys: PluginKey[],
  imageUploader: MarkdownEditorProps['imageUploader']
): Record<string, unknown> {
  const allTools: Record<PluginKey, unknown> = {
    paragraph: { /* ... */ },
    header: Header,
    list: { class: List, inlineToolbar: true },
    code: CodeCup,
    // ... all 15
  };
  
  return Object.fromEntries(
    pluginKeys.map(key => [key, allTools[key]])
  );
}
```

The `image` tool config needs the `imageUploader` prop wired in as the `uploader.uploadByFile` handler.

### 6. Code Block Languages (codecup config)

The `@calumk/editorjs-codecup` plugin requires a language list config. Use exactly:

```ts
const languages = [
  'bash', 'shell', 'powershell', 'git', 'markup', 'html', 'css', 'sass', 'scss',
  'javascript', 'typescript', 'jsx', 'tsx', 'json', 'mongodb', 'sql', 'docker',
  'python', 'regex', 'lua', 'none'
];
```

### 7. Dynamic Import for SSR Safety

```ts
// Dynamically import EditorJS plugins to avoid SSR issues
// All plugins are client-only (they reference document/window)
const EditorJS = (await import('@editorjs/editorjs')).default;
const Header = (await import('@editorjs/header')).default;
// etc.
```

---

## Anti-Patterns to Avoid

- **Never remove or modify `cleanupHasRunOnceRef`** — it prevents EditorJS double-initialization under React 18 StrictMode.
- **Do not import EditorJS at module level.** Dynamic import only — EditorJS is DOM-dependent.
- **Do not block the UI thread** during initialization — use `useEffect` with dynamic imports.

---

## Verification Checklist

- [ ] `<MarkdownEditor>` without `plugins` prop shows all 15 block types
- [ ] `plugins={['paragraph', 'header']}` shows only those 2 block types
- [ ] `cleanupHasRunOnceRef` implemented in the useEffect cleanup
- [ ] No TypeScript errors (`any` stubs from Story 1.2 replaced with real types here)
- [ ] EditorJS initializes asynchronously (no UI blocking)

---

## Dev Notes

_To be filled in during implementation._
