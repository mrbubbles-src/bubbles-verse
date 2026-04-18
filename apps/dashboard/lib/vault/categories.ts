import type { VaultCategoryTreeNode } from '@/lib/vault/category-tree';

import {
  buildVaultCategoryTree,
  canReparentCategory,
} from '@/lib/vault/category-tree';

import { asc, count, eq, inArray, isNull } from 'drizzle-orm';
import * as z from 'zod';

import { db } from '@/drizzle/db';
import { vaultCategories, vaultEntries } from '@/drizzle/db/schema';

export type VaultCategoryRecord = typeof vaultCategories.$inferSelect;

export type VaultCategoryFormValues = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  parentId: string | null;
  sortOrder: number;
};

const createVaultCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Bitte gib einen Kategorienamen ein.')
    .max(80, 'Kategorienamen dürfen höchstens 80 Zeichen lang sein.'),
  slug: z
    .string()
    .trim()
    .max(120, 'Slugs dürfen höchstens 120 Zeichen lang sein.'),
  description: z
    .string()
    .trim()
    .max(240, 'Beschreibungen dürfen höchstens 240 Zeichen lang sein.')
    .transform((value) => value),
  parentId: z
    .string()
    .trim()
    .transform((value) => normalizeVaultCategoryParentId(value)),
  sortOrder: z.coerce
    .number()
    .int('Bitte gib eine ganze Zahl ein.')
    .min(-999, 'Sortierung darf nicht kleiner als -999 sein.')
    .max(999, 'Sortierung darf nicht größer als 999 sein.'),
});

const updateVaultCategorySchema = createVaultCategorySchema.extend({
  id: z.string().trim().min(1, 'Bitte wähle eine Kategorie aus.'),
});

/**
 * Turns free-form category titles into a stable URL slug.
 *
 * The category table keeps a unique slug per row so future public Vault pages
 * can reuse the same identifier without a second migration.
 *
 * @param value Raw category title or manual slug input.
 * @returns A normalized, ASCII-only slug.
 */
export function slugifyVaultCategory(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

/**
 * Normalizes the synthetic form value for top-level categories.
 *
 * The UI uses the stable sentinel `root` in select menus because Base UI does
 * not support an empty item value, while the database stores top-level
 * categories with `parentId = null`.
 *
 * @param value Raw parent select value from the category forms.
 * @returns `null` for top-level categories or the referenced parent ID.
 */
export function normalizeVaultCategoryParentId(
  value: string | null | undefined
) {
  if (!value) {
    return null;
  }

  const normalizedValue = value.trim();

  if (!normalizedValue || normalizedValue === 'root') {
    return null;
  }

  return normalizedValue;
}

/**
 * Parses and normalizes a create-category form payload.
 *
 * Empty slug input falls back to a slug generated from the category name.
 *
 * @param formData Submitted create form payload.
 * @returns A safe parse result with normalized values.
 */
export function parseCreateVaultCategory(formData: FormData) {
  return createVaultCategorySchema
    .transform((values) => ({
      ...values,
      slug: slugifyVaultCategory(values.slug || values.name),
    }))
    .safeParse({
      name: formData.get('name'),
      slug: formData.get('slug') ?? '',
      description: formData.get('description') ?? '',
      parentId: formData.get('parentId') ?? '',
      sortOrder: formData.get('sortOrder') ?? '0',
    });
}

/**
 * Parses and normalizes an update-category form payload.
 *
 * @param formData Submitted update form payload.
 * @returns A safe parse result with normalized values.
 */
export function parseUpdateVaultCategory(formData: FormData) {
  return updateVaultCategorySchema
    .transform((values) => ({
      ...values,
      slug: slugifyVaultCategory(values.slug || values.name),
    }))
    .safeParse({
      id: formData.get('id'),
      name: formData.get('name'),
      slug: formData.get('slug') ?? '',
      description: formData.get('description') ?? '',
      parentId: formData.get('parentId') ?? '',
      sortOrder: formData.get('sortOrder') ?? '0',
    });
}

/**
 * Loads a single Vault category row by ID.
 *
 * @param id Vault category identifier.
 * @returns The matching category or `null`.
 */
export async function getVaultCategoryById(id: string) {
  const [category] = await db
    .select()
    .from(vaultCategories)
    .where(eq(vaultCategories.id, id))
    .limit(1);

  return category ?? null;
}

/**
 * Lists every Vault category in stable top-level-first order.
 *
 * @returns Flat category rows from the database.
 */
export async function listVaultCategories() {
  return db
    .select()
    .from(vaultCategories)
    .orderBy(
      asc(vaultCategories.parentId),
      asc(vaultCategories.sortOrder),
      asc(vaultCategories.name)
    );
}

/**
 * Returns all top-level categories that may receive children in V1.
 *
 * @returns Top-level parent options for the category form.
 */
export async function listVaultCategoryParentOptions() {
  return db
    .select({
      id: vaultCategories.id,
      name: vaultCategories.name,
    })
    .from(vaultCategories)
    .where(isNull(vaultCategories.parentId))
    .orderBy(asc(vaultCategories.sortOrder), asc(vaultCategories.name));
}

/**
 * Counts the direct child categories for a given parent.
 *
 * @param parentId Parent category identifier.
 * @returns Number of direct child rows.
 */
export async function countVaultCategoryChildren(parentId: string) {
  const [result] = await db
    .select({ total: count() })
    .from(vaultCategories)
    .where(eq(vaultCategories.parentId, parentId));

  return result?.total ?? 0;
}

/**
 * Counts how many Vault entries reference a category as their primary category.
 *
 * @param categoryId Category identifier.
 * @returns Number of linked Vault entries.
 */
export async function countVaultCategoryEntries(categoryId: string) {
  const [result] = await db
    .select({ total: count() })
    .from(vaultEntries)
    .where(eq(vaultEntries.primaryCategoryId, categoryId));

  return result?.total ?? 0;
}

/**
 * Builds the full model needed by the `/vault/categories` page.
 *
 * Each node includes its current direct entry count so the UI can show whether
 * a category is still in active use before the owner edits or deletes it.
 *
 * @returns Sorted tree plus parent options for the management page.
 */
export async function getVaultCategoryPageModel(): Promise<{
  tree: VaultCategoryTreeNode[];
  parentOptions: Array<{ id: string; name: string }>;
}> {
  const categories = await listVaultCategories();
  const categoryIds = categories.map((category) => category.id);
  const entryCounts =
    categoryIds.length === 0
      ? []
      : await db
          .select({
            categoryId: vaultEntries.primaryCategoryId,
            total: count(),
          })
          .from(vaultEntries)
          .where(inArray(vaultEntries.primaryCategoryId, categoryIds))
          .groupBy(vaultEntries.primaryCategoryId);
  const entryCountMap = new Map(
    entryCounts.map((entryCount) => [entryCount.categoryId, entryCount.total])
  );

  return {
    tree: buildVaultCategoryTree(
      categories.map((category) => ({
        ...category,
        description: category.description,
        entryCount: entryCountMap.get(category.id) ?? 0,
      }))
    ),
    parentOptions: categories
      .filter((category) => category.parentId === null)
      .sort((left, right) => {
        if (left.sortOrder !== right.sortOrder) {
          return left.sortOrder - right.sortOrder;
        }

        return left.name.localeCompare(right.name, 'de');
      })
      .map((category) => ({
        id: category.id,
        name: category.name,
      })),
  };
}

/**
 * Checks whether a category may be assigned to the proposed parent.
 *
 * @param currentCategory Current category row for update flows.
 * @param nextParentId Proposed parent category ID or `null`.
 * @returns `true` when the new parent keeps the tree valid.
 */
export async function canAssignVaultCategoryParent(input: {
  currentCategory: VaultCategoryRecord | null;
  nextParentId: string | null;
}) {
  if (!input.nextParentId) {
    return true;
  }

  if (
    input.currentCategory &&
    input.currentCategory.id === input.nextParentId
  ) {
    return false;
  }

  const nextParent = await getVaultCategoryById(input.nextParentId);

  if (!nextParent) {
    return false;
  }

  const nextParentDepth = nextParent.parentId ? 1 : 0;
  const hasChildren = input.currentCategory
    ? (await countVaultCategoryChildren(input.currentCategory.id)) > 0
    : false;

  return canReparentCategory({
    nextParentDepth,
    hasChildren,
  });
}
