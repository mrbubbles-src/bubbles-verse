import {
  listVaultEntryCategoryOptions,
  parseCreateVaultEntryRequest,
} from '@/lib/vault/entries';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const listVaultCategoriesMock = vi.fn();

vi.mock('@/lib/vault/categories', () => ({
  listVaultCategories: () => listVaultCategoriesMock(),
}));

describe('vault entry helpers', () => {
  beforeEach(() => {
    listVaultCategoriesMock.mockReset();
  });

  it('flattens top-level and child categories into editor options', async () => {
    listVaultCategoriesMock.mockResolvedValue([
      {
        id: 'root',
        name: 'React',
        slug: 'react',
        description: '',
        parentId: null,
        sortOrder: 0,
        createdAt: '2026-04-18T00:00:00.000Z',
        updatedAt: '2026-04-18T00:00:00.000Z',
      },
      {
        id: 'child',
        name: 'Server Actions',
        slug: 'server-actions',
        description: '',
        parentId: 'root',
        sortOrder: 1,
        createdAt: '2026-04-18T00:00:00.000Z',
        updatedAt: '2026-04-18T00:00:00.000Z',
      },
    ]);

    await expect(listVaultEntryCategoryOptions()).resolves.toEqual([
      {
        id: 'root',
        label: 'React',
        name: 'React',
        topLevelSlug: 'react',
        childSlug: null,
      },
      {
        id: 'child',
        label: 'React / Server Actions',
        name: 'Server Actions',
        topLevelSlug: 'react',
        childSlug: 'server-actions',
      },
    ]);
  });

  it('validates a create-entry payload from the markdown editor route', () => {
    const parsedPayload = parseCreateVaultEntryRequest({
      title: 'React Rendering',
      slug: 'react/rendering',
      description: 'Alles rund um Rendering.',
      tags: ['react', 'rendering', 'react'],
      status: 'published',
      editorContent: {
        blocks: [
          {
            id: 'intro',
            type: 'header',
            data: {
              level: 1,
              text: 'React Rendering',
            },
          },
        ],
      },
      serializedContent: '# React Rendering',
      primaryCategoryId: 'category-id',
    });

    expect(parsedPayload.success).toBe(true);

    if (!parsedPayload.success) {
      throw new Error('Expected create-entry payload to parse.');
    }

    expect(parsedPayload.data.tags).toEqual(['react', 'rendering']);
  });
});
