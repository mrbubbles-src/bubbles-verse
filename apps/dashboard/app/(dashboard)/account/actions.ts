'use server';

import type { DashboardAccessFeedbackStatus } from '@/lib/account/access-feedback';

import { getDashboardAccessFeedbackHref } from '@/lib/account/access-feedback';
import {
  countActiveDashboardOwners,
  getDashboardAccessEntryByIdentity,
  parseCreateDashboardAccessEntry,
  parseUpdateDashboardAccessEntry,
  toDashboardAccessInsertValues,
} from '@/lib/account/dashboard-access';
import { requireOwnerSession } from '@/lib/auth/session';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { and, eq } from 'drizzle-orm';

import { db } from '@/drizzle/db';
import { dashboardGithubAllowlist } from '@/drizzle/db/schema';

/**
 * Redirects the owner back to the account page with a short feedback code.
 *
 * Centralizing this keeps all account mutations aligned with the toast/URL
 * parsing logic and makes cache revalidation easy to apply consistently.
 *
 * @param status Short result code for the account feedback toast.
 */
function redirectToAccountFeedback(
  status: DashboardAccessFeedbackStatus
): never {
  revalidatePath('/account');
  redirect(getDashboardAccessFeedbackHref(status));
}

/**
 * Detects a Postgres error code on thrown DB errors.
 *
 * Drizzle's Postgres driver surfaces database errors as plain objects with a
 * `code` field, so this helper keeps the action error branches typed.
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
 * Prevents the final active Owner row from being disabled or removed.
 *
 * This avoids accidental dashboard lockouts while the first account-management
 * UI is still intentionally lightweight.
 *
 * @param currentAccess Current access row before the mutation.
 * @param nextAccess Target access state after the mutation, or `null` for delete.
 * @returns `true` when the mutation would remove the final active Owner.
 */
async function wouldRemoveLastOwner(
  currentAccess: {
    userRole: string;
    dashboardAccess: boolean;
  },
  nextAccess: {
    userRole: string;
    dashboardAccess: boolean;
  } | null
) {
  const isCurrentlyProtectedOwner =
    currentAccess.userRole === 'owner' && currentAccess.dashboardAccess;

  if (!isCurrentlyProtectedOwner) {
    return false;
  }

  const remainsProtectedOwner =
    nextAccess?.userRole === 'owner' && nextAccess.dashboardAccess === true;

  if (remainsProtectedOwner) {
    return false;
  }

  return (await countActiveDashboardOwners()) <= 1;
}

/**
 * Creates a new dashboard access row for a GitHub identity.
 *
 * Only Owners may call this action. Validation failures and duplicate rows are
 * redirected back to `/account` with a toast-friendly feedback code.
 *
 * @param formData Submitted owner form payload.
 */
export async function createDashboardAccessEntryAction(formData: FormData) {
  await requireOwnerSession();

  const parsedEntry = parseCreateDashboardAccessEntry(formData);

  if (!parsedEntry.success) {
    redirectToAccountFeedback('invalid');
  }

  try {
    await db
      .insert(dashboardGithubAllowlist)
      .values(toDashboardAccessInsertValues(parsedEntry.data));
  } catch (error) {
    if (hasPostgresErrorCode(error, '23505')) {
      redirectToAccountFeedback('duplicate');
    }

    console.error('Failed to create dashboard access entry.', error);
    redirectToAccountFeedback('error');
  }

  redirectToAccountFeedback('created');
}

/**
 * Updates the mutable fields of an existing dashboard access row.
 *
 * Identity keys stay immutable in V1, so this action only touches role, note,
 * and the enabled dashboard flag after verifying Owner-level access.
 *
 * @param formData Submitted owner form payload.
 */
export async function updateDashboardAccessEntryAction(formData: FormData) {
  await requireOwnerSession();

  const parsedEntry = parseUpdateDashboardAccessEntry(formData);

  if (!parsedEntry.success) {
    redirectToAccountFeedback('invalid');
  }

  const currentAccess = await getDashboardAccessEntryByIdentity({
    githubUsername: parsedEntry.data.githubUsername,
    email: parsedEntry.data.email,
  });

  if (!currentAccess) {
    redirectToAccountFeedback('error');
  }

  const nextAccess = toDashboardAccessInsertValues(parsedEntry.data);

  if (
    await wouldRemoveLastOwner(currentAccess, {
      userRole: nextAccess.userRole,
      dashboardAccess: nextAccess.dashboardAccess,
    })
  ) {
    redirectToAccountFeedback('protected');
  }

  try {
    await db
      .update(dashboardGithubAllowlist)
      .set({
        userRole: nextAccess.userRole,
        dashboardAccess: nextAccess.dashboardAccess,
        note: nextAccess.note,
      })
      .where(
        and(
          eq(
            dashboardGithubAllowlist.githubUsername,
            parsedEntry.data.githubUsername
          ),
          eq(dashboardGithubAllowlist.email, parsedEntry.data.email)
        )
      );
  } catch (error) {
    console.error('Failed to update dashboard access entry.', error);
    redirectToAccountFeedback('error');
  }

  redirectToAccountFeedback('updated');
}

/**
 * Deletes a dashboard access row by its immutable composite identity key.
 *
 * Owners can remove stale identities from the dashboard, unless that row is the
 * final active Owner entry required to keep account management reachable.
 *
 * @param formData Submitted owner form payload.
 */
export async function deleteDashboardAccessEntryAction(formData: FormData) {
  await requireOwnerSession();

  const githubUsername = String(formData.get('githubUsername') ?? '')
    .trim()
    .toLowerCase();
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();

  if (!githubUsername || !email) {
    redirectToAccountFeedback('invalid');
  }

  const currentAccess = await getDashboardAccessEntryByIdentity({
    githubUsername,
    email,
  });

  if (!currentAccess) {
    redirectToAccountFeedback('error');
  }

  if (await wouldRemoveLastOwner(currentAccess, null)) {
    redirectToAccountFeedback('protected');
  }

  try {
    await db
      .delete(dashboardGithubAllowlist)
      .where(
        and(
          eq(dashboardGithubAllowlist.githubUsername, githubUsername),
          eq(dashboardGithubAllowlist.email, email)
        )
      );
  } catch (error) {
    console.error('Failed to delete dashboard access entry.', error);
    redirectToAccountFeedback('error');
  }

  redirectToAccountFeedback('deleted');
}
