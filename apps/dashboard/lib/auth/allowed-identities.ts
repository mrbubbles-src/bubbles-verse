type GithubIdentityLike = {
  provider?: unknown;
  identity_data?: unknown;
};

type GithubUserMetadataLike = {
  user_name?: unknown;
  preferred_username?: unknown;
  login?: unknown;
};

/**
 * Matches a GitHub username against the configured owner allowlist.
 *
 * Pass the normalized username from the signed-in GitHub identity and the
 * configured allowlist entries. Returns `true` only for exact case-insensitive
 * matches.
 */
export function isAllowedGithubIdentity(
  username: string | null | undefined,
  allowlist: string[]
): boolean {
  if (!username) {
    return false;
  }

  return allowlist.some(
    (candidate) => candidate.trim().toLowerCase() === username.toLowerCase()
  );
}

/**
 * Splits the configured GitHub owner allowlist into individual usernames.
 *
 * The input should be a comma-separated string from the dashboard environment.
 * Empty entries are removed so auth checks only compare real usernames.
 */
export function parseGithubOwnerAllowlist(raw: string): string[] {
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

/**
 * Extracts the GitHub username from the immutable OAuth identity payload.
 *
 * Supabase documents `user_metadata` as user-editable, so auth checks should
 * read the GitHub username from `identities[].identity_data` instead.
 */
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
 * Extracts the GitHub username from the available Supabase user payload.
 *
 * The dashboard prefers immutable GitHub identity data. Some Supabase GitHub
 * sessions, however, only expose the username in `user_metadata`, so this
 * helper falls back to the provider metadata to keep the owner gate aligned
 * with the working OAuth payload.
 */
export function getGithubIdentityUsername({
  identities,
  userMetadata,
}: {
  identities: GithubIdentityLike[] | null | undefined;
  userMetadata: GithubUserMetadataLike | null | undefined;
}): string | null {
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
