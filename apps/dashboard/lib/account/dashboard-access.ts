import 'server-only';

import type {
  DashboardAccessEntry,
  DashboardAccessRole,
} from '@/lib/account/dashboard-access.shared';

import {
  DASHBOARD_CACHE_PROFILE,
  DASHBOARD_CACHE_TAGS,
} from '@/lib/cache/tags';

import { cacheLife, cacheTag } from 'next/cache';

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

const DASHBOARD_ACCESS_READ_RETRY_DELAY_MS = 200;
const DASHBOARD_ACCESS_SLOW_READ_MS = 500;
const POSTGRES_STATEMENT_TIMEOUT_CODE = '57014';

/**
 * Waits before retrying one transient dashboard access read.
 *
 * @param delayMs Number of milliseconds to wait.
 * @returns Promise that resolves after the delay.
 */
function waitForRetry(delayMs: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

/**
 * Checks whether a database error is a canceled statement timeout.
 *
 * @param error Error thrown by Postgres.js or Drizzle.
 * @returns `true` when the error code matches Postgres statement timeout.
 */
function isStatementTimeoutError(error: Error) {
  return (
    (error as { code?: string; cause?: { code?: string } }).code ===
      POSTGRES_STATEMENT_TIMEOUT_CODE ||
    (error as { code?: string; cause?: { code?: string } }).cause?.code ===
      POSTGRES_STATEMENT_TIMEOUT_CODE
  );
}

/**
 * Logs slow dashboard access reads during local development.
 *
 * @param event Short event label for the timing log.
 * @param elapsedMs Query duration in milliseconds.
 * @param attempt Current read attempt number.
 */
function logDashboardAccessReadTiming(
  event: 'retry' | 'slow' | 'failed',
  elapsedMs: number,
  attempt: number
) {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  const message =
    event === 'retry'
      ? 'Dashboard access read timed out; retrying once.'
      : event === 'failed'
        ? 'Dashboard access read failed.'
        : 'Dashboard access read was slow.';

  console.warn(`[dashboard-auth] ${message}`, {
    attempt,
    elapsedMs,
  });
}

/**
 * Reads one dashboard access row without persistent caching.
 *
 * @param identity The normalized username and email to look up.
 * @returns The matching access row or `null`.
 */
async function readDashboardAccessEntryByIdentity(identity: {
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
  'use cache';

  cacheLife(DASHBOARD_CACHE_PROFILE);
  cacheTag(DASHBOARD_CACHE_TAGS.access);

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
  const startedAt = Date.now();

  try {
    const entry = await readDashboardAccessEntryByIdentity(identity);
    const elapsedMs = Date.now() - startedAt;

    if (elapsedMs >= DASHBOARD_ACCESS_SLOW_READ_MS) {
      logDashboardAccessReadTiming('slow', elapsedMs, 1);
    }

    return entry;
  } catch (error) {
    if (!(error instanceof Error) || !isStatementTimeoutError(error)) {
      throw error;
    }

    logDashboardAccessReadTiming('retry', Date.now() - startedAt, 1);
    await waitForRetry(DASHBOARD_ACCESS_READ_RETRY_DELAY_MS);

    const retryStartedAt = Date.now();

    try {
      return await readDashboardAccessEntryByIdentity(identity);
    } catch (retryError) {
      if (retryError instanceof Error) {
        logDashboardAccessReadTiming('failed', Date.now() - retryStartedAt, 2);
      }

      throw retryError;
    }
  }
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
