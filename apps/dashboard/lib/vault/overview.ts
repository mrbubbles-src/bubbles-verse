import { listVaultCategories } from '@/lib/vault/categories';
import { getVaultEntries } from '@/lib/vault/entries';

import { count, eq } from 'drizzle-orm';

import { db } from '@/drizzle/db';
import { contentItems, vaultEntries } from '@/drizzle/db/schema';

export type VaultOverviewQuickAction = {
  label: string;
  href: string;
  description: string;
};

export type VaultOverviewStat = {
  label: string;
  value: string;
  detail: string;
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
  totalEntries: number;
  draftEntries: number;
  publishedEntries: number;
  totalCategories: number;
  topLevelCategories: number;
  childCategories: number;
  recentEntries: VaultOverviewRecentEntry[];
};

export type VaultOverviewModel = {
  quickActions: VaultOverviewQuickAction[];
  stats: VaultOverviewStat[];
  recentEntries: VaultOverviewRecentEntry[];
  taxonomySummary: {
    title: string;
    description: string;
  };
};

/**
 * Shapes the first Vault landing page around the core editorial decisions.
 *
 * The model stays compact on purpose: quick ways into writing, a few stable
 * counts, and a small recent-work section are enough for V1.
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
        description: 'Direkt in den Markdown-Editor springen.',
      },
      {
        label: 'Einträge öffnen',
        href: '/vault/entries',
        description: 'Bestehende Inhalte prüfen und weiterbearbeiten.',
      },
      {
        label: 'Kategorien pflegen',
        href: '/vault/categories',
        description: 'Taxonomie für neue Artikel und Serien schärfen.',
      },
    ],
    stats: [
      {
        label: 'Einträge gesamt',
        value: String(input.totalEntries),
        detail: 'Alle aktuell gespeicherten Vault-Inhalte.',
      },
      {
        label: 'Entwürfe',
        value: String(input.draftEntries),
        detail: 'Alles, was noch Feinschliff oder Review braucht.',
      },
      {
        label: 'Veröffentlicht',
        value: String(input.publishedEntries),
        detail: 'Bereits freigegebene Inhalte im Vault.',
      },
      {
        label: 'Kategorien',
        value: String(input.totalCategories),
        detail: `${input.topLevelCategories} Oberkategorien, ${input.childCategories} Unterkategorien.`,
      },
    ],
    recentEntries: input.recentEntries.slice(0, 5),
    taxonomySummary: {
      title: 'Taxonomie im Blick behalten',
      description:
        input.totalCategories === 0
          ? 'Lege zuerst Kategorien an, damit neue Einträge sauber einsortiert werden können.'
          : `Aktuell strukturieren ${input.topLevelCategories} Oberkategorien und ${input.childCategories} Unterkategorien den Coding Vault.`,
    },
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
  const [
    categories,
    recentEntries,
    totalEntries,
    draftEntries,
    publishedEntries,
  ] = await Promise.all([
    listVaultCategories(),
    getVaultEntries(),
    countVaultEntries(),
    countVaultEntries('draft'),
    countVaultEntries('published'),
  ]);
  const topLevelCategories = categories.filter(
    (category) => category.parentId === null
  ).length;
  const childCategories = categories.length - topLevelCategories;

  return buildVaultOverviewModel({
    totalEntries,
    draftEntries,
    publishedEntries,
    totalCategories: categories.length,
    topLevelCategories,
    childCategories,
    recentEntries,
  });
}
