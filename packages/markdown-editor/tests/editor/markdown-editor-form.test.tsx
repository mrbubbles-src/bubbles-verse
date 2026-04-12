import type { OutputData } from '@editorjs/editorjs';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { MarkdownEditor } from '../../src/components/markdown-editor';
import type {
  EditorRenderFormProps,
  MarkdownEditorInitialData,
  MarkdownEditorSubmitData,
} from '../../src/types/editor';

const INITIAL_OUTPUT: OutputData = {
  blocks: [
    {
      id: 'intro-heading',
      type: 'header',
      data: {
        level: 1,
        text: 'Story Driven Editor',
      },
    },
    {
      id: 'intro-body',
      type: 'paragraph',
      data: {
        text: 'Body copy',
      },
    },
  ],
  time: 123,
  version: '2.31.0',
};

const INITIAL_DATA: MarkdownEditorInitialData = {
  content: INITIAL_OUTPUT,
  description: 'Existing description',
  slug: 'existing-slug',
  status: 'published',
  tags: ['ref', 'story'],
  title: 'Existing title',
};

const latestOutput: OutputData = INITIAL_OUTPUT;

vi.mock('@editorjs/editorjs', () => {
  class MockEditorJs {
    public isReady: Promise<void>;
    private readonly saveMock: () => Promise<OutputData>;
    private readonly destroyMock: () => void;

    constructor(config: { onReady?: () => void }) {
      this.saveMock = vi.fn(async () => latestOutput);
      this.destroyMock = vi.fn();
      this.isReady = Promise.resolve().then(() => {
        config.onReady?.();
      });
    }

    async save() {
      return this.saveMock();
    }

    destroy() {
      this.destroyMock();
    }
  }

  return {
    default: MockEditorJs,
  };
});

vi.mock('../../src/lib/editor-tools', async () => {
  const actual = await vi.importActual<typeof import('../../src/lib/editor-tools')>(
    '../../src/lib/editor-tools'
  );

  return {
    ...actual,
    buildEditorTools: vi.fn(() => ({})),
    loadEditorToolRegistry: vi.fn(async () => ({})),
  };
});

function RenderFormProbe({
  editorContent,
  editorOutput,
  editorReady,
  initialData,
  isEditMode,
}: EditorRenderFormProps) {
  const [savedBlockCount, setSavedBlockCount] = useState<string>('pending');

  return (
    <section data-testid="custom-form">
      <div data-testid="editor-ready">{String(editorReady)}</div>
      <div data-testid="is-edit-mode">{String(isEditMode)}</div>
      <div data-testid="initial-title">{initialData?.title ?? 'missing'}</div>
      <div data-testid="editor-block-count">
        {String(editorContent?.blocks.length ?? 0)}
      </div>
      <div data-testid="saved-block-count">{savedBlockCount}</div>
      <button
        type="button"
        onClick={async () => {
          const output = await editorOutput();
          setSavedBlockCount(String(output?.blocks.length ?? 0));
        }}
      >
        Read output
      </button>
    </section>
  );
}

describe('MarkdownEditor form surface', () => {
  it('passes typed editor state into the renderForm callback', async () => {
    render(
      <MarkdownEditor
        initialData={INITIAL_DATA}
        isEditMode
        renderForm={(props) => <RenderFormProbe {...props} />}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('custom-form')).toBeInTheDocument();
      expect(screen.getByTestId('editor-ready')).toHaveTextContent('true');
    });

    expect(screen.getByTestId('is-edit-mode')).toHaveTextContent('true');
    expect(screen.getByTestId('initial-title')).toHaveTextContent('Existing title');
    expect(screen.getByTestId('editor-block-count')).toHaveTextContent('2');

    fireEvent.click(screen.getByRole('button', { name: 'Read output' }));

    await waitFor(() => {
      expect(screen.getByTestId('saved-block-count')).toHaveTextContent('2');
    });
  });

  it('renders the default EditorForm when no renderForm override is provided', async () => {
    render(<MarkdownEditor initialData={INITIAL_DATA} />);

    await waitFor(() => {
      expect(screen.getByText('Title')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Slug')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Tags')).toBeInTheDocument();
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  it('serializes the default form payload through onSuccess', async () => {
    const onSuccess = vi.fn<(data: MarkdownEditorSubmitData) => void>();

    render(<MarkdownEditor initialData={INITIAL_DATA} onSuccess={onSuccess} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Slug')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Updated description' },
    });
    fireEvent.change(screen.getByLabelText('Tags'), {
      target: { value: 'alpha, beta' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    expect(onSuccess).toHaveBeenCalledWith({
      description: 'Updated description',
      editorContent: INITIAL_OUTPUT,
      isEditMode: false,
      serializedContent:
        '<div data-block-id="intro-heading">\n\n# Story Driven Editor\n\n</div>\n\n<div data-block-id="intro-body">\n\nBody copy\n\n</div>',
      slug: 'story-driven-editor',
      status: 'published',
      tags: ['alpha', 'beta'],
      title: 'Story Driven Editor',
    });
  });
});
