import { isBubblophyAgentRunBoundToToken } from '@/lib/agent-runs/authorization';

import { describe, expect, it } from 'vitest';

describe('Bubblophy agent run authorization', () => {
  it('allows only the token assigned to the run', () => {
    expect(
      isBubblophyAgentRunBoundToToken({
        runAgentTokenId: 'token_codex',
        authenticatedAgentTokenId: 'token_codex',
      })
    ).toBe(true);
    expect(
      isBubblophyAgentRunBoundToToken({
        runAgentTokenId: 'token_claude',
        authenticatedAgentTokenId: 'token_codex',
      })
    ).toBe(false);
  });
});
