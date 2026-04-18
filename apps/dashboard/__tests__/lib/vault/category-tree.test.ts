import { describe, expect, it } from 'vitest'

import {
  buildVaultCategoryTree,
  canAppendCategoryChild,
  canReparentCategory,
} from '@/lib/vault/category-tree'

describe('canAppendCategoryChild', () => {
  it('allows a child under a top-level category but rejects a third level', () => {
    expect(canAppendCategoryChild({ parentDepth: 0 })).toBe(true)
    expect(canAppendCategoryChild({ parentDepth: 1 })).toBe(false)
  })

  it('keeps categories sorted while nesting one child level below parents', () => {
    const tree = buildVaultCategoryTree([
      {
        id: 'parent-b',
        name: 'B',
        slug: 'b',
        description: '',
        parentId: null,
        sortOrder: 2,
        createdAt: '2026-04-18T00:00:00.000Z',
        updatedAt: '2026-04-18T00:00:00.000Z',
        entryCount: 0,
      },
      {
        id: 'child-a',
        name: 'A child',
        slug: 'a-child',
        description: '',
        parentId: 'parent-a',
        sortOrder: 0,
        createdAt: '2026-04-18T00:00:00.000Z',
        updatedAt: '2026-04-18T00:00:00.000Z',
        entryCount: 0,
      },
      {
        id: 'parent-a',
        name: 'A',
        slug: 'a',
        description: '',
        parentId: null,
        sortOrder: 1,
        createdAt: '2026-04-18T00:00:00.000Z',
        updatedAt: '2026-04-18T00:00:00.000Z',
        entryCount: 0,
      },
    ])

    expect(tree.map((entry) => entry.name)).toEqual(['A', 'B'])
    expect(tree[0]?.children[0]?.name).toBe('A child')
  })

  it('does not allow moving a category with children below another parent', () => {
    expect(
      canReparentCategory({
        nextParentDepth: 0,
        hasChildren: true,
      })
    ).toBe(false)
  })
})
