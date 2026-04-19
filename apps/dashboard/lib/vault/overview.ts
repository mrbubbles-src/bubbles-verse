import { listVaultCategories } from '@/lib/vault/categories';
import { getVaultEntries } from '@/lib/vault/entries';

import { count, eq } from 'drizzle-orm';

import { db } from '@/drizzle/db';
import { contentItems, vaultEntries } from '@/drizzle/db/schema';

export type VaultOverviewQuickAction = {
  label: string;
  href: string;
};

export type VaultOverviewStatusItem = {
  label: string;
  value: string;
};

export type VaultOverviewRecentEntry = {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  categoryId: string;
  categoryLabel: string;
  updatedAt: string;
  updatedAtLabel: string;
};

type VaultOverviewInput = {
  draftEntries: number;
  publishedEntries: number;
  totalCategories: number;
  recentEntries: VaultOverviewRecentEntry[];
};

export type VaultOverviewModel = {
  quickActions: VaultOverviewQuickAction[];
  statusItems: VaultOverviewStatusItem[];
  recentDrafts: VaultOverviewRecentEntry[];
  recentUpdates: VaultOverviewRecentEntry[];
};

/**
 * Shapes the first Vault landing page around the core editorial decisions.
 *
 * The model stays compact on purpose: one work queue, two creation actions,
 * and one slim status line are enough for this overview.
 *
 * @param input Raw query results for entries, categories, and recent updates.
 * @returns A UI-ready Vault overview model.
 */
export function buildVaultOverviewModel(
  input: VaultOverviewInput
): VaultOverviewModel {
  return {
    quickActions: [
      {
        label: 'Neuer Eintrag',
        href: '/vault/entries/new',
      },
      {
        label: 'Neue Kategorie',
        href: '/vault/categories',
      },
    ],
    statusItems: [
      {
        label: 'Entwürfe',
        value: String(input.draftEntries),
      },
      {
        label: 'Veröffentlicht',
        value: String(input.publishedEntries),
      },
      {
        label: 'Kategorien',
        value: String(input.totalCategories),
      },
    ],
    recentDrafts: input.recentEntries
      .filter((entry) => entry.status === 'draft')
      .slice(0, 5),
    recentUpdates: input.recentEntries.slice(0, 5),
  };
}

/**
 * Counts Vault entries for either all statuses or one specific status.
 *
 * @param status Optional content status filter.
 * @returns Number of matching Vault entries.
 */
async function countVaultEntries(status?: 'draft' | 'published') {
  const baseQuery = db
    .select({ total: count() })
    .from(vaultEntries)
    .innerJoin(contentItems, eq(vaultEntries.contentItemId, contentItems.id));

  const [result] =
    status === undefined
      ? await baseQuery
      : await baseQuery.where(eq(contentItems.status, status));

  return result?.total ?? 0;
}

/**
 * Loads the complete overview model for the `/vault` landing page.
 *
 * @returns Quick actions, editorial stats, and the latest Vault activity.
 */
export async function getVaultOverviewModel(): Promise<VaultOverviewModel> {
  const [categories, recentEntries, draftEntries, publishedEntries] =
    await Promise.all([
      listVaultCategories(),
      getVaultEntries(),
      countVaultEntries('draft'),
      countVaultEntries('published'),
    ]);

  return buildVaultOverviewModel({
    draftEntries,
    publishedEntries,
    totalCategories: categories.length,
    recentEntries,
  });
}
