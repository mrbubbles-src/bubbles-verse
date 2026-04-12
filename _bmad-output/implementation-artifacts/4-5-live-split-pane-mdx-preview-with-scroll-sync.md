---
story_id: '4.5'
story_key: '4-5-live-split-pane-mdx-preview-with-scroll-sync'
epic: 'Epic 4 — Content Authoring Editor'
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

This story must port the preview and scroll-sync behavior from `to-be-integrated/` first, otherwise from `portal-ref`. Do not redesign the preview pipeline or synchronization strategy unless the user explicitly approves a deviation.

**NFR1:** Preview updates within a perceptible response time — no artificial debounce.

**Prerequisite:** Stories 3.1, 4.1, 4.2 complete.

---

## Mandatory Implementation Contract

- Follow `AGENTS.md` for every implementation decision in this story.
- Port the existing working implementation from the designated reference source as the default path.
- Use `to-be-integrated/` first when the relevant implementation exists there.
- If the relevant implementation is not present in `to-be-integrated/`, use `portal-ref`.
- Do not rewrite, redesign, or replace a working reference implementation with a newly authored one unless this story explicitly documents an approved exception.
- If a reference implementation and this story appear to conflict, preserve the reference behavior and escalate the conflict instead of inventing a new solution.

### Primary Reference Source

`to-be-integrated/`

### Fallback Reference Source

`portal-ref`

### Reference Files / Modules

- Live preview implementation in `to-be-integrated/` if present
- Equivalent live preview implementation in `portal-ref`
- Scroll-sync hooks and related internal modules in the same reference source

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

### 1. Reference-First Extraction

Inspect `to-be-integrated/` first and port the exact preview and scroll-sync behavior.

If the implementation is not available there, inspect `portal-ref` and port the behavior from there.

Do not invent a new preview pipeline, update strategy, or scroll-mapping approach unless the user explicitly approves a deviation.

### 2. Split-Pane Layout

```tsx
// markdown-editor.tsx
<div className="markdown-editor-split-pane">
  <div ref={editorPaneRef} className="editor-pane">
    <div id={EDITOR_HOLDER_ID} /> {/* EditorJS mount point */}
  </div>
  <div ref={previewPaneRef} className="preview-pane">
    <MdxRenderer content={editorContent} />
  </div>
</div>
```

### 3. Scroll Sync — How It Works

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
  const isSyncingRef = useRef(false); // prevent scroll event loops

  useEffect(() => {
    const editorEl = editorPaneRef.current;
    const previewEl = previewPaneRef.current;
    if (!editorEl || !previewEl) return;

    function syncEditorToPreview() {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;

      // Find the topmost visible block in the editor pane
      // Scroll the corresponding data-block-id element in the preview pane into view

      requestAnimationFrame(() => {
        isSyncingRef.current = false;
      });
    }

    function syncPreviewToEditor() {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;

      // Find the topmost visible data-block-id element in the preview
      // Scroll the corresponding EditorJS block into view in the editor pane

      requestAnimationFrame(() => {
        isSyncingRef.current = false;
      });
    }

    editorEl.addEventListener('scroll', syncEditorToPreview, { passive: true });
    previewEl.addEventListener('scroll', syncPreviewToEditor, {
      passive: true,
    });

    return () => {
      editorEl.removeEventListener('scroll', syncEditorToPreview);
      previewEl.removeEventListener('scroll', syncPreviewToEditor);
    };
  }, [editorPaneRef, previewPaneRef]);
}
```

The `isSyncingRef` flag prevents scroll event loops (editor scroll triggers preview scroll, which would trigger editor scroll again).

### 4. Block Position Lookup

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

### 5. Preview Updates — No Debounce

EditorJS `onChange` calls `serializeToMdx` synchronously and updates `editorContent` state immediately. React re-renders `<MdxRenderer>` with the new content. No `setTimeout` or `debounce` — NFR1 requires perceptible real-time updates.

Preserve the preview update and re-render behavior from the reference implementation. Do not assume a specific MDX runtime pipeline beyond what the designated reference source already uses.

### 6. Internal Hooks — Not Exported

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
- **Do not redesign preview or scroll-sync behavior away from the reference implementation** unless the user explicitly approves the deviation.

---

## Verification Checklist

- [ ] Preview pane updates immediately when editor content changes (no debounce)
- [ ] Editor scroll → preview scrolls to corresponding block
- [ ] Preview scroll → editor scrolls to corresponding block
- [ ] `isSyncingRef` prevents scroll event loops
- [ ] Every preview block has `data-block-id` attribute (from serializer)
- [ ] `useScrollSync` NOT exported from `src/index.ts`
- [ ] Preview and scroll-sync behavior match the designated reference implementation

---

## Dev Notes

_To be filled in during implementation._
