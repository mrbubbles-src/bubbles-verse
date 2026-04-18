import {
  normalizeVaultCategoryParentId,
  parseCreateVaultCategory,
  parseUpdateVaultCategory,
  slugifyVaultCategory,
} from '@/lib/vault/categories';
import {
  buildVaultCategoryTree,
  canReparentCategory,
} from '@/lib/vault/category-tree';

import { describe, expect, it } from 'vitest';

describe('vault category helpers', () => {
  it('slugifies category names into stable ASCII slugs', () => {
    expect(slugifyVaultCategory('Über React & RSC')).toBe('uber-react-rsc');
  });

  it('builds a sorted two-level category tree', () => {
    const tree = buildVaultCategoryTree([
      {
        id: 'child',
        name: 'Server Actions',
        slug: 'server-actions',
        description: '',
        parentId: 'root',
        sortOrder: 1,
        createdAt: '2026-04-18T00:00:00.000Z',
        updatedAt: '2026-04-18T00:00:00.000Z',
        entryCount: 2,
      },
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
      },
    ]);

    expect(tree).toHaveLength(1);
    expect(tree[0]?.children[0]?.name).toBe('Server Actions');
    expect(tree[0]?.children[0]?.depth).toBe(1);
  });

  it('rejects reparenting a category with children below another parent', () => {
    expect(
      canReparentCategory({
        nextParentDepth: 0,
        hasChildren: true,
      })
    ).toBe(false);
    expect(
      canReparentCategory({
        nextParentDepth: null,
        hasChildren: true,
      })
    ).toBe(true);
  });

  it('parses create and update payloads with generated slugs', () => {
    const createFormData = new FormData();
    createFormData.set('name', 'React Rendering');
    createFormData.set('slug', '');
    createFormData.set('description', 'Alles rund um Rendering.');
    createFormData.set('parentId', 'root-category');
    createFormData.set('sortOrder', '3');

    const updateFormData = new FormData();
    updateFormData.set('id', 'category-id');
    updateFormData.set('name', 'React Rendering');
    updateFormData.set('slug', '');
    updateFormData.set('description', 'Alles rund um Rendering.');
    updateFormData.set('parentId', '');
    updateFormData.set('sortOrder', '0');

    const parsedCreate = parseCreateVaultCategory(createFormData);
    const parsedUpdate = parseUpdateVaultCategory(updateFormData);

    expect(parsedCreate.success).toBe(true);
    expect(parsedUpdate.success).toBe(true);

    if (!parsedCreate.success || !parsedUpdate.success) {
      throw new Error('Expected Vault category form payloads to parse.');
    }

    expect(parsedCreate.data.slug).toBe('react-rendering');
    expect(parsedCreate.data.parentId).toBe('root-category');
    expect(parsedUpdate.data.slug).toBe('react-rendering');
    expect(parsedUpdate.data.parentId).toBeNull();
  });

  it('maps the synthetic root option back to a top-level category', () => {
    expect(normalizeVaultCategoryParentId('root')).toBeNull();
    expect(normalizeVaultCategoryParentId('')).toBeNull();
    expect(normalizeVaultCategoryParentId('parent-category')).toBe(
      'parent-category'
    );
  });
});
