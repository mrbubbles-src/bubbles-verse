import { useMemo, useRef } from 'react';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useScrollSync } from '../../src/hooks/use-scroll-sync';

type BlockLayout = {
  id: string;
  height: number;
  top: number;
};

type RectInit = {
  top: number;
  height: number;
};

type ScrollSyncHarnessProps = {
  blockIds: string[];
  direction?: 'editor-to-preview' | 'bidirectional';
};

/**
 * Build a DOMRect-like object for jsdom scroll-sync measurements.
 *
 * @param init - Top and height for the mocked rectangle.
 * @returns Rect object compatible with `getBoundingClientRect()`.
 */
function createRect({ top, height }: RectInit): DOMRect {
  return {
    x: 0,
    y: top,
    width: 100,
    height,
    top,
    right: 100,
    bottom: top + height,
    left: 0,
    toJSON() {
      return {};
    },
  } as DOMRect;
}

/**
 * Define fixed scroll metrics on a jsdom element.
 *
 * @param element - Scroll container to patch.
 * @param clientHeight - Visible height of the container.
 * @param scrollHeight - Total scrollable height.
 */
function defineScrollableMetrics(
  element: HTMLElement,
  clientHeight: number,
  scrollHeight: number
) {
  let scrollTopValue = 0;

  Object.defineProperty(element, 'clientHeight', {
    configurable: true,
    get: () => clientHeight,
  });
  Object.defineProperty(element, 'scrollHeight', {
    configurable: true,
    get: () => scrollHeight,
  });
  Object.defineProperty(element, 'scrollTop', {
    configurable: true,
    get: () => scrollTopValue,
    set: (value: number) => {
      scrollTopValue = value;
    },
  });

  element.getBoundingClientRect = () =>
    createRect({ top: 0, height: clientHeight });
}

/**
 * Define block geometry relative to the provided scroll container.
 *
 * @param element - Block element to patch.
 * @param container - Owning scroll container.
 * @param layout - Static block layout values.
 */
function defineBlockMetrics(
  element: HTMLElement,
  container: HTMLElement,
  layout: BlockLayout
) {
  element.getBoundingClientRect = () =>
    createRect({
      top: layout.top - container.scrollTop,
      height: layout.height,
    });
}

/**
 * Render paired editor and preview panes wired into `useScrollSync`.
 *
 * @param props - Shared block ids and optional sync direction.
 * @returns Test-only pane markup.
 */
function ScrollSyncHarness({
  blockIds,
  direction = 'bidirectional',
}: ScrollSyncHarnessProps) {
  const editorScrollRef = useRef<HTMLDivElement | null>(null);
  const editorHolderRef = useRef<HTMLDivElement | null>(null);
  const previewScrollRef = useRef<HTMLDivElement | null>(null);
  const editorBlocks = useMemo(
    () =>
      blockIds.map((id) => (
        <div className="ce-block" data-testid={`editor-block-${id}`} key={id} />
      )),
    [blockIds]
  );
  const previewBlocks = useMemo(
    () =>
      blockIds.map((id) => (
        <div data-block-id={id} data-testid={`preview-block-${id}`} key={id} />
      )),
    [blockIds]
  );

  useScrollSync({
    editorScrollRef,
    previewScrollRef,
    editorHolderRef,
    blockIds,
    direction,
    enabled: true,
    contentVersion: blockIds.length,
  });

  return (
    <div>
      <div ref={editorScrollRef} data-testid="editor-scroll">
        <div ref={editorHolderRef}>{editorBlocks}</div>
      </div>
      <div ref={previewScrollRef} data-testid="preview-scroll">
        <div>{previewBlocks}</div>
      </div>
    </div>
  );
}

describe('useScrollSync', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'requestAnimationFrame',
      (callback: FrameRequestCallback): number =>
        window.setTimeout(() => {
          callback(Date.now());
        }, 0)
    );
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      window.clearTimeout(id);
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('syncs editor scrolling into the preview pane using block anchors', async () => {
    render(<ScrollSyncHarness blockIds={['intro', 'body', 'summary']} />);

    const editorScroll = screen.getByTestId('editor-scroll');
    const previewScroll = screen.getByTestId('preview-scroll');

    defineScrollableMetrics(editorScroll, 100, 300);
    defineScrollableMetrics(previewScroll, 100, 600);

    defineBlockMetrics(screen.getByTestId('editor-block-intro'), editorScroll, {
      id: 'intro',
      top: 0,
      height: 100,
    });
    defineBlockMetrics(screen.getByTestId('editor-block-body'), editorScroll, {
      id: 'body',
      top: 100,
      height: 100,
    });
    defineBlockMetrics(
      screen.getByTestId('editor-block-summary'),
      editorScroll,
      {
        id: 'summary',
        top: 200,
        height: 100,
      }
    );

    defineBlockMetrics(
      screen.getByTestId('preview-block-intro'),
      previewScroll,
      {
        id: 'intro',
        top: 0,
        height: 200,
      }
    );
    defineBlockMetrics(
      screen.getByTestId('preview-block-body'),
      previewScroll,
      {
        id: 'body',
        top: 200,
        height: 200,
      }
    );
    defineBlockMetrics(
      screen.getByTestId('preview-block-summary'),
      previewScroll,
      {
        id: 'summary',
        top: 400,
        height: 200,
      }
    );

    editorScroll.scrollTop = 100;
    fireEvent.scroll(editorScroll);

    await waitFor(() => {
      expect(previewScroll.scrollTop).toBeGreaterThan(230);
      expect(previewScroll.scrollTop).toBeLessThan(240);
    });
  });

  it('syncs preview scrolling back into the editor pane in bidirectional mode', async () => {
    render(<ScrollSyncHarness blockIds={['intro', 'body', 'summary']} />);

    const editorScroll = screen.getByTestId('editor-scroll');
    const previewScroll = screen.getByTestId('preview-scroll');

    defineScrollableMetrics(editorScroll, 100, 300);
    defineScrollableMetrics(previewScroll, 100, 600);

    defineBlockMetrics(screen.getByTestId('editor-block-intro'), editorScroll, {
      id: 'intro',
      top: 0,
      height: 100,
    });
    defineBlockMetrics(screen.getByTestId('editor-block-body'), editorScroll, {
      id: 'body',
      top: 100,
      height: 100,
    });
    defineBlockMetrics(
      screen.getByTestId('editor-block-summary'),
      editorScroll,
      {
        id: 'summary',
        top: 200,
        height: 100,
      }
    );

    defineBlockMetrics(
      screen.getByTestId('preview-block-intro'),
      previewScroll,
      {
        id: 'intro',
        top: 0,
        height: 200,
      }
    );
    defineBlockMetrics(
      screen.getByTestId('preview-block-body'),
      previewScroll,
      {
        id: 'body',
        top: 200,
        height: 200,
      }
    );
    defineBlockMetrics(
      screen.getByTestId('preview-block-summary'),
      previewScroll,
      {
        id: 'summary',
        top: 400,
        height: 200,
      }
    );

    previewScroll.scrollTop = 250;
    fireEvent.scroll(previewScroll);

    await waitFor(() => {
      expect(editorScroll.scrollTop).toBeGreaterThan(105);
      expect(editorScroll.scrollTop).toBeLessThan(110);
    });
  });
});
