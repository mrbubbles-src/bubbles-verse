import { requireDashboardManagerSession } from '@/lib/auth/session';
import { getVaultCategoryPageModel } from '@/lib/vault/categories';

import { CategoryFeedbackToast } from '@/components/vault/categories/category-feedback-toast';
import { CategoryManager } from '@/components/vault/categories/category-manager';

/**
 * Renders the first real Vault category management page.
 *
 * Owners and Editors can create, edit, and delete the strict two-level Vault
 * category tree directly inside the shared dashboard shell.
 */
export default async function VaultCategoriesPage() {
  await requireDashboardManagerSession();
  const categoryPageModel = await getVaultCategoryPageModel();

  return (
    <>
      <CategoryFeedbackToast />
      <CategoryManager
        categories={categoryPageModel.tree}
        parentOptions={categoryPageModel.parentOptions}
      />
    </>
  );
}
