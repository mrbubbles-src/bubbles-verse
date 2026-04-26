import type { DashboardAccessRole } from '@/lib/account/dashboard-access';
import type { DashboardSession } from '@/lib/auth/session';

import { getDashboardProfileByAuthUserId } from '@/lib/profile/profile';
import { listVaultCategories } from '@/lib/vault/categories';
import { getVaultEntries } from '@/lib/vault/entries';

import { count, eq } from 'drizzle-orm';

import { db } from '@/drizzle/db';
import {
  contentItems,
  profileSocialLinks,
  vaultEntries,
} from '@/drizzle/db/schema';

export type DashboardHomeRecentItem = {
  id: string;
  title: string;
  appSlug: string;
  status: 'draft' | 'published';
  updatedAt: string;
};

export type DashboardHomeSummary = {
  appSlug: string;
  appName: string;
  draftCount: number;
  publishedCount: number;
};

export type DashboardHomeQuickAction = {
  label: string;
  href: string;
  description: string;
};

export type DashboardHomeStat = {
  label: string;
  value: string;
};

export type DashboardHomeIdentity = {
  displayName: string;
  githubUsername: string;
  email: string;
  role: DashboardAccessRole;
  roleLabel: string;
};

export type DashboardHomeProfileStatus = {
  isComplete: boolean;
  completedFields: number;
  totalFields: number;
  summary: string;
  nextStepLabel: string;
  nextStepHref: string;
};

type DashboardHomeInput = {
  identity: DashboardHomeIdentity;
  recentItems: DashboardHomeRecentItem[];
  appSummaries: DashboardHomeSummary[];
  draftCount: number;
  publishedCount: number;
  categoryCount: number;
  profileStatus: {
    slug: string | null;
    bioComplete: boolean;
    avatarComplete: boolean;
    socialLinkCount: number;
  };
};

export type DashboardHomeModel = {
  greetingName: string;
  quickActions: DashboardHomeQuickAction[];
  workspaceStats: DashboardHomeStat[];
  profileStatus: DashboardHomeProfileStatus;
  recentDrafts: DashboardHomeRecentItem[];
  recentUpdates: DashboardHomeRecentItem[];
  appSummaries: DashboardHomeSummary[];
};

/**
 * Extracts the short greeting name for the dashboard home headline.
 *
 * Use the first non-empty token so the home only greets with a Vorname and
 * still falls back gracefully for usernames or single-word identities.
 *
 * @param displayName Full display name or fallback username.
 * @returns Short greeting name for `Hallo, …`.
 */
function getGreetingName(displayName: string) {
  const [firstToken] = displayName.trim().split(/\s+/);

  return firstToken && firstToken.length > 0 ? firstToken : displayName.trim();
}

/**
 * Maps dashboard access roles to short German UI labels.
 *
 * @param role Access role from the private allowlist.
 * @returns Human-readable label for the dashboard home.
 */
export function getDashboardRoleLabel(role: DashboardAccessRole) {
  switch (role) {
    case 'owner':
      return 'Owner';
    case 'editor':
      return 'Editor';
    case 'guest_author':
      return 'Gastautor';
  }
}

/**
 * Counts Vault entries for either all statuses or one specific status.
 *
 * @param status Optional shared content status filter.
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
 * Counts saved social links for one shared author profile.
 *
 * @param profileId Shared `profiles.id` value.
 * @returns Number of stored social links.
 */
async function countProfileSocialLinks(profileId: string) {
  const [result] = await db
    .select({ total: count() })
    .from(profileSocialLinks)
    .where(eq(profileSocialLinks.profileId, profileId));

  return result?.total ?? 0;
}

/**
 * Builds quick actions from the current dashboard role and profile state.
 *
 * @param input Minimal role/profile context for first-click actions.
 * @returns Ordered action list for the dashboard home hero.
 */
function buildDashboardQuickActions(input: {
  role: DashboardAccessRole;
  profileComplete: boolean;
}) {
  const actions: DashboardHomeQuickAction[] = [];

  if (!input.profileComplete) {
    actions.push({
      label: 'Profil vervollständigen',
      href: '/profile',
      description: 'Avatar, Bio und Social Links sauber fertigziehen.',
    });
  }

  if (input.role === 'owner' || input.role === 'editor') {
    actions.push(
      {
        label: 'Neuer Eintrag',
        href: '/vault/entries/new',
        description: 'Direkt in den Editor springen und weiterschreiben.',
      },
      {
        label: 'Einträge öffnen',
        href: '/vault/entries',
        description: 'Offene Entwürfe und letzte Änderungen durchgehen.',
      },
      {
        label: 'Kategorien öffnen',
        href: '/vault/categories',
        description: 'Struktur prüfen und neue Themen sauber einsortieren.',
      }
    );
  } else {
    actions.push({
      label: 'Vault öffnen',
      href: '/vault',
      description:
        'Aktuelle Inhalte ansehen und die bestehende Struktur im Blick behalten.',
    });
  }

  if (input.role === 'owner') {
    actions.push({
      label: 'Zugangsverwaltung',
      href: '/account',
      description: 'Freigaben, Rollen und bestehende Zugänge verwalten.',
    });
  }

  return actions;
}

/**
 * Shapes the dashboard landing page from live auth, profile, and Vault data.
 *
 * @param input Aggregated dashboard data for the landing page.
 * @returns UI-ready model with identity, actions, stats, and recents.
 */
export function buildDashboardHomeModel(
  input: DashboardHomeInput
): DashboardHomeModel {
  const profileChecklist = [
    {
      label: 'Slug gesetzt',
      done: Boolean(input.profileStatus.slug),
    },
    {
      label: 'Avatar hinterlegt',
      done: input.profileStatus.avatarComplete,
    },
    {
      label: 'Bio gepflegt',
      done: input.profileStatus.bioComplete,
    },
    {
      label: 'Mindestens ein Social Link',
      done: input.profileStatus.socialLinkCount > 0,
    },
  ];
  const completedProfileFields = profileChecklist.filter(
    (item) => item.done
  ).length;
  const totalProfileFields = profileChecklist.length;
  const profileComplete = completedProfileFields === totalProfileFields;

  return {
    greetingName: getGreetingName(input.identity.displayName),
    quickActions: buildDashboardQuickActions({
      role: input.identity.role,
      profileComplete,
    }),
    workspaceStats: [
      {
        label: 'Offene Entwürfe',
        value: String(input.draftCount),
      },
      {
        label: 'Veröffentlicht',
        value: String(input.publishedCount),
      },
      {
        label: 'Kategorien',
        value: String(input.categoryCount),
      },
    ],
    profileStatus: {
      isComplete: profileComplete,
      completedFields: completedProfileFields,
      totalFields: totalProfileFields,
      summary: profileComplete
        ? 'Dein Profil ist vollständig und muss hier nicht mehr auftauchen.'
        : `Noch ${totalProfileFields - completedProfileFields} Bereich(e) offen, bis dein Autorenprofil vollständig ist.`,
      nextStepLabel: 'Profil vervollständigen',
      nextStepHref: '/profile',
    },
    recentDrafts: input.recentItems
      .filter((item) => item.status === 'draft')
      .slice(0, 5),
    recentUpdates: input.recentItems.slice(0, 5),
    appSummaries: input.appSummaries,
  };
}

/**
 * Loads the live dashboard home model for the authenticated user.
 *
 * @param session Authenticated dashboard session from the server layout.
 * @returns Home model with live Vault data and current profile readiness.
 */
export async function getDashboardHomeModel(
  session: DashboardSession
): Promise<DashboardHomeModel> {
  const [profile, recentItems, categories, draftCount, publishedCount] =
    await Promise.all([
      getDashboardProfileByAuthUserId(session.user.id),
      getVaultEntries({
        query: '',
        status: 'all',
        categoryId: null,
        page: 1,
        pageSize: 5,
      }),
      listVaultCategories(),
      countVaultEntries('draft'),
      countVaultEntries('published'),
    ]);
  const socialLinkCount = profile
    ? await countProfileSocialLinks(profile.id)
    : 0;

  return buildDashboardHomeModel({
    identity: {
      displayName: profile?.displayName ?? session.githubUsername,
      githubUsername: session.githubUsername,
      email: session.user.email ?? session.accessEntry.email,
      role: session.accessEntry.userRole as DashboardAccessRole,
      roleLabel: getDashboardRoleLabel(
        session.accessEntry.userRole as DashboardAccessRole
      ),
    },
    recentItems: recentItems.map((item) => ({
      id: item.id,
      title: item.title,
      appSlug: 'vault',
      status: item.status,
      updatedAt: item.updatedAt,
    })),
    appSummaries: [
      {
        appSlug: 'vault',
        appName: 'Coding Vault',
        draftCount,
        publishedCount,
      },
    ],
    draftCount,
    publishedCount,
    categoryCount: categories.length,
    profileStatus: {
      slug: profile?.slug ?? null,
      bioComplete: Boolean(profile?.bio.trim()),
      avatarComplete: Boolean(profile?.avatarUrl),
      socialLinkCount,
    },
  });
}
