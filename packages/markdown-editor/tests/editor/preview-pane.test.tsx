import type { OutputData } from '@editorjs/editorjs';

import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PreviewPane } from '../../src/components/preview-pane';

const evaluateMock = vi.fn();

vi.mock('@mdx-js/mdx', () => {
  return {
    evaluate: (...args: unknown[]) => evaluateMock(...args),
  };
});

vi.mock('@bubbles/markdown-renderer', () => {
  return {
    defaultComponents: {},
  };
});

vi.mock('../../src/hooks/use-scroll-sync', () => {
  return {
    useScrollSync: vi.fn(),
  };
});

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

/**
 * Create a manually controlled promise for compile timing tests.
 *
 * @returns Deferred promise plus resolve and reject handles.
 */
function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return {
    promise,
    resolve,
    reject,
  };
}

/**
 * Build a minimal evaluated MDX module for preview rendering tests.
 *
 * @param text - Text rendered by the compiled preview component.
 * @returns MDX evaluate-like module shape.
 */
function createEvaluatedModule(text: string) {
  return {
    default: function CompiledPreview() {
      return <div>{text}</div>;
    },
  };
}

const FIRST_OUTPUT: OutputData = {
  blocks: [
    {
      id: 'first-heading',
      type: 'header',
      data: {
        level: 1,
        text: 'First Title',
      },
    },
  ],
  time: 1,
  version: '2.31.0',
};

const SECOND_OUTPUT: OutputData = {
  blocks: [
    {
      id: 'second-heading',
      type: 'header',
      data: {
        level: 1,
        text: 'Second Title',
      },
    },
  ],
  time: 2,
  version: '2.31.0',
};

describe('PreviewPane', () => {
  it('keeps the previous successful preview mounted while the next compile is pending', async () => {
    const pendingCompile = createDeferred<ReturnType<typeof createEvaluatedModule>>();

    evaluateMock
      .mockResolvedValueOnce(createEvaluatedModule('First preview'))
      .mockReturnValueOnce(pendingCompile.promise);

    const editorHolderRef = {
      current: document.createElement('div'),
    };
    const editorScrollRef = {
      current: document.createElement('div'),
    };

    const { rerender } = render(
      <PreviewPane
        editorContent={FIRST_OUTPUT}
        editorHolderRef={editorHolderRef}
        editorScrollRef={editorScrollRef}
      />
    );

    expect(await screen.findByText('First preview')).toBeInTheDocument();

    rerender(
      <PreviewPane
        editorContent={SECOND_OUTPUT}
        editorHolderRef={editorHolderRef}
        editorScrollRef={editorScrollRef}
      />
    );

    expect(screen.getByText('First preview')).toBeInTheDocument();
    expect(
      screen.queryByTestId('markdown-editor-preview-loading')
    ).not.toBeInTheDocument();

    pendingCompile.resolve(createEvaluatedModule('Second preview'));

    await waitFor(() => {
      expect(screen.getByText('Second preview')).toBeInTheDocument();
    });
  });
});
