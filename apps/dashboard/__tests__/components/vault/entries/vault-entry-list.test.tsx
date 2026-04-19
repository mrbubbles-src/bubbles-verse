import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { VaultEntryList } from '@/components/vault/entries/vault-entry-list';

const routerPushMock = vi.fn();
const routerRefreshMock = vi.fn();
const fetchMock = vi.fn();

vi.stubGlobal('fetch', fetchMock);

vi.mock('next/navigation', () => ({
  usePathname: () => '/vault/entries',
  useRouter: () => ({
    push: routerPushMock,
    refresh: routerRefreshMock,
  }),
  useSearchParams: () => new URLSearchParams('query=React&page=2'),
}));

describe('VaultEntryList', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    routerPushMock.mockReset();
    routerRefreshMock.mockReset();
  });

  it('renders a real table with the agreed columns and icon actions', () => {
    render(
      <VaultEntryList
        entries={[
          {
            id: 'entry-1',
            title: 'React Rendering',
            slug: 'react/rendering',
            description: 'Alles rund um Rendering und Streaming.',
            status: 'published',
            categoryId: 'react-rendering',
            categoryLabel: 'React / Rendering',
            updatedAt: '2026-04-18T18:00:00.000Z',
            updatedAtLabel: '18.04.2026, 18:00',
            previewHref: null,
          },
        ]}
        filters={{
          query: '',
          status: 'all',
          categoryId: null,
          page: 1,
          pageSize: 20,
        }}
        pagination={{
          page: 1,
          pageSize: 20,
          totalItems: 1,
          totalPages: 1,
          showPagination: false,
          pageSizeOptions: [20, 50, 100],
        }}
      />
    );

    expect(
      screen.getByRole('columnheader', { name: 'Titel' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Kategorie' })
    ).toBeInTheDocument();
    expect(screen.getByText('React Rendering')).toBeInTheDocument();
    expect(
      screen.getByText('Alles rund um Rendering und Streaming.')
    ).toBeInTheDocument();
    expect(screen.getByText('React / Rendering')).toBeInTheDocument();
    expect(screen.getByText('Veröffentlicht')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Vorschau öffnen' })
    ).toBeDisabled();
  });

  it('shows classic pagination controls when multiple pages are available', () => {
    render(
      <VaultEntryList
        entries={[
          {
            id: 'entry-1',
            title: 'React Rendering',
            slug: 'react/rendering',
            description: 'Alles rund um Rendering und Streaming.',
            status: 'draft',
            categoryId: 'react-rendering',
            categoryLabel: 'React / Rendering',
            updatedAt: '2026-04-18T18:00:00.000Z',
            updatedAtLabel: '18.04.2026, 18:00',
            previewHref: 'https://vault.example/vault/react/rendering',
          },
        ]}
        filters={{
          query: 'React',
          status: 'all',
          categoryId: null,
          page: 2,
          pageSize: 20,
        }}
        pagination={{
          page: 2,
          pageSize: 20,
          totalItems: 42,
          totalPages: 3,
          showPagination: true,
          pageSizeOptions: [20, 50, 100],
        }}
      />
    );

    expect(screen.getByText('Items pro Seite')).toBeInTheDocument();
    expect(screen.getByText('Seite 2 von 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zurück' })).toHaveAttribute(
      'href',
      '/vault/entries?query=React'
    );
    expect(screen.getByRole('button', { name: 'Seite 2' })).toBeDisabled();
  });

  it('uses the two-step delete confirmation flow before deleting an entry', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => null,
    });

    render(
      <VaultEntryList
        entries={[
          {
            id: 'entry-1',
            title: 'React Rendering',
            slug: 'react/rendering',
            description: 'Alles rund um Rendering und Streaming.',
            status: 'draft',
            categoryId: 'react-rendering',
            categoryLabel: 'React / Rendering',
            updatedAt: '2026-04-18T18:00:00.000Z',
            updatedAtLabel: '18.04.2026, 18:00',
            previewHref: null,
          },
        ]}
        filters={{
          query: 'React',
          status: 'all',
          categoryId: null,
          page: 2,
          pageSize: 20,
        }}
        pagination={{
          page: 2,
          pageSize: 20,
          totalItems: 21,
          totalPages: 2,
          showPagination: true,
          pageSizeOptions: [20, 50, 100],
        }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Eintrag löschen' }));

    expect(screen.getByText('Eintrag löschen?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Löschen' }));

    expect(screen.getByText('Wirklich endgültig löschen?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ja, löschen' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/vault/entries/entry-1', {
        method: 'DELETE',
      });
    });

    expect(routerPushMock).toHaveBeenCalledWith(
      '/vault/entries?query=React&page=2&entry=deleted'
    );
    expect(routerRefreshMock).toHaveBeenCalled();
  });

  it('renders a custom empty state when filters return no results', () => {
    render(
      <VaultEntryList
        entries={[]}
        filters={{
          query: '',
          status: 'all',
          categoryId: null,
          page: 1,
          pageSize: 20,
        }}
        pagination={{
          page: 1,
          pageSize: 20,
          totalItems: 0,
          totalPages: 1,
          showPagination: false,
          pageSizeOptions: [20, 50, 100],
        }}
        emptyState="Keine Vault-Einträge passen gerade zu diesen Filtern."
      />
    );

    expect(
      screen.getByText('Keine Vault-Einträge passen gerade zu diesen Filtern.')
    ).toBeInTheDocument();
  });
});
