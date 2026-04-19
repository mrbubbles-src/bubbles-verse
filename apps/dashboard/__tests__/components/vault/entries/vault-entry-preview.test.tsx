import type { MarkdownEditorDraft } from '@bubbles/markdown-editor';

import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { VaultEntryPreview } from '@/components/vault/entries/vault-entry-preview';

const loadCreateDraftMock =
  vi.fn<(scope?: string) => MarkdownEditorDraft | null>();
const loadEditDraftMock =
  vi.fn<(scope?: string) => MarkdownEditorDraft | null>();
const serializeToMdxMock =
  vi.fn<(draft: MarkdownEditorDraft['content']) => string>();

vi.mock('@bubbles/markdown-editor', () => ({
  CREATE_DRAFT_KEY: 'topic-editor-create-draft',
  EDIT_DRAFT_KEY: 'topic-editor-edit-draft',
  loadCreateDraft: (scope?: string) => loadCreateDraftMock(scope),
  loadEditDraft: (scope?: string) => loadEditDraftMock(scope),
  serializeToMdx: (content: MarkdownEditorDraft['content']) =>
    serializeToMdxMock(content),
}));

vi.mock('@bubbles/markdown-renderer', () => ({
  MdxRenderer: ({ content }: { content: string }) => (
    <div data-testid="mdx-renderer">{content}</div>
  ),
}));

describe('VaultEntryPreview', () => {
  beforeEach(() => {
    loadCreateDraftMock.mockReset();
    loadEditDraftMock.mockReset();
    serializeToMdxMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the fullscreen preview from the active create draft', async () => {
    loadCreateDraftMock.mockReturnValue({
      content: {
        blocks: [],
        time: 1,
        version: '2.31.0',
      },
      description: 'Ungespeicherte Vorschau',
      status: 'unpublished',
      title: 'Draft aus dem Browser',
    });
    serializeToMdxMock.mockReturnValue('# Draft body');

    render(<VaultEntryPreview draftScope="vault-entry:create" mode="create" />);

    await waitFor(() => {
      expect(loadCreateDraftMock).toHaveBeenCalledWith('vault-entry:create');
    });

    expect(
      screen.getByRole('heading', { name: 'Draft aus dem Browser' })
    ).toBeInTheDocument();
    expect(screen.getByText('Ungespeicherte Vorschau')).toBeInTheDocument();
    expect(screen.getByTestId('mdx-renderer')).toHaveTextContent(
      '# Draft body'
    );
  });

  it('falls back to persisted content when no edit draft exists', async () => {
    loadEditDraftMock.mockReturnValue(null);

    render(
      <VaultEntryPreview
        draftScope="vault-entry:entry-id"
        fallbackDescription="Gespeicherte Beschreibung"
        fallbackSerializedContent="# Gespeichert"
        fallbackTitle="Gespeicherter Eintrag"
        mode="edit"
      />
    );

    await waitFor(() => {
      expect(loadEditDraftMock).toHaveBeenCalledWith('vault-entry:entry-id');
    });

    expect(
      screen.getByRole('heading', { name: 'Gespeicherter Eintrag' })
    ).toBeInTheDocument();
    expect(screen.getByText('Gespeicherte Beschreibung')).toBeInTheDocument();
    expect(screen.getByTestId('mdx-renderer')).toHaveTextContent(
      '# Gespeichert'
    );
  });
});
