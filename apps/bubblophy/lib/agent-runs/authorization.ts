/**
 * Checks whether the authenticated agent token owns a requested run.
 *
 * @param input Persisted run token ID and authenticated token ID.
 * @returns `true` only when both IDs identify the same agent token.
 */
export function isBubblophyAgentRunBoundToToken({
  runAgentTokenId,
  authenticatedAgentTokenId,
}: {
  runAgentTokenId: string;
  authenticatedAgentTokenId: string;
}) {
  return runAgentTokenId === authenticatedAgentTokenId;
}
