import type { RefObject } from 'react';

import { useEffect, useRef } from 'react';

type UsePreviewScrollOptions = {
  focusedBlockId: string | null;
  previewContainerRef: RefObject<HTMLElement | null>;
  contentVersion?: number;
};

/**
 * Keep the preview pane centered on the currently focused block.
 *
 * The package does not expose this hook publicly; it mirrors the reference
 * preview behavior for future integrations that track block focus explicitly.
 *
 * @param options - Preview scroll targeting configuration.
 */
export function usePreviewScroll({
  focusedBlockId,
  previewContainerRef,
  contentVersion = 0,
}: UsePreviewScrollOptions): void {
  const lastScrolledId = useRef<string | null>(null);

  useEffect(() => {
    const container = previewContainerRef.current;

    if (!container || !focusedBlockId) {
      return;
    }

    const targetElement = container.querySelector<HTMLElement>(
      `[data-block-id="${focusedBlockId}"]`
    );

    if (!targetElement) {
      return;
    }

    const isNewBlock = focusedBlockId !== lastScrolledId.current;
    const containerRect = container.getBoundingClientRect();
    const elementRect = targetElement.getBoundingClientRect();
    const isVisible =
      elementRect.top >= containerRect.top &&
      elementRect.bottom <= containerRect.bottom;

    if (!isVisible) {
      const scrollTarget =
        targetElement.offsetTop -
        container.clientHeight / 2 +
        targetElement.clientHeight / 2;

      container.scrollTo({
        top: Math.max(0, scrollTarget),
        behavior: isNewBlock ? 'smooth' : 'instant',
      });
    }

    let highlightTimer: ReturnType<typeof setTimeout> | undefined;

    if (isNewBlock) {
      targetElement.classList.add('highlight-block');
      highlightTimer = setTimeout(() => {
        targetElement.classList.remove('highlight-block');
      }, 1500);
      lastScrolledId.current = focusedBlockId;
    }

    return () => {
      if (highlightTimer) {
        clearTimeout(highlightTimer);
      }
    };
  }, [contentVersion, focusedBlockId, previewContainerRef]);
}
