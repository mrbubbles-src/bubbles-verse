import * as z from 'zod';

const bubblophyOAuthAuthorizationIdSchema = z
  .string()
  .trim()
  .min(16)
  .max(200)
  .regex(/^[A-Za-z0-9._~-]+$/);

/**
 * Validates one opaque Supabase OAuth authorization request identifier.
 *
 * @param value Untrusted query or form value.
 * @returns Normalized identifier, or `null` when it is missing or malformed.
 */
export function parseBubblophyOAuthAuthorizationId(
  value: string | null | undefined
) {
  const result = bubblophyOAuthAuthorizationIdSchema.safeParse(value);

  return result.success ? result.data : null;
}
