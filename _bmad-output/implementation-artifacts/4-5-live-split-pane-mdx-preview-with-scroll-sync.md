---
story_id: "4.5"
story_key: "4-5-live-split-pane-mdx-preview-with-scroll-sync"
epic: "Epic 4 — Content Authoring Editor"
status: ready-for-dev
created: 2026-04-12
---

# Story 4.5 — Live Split-Pane MDX Preview with Scroll Sync

## User Story

As a developer (and as a content author),
I want a live split-pane preview with bidirectional scroll sync,
So that I can see the rendered output while writing without switching views.

---

## Context

The preview pane renders the live `editorContent` (MDX string from Story 4.2) using `<MdxRenderer>` from `@bubbles/markdown-renderer`. Scroll sync relies on `data-block-id` attributes that the serializer adds to every block (Story 3.1) and that `<MdxRenderer>` preserves.

Two hooks handle scroll sync: `useScrollSync` (bidirectional coordinator) and `usePreviewScroll` (preview pane scroll logic). Both are internal — not exported.

**NFR1:** Preview updates within a perceptible response time — no artificial debounce.

**Prerequisite:** Stories 3.1, 4.1, 4.2 complete.

---

## Mandatory Implementation Directives

- Follow `AGENTS.md` for every implementation decision in this story.
- If relevant code already exists in `portal-ref` or `lms-ref`, reuse that working code first and port it cleanly into the target package or app.
- Adapt reference code only as needed for this monorepo plan, package boundaries, typing, naming, and acceptance criteria.
- Do not rewrite or redesign working reference code unnecessarily when a clean extraction or transfer is sufficient.

## Acceptance Criteria

```gherkin
Given content being authored in the editor pane
When any block changes
Then the MDX preview pane updates with no perceptible delay

Given an author scrolling in the editor pane
When the scroll position changes
Then the preview pane scrolls to the corresponding block

Given an author scrolling in the preview pane
When the scroll position changes
Then the editor pane scrolls to the corresponding block

And every block in the preview is addressable by EditorJS block ID via data-block-id attribute
```

---

## Implementation Guide

### 1. Split-Pane Layout

```tsx
// markdown-editor.tsx
<div className="markdown-editor-split-pane">
  <div ref={editorPaneRef} className="editor-pane">
    <div id={EDITOR_HOLDER_ID} />  {/* EditorJS mount point */}
  </div>
  <div ref={previewPaneRef} className="preview-pane">
    <MdxRenderer content={editorContent} />
  </div>
</div>
```

### 2. Scroll Sync — How It Works

Each block in the editor pane has a DOM element that EditorJS generates. Each block in the preview pane is wrapped in `<div data-block-id="{id}">` (from the serializer).

Scroll sync maps editor block DOM position → preview block DOM position:

```ts
// hooks/use-scroll-sync.ts
'use client';

/**
 * Bidirectional scroll sync between editor and preview panes.
 * Uses data-block-id attributes for positional mapping.
 * Internal hook — not exported.
 */
export function useScrollSync(
  editorPaneRef: React.RefObject<HTMLDivElement>,
  previewPaneRef: React.RefObject<HTMLDivElement>
) {
  const isSyncingRef = useRef(false);  // prevent scroll event loops

  useEffect(() => {
    const editorEl = editorPaneRef.current;
    const previewEl = previewPaneRef.current;
    if (!editorEl || !previewEl) return;

    function syncEditorToPreview() {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
      
      // Find the topmost visible block in the editor pane
      // Scroll the corresponding data-block-id element in the preview pane into view
      
      requestAnimationFrame(() => { isSyncingRef.current = false; });
    }

    function syncPreviewToEditor() {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
      
      // Find the topmost visible data-block-id element in the preview
      // Scroll the corresponding EditorJS block into view in the editor pane
      
      requestAnimationFrame(() => { isSyncingRef.current = false; });
    }

    editorEl.addEventListener('scroll', syncEditorToPreview, { passive: true });
    previewEl.addEventListener('scroll', syncPreviewToEditor, { passive: true });
    
    return () => {
      editorEl.removeEventListener('scroll', syncEditorToPreview);
      previewEl.removeEventListener('scroll', syncPreviewToEditor);
    };
  }, [editorPaneRef, previewPaneRef]);
}
```

The `isSyncingRef` flag prevents scroll event loops (editor scroll triggers preview scroll, which would trigger editor scroll again).

### 3. Block Position Lookup

```ts
function findTopmostVisibleBlockId(paneEl: HTMLElement): string | null {
  const blocks = paneEl.querySelectorAll('[data-block-id]');
  const paneTop = paneEl.scrollTop;
  
  for (const block of blocks) {
    const blockTop = (block as HTMLElement).offsetTop;
    if (blockTop >= paneTop) {
      return block.getAttribute('data-block-id');
    }
  }
  return null;
}

function scrollToBlockInPane(paneEl: HTMLElement, blockId: string) {
  const target = paneEl.querySelector(`[data-block-id="${blockId}"]`);
  target?.scrollIntoView({ block: 'start', behavior: 'instant' });
}
```

### 4. Preview Updates — No Debounce

EditorJS `onChange` calls `serializeToMdx` synchronously and updates `editorContent` state immediately. React re-renders `<MdxRenderer>` with the new content. No `setTimeout` or `debounce` — NFR1 requires perceptible real-time updates.

`@mdx-js/mdx`'s `evaluate()` is async — `<MdxRenderer>` handles this with `useEffect`. During recompilation, the previous render stays visible until the new one is ready.

### 5. Internal Hooks — Not Exported

```ts
// These hooks are internal implementation details.
// They appear in the package but are NOT in src/index.ts exports.
// useScrollSync, useDraftAutosave, usePreviewScroll
```

---

## Anti-Patterns to Avoid

- **No debounce on preview updates.** The preview should feel live — any delay disrupts authoring flow (NFR1).
- **Do not export `useScrollSync` or `usePreviewScroll`.** Internal only.
- **Use `isSyncingRef` to prevent scroll loops.** Without it, scroll events will infinitely trigger each other.
- **Use `passive: true` on scroll listeners** for performance — these don't call `preventDefault`.

---

## Verification Checklist

- [ ] Preview pane updates immediately when editor content changes (no debounce)
- [ ] Editor scroll → preview scrolls to corresponding block
- [ ] Preview scroll → editor scrolls to corresponding block
- [ ] `isSyncingRef` prevents scroll event loops
- [ ] Every preview block has `data-block-id` attribute (from serializer)
- [ ] `useScrollSync` NOT exported from `src/index.ts`

---

## Dev Notes

_To be filled in during implementation._
