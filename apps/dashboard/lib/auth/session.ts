import type { DashboardAccessEntry } from '@/lib/account/dashboard-access';
import type { User } from '@supabase/supabase-js';

import {
  getDashboardAccessEntryByIdentity,
  normalizeDashboardEmail,
  normalizeGithubUsername,
} from '@/lib/account/dashboard-access';
import { getGithubIdentityUsername } from '@/lib/auth/allowed-identities';
import { createDashboardServerSupabaseClient } from '@/lib/supabase/server';

import { redirect } from 'next/navigation';

export type DashboardSession = {
  user: User;
  accessEntry: DashboardAccessEntry;
  githubUsername: string;
};

/**
 * Loads the current dashboard session and resolves the matching access row.
 *
 * This is the secure, DB-backed authorization check. It verifies the signed-in
 * Supabase user, matches the normalized GitHub identity against the private
 * allowlist, and logs out stale or unauthorized sessions before private routes
 * render.
 */
async function loadDashboardSession(): Promise<DashboardSession> {
  const supabase = await createDashboardServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
    throw new Error('Missing dashboard session.');
  }

  const githubUsername = normalizeGithubUsername(
    getGithubIdentityUsername({
      identities: user.identities,
      userMetadata:
        user.user_metadata && typeof user.user_metadata === 'object'
          ? user.user_metadata
          : null,
    })
  );
  const email = normalizeDashboardEmail(user.email);

  if (!githubUsername || !email) {
    redirect('/auth/logout?next=/login');
    throw new Error('Incomplete GitHub identity.');
  }

  const accessEntry = await getDashboardAccessEntryByIdentity({
    githubUsername,
    email,
  });

  if (!accessEntry?.dashboardAccess) {
    redirect('/auth/logout?next=/login');
    throw new Error('Dashboard access denied.');
  }

  return {
    user,
    accessEntry,
    githubUsername,
  };
}

/**
 * Returns the signed-in dashboard user plus the matching access row.
 *
 * Use this in protected Server Components, Route Handlers, and Server Actions
 * whenever a valid dashboard session is required, regardless of the specific
 * dashboard role.
 */
export async function requireDashboardSession() {
  return loadDashboardSession();
}

/**
 * Returns the current dashboard session only for Owner-level routes/actions.
 *
 * Keep destructive account-management actions behind this helper so Editors and
 * Guest Authors can use the dashboard without inheriting owner-only controls.
 */
export async function requireOwnerSession() {
  const session = await loadDashboardSession();

  if (session.accessEntry.userRole !== 'owner') {
    redirect('/');
    throw new Error('Owner access required.');
  }

  return session;
}
