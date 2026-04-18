import {
  getVaultEntryInitialData,
  listVaultEntryCategoryOptions,
  parseCreateVaultEntryRequest,
  parseUpdateVaultEntryRequest,
} from '@/lib/vault/entries';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const listVaultCategoriesMock = vi.fn();
const dbSelectMock = vi.fn();
const dbFromMock = vi.fn();
const dbInnerJoinMock = vi.fn();
const dbWhereMock = vi.fn();
const dbLimitMock = vi.fn();
const dbOrderByMock = vi.fn();

vi.mock('@/lib/vault/categories', () => ({
  listVaultCategories: () => listVaultCategoriesMock(),
}));

vi.mock('@/drizzle/db', () => ({
  db: {
    select: (...args: unknown[]) => dbSelectMock(...args),
  },
}));

describe('vault entry helpers', () => {
  beforeEach(() => {
    listVaultCategoriesMock.mockReset();
    dbSelectMock.mockReset();
    dbFromMock.mockReset();
    dbInnerJoinMock.mockReset();
    dbWhereMock.mockReset();
    dbLimitMock.mockReset();
    dbOrderByMock.mockReset();
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

  it('validates an update-entry payload from the markdown editor route', () => {
    const parsedPayload = parseUpdateVaultEntryRequest({
      title: 'React Rendering',
      slug: 'react/rendering',
      description: 'Alles rund um Rendering.',
      tags: ['react'],
      status: 'unpublished',
      editorContent: {
        blocks: [],
      },
      serializedContent: '# React Rendering',
      primaryCategoryId: 'category-id',
    });

    expect(parsedPayload.success).toBe(true);
  });

  it('loads one vault entry with category and tag metadata for edit mode', async () => {
    dbSelectMock
      .mockReturnValueOnce({
        from: dbFromMock.mockReturnValueOnce({
          innerJoin: dbInnerJoinMock.mockReturnValueOnce({
            where: dbWhereMock.mockReturnValueOnce({
              limit: dbLimitMock.mockResolvedValueOnce([
                {
                  id: 'entry-id',
                  title: 'React Rendering',
                  slug: 'react/rendering',
                  description: 'Alles rund um Rendering.',
                  status: 'published',
                  editorContent: {
                    blocks: [],
                  },
                  primaryCategoryId: 'category-id',
                },
              ]),
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: dbFromMock.mockReturnValueOnce({
          where: dbWhereMock.mockReturnValueOnce({
            orderBy: dbOrderByMock.mockResolvedValueOnce([
              {
                tag: 'react',
              },
              {
                tag: 'rendering',
              },
            ]),
          }),
        }),
      });

    await expect(getVaultEntryInitialData('entry-id')).resolves.toEqual({
      id: 'entry-id',
      title: 'React Rendering',
      slug: 'react/rendering',
      description: 'Alles rund um Rendering.',
      tags: ['react', 'rendering'],
      status: 'published',
      primaryCategoryId: 'category-id',
      editorContent: {
        blocks: [],
      },
    });
  });
});
