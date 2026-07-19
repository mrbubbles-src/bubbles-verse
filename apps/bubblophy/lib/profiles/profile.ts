import type { User } from '@supabase/supabase-js';

type ProviderIdentityData = {
  full_name?: string | null;
  name?: string | null;
  user_name?: string | null;
};

/**
 * Normalizes a provider-backed display name for the Bubblophy team UI.
 *
 * @param value Raw identity field from the verified Supabase user.
 * @returns A compact display name or `null` when the value is unusable.
 */
export function normalizeBubblophyProfileDisplayName(
  value: string | null | undefined
) {
  if (!value) {
    return null;
  }

  const normalized = Array.from(value, (character) => {
    const codePoint = character.codePointAt(0) ?? 0;

    return codePoint <= 31 || codePoint === 127 ? ' ' : character;
  })
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120)
    .trim();

  return normalized || null;
}

/**
 * Reads a human-facing name from immutable provider identity data.
 *
 * Provider identity data wins over editable user metadata so profile labels do
 * not become a second, browser-controlled identity source. GitHub's username
 * is the final provider-backed name fallback; the UI can still fall back to
 * the verified session e-mail when no provider name exists.
 *
 * @param user Verified Supabase user from `auth.getUser()`.
 * @returns Provider-backed display name or `null`.
 */
export function resolveBubblophyProfileDisplayName(user: User) {
  const identity = user.identities?.find(
    (candidate) => candidate.provider === 'github'
  );

  if (!identity?.identity_data || typeof identity.identity_data !== 'object') {
    return null;
  }

  const identityData = identity.identity_data as ProviderIdentityData;

  for (const key of ['full_name', 'name', 'user_name'] as const) {
    const name = normalizeBubblophyProfileDisplayName(identityData[key]);

    if (name) {
      return name;
    }
  }

  return null;
}
