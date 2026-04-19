import 'server-only';

import type {
  DashboardAccessEntry,
  DashboardAccessRole,
} from '@/lib/account/dashboard-access.shared';

import { and, asc, count, desc, eq } from 'drizzle-orm';

import { db } from '@/drizzle/db';
import { dashboardGithubAllowlist } from '@/drizzle/db/schema';

export {
  DASHBOARD_ACCESS_ROLE_VALUES,
  formatDashboardAccessRoleLabel,
  normalizeDashboardEmail,
  normalizeGithubUsername,
  parseCreateDashboardAccessEntry,
  parseUpdateDashboardAccessEntry,
  summarizeDashboardAccessEntries,
  toDashboardAccessInsertValues,
  toDashboardAccessRole,
  type DashboardAccessEntry,
  type DashboardAccessRole,
  type DashboardAccessSummary,
} from '@/lib/account/dashboard-access.shared';

const dashboardAccessRoleOrder: Record<DashboardAccessRole, number> = {
  owner: 0,
  editor: 1,
  guest_author: 2,
};

/**
 * Lists all dashboard access rows in owner-first order.
 *
 * The account page uses this to render a stable, mobile-friendly access list
 * where active Owner entries stay visible at the top.
 *
 * @returns The complete allowlist, sorted for the dashboard UI.
 */
export async function listDashboardAccessEntries(): Promise<
  DashboardAccessEntry[]
> {
  const entries = await db
    .select()
    .from(dashboardGithubAllowlist)
    .orderBy(
      desc(dashboardGithubAllowlist.dashboardAccess),
      asc(dashboardGithubAllowlist.githubUsername),
      asc(dashboardGithubAllowlist.email)
    );

  return entries.sort((left, right) => {
    const roleDifference =
      dashboardAccessRoleOrder[left.userRole as DashboardAccessRole] -
      dashboardAccessRoleOrder[right.userRole as DashboardAccessRole];

    if (roleDifference !== 0) {
      return roleDifference;
    }

    return left.githubUsername.localeCompare(right.githubUsername, 'de');
  });
}

/**
 * Loads one dashboard access row by its composite GitHub identity key.
 *
 * Access rows are keyed by lowercase GitHub username plus email so Supabase
 * hook decisions and dashboard-side checks rely on the same identity pair.
 *
 * @param identity The normalized username and email to look up.
 * @returns The matching access row or `null`.
 */
export async function getDashboardAccessEntryByIdentity(identity: {
  githubUsername: string;
  email: string;
}): Promise<DashboardAccessEntry | null> {
  const [entry] = await db
    .select()
    .from(dashboardGithubAllowlist)
    .where(
      and(
        eq(dashboardGithubAllowlist.githubUsername, identity.githubUsername),
        eq(dashboardGithubAllowlist.email, identity.email)
      )
    )
    .limit(1);

  return entry ?? null;
}

/**
 * Counts active Owner rows that still have dashboard access enabled.
 *
 * Mutations use this guard to prevent locking everyone out of the dashboard by
 * downgrading or deleting the final Owner entry.
 *
 * @returns Number of active Owner rows.
 */
export async function countActiveDashboardOwners() {
  const [result] = await db
    .select({ total: count() })
    .from(dashboardGithubAllowlist)
    .where(
      and(
        eq(dashboardGithubAllowlist.userRole, 'owner'),
        eq(dashboardGithubAllowlist.dashboardAccess, true)
      )
    );

  return result?.total ?? 0;
}
