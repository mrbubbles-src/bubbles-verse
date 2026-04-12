import type { OutputData } from '@editorjs/editorjs';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MarkdownEditor } from '../../src/components/markdown-editor';
import { CREATE_DRAFT_KEY, EDIT_DRAFT_KEY } from '../../src/lib/draft-storage';
import type {
  EditorRenderFormProps,
  MarkdownEditorInitialData,
  MarkdownEditorSubmitData,
} from '../../src/types/editor';

const mdxRendererMock = vi.fn((props: { content: string }) => (
  <div data-testid="mdx-renderer">{props.content}</div>
));

vi.mock('@bubbles/markdown-renderer', () => {
  return {
    MdxRenderer: (props: { content: string }) => mdxRendererMock(props),
  };
});

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

class MockEditorJs {
  public isReady: Promise<void>;
  private currentOutput: OutputData;
  private readonly destroyMock: () => void;
  private readonly renderMock: (data: OutputData) => Promise<void>;
  public readonly blocks: {
    render: (data: OutputData) => Promise<void>;
  };

  constructor(config: { data?: OutputData; onReady?: () => void }) {
    this.currentOutput = config.data ?? latestOutput;
    this.destroyMock = vi.fn();
    this.renderMock = vi.fn(async (data: OutputData) => {
      this.currentOutput = data;
    });
    this.blocks = {
      render: async (data: OutputData) => {
        this.currentOutput = data;
      },
    };
    this.isReady = Promise.resolve().then(() => {
      config.onReady?.();
    });
  }

  async save() {
    return this.currentOutput;
  }

  async render(data: OutputData) {
    await this.renderMock(data);
  }

  destroy() {
    this.destroyMock();
  }
}

vi.mock('../../src/lib/load-editorjs', () => {
  return {
    loadEditorJs: vi.fn(async () => MockEditorJs),
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
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

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

  it('renders the live split-pane preview from the current editor content', async () => {
    render(<MarkdownEditor initialData={INITIAL_DATA} />);

    await waitFor(() => {
      expect(screen.getByTestId('markdown-editor-preview')).toBeInTheDocument();
      expect(screen.getByTestId('mdx-renderer')).toBeInTheDocument();
    });

    expect(screen.getByTestId('mdx-renderer')).toHaveTextContent(
      '<div data-block-id="intro-heading">'
    );
    expect(screen.getByTestId('mdx-renderer')).toHaveTextContent(
      'Story Driven Editor'
    );
    expect(screen.getByTestId('mdx-renderer')).toHaveTextContent(
      '<div data-block-id="intro-body">'
    );
  });

  it('imports markdown files with the portal reference replacement flow', async () => {
    render(<MarkdownEditor initialData={INITIAL_DATA} />);

    fireEvent.click(
      await screen.findByRole('button', { name: 'Markdown importieren' })
    );

    const fileInput = await screen.findByLabelText('Markdown-Datei auswählen');
    const importFile = new File(
      ['# Imported Title\n\nImported body'],
      'imported-entry.md',
      {
        type: 'text/markdown',
      }
    );

    fireEvent.change(fileInput, {
      target: { files: [importFile] },
    });

    await waitFor(() => {
      expect(screen.getByText(/Blöcke:/)).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Importieren' }));

    await waitFor(() => {
      expect(
        screen.getByText('Bestehender Inhalt wird ersetzt!')
      ).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'Trotzdem importieren' })
    );

    await waitFor(() => {
      expect(screen.getByTestId('mdx-renderer')).toHaveTextContent(
        'Imported Title'
      );
      expect(screen.getByTestId('mdx-renderer')).toHaveTextContent(
        'Imported body'
      );
    });
  });

  it('surfaces image placeholder warnings during markdown import', async () => {
    render(<MarkdownEditor initialData={INITIAL_DATA} />);

    fireEvent.click(
      await screen.findByRole('button', { name: 'Markdown importieren' })
    );

    const fileInput = await screen.findByLabelText('Markdown-Datei auswählen');
    const importFile = new File(
      ['![Hero](https://example.com/hero.png)'],
      'hero.mdx',
      {
        type: 'text/markdown',
      }
    );

    fireEvent.change(fileInput, {
      target: { files: [importFile] },
    });

    await waitFor(() => {
      expect(screen.getByText(/Hinweise \(1\)/)).toBeInTheDocument();
      expect(screen.getByText(/Image "Hero"/)).toBeInTheDocument();
      expect(screen.getByText(/Bilder:/)).toBeInTheDocument();
      expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(2);
    });
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

  it('restores create-mode drafts from localStorage when the editor mounts', async () => {
    const restoredOutput: OutputData = {
      blocks: [
        {
          id: 'draft-heading',
          type: 'header',
          data: {
            level: 1,
            text: 'Restored Draft Title',
          },
        },
      ],
      time: 999,
      version: '2.31.0',
    };

    window.localStorage.setItem(
      CREATE_DRAFT_KEY,
      JSON.stringify({
        content: restoredOutput,
        description: 'Draft description',
        slug: 'restored-draft-title',
        status: 'unpublished',
        tags: ['draft'],
        title: 'Restored Draft Title',
      } satisfies MarkdownEditorInitialData)
    );

    render(
      <MarkdownEditor
        initialData={INITIAL_DATA}
        renderForm={(props) => <RenderFormProbe {...props} />}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('initial-title')).toHaveTextContent(
        'Restored Draft Title'
      );
      expect(screen.getByTestId('editor-block-count')).toHaveTextContent('1');
    });
  });

  it('restores edit-mode form fields from the separate edit draft key', async () => {
    window.localStorage.setItem(
      EDIT_DRAFT_KEY,
      JSON.stringify({
        content: {
          blocks: [
            {
              id: 'edit-draft-heading',
              type: 'header',
              data: {
                level: 1,
                text: 'Edit Draft Title',
              },
            },
          ],
          time: 111,
          version: '2.31.0',
        },
        description: 'Edit draft description',
        slug: 'edit-draft-title',
        status: 'unpublished',
        tags: ['edit', 'draft'],
        title: 'Edit Draft Title',
      } satisfies MarkdownEditorInitialData)
    );

    render(<MarkdownEditor initialData={INITIAL_DATA} isEditMode />);

    await waitFor(() => {
      expect(screen.getByLabelText('Slug')).toHaveValue('edit-draft-title');
      expect(screen.getByLabelText('Description')).toHaveValue(
        'Edit draft description'
      );
      expect(screen.getByLabelText('Tags')).toHaveValue('edit, draft');
    });

    expect(screen.getByText('Edit Draft Title')).toBeInTheDocument();
  });

  it('saves edit-mode drafts to the edit localStorage key', async () => {
    render(<MarkdownEditor initialData={INITIAL_DATA} isEditMode />);

    await waitFor(() => {
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Changed in edit mode' },
    });

    await waitFor(() => {
      const storedDraft = JSON.parse(
        window.localStorage.getItem(EDIT_DRAFT_KEY) ?? 'null'
      ) as MarkdownEditorInitialData | null;

      expect(storedDraft?.description).toBe('Changed in edit mode');
    });

    expect(window.localStorage.getItem(CREATE_DRAFT_KEY)).toBeNull();
  });

  it('clears and disables create-mode draft persistence after a successful submit', async () => {
    function SubmitHarness() {
      const [submitCount, setSubmitCount] = useState(0);

      return (
        <div>
          <div data-testid="submit-count">{submitCount}</div>
          <MarkdownEditor
            initialData={INITIAL_DATA}
            onSuccess={() => {
              setSubmitCount((currentCount) => currentCount + 1);
            }}
          />
        </div>
      );
    }

    render(<SubmitHarness />);

    await waitFor(() => {
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Draft before submit' },
    });

    await waitFor(() => {
      const storedDraft = JSON.parse(
        window.localStorage.getItem(CREATE_DRAFT_KEY) ?? 'null'
      ) as MarkdownEditorInitialData | null;

      expect(storedDraft?.description).toBe('Draft before submit');
    });

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByTestId('submit-count')).toHaveTextContent('1');
      expect(window.localStorage.getItem(CREATE_DRAFT_KEY)).toBeNull();
    });
  });
});
