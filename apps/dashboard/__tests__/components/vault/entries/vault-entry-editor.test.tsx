import type { MarkdownEditorProps } from '@bubbles/markdown-editor';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { VaultEntryEditor } from '@/components/vault/entries/vault-entry-editor';

const pushMock = vi.fn();
const refreshMock = vi.fn();
const toastErrorMock = vi.fn<(message: string) => void>();
const createEditorImageUploaderMock = vi.fn(() => ({ uploadByFile: vi.fn() }));
const markdownEditorPropsMock = vi.fn<(props: MarkdownEditorProps) => void>();
const originalFetch = globalThis.fetch;

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

vi.mock('@bubbles/ui/lib/sonner', () => ({
  toast: {
    error: (message: string) => toastErrorMock(message),
    success: vi.fn(),
  },
}));

vi.mock('@bubbles/markdown-editor', () => ({
  createEditorImageUploader: () => createEditorImageUploaderMock(),
  MarkdownEditor: (props: MarkdownEditorProps) => {
    markdownEditorPropsMock(props);

    return (
      <button
        type="button"
        onClick={() => {
          void props.onSuccess?.({
            description: 'Meta description',
            editorContent: {
              blocks: [],
              time: 1,
              version: '2.31.0',
            },
            isEditMode: props.isEditMode ?? false,
            serializedContent: '# Entry',
            slug: 'basics/git',
            status: 'published',
            tags: ['git', 'basics'],
            title: 'Git Basics',
          });
        }}>
        Mock submit
      </button>
    );
  },
}));

describe('VaultEntryEditor', () => {
  beforeEach(() => {
    pushMock.mockReset();
    refreshMock.mockReset();
    toastErrorMock.mockReset();
    createEditorImageUploaderMock.mockClear();
    markdownEditorPropsMock.mockClear();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'entry-id',
        slug: 'basics/git',
      }),
    }) as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('renders the selected category label instead of the raw ID', () => {
    render(
      <VaultEntryEditor
        categories={[
          {
            id: 'category-a',
            label: 'Basics / HTML',
            name: 'HTML',
            topLevelSlug: 'basics',
            childSlug: 'html',
          },
        ]}
        initialData={{
          id: 'entry-id',
          title: 'Tables',
          slug: 'basics/html/tables',
          description: 'HTML tables',
          tags: ['html'],
          status: 'published',
          primaryCategoryId: 'category-a',
          editorContent: {
            blocks: [],
            time: 1,
            version: '2.31.0',
          },
        }}
        mode="edit"
      />
    );

    expect(screen.getByText('Basics / HTML')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Vorschau' })).toHaveAttribute(
      'href',
      '/vault/preview/entry-id'
    );
    expect(screen.queryByText('category-a')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Als Entwurf duplizieren')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Eintrag endgültig entfernen')
    ).not.toBeInTheDocument();
  });

  it('sends description, tags, category, and scoped draft props when saving', async () => {
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;

    render(
      <VaultEntryEditor
        categories={[
          {
            id: 'category-a',
            label: 'Basics',
            name: 'Basics',
            topLevelSlug: 'basics',
            childSlug: null,
          },
        ]}
        initialData={{
          id: 'entry-id',
          title: 'Git Basics',
          slug: 'basics/git',
          description: 'Existing meta',
          tags: ['git'],
          status: 'published',
          primaryCategoryId: 'category-a',
          editorContent: {
            blocks: [],
            time: 1,
            version: '2.31.0',
          },
        }}
        mode="edit"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Mock submit' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(markdownEditorPropsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        draftStorageScope: 'vault-entry:entry-id',
      })
    );
    expect(fetchMock).toHaveBeenCalledWith('/api/vault/entries/entry-id', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: 'Meta description',
        editorContent: {
          blocks: [],
          time: 1,
          version: '2.31.0',
        },
        isEditMode: true,
        serializedContent: '# Entry',
        slug: 'basics/git',
        status: 'published',
        tags: ['git', 'basics'],
        title: 'Git Basics',
        primaryCategoryId: 'category-a',
      }),
    });
    expect(pushMock).toHaveBeenCalledWith('/vault/entries?entry=updated');
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });
});
