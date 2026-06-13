import type {
  BubblophyAgentTokenLifecycleStore,
  BubblophyAgentTokenLifecycleStoreInput,
} from '@/lib/agent-tokens/lifecycle';

import {
  mapLifecycleTokenToSummary,
  updateBubblophyAgentTokenLifecycle,
} from '@/lib/agent-tokens/lifecycle';
import {
  buildBubblophyAgentTokenLifecycleProjectEventInsert,
  getAgentTokenLifecycleTransition,
} from '@/lib/agent-tokens/lifecycle-database-write';

import { afterEach, describe, expect, it, vi } from 'vitest';

function createStore(
  handler: (
    input: BubblophyAgentTokenLifecycleStoreInput
  ) => ReturnType<
    BubblophyAgentTokenLifecycleStore['updateAgentTokenLifecycle']
  >
) {
  const updateAgentTokenLifecycle = vi.fn(handler);

  return {
    store: {
      updateAgentTokenLifecycle,
    } satisfies BubblophyAgentTokenLifecycleStore,
    updateAgentTokenLifecycle,
  };
}

describe('updateBubblophyAgentTokenLifecycle', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejects invalid lifecycle input before touching the store', async () => {
    const { store, updateAgentTokenLifecycle } = createStore(async () => {
      throw new Error('store should not be called');
    });

    await expect(
      updateBubblophyAgentTokenLifecycle(
        {
          authUserId: 'user_owner',
          tokenId: '   ',
          decision: 'pause',
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_token' });
    await expect(
      updateBubblophyAgentTokenLifecycle(
        {
          authUserId: 'user_owner',
          tokenId: 'token_codex',
          decision: 'destroy' as 'pause',
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'invalid_decision' });

    expect(updateAgentTokenLifecycle).not.toHaveBeenCalled();
  });

  it('passes normalized lifecycle decisions to the store', async () => {
    const { store, updateAgentTokenLifecycle } = createStore(async (input) => ({
      status: 'updated',
      token: {
        id: input.tokenId,
        label: 'Codex lokal',
        projectKey: 'BV',
        scopes: ['runs:update'],
        state: 'paused',
        lastUsedAt: null,
        expiresAt: null,
      },
    }));

    await expect(
      updateBubblophyAgentTokenLifecycle(
        {
          authUserId: 'user_owner',
          tokenId: ' token_codex ',
          decision: 'pause',
        },
        { store }
      )
    ).resolves.toEqual({
      status: 'updated',
      token: {
        id: 'token_codex',
        label: 'Codex lokal',
        projectKey: 'BV',
        scopes: ['runs:update'],
        state: 'pausiert',
        lastUsedAt: 'noch nie verwendet',
        expiresAt: 'läuft nicht automatisch ab',
      },
    });

    expect(updateAgentTokenLifecycle).toHaveBeenCalledWith({
      authUserId: 'user_owner',
      tokenId: 'token_codex',
      decision: 'pause',
    });
  });

  it('returns store denials and invalid transitions unchanged', async () => {
    await expect(
      updateBubblophyAgentTokenLifecycle(
        {
          authUserId: 'user_owner',
          tokenId: 'token_missing',
          decision: 'pause',
        },
        { store: createStore(async () => ({ status: 'not_found' })).store }
      )
    ).resolves.toEqual({ status: 'not_found' });
    await expect(
      updateBubblophyAgentTokenLifecycle(
        {
          authUserId: 'user_viewer',
          tokenId: 'token_codex',
          decision: 'pause',
        },
        { store: createStore(async () => ({ status: 'forbidden' })).store }
      )
    ).resolves.toEqual({ status: 'forbidden' });
    await expect(
      updateBubblophyAgentTokenLifecycle(
        {
          authUserId: 'user_owner',
          tokenId: 'token_codex',
          decision: 'resume',
        },
        {
          store: createStore(async () => ({
            status: 'invalid_transition',
            reason: 'revoked',
          })).store,
        }
      )
    ).resolves.toEqual({ status: 'invalid_transition', reason: 'revoked' });
  });

  it('returns database_unavailable when no store and no database URL exist', async () => {
    vi.stubEnv('DATABASE_URL', '');

    await expect(
      updateBubblophyAgentTokenLifecycle({
        authUserId: 'user_owner',
        tokenId: 'token_codex',
        decision: 'pause',
      })
    ).resolves.toEqual({ status: 'database_unavailable' });
  });
});

describe('Bubblophy agent token lifecycle helpers', () => {
  it('blocks resume for revoked and expired tokens', () => {
    expect(
      getAgentTokenLifecycleTransition({
        decision: 'resume',
        state: 'revoked',
        expiresAt: null,
      })
    ).toEqual({ status: 'invalid_transition', reason: 'revoked' });
    expect(
      getAgentTokenLifecycleTransition({
        decision: 'resume',
        state: 'paused',
        expiresAt: '2000-01-01T00:00:00.000Z',
      })
    ).toEqual({ status: 'invalid_transition', reason: 'expired' });
    expect(
      getAgentTokenLifecycleTransition({
        decision: 'revoke',
        state: 'paused',
        expiresAt: '2000-01-01T00:00:00.000Z',
      })
    ).toEqual({ status: 'change', nextState: 'revoked' });
  });

  it('maps lifecycle rows without token secrets', () => {
    const token = mapLifecycleTokenToSummary({
      id: 'token_codex',
      label: 'Codex lokal',
      projectKey: 'BV',
      scopes: ['runs:update'],
      state: 'revoked',
      lastUsedAt: null,
      expiresAt: null,
    });

    expect(token).toEqual({
      id: 'token_codex',
      label: 'Codex lokal',
      projectKey: 'BV',
      scopes: ['runs:update'],
      state: 'widerrufen',
      lastUsedAt: 'noch nie verwendet',
      expiresAt: 'läuft nicht automatisch ab',
    });
    expect(JSON.stringify(token)).not.toContain('tokenHash');
    expect(JSON.stringify(token)).not.toContain('plaintextToken');
  });

  it('builds explicit audit events without token secrets', () => {
    const event = buildBubblophyAgentTokenLifecycleProjectEventInsert({
      projectId: 'project_bv',
      projectKey: 'BV',
      authUserId: 'user_owner',
      tokenId: 'token_codex',
      tokenLabel: 'Codex lokal',
      previousState: 'active',
      nextState: 'paused',
      decision: 'pause',
    });

    expect(event).toEqual({
      projectId: 'project_bv',
      eventType: 'project_updated',
      actorAuthUserId: 'user_owner',
      actorAgentTokenId: null,
      agentRunId: null,
      summary: 'Agent-Token "Codex lokal" für BV: active → paused.',
      payload: {
        source: 'human',
        entity: 'agent_token',
        action: 'paused',
        projectKey: 'BV',
        tokenId: 'token_codex',
        tokenLabel: 'Codex lokal',
        decision: 'pause',
        previousState: 'active',
        nextState: 'paused',
      },
    });
    expect(JSON.stringify(event)).not.toContain('tokenHash');
    expect(JSON.stringify(event)).not.toContain('plaintextToken');
  });

  it('uses a revoked audit action for irreversible token revoke', () => {
    const event = buildBubblophyAgentTokenLifecycleProjectEventInsert({
      projectId: 'project_bv',
      projectKey: 'BV',
      authUserId: 'user_owner',
      tokenId: 'token_codex',
      tokenLabel: 'Codex lokal',
      previousState: 'paused',
      nextState: 'revoked',
      decision: 'revoke',
    });

    expect(event.eventType).toBe('agent_token_revoked');
    expect(event.payload).toEqual(
      expect.objectContaining({
        entity: 'agent_token',
        action: 'revoked',
        previousState: 'paused',
        nextState: 'revoked',
      })
    );
    expect(JSON.stringify(event)).not.toContain('tokenHash');
    expect(JSON.stringify(event)).not.toContain('plaintextToken');
  });
});
