import {
  getGithubIdentityUsername,
  isAllowedGithubIdentity,
  parseGithubOwnerAllowlist,
} from '@/lib/auth/allowed-identities';
import { getServerDashboardEnv } from '@/lib/env';
import { createDashboardServerSupabaseClient } from '@/lib/supabase/server';

import { redirect } from 'next/navigation';

/**
 * Loads the current owner session and redirects to login when access is denied.
 *
 * This checks the signed-in Supabase user, extracts the GitHub identity
 * username, compares it against the configured allowlist, and returns the user
 * only when the identity is allowed.
 */
export async function requireOwnerSession() {
  const env = getServerDashboardEnv();
  const supabase = await createDashboardServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const githubUsername = getGithubIdentityUsername(user?.identities);
  const allowlist = parseGithubOwnerAllowlist(env.GITHUB_OWNER_ALLOWLIST);

  if (!user) {
    redirect('/login');
  }

  if (!isAllowedGithubIdentity(githubUsername, allowlist)) {
    redirect('/auth/logout?next=/login');
  }

  return user;
}
