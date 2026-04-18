type GithubIdentityLike = {
  provider?: unknown
  identity_data?: unknown
}

/**
 * Matches a GitHub username against the configured owner allowlist.
 *
 * Pass the normalized username from the signed-in GitHub identity and the
 * configured allowlist entries. Returns `true` only for exact case-insensitive
 * matches.
 */
export function isAllowedGithubIdentity(
  username: string | null | undefined,
  allowlist: string[],
): boolean {
  if (!username) {
    return false
  }

  return allowlist.some(
    (candidate) => candidate.trim().toLowerCase() === username.toLowerCase(),
  )
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
    .filter(Boolean)
}

/**
 * Extracts the GitHub username from the immutable OAuth identity payload.
 *
 * Supabase documents `user_metadata` as user-editable, so auth checks should
 * read the GitHub username from `identities[].identity_data` instead.
 */
export function getGithubIdentityUsername(
  identities: GithubIdentityLike[] | null | undefined,
): string | null {
  const githubIdentity = identities?.find(
    (identity) => identity.provider === 'github',
  )

  if (!githubIdentity || typeof githubIdentity.identity_data !== 'object') {
    return null
  }

  const username = (githubIdentity.identity_data as { user_name?: unknown })
    .user_name

  return typeof username === 'string' && username.length > 0 ? username : null
}
