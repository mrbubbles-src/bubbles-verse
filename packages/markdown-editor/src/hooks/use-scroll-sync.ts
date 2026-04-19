import type { RefObject } from 'react';

import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

type ScrollPane = 'editor' | 'preview';
type ScrollSyncDirection = 'editor-to-preview' | 'bidirectional';

type UseScrollSyncOptions = {
  editorScrollRef: RefObject<HTMLElement | null>;
  previewScrollRef: RefObject<HTMLElement | null>;
  editorHolderRef?: RefObject<HTMLElement | null>;
  blockIds?: string[];
  enabled?: boolean;
  direction?: ScrollSyncDirection;
  contentVersion?: number | string;
  anchorRatio?: number;
};

type BlockAnchor = {
  id: string;
  relativeProgress: number;
};

type BlockEntry = {
  id: string;
  element: HTMLElement;
};

const NULL_RAFS = {
  editor: null,
  preview: null,
} as const;

const EDITOR_BLOCK_SELECTOR = '.ce-block';
const PREVIEW_BLOCK_SELECTOR = '[data-block-id]';

/**
 * Clamp a numeric value so scroll math stays inside the pane bounds.
 *
 * @param value - Current value to clamp.
 * @param min - Lower inclusive bound.
 * @param max - Upper inclusive bound.
 * @returns Value constrained to the provided range.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Measure a block relative to its scroll container instead of the viewport.
 *
 * @param element - Block element to measure.
 * @param container - Scroll container that owns the block.
 * @returns Relative top/height metrics for anchor calculations.
 */
function getRelativeMetrics(
  element: HTMLElement,
  container: HTMLElement
): { top: number; height: number } {
  const containerRect = container.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const top = elementRect.top - containerRect.top + container.scrollTop;
  const height = Math.max(elementRect.height, 1);

  return { top, height };
}

/**
 * Build a stable ordered block map for one pane.
 *
 * Editor blocks are resolved by order because EditorJS does not expose the
 * block id on the rendered wrapper. Preview blocks are resolved by
 * `data-block-id`, which is preserved by the serializer and renderer.
 *
 * @param pane - Pane to read blocks from.
 * @param container - Scrollable pane element.
 * @param editorHolder - Optional EditorJS holder used for editor block lookup.
 * @param blockIds - Shared ordered block ids from the current editor payload.
 * @returns Ordered block entries that can be matched across panes.
 */
function getBlockEntries(
  pane: ScrollPane,
  container: HTMLElement,
  editorHolder: HTMLElement | null,
  blockIds: string[]
): BlockEntry[] {
  if (pane === 'editor') {
    if (!editorHolder || blockIds.length === 0) {
      return [];
    }

    const editorBlocks = Array.from(
      editorHolder.querySelectorAll<HTMLElement>(EDITOR_BLOCK_SELECTOR)
    );
    const maxLength = Math.min(editorBlocks.length, blockIds.length);
    const result: BlockEntry[] = [];

    for (let index = 0; index < maxLength; index += 1) {
      const id = blockIds[index];
      const element = editorBlocks[index];

      if (!id || !element) {
        continue;
      }

      result.push({ id, element });
    }

    return result;
  }

  if (blockIds.length > 0) {
    const result: BlockEntry[] = [];

    for (const id of blockIds) {
      const escapedId = typeof CSS !== 'undefined' ? CSS.escape(id) : id;
      const element = container.querySelector<HTMLElement>(
        `${PREVIEW_BLOCK_SELECTOR}[data-block-id="${escapedId}"]`
      );

      if (element) {
        result.push({ id, element });
      }
    }

    return result;
  }

  const previewBlocks = Array.from(
    container.querySelectorAll<HTMLElement>(PREVIEW_BLOCK_SELECTOR)
  );

  return previewBlocks
    .map((element) => ({ id: element.dataset.blockId ?? '', element }))
    .filter((entry) => entry.id.length > 0);
}

/**
 * Resolve the block that currently sits under the scroll anchor.
 *
 * @param entries - Ordered pane blocks.
 * @param container - Source scroll container.
 * @param anchorPosition - Anchor position within the scroll space.
 * @returns The matching block id plus progress inside that block.
 */
function findAnchorBlock(
  entries: BlockEntry[],
  container: HTMLElement,
  anchorPosition: number
): BlockAnchor | null {
  if (entries.length === 0) {
    return null;
  }

  let previous: {
    id: string;
    top: number;
    height: number;
  } | null = null;

  for (const entry of entries) {
    const { top, height } = getRelativeMetrics(entry.element, container);
    const bottom = top + height;

    if (anchorPosition < top) {
      if (!previous) {
        return { id: entry.id, relativeProgress: 0 };
      }

      const relativeProgress = clamp(
        (anchorPosition - previous.top) / previous.height,
        0,
        1
      );

      return { id: previous.id, relativeProgress };
    }

    if (anchorPosition <= bottom) {
      const relativeProgress = clamp((anchorPosition - top) / height, 0, 1);
      return { id: entry.id, relativeProgress };
    }

    previous = { id: entry.id, top, height };
  }

  if (!previous) {
    return null;
  }

  return { id: previous.id, relativeProgress: 1 };
}

/**
 * Fall back to percentage-based sync when block mapping is incomplete.
 *
 * @param source - Source scroll container.
 * @param target - Target scroll container.
 * @returns Best-effort target scroll position.
 */
function getPercentageSyncScrollTop(
  source: HTMLElement,
  target: HTMLElement
): number {
  const sourceScrollable = source.scrollHeight - source.clientHeight;
  const targetScrollable = target.scrollHeight - target.clientHeight;

  if (targetScrollable <= 0 || sourceScrollable <= 0) {
    return 0;
  }

  const percentage = source.scrollTop / sourceScrollable;

  return clamp(percentage * targetScrollable, 0, targetScrollable);
}

/**
 * Keep the EditorJS pane and rendered MDX preview aligned while scrolling.
 *
 * The implementation mirrors the reference sync strategy: use block ids when
 * available, preserve relative progress within the active block, and fall back
 * to percentage-based sync when exact mapping is not possible.
 *
 * @param options - Scroll sync configuration.
 */
export function useScrollSync({
  editorScrollRef,
  previewScrollRef,
  editorHolderRef,
  blockIds = [],
  enabled = true,
  direction = 'bidirectional',
  contentVersion = 0,
  anchorRatio = 0.35,
}: UseScrollSyncOptions): void {
  const lastUserSourceRef = useRef<ScrollPane>('editor');
  const scrollRafRef = useRef<Record<ScrollPane, number | null>>({
    ...NULL_RAFS,
  });
  const guardRafRef = useRef<Record<ScrollPane, number | null>>({
    ...NULL_RAFS,
  });
  const isProgrammaticScrollRef = useRef<Record<ScrollPane, boolean>>({
    editor: false,
    preview: false,
  });
  const resizeRafRef = useRef<number | null>(null);

  const getContainer = useCallback(
    (pane: ScrollPane): HTMLElement | null =>
      pane === 'editor' ? editorScrollRef.current : previewScrollRef.current,
    [editorScrollRef, previewScrollRef]
  );

  const getTargetPane = useCallback(
    (pane: ScrollPane): ScrollPane =>
      pane === 'editor' ? 'preview' : 'editor',
    []
  );

  const getEntriesForPane = useCallback(
    (pane: ScrollPane): BlockEntry[] => {
      const container = getContainer(pane);

      if (!container) {
        return [];
      }

      return getBlockEntries(
        pane,
        container,
        editorHolderRef?.current ?? null,
        blockIds
      );
    },
    [blockIds, editorHolderRef, getContainer]
  );

  const markProgrammatic = useCallback((pane: ScrollPane) => {
    isProgrammaticScrollRef.current[pane] = true;

    const rafId = guardRafRef.current[pane];
    if (rafId) {
      cancelAnimationFrame(rafId);
    }

    guardRafRef.current[pane] = requestAnimationFrame(() => {
      isProgrammaticScrollRef.current[pane] = false;
      guardRafRef.current[pane] = null;
    });
  }, []);

  const syncFromSource = useCallback(
    (sourcePane: ScrollPane) => {
      const source = getContainer(sourcePane);
      const targetPane = getTargetPane(sourcePane);
      const target = getContainer(targetPane);

      if (!source || !target) {
        return;
      }

      const sourceScrollable = source.scrollHeight - source.clientHeight;
      const targetScrollable = Math.max(
        target.scrollHeight - target.clientHeight,
        0
      );
      const edgeTolerance = 1;

      if (source.scrollTop <= edgeTolerance) {
        markProgrammatic(targetPane);
        target.scrollTop = 0;
        return;
      }

      if (source.scrollTop >= sourceScrollable - edgeTolerance) {
        markProgrammatic(targetPane);
        target.scrollTop = targetScrollable;
        return;
      }

      const sourceAnchorPosition =
        source.scrollTop + source.clientHeight * anchorRatio;
      const sourceEntries = getEntriesForPane(sourcePane);
      const sourceAnchor = findAnchorBlock(
        sourceEntries,
        source,
        sourceAnchorPosition
      );

      let targetScrollTop: number | null = null;

      if (sourceAnchor) {
        const targetEntries = getEntriesForPane(targetPane);
        const targetEntry = targetEntries.find(
          (entry) => entry.id === sourceAnchor.id
        );

        if (targetEntry) {
          const { top, height } = getRelativeMetrics(
            targetEntry.element,
            target
          );
          const targetAnchorPosition =
            top + height * sourceAnchor.relativeProgress;

          targetScrollTop = clamp(
            targetAnchorPosition - target.clientHeight * anchorRatio,
            0,
            targetScrollable
          );
        }
      }

      if (targetScrollTop === null) {
        targetScrollTop = getPercentageSyncScrollTop(source, target);
      }

      markProgrammatic(targetPane);
      target.scrollTop = targetScrollTop;
    },
    [
      anchorRatio,
      getContainer,
      getEntriesForPane,
      getTargetPane,
      markProgrammatic,
    ]
  );

  const scheduleSync = useCallback(
    (sourcePane: ScrollPane) => {
      const rafId = scrollRafRef.current[sourcePane];

      if (rafId) {
        cancelAnimationFrame(rafId);
      }

      scrollRafRef.current[sourcePane] = requestAnimationFrame(() => {
        scrollRafRef.current[sourcePane] = null;
        syncFromSource(sourcePane);
      });
    },
    [syncFromSource]
  );

  const handleUserScroll = useCallback(
    (sourcePane: ScrollPane) => {
      if (isProgrammaticScrollRef.current[sourcePane]) {
        return;
      }

      lastUserSourceRef.current = sourcePane;
      scheduleSync(sourcePane);
    },
    [scheduleSync]
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const editor = editorScrollRef.current;
    const preview = previewScrollRef.current;

    if (!editor || !preview) {
      return;
    }

    const handleEditorScroll = () => handleUserScroll('editor');
    const handlePreviewScroll = () => handleUserScroll('preview');

    editor.addEventListener('scroll', handleEditorScroll, { passive: true });

    if (direction === 'bidirectional') {
      preview.addEventListener('scroll', handlePreviewScroll, {
        passive: true,
      });
    }

    const scrollRaf = scrollRafRef.current;

    return () => {
      editor.removeEventListener('scroll', handleEditorScroll);

      if (direction === 'bidirectional') {
        preview.removeEventListener('scroll', handlePreviewScroll);
      }

      const editorRafId = scrollRaf.editor;
      if (editorRafId) {
        cancelAnimationFrame(editorRafId);
        scrollRaf.editor = null;
      }

      const previewRafId = scrollRaf.preview;
      if (previewRafId) {
        cancelAnimationFrame(previewRafId);
        scrollRaf.preview = null;
      }
    };
  }, [direction, editorScrollRef, enabled, handleUserScroll, previewScrollRef]);

  useLayoutEffect(() => {
    if (!enabled) {
      return;
    }

    const rafId = requestAnimationFrame(() => {
      scheduleSync(lastUserSourceRef.current);
    });

    return () => cancelAnimationFrame(rafId);
  }, [contentVersion, enabled, scheduleSync]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const editor = editorScrollRef.current;
    const preview = previewScrollRef.current;

    if (!editor || !preview) {
      return;
    }

    const runResync = () => {
      if (resizeRafRef.current) {
        cancelAnimationFrame(resizeRafRef.current);
      }

      resizeRafRef.current = requestAnimationFrame(() => {
        resizeRafRef.current = null;
        scheduleSync(lastUserSourceRef.current);
      });
    };

    const holder = editorHolderRef?.current ?? null;
    const previewContent =
      preview.firstElementChild instanceof HTMLElement
        ? preview.firstElementChild
        : null;

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => runResync());
      observer.observe(editor);
      observer.observe(preview);

      if (holder) {
        observer.observe(holder);
      }

      if (previewContent) {
        observer.observe(previewContent);
      }

      return () => {
        observer.disconnect();

        if (resizeRafRef.current) {
          cancelAnimationFrame(resizeRafRef.current);
          resizeRafRef.current = null;
        }
      };
    }

    window.addEventListener('resize', runResync, { passive: true });

    return () => {
      window.removeEventListener('resize', runResync);

      if (resizeRafRef.current) {
        cancelAnimationFrame(resizeRafRef.current);
        resizeRafRef.current = null;
      }
    };
  }, [
    editorHolderRef,
    editorScrollRef,
    enabled,
    previewScrollRef,
    scheduleSync,
  ]);

  useEffect(() => {
    const guardRaf = guardRafRef.current;

    return () => {
      const editorGuardRafId = guardRaf.editor;
      if (editorGuardRafId) {
        cancelAnimationFrame(editorGuardRafId);
      }

      const previewGuardRafId = guardRaf.preview;
      if (previewGuardRafId) {
        cancelAnimationFrame(previewGuardRafId);
      }
    };
  }, []);
}
