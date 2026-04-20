import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { CategoryTreeList } from '@/components/vault/categories/category-tree-list';

vi.mock('@/app/(dashboard)/vault/categories/actions', () => ({
  createVaultCategoryAction: async () => undefined,
  updateVaultCategoryAction: async () => undefined,
  deleteVaultCategoryAction: async () => undefined,
}));

describe('CategoryTreeList', () => {
  it('renders flat management rows with hierarchy labels and actions', () => {
    render(
      <CategoryTreeList
        parentOptions={[{ id: 'root', name: 'React' }]}
        categories={[
          {
            id: 'root',
            name: 'React',
            slug: 'react',
            description: 'Alles rund um React.',
            parentId: null,
            sortOrder: 0,
            createdAt: '2026-04-18T00:00:00.000Z',
            updatedAt: '2026-04-18T00:00:00.000Z',
            entryCount: 1,
            depth: 0,
            children: [
              {
                id: 'child',
                name: 'Server Actions',
                slug: 'server-actions',
                description: 'Mutationen mit Server Actions.',
                parentId: 'root',
                sortOrder: 1,
                createdAt: '2026-04-18T00:00:00.000Z',
                updatedAt: '2026-04-18T00:00:00.000Z',
                entryCount: 0,
                depth: 1,
                children: [],
              },
            ],
          },
        ]}
      />
    );

    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Server Actions')).toBeInTheDocument();
    expect(screen.getByText('Oberkategorie')).toBeInTheDocument();
    expect(screen.getByText('Unterkategorie in React')).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: 'Kategorie bearbeiten' })
    ).toHaveLength(2);
    expect(
      screen.getAllByRole('button', { name: 'Kategorie bearbeiten' })[0]
    ).not.toHaveAttribute('title');
    screen
      .getAllByRole('button', { name: 'Unterkategorie anlegen' })
      .forEach((button) => {
        expect(button).not.toHaveAttribute('title');
      });
    screen
      .getAllByRole('button', { name: 'Kategorie löschen' })
      .forEach((button) => {
        expect(button).not.toHaveAttribute('title');
      });
  });

  it('allows collapsing one top-level category group', () => {
    render(
      <CategoryTreeList
        parentOptions={[{ id: 'root', name: 'React' }]}
        categories={[
          {
            id: 'root',
            name: 'React',
            slug: 'react',
            description: 'Alles rund um React.',
            parentId: null,
            sortOrder: 0,
            createdAt: '2026-04-18T00:00:00.000Z',
            updatedAt: '2026-04-18T00:00:00.000Z',
            entryCount: 1,
            depth: 0,
            children: [
              {
                id: 'child',
                name: 'Server Actions',
                slug: 'server-actions',
                description: 'Mutationen mit Server Actions.',
                parentId: 'root',
                sortOrder: 1,
                createdAt: '2026-04-18T00:00:00.000Z',
                updatedAt: '2026-04-18T00:00:00.000Z',
                entryCount: 0,
                depth: 1,
                children: [],
              },
            ],
          },
        ]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'React einklappen' }));

    expect(screen.queryByText('Server Actions')).not.toBeInTheDocument();
  });

  it('renders the custom empty state when no categories match', () => {
    render(
      <CategoryTreeList
        parentOptions={[]}
        categories={[]}
        emptyState="Keine Kategorien passen gerade zu dieser Suche oder diesem Filter."
      />
    );

    expect(
      screen.getByText(
        'Keine Kategorien passen gerade zu dieser Suche oder diesem Filter.'
      )
    ).toBeInTheDocument();
  });
});
