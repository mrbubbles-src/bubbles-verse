import type {
  BubblophyAgentTokenScope,
  BubblophyAgentTokenState,
} from '@/drizzle/db/schema';

const requiredExecutionScopes = [
  'issues:read',
  'runs:update',
] as const satisfies readonly BubblophyAgentTokenScope[];

/**
 * Checks whether a token can read context and report updates for a run.
 *
 * @param token Persisted lifecycle, expiry, and scope fields.
 * @param now Current ISO timestamp, injectable for deterministic checks.
 * @returns `true` only for active, unexpired tokens with all run scopes.
 */
export function isExecutableBubblophyAgentToken(
  token: {
    state: BubblophyAgentTokenState;
    expiresAt: string | null;
    scopes: BubblophyAgentTokenScope[];
  },
  now = new Date().toISOString()
) {
  return (
    token.state === 'active' &&
    (!token.expiresAt || token.expiresAt > now) &&
    requiredExecutionScopes.every((scope) => token.scopes.includes(scope))
  );
}
