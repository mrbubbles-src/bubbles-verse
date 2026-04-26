'use server';

import type { DashboardProfileFeedbackStatus } from '@/lib/profile/profile-feedback';

import { requireDashboardSession } from '@/lib/auth/session';
import { DASHBOARD_CACHE_TAGS } from '@/lib/cache/tags';
import {
  parseUpdateDashboardProfile,
  updateDashboardProfile,
} from '@/lib/profile/profile';
import { getDashboardProfileFeedbackHref } from '@/lib/profile/profile-feedback';

import { revalidatePath, updateTag } from 'next/cache';
import { redirect } from 'next/navigation';

/**
 * Redirects the user back to `/profile` with a short feedback code.
 *
 * @param status Short result code for the profile feedback toast.
 */
function redirectToProfileFeedback(
  status: DashboardProfileFeedbackStatus,
  userId?: string
): never {
  updateTag(DASHBOARD_CACHE_TAGS.home);

  if (userId) {
    updateTag(DASHBOARD_CACHE_TAGS.profile(userId));
  }

  revalidatePath('/profile');
  redirect(getDashboardProfileFeedbackHref(status));
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
 * Updates the current dashboard user's profile row and fixed social links.
 *
 * @param formData Submitted profile form payload.
 */
export async function updateDashboardProfileAction(formData: FormData) {
  const session = await requireDashboardSession();
  const parsedProfile = parseUpdateDashboardProfile(formData);

  if (!parsedProfile.success) {
    redirectToProfileFeedback('invalid', session.user.id);
  }

  try {
    await updateDashboardProfile({
      user: session.user,
      accessEntry: session.accessEntry,
      githubUsername: session.githubUsername,
      payload: parsedProfile.data,
    });
  } catch (error) {
    if (hasPostgresErrorCode(error, '23505')) {
      redirectToProfileFeedback('duplicate', session.user.id);
    }

    console.error('Failed to update dashboard profile.', error);
    redirectToProfileFeedback('error', session.user.id);
  }

  redirectToProfileFeedback('updated', session.user.id);
}
