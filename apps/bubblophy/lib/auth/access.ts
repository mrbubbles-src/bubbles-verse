import 'server-only';

import type { User } from '@supabase/supabase-js';

import { sql } from 'drizzle-orm';

import { db } from '@/drizzle/db';

type GithubIdentityLike = {
  provider?: unknown;
  identity_data?: unknown;
};

type GithubUserMetadataLike = {
  user_name?: unknown;
  preferred_username?: unknown;
  login?: unknown;
};

type BubblophyAccessRow = {
  hasDashboardAccess: boolean;
  hasProjectMembership: boolean;
};

/**
 * Normalizes GitHub usernames for stable allowlist comparisons.
 *
 * @param value Username from Supabase identity data or metadata.
 * @returns Lowercase username or `null` when absent.
 */
export function normalizeBubblophyGithubUsername(
  value: string | null | undefined
) {
  if (!value) {
    return null;
  }

  return value.trim().toLowerCase();
}

/**
 * Normalizes e-mail addresses for stable allowlist comparisons.
 *
 * @param value Supabase Auth e-mail.
 * @returns Lowercase e-mail or `null` when absent.
 */
export function normalizeBubblophyAuthEmail(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return value.trim().toLowerCase();
}

function getGithubIdentityUsernameFromIdentities(
  identities: GithubIdentityLike[] | null | undefined
): string | null {
  const githubIdentity = identities?.find(
    (identity) => identity.provider === 'github'
  );

  if (!githubIdentity || typeof githubIdentity.identity_data !== 'object') {
    return null;
  }

  const username = (githubIdentity.identity_data as { user_name?: unknown })
    .user_name;

  return typeof username === 'string' && username.length > 0 ? username : null;
}

/**
 * Extracts the GitHub username from Supabase's OAuth identity payload.
 *
 * Immutable GitHub identity data wins. Metadata is only a compatibility
 * fallback because some local Supabase sessions expose the username there.
 *
 * @param input Supabase identity and metadata payloads.
 * @returns GitHub username or `null`.
 */
export function getBubblophyGithubIdentityUsername({
  identities,
  userMetadata,
}: {
  identities: GithubIdentityLike[] | null | undefined;
  userMetadata: GithubUserMetadataLike | null | undefined;
}) {
  const immutableUsername = getGithubIdentityUsernameFromIdentities(identities);

  if (immutableUsername) {
    return immutableUsername;
  }

  const metadataUsername =
    userMetadata?.user_name ??
    userMetadata?.preferred_username ??
    userMetadata?.login;

  return typeof metadataUsername === 'string' && metadataUsername.length > 0
    ? metadataUsername
    : null;
}

async function readBubblophyAccess({
  authUserId,
  email,
  githubUsername,
}: {
  authUserId: string;
  email: string | null;
  githubUsername: string | null;
}) {
  const rows = await db.execute<BubblophyAccessRow>(sql`
    select
      exists (
        select 1
        from private.dashboard_github_allowlist dashboard_access
        where dashboard_access.github_username = ${githubUsername}
          and dashboard_access.email = ${email}
          and dashboard_access.dashboard_access = true
        limit 1
      ) as "hasDashboardAccess",
      exists (
        select 1
        from public.bubblophy_project_members project_member
        where project_member.auth_user_id = ${authUserId}
        limit 1
      ) as "hasProjectMembership"
  `);

  const row = rows[0];

  return {
    hasDashboardAccess: Boolean(row?.hasDashboardAccess),
    hasProjectMembership: Boolean(row?.hasProjectMembership),
  };
}

/**
 * Resolves whether a signed-in Supabase user may enter Bubblophy.
 *
 * App-level bootstrap access reuses the existing private dashboard allowlist.
 * Project-scoped collaborators can also enter when their Supabase Auth user ID
 * is present in `bubblophy_project_members`; project queries still restrict the
 * actual visible data to those memberships.
 *
 * @param user Signed-in Supabase Auth user.
 * @returns Authorized Bubblophy session identity fields or `null`.
 */
export async function getBubblophyDbAccessForUser(user: User | null) {
  const email = normalizeBubblophyAuthEmail(user?.email);

  if (!user || !email) {
    return null;
  }

  const githubUsername = normalizeBubblophyGithubUsername(
    getBubblophyGithubIdentityUsername({
      identities: user.identities,
      userMetadata:
        user.user_metadata && typeof user.user_metadata === 'object'
          ? user.user_metadata
          : null,
    })
  );
  const access = await readBubblophyAccess({
    authUserId: user.id,
    email,
    githubUsername,
  });

  if (!access.hasDashboardAccess && !access.hasProjectMembership) {
    return null;
  }

  return {
    authUserId: user.id,
    email,
  };
}
