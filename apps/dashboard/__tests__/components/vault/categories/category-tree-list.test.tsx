import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { CategoryTreeList } from '@/components/vault/categories/category-tree-list';

vi.mock('@/app/(dashboard)/vault/categories/actions', () => ({
  updateVaultCategoryAction: async () => undefined,
  deleteVaultCategoryAction: async () => undefined,
}));

describe('CategoryTreeList', () => {
  it('renders top-level and child categories with their labels', () => {
    render(
      <CategoryTreeList
        parentOptions={[{ id: 'root', name: 'React' }]}
        categories={[
          {
            id: 'root',
            name: 'React',
            slug: 'react',
            description: '',
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
                description: '',
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
    expect(screen.getByText('Unterkategorie')).toBeInTheDocument();
  });
});
