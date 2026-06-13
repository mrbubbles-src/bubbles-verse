import type {
  BubblophyAgentTokenCreateStore,
  BubblophyAgentTokenCreateStoreInput,
} from '@/lib/agent-tokens/create';

import {
  createBubblophyAgentToken,
  generateBubblophyAgentPlaintextToken,
  hashBubblophyAgentToken,
  mapCreatedAgentTokenToSummary,
  normalizeBubblophyAgentTokenScopes,
} from '@/lib/agent-tokens/create';

import { afterEach, describe, expect, it, vi } from 'vitest';

function createStore(
  handler: (
    input: BubblophyAgentTokenCreateStoreInput
  ) => ReturnType<BubblophyAgentTokenCreateStore['createAgentToken']>
) {
  const createAgentToken = vi.fn(handler);

  return {
    store: {
      createAgentToken,
    } satisfies BubblophyAgentTokenCreateStore,
    createAgentToken,
  };
}

describe('createBubblophyAgentToken', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejects invalid token inputs before touching the store', async () => {
    const { store, createAgentToken } = createStore(async () => {
      throw new Error('store should not be called');
    });

    await expect(
      createBubblophyAgentToken(
        {
          authUserId: 'user_owner',
          projectKey: 'BV',
          label: '   ',
          scopes: ['projects:read'],
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_label' });
    await expect(
      createBubblophyAgentToken(
        {
          authUserId: 'user_owner',
          projectKey: 'BV',
          label: 'x'.repeat(81),
          scopes: ['projects:read'],
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'label_too_long' });
    await expect(
      createBubblophyAgentToken(
        {
          authUserId: 'user_owner',
          projectKey: '   ',
          label: 'Codex lokal',
          scopes: ['projects:read'],
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_project' });
    await expect(
      createBubblophyAgentToken(
        {
          authUserId: 'user_owner',
          projectKey: 'b-v',
          label: 'Codex lokal',
          scopes: ['projects:read'],
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'invalid_project_key' });
    await expect(
      createBubblophyAgentToken(
        {
          authUserId: 'user_owner',
          projectKey: 'BV',
          label: 'Codex lokal',
          scopes: [],
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_scopes' });
    await expect(
      createBubblophyAgentToken(
        {
          authUserId: 'user_owner',
          projectKey: 'BV',
          label: 'Codex lokal',
          scopes: ['admin:all'],
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'invalid_scope' });

    expect(createAgentToken).not.toHaveBeenCalled();
  });

  it('rejects expired or too-distant expiry timestamps before touching the store', async () => {
    const { store, createAgentToken } = createStore(async () => {
      throw new Error('store should not be called');
    });

    await expect(
      createBubblophyAgentToken(
        {
          authUserId: 'user_owner',
          projectKey: 'BV',
          label: 'Codex lokal',
          scopes: ['projects:read'],
          expiresAt: '2000-01-01T00:00:00.000Z',
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'invalid_expires_at' });
    await expect(
      createBubblophyAgentToken(
        {
          authUserId: 'user_owner',
          projectKey: 'BV',
          label: 'Codex lokal',
          scopes: ['projects:read'],
          expiresAt: 'not-a-date',
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'invalid_expires_at' });

    expect(createAgentToken).not.toHaveBeenCalled();
  });

  it('denies creation when the store rejects the project role', async () => {
    const { store, createAgentToken } = createStore(async () => ({
      status: 'forbidden',
    }));

    await expect(
      createBubblophyAgentToken(
        {
          authUserId: 'user_viewer',
          projectKey: 'BV',
          label: 'Viewer Token',
          scopes: ['projects:read'],
        },
        { store, tokenFactory: () => 'bubblophy_agent_secret' }
      )
    ).resolves.toEqual({ status: 'forbidden' });

    expect(createAgentToken).toHaveBeenCalledTimes(1);
  });

  it('stores only a token hash and returns the plaintext once in the result', async () => {
    const plaintextToken = 'bubblophy_agent_test_plaintext';
    const { store, createAgentToken } = createStore(async (input) => ({
      status: 'created',
      token: {
        id: 'token_codex',
        label: input.label,
        projectKey: input.projectKey,
        scopes: input.scopes,
        state: 'active',
      },
    }));

    await expect(
      createBubblophyAgentToken(
        {
          authUserId: 'user_owner',
          projectKey: ' bv ',
          label: '  Codex lokal  ',
          scopes: ['projects:read', 'issues:read', 'projects:read'],
        },
        { store, tokenFactory: () => plaintextToken }
      )
    ).resolves.toEqual({
      status: 'created',
      token: {
        id: 'token_codex',
        label: 'Codex lokal',
        projectKey: 'BV',
        scopes: ['projects:read', 'issues:read'],
        state: 'aktiv',
        lastUsedAt: 'noch nie verwendet',
        plaintextToken,
      },
    });

    expect(createAgentToken).toHaveBeenCalledTimes(1);
    expect(createAgentToken).toHaveBeenCalledWith({
      authUserId: 'user_owner',
      projectKey: 'BV',
      label: 'Codex lokal',
      scopes: ['projects:read', 'issues:read'],
      tokenHash: hashBubblophyAgentToken(plaintextToken),
      expiresAt: null,
    });
    expect(createAgentToken.mock.calls[0]?.[0]).not.toHaveProperty(
      'plaintextToken'
    );
    expect(createAgentToken.mock.calls[0]?.[0]).not.toHaveProperty('token');
  });

  it('returns duplicate as a structured result', async () => {
    const { store } = createStore(async () => ({ status: 'duplicate' }));

    await expect(
      createBubblophyAgentToken(
        {
          authUserId: 'user_owner',
          projectKey: 'BV',
          label: 'Codex lokal',
          scopes: ['projects:read'],
        },
        { store, tokenFactory: () => 'bubblophy_agent_secret' }
      )
    ).resolves.toEqual({ status: 'duplicate' });
  });

  it('returns database_unavailable when no store and no database URL exist', async () => {
    vi.stubEnv('DATABASE_URL', '');

    await expect(
      createBubblophyAgentToken({
        authUserId: 'user_owner',
        projectKey: 'BV',
        label: 'Codex lokal',
        scopes: ['projects:read'],
      })
    ).resolves.toEqual({ status: 'database_unavailable' });
  });
});

describe('Bubblophy agent token helpers', () => {
  it('normalizes and rejects scopes', () => {
    expect(
      normalizeBubblophyAgentTokenScopes([
        'projects:read',
        'issues:read',
        'projects:read',
      ])
    ).toEqual({
      status: 'valid',
      value: ['projects:read', 'issues:read'],
    });
    expect(normalizeBubblophyAgentTokenScopes([])).toEqual({
      status: 'empty',
    });
    expect(normalizeBubblophyAgentTokenScopes(['admin:all'])).toEqual({
      status: 'invalid',
    });
  });

  it('generates prefixed tokens and deterministic hashes', () => {
    const token = generateBubblophyAgentPlaintextToken();

    expect(token).toMatch(/^bubblophy_agent_[A-Za-z0-9_-]+$/);
    expect(token.length).toBeGreaterThanOrEqual(59);
    expect(hashBubblophyAgentToken('bubblophy_agent_secret')).toBe(
      'sha256:36d3210e4de6a89fd9ba7ac386afebf2e49fb8f7274a3c87642ea542234fec9b'
    );
  });

  it('maps created token rows without plaintext', () => {
    expect(
      mapCreatedAgentTokenToSummary({
        id: 'token_codex',
        label: 'Codex lokal',
        projectKey: 'BV',
        scopes: ['projects:read'],
        state: 'active',
      })
    ).toEqual({
      id: 'token_codex',
      label: 'Codex lokal',
      projectKey: 'BV',
      scopes: ['projects:read'],
      state: 'aktiv',
      lastUsedAt: 'noch nie verwendet',
    });
  });
});
