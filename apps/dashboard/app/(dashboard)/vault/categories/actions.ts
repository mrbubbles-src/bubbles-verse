'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { db } from '@/drizzle/db';
import { vaultCategories } from '@/drizzle/db/schema';
import {
  getVaultCategoryFeedbackHref,
  type VaultCategoryFeedbackStatus,
} from '@/lib/vault/category-feedback';
import {
  canAssignVaultCategoryParent,
  countVaultCategoryChildren,
  countVaultCategoryEntries,
  getVaultCategoryById,
  parseCreateVaultCategory,
  parseUpdateVaultCategory,
} from '@/lib/vault/categories';
import { requireDashboardManagerSession } from '@/lib/auth/session';

import { eq } from 'drizzle-orm';

/**
 * Redirects back to the categories page after a finished mutation.
 *
 * @param status Short status code for the category feedback toast.
 */
function redirectToVaultCategoryFeedback(
  status: VaultCategoryFeedbackStatus
): never {
  revalidatePath('/vault/categories');
  redirect(getVaultCategoryFeedbackHref(status));
}

/**
 * Detects a Postgres error code on thrown DB errors.
 *
 * @param error Thrown DB error from the current mutation.
 * @param code Postgres error code to match.
 * @returns `true` when the error exposes the requested code.
 */
function hasPostgresErrorCode(error: unknown, code: string) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string' &&
    error.code === code
  );
}

/**
 * Creates a new Vault category.
 *
 * @param formData Submitted category form payload.
 */
export async function createVaultCategoryAction(formData: FormData) {
  await requireDashboardManagerSession();

  const parsedCategory = parseCreateVaultCategory(formData);

  if (!parsedCategory.success || !parsedCategory.data.slug) {
    redirectToVaultCategoryFeedback('invalid');
  }

  const canAssignParent = await canAssignVaultCategoryParent({
    currentCategory: null,
    nextParentId: parsedCategory.data.parentId,
  });

  if (!canAssignParent) {
    redirectToVaultCategoryFeedback('protected');
  }

  try {
    await db.insert(vaultCategories).values({
      name: parsedCategory.data.name,
      slug: parsedCategory.data.slug,
      description: parsedCategory.data.description,
      parentId: parsedCategory.data.parentId,
      sortOrder: parsedCategory.data.sortOrder,
    });
  } catch (error) {
    if (hasPostgresErrorCode(error, '23505')) {
      redirectToVaultCategoryFeedback('duplicate');
    }

    console.error('Failed to create Vault category.', error);
    redirectToVaultCategoryFeedback('error');
  }

  redirectToVaultCategoryFeedback('created');
}

/**
 * Updates a Vault category while preserving the two-level tree limit.
 *
 * @param formData Submitted category edit payload.
 */
export async function updateVaultCategoryAction(formData: FormData) {
  await requireDashboardManagerSession();

  const parsedCategory = parseUpdateVaultCategory(formData);

  if (!parsedCategory.success || !parsedCategory.data.slug) {
    redirectToVaultCategoryFeedback('invalid');
  }

  const currentCategory = await getVaultCategoryById(parsedCategory.data.id);

  if (!currentCategory) {
    redirectToVaultCategoryFeedback('error');
  }

  const canAssignParent = await canAssignVaultCategoryParent({
    currentCategory,
    nextParentId: parsedCategory.data.parentId,
  });

  if (!canAssignParent) {
    redirectToVaultCategoryFeedback('protected');
  }

  try {
    await db
      .update(vaultCategories)
      .set({
        name: parsedCategory.data.name,
        slug: parsedCategory.data.slug,
        description: parsedCategory.data.description,
        parentId: parsedCategory.data.parentId,
        sortOrder: parsedCategory.data.sortOrder,
      })
      .where(eq(vaultCategories.id, parsedCategory.data.id));
  } catch (error) {
    if (hasPostgresErrorCode(error, '23505')) {
      redirectToVaultCategoryFeedback('duplicate');
    }

    console.error('Failed to update Vault category.', error);
    redirectToVaultCategoryFeedback('error');
  }

  redirectToVaultCategoryFeedback('updated');
}

/**
 * Deletes a Vault category when it is not referenced by children or entries.
 *
 * @param formData Submitted delete payload containing the category ID.
 */
export async function deleteVaultCategoryAction(formData: FormData) {
  await requireDashboardManagerSession();

  const categoryId = String(formData.get('id') ?? '').trim();

  if (!categoryId) {
    redirectToVaultCategoryFeedback('invalid');
  }

  const childCount = await countVaultCategoryChildren(categoryId);
  const entryCount = await countVaultCategoryEntries(categoryId);

  if (childCount > 0 || entryCount > 0) {
    redirectToVaultCategoryFeedback('protected');
  }

  try {
    await db.delete(vaultCategories).where(eq(vaultCategories.id, categoryId));
  } catch (error) {
    console.error('Failed to delete Vault category.', error);
    redirectToVaultCategoryFeedback('error');
  }

  redirectToVaultCategoryFeedback('deleted');
}
