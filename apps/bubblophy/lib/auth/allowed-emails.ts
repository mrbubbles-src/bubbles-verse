import 'server-only';

/**
 * Normalizes an auth email before temporary Bubblophy allowlist checks.
 *
 * @param email Email from Supabase Auth or env configuration.
 * @returns Lowercase email or `null` when the value is empty.
 */
export function normalizeBubblophyAuthEmail(email: string | null | undefined) {
  const normalizedEmail = email?.trim().toLowerCase();

  return normalizedEmail ? normalizedEmail : null;
}

/**
 * Parses the temporary Bubblophy auth email allowlist.
 *
 * @param raw Comma-separated `BUBBLOPHY_ALLOWED_AUTH_EMAILS` value.
 * @returns Normalized email entries; empty config intentionally means no access.
 */
export function parseBubblophyAllowedAuthEmails(raw: string | undefined) {
  return (raw ?? '')
    .split(',')
    .map((entry) => normalizeBubblophyAuthEmail(entry))
    .filter((entry): entry is string => Boolean(entry));
}

/**
 * Returns the current temporary server-only Bubblophy email allowlist.
 *
 * @returns Normalized emails from `BUBBLOPHY_ALLOWED_AUTH_EMAILS`.
 */
export function getBubblophyAllowedAuthEmails() {
  return parseBubblophyAllowedAuthEmails(
    process.env.BUBBLOPHY_ALLOWED_AUTH_EMAILS
  );
}

/**
 * Checks whether a Supabase Auth email is temporarily allowed into Bubblophy.
 *
 * @param email Supabase Auth email from the signed-in user.
 * @param allowlist Normalized or raw allowed email entries.
 * @returns `true` only for exact case-insensitive email matches.
 */
export function isBubblophyAuthEmailAllowed({
  email,
  allowlist,
}: {
  email: string | null | undefined;
  allowlist: string[];
}) {
  const normalizedEmail = normalizeBubblophyAuthEmail(email);

  if (!normalizedEmail) {
    return false;
  }

  return allowlist.some(
    (allowedEmail) =>
      normalizeBubblophyAuthEmail(allowedEmail) === normalizedEmail
  );
}
