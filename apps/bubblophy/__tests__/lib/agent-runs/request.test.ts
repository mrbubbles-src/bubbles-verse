import type {
  BubblophyAgentRunRequestStore,
  BubblophyAgentRunRequestStoreInput,
} from '@/lib/agent-runs/request';

import {
  bubblophyAgentRunRequestLimits,
  mapRequestedAgentRunToSummary,
  requestBubblophyAgentRun,
} from '@/lib/agent-runs/request';
import { buildBubblophyAgentRunRequestedIssueEventInsert } from '@/lib/agent-runs/request-database-write';

import { afterEach, describe, expect, it, vi } from 'vitest';

function createStore(
  handler: (
    input: BubblophyAgentRunRequestStoreInput
  ) => ReturnType<BubblophyAgentRunRequestStore['requestAgentRun']>
): BubblophyAgentRunRequestStore {
  return {
    requestAgentRun: vi.fn(handler),
  };
}

describe('requestBubblophyAgentRun', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejects invalid input before touching the store', async () => {
    const store = createStore(async () => {
      throw new Error('store should not be called');
    });

    await expect(
      requestBubblophyAgentRun(
        {
          authUserId: 'user_owner',
          issueId: '   ',
          agentTokenId: 'token_codex',
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_issue' });
    await expect(
      requestBubblophyAgentRun(
        {
          authUserId: 'user_owner',
          issueId: 'BV-12',
          agentTokenId: '   ',
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_agent_token' });
    await expect(
      requestBubblophyAgentRun(
        {
          authUserId: 'user_owner',
          issueId: 'BV-12',
          agentTokenId: 'token_codex',
          instructions: 'x'.repeat(501),
        },
        { store }
      )
    ).resolves.toEqual({
      status: 'invalid',
      reason: 'instructions_too_long',
    });

    expect(store.requestAgentRun).not.toHaveBeenCalled();
  });

  it('passes normalized request data to the store and returns a waiting run', async () => {
    const requestAgentRun = vi.fn<
      (
        input: BubblophyAgentRunRequestStoreInput
      ) => ReturnType<BubblophyAgentRunRequestStore['requestAgentRun']>
    >(async (input) => ({
      status: 'requested',
      run: {
        id: 'run_bv_12_1',
        issueId: input.issueId,
        agentTokenLabel: 'codex-local-lio',
        requestedByAuthUserId: input.authUserId,
        instructions: input.instructions,
        createdAt: '2026-07-18T12:00:00.000Z',
      },
    }));
    const store: BubblophyAgentRunRequestStore = {
      requestAgentRun,
    };

    await expect(
      requestBubblophyAgentRun(
        {
          authUserId: 'user_owner',
          issueId: ' BV-12 ',
          agentTokenId: ' token_codex ',
          instructions: '  Bitte den Plan prüfen, aber nichts ausführen.  ',
        },
        { store }
      )
    ).resolves.toEqual({
      status: 'requested',
      run: {
        id: 'run_bv_12_1',
        issueId: 'BV-12',
        agentLabel: 'codex-local-lio',
        state: 'wartet',
        requestedBy: 'Mensch',
        lastEvent:
          'Anfrage gespeichert: Bitte den Plan prüfen, aber nichts ausführen.',
      },
      createdAt: '2026-07-18T12:00:00.000Z',
    });

    expect(requestAgentRun).toHaveBeenCalledTimes(1);
    expect(requestAgentRun).toHaveBeenCalledWith({
      authUserId: 'user_owner',
      issueId: 'BV-12',
      agentTokenId: 'token_codex',
      instructions: 'Bitte den Plan prüfen, aber nichts ausführen.',
    });
  });

  it('normalizes OAuth attribution and accepts exact instruction limits', async () => {
    const store = createStore(async (input) => ({
      status: 'requested',
      run: {
        id: 'run_bv_12',
        issueId: input.issueId,
        agentTokenLabel: 'Codex',
        requestedByAuthUserId: input.authUserId,
        instructions: input.instructions,
        createdAt: '2026-07-18T12:00:00.000Z',
      },
    }));

    await requestBubblophyAgentRun(
      {
        authUserId: 'user_owner',
        oauthClientId: ' client-1 ',
        issueId: 'BV-12',
        agentTokenId: 'token_codex',
        instructions: 'x'.repeat(
          bubblophyAgentRunRequestLimits.maxInstructionsLength
        ),
      },
      { store }
    );

    expect(store.requestAgentRun).toHaveBeenCalledWith(
      expect.objectContaining({ oauthClientId: 'client-1' })
    );
  });

  it('returns store not_found, forbidden, and token_unavailable results unchanged', async () => {
    await expect(
      requestBubblophyAgentRun(
        {
          authUserId: 'user_owner',
          issueId: 'BV-99',
          agentTokenId: 'token_codex',
        },
        { store: createStore(async () => ({ status: 'not_found' })) }
      )
    ).resolves.toEqual({ status: 'not_found' });
    await expect(
      requestBubblophyAgentRun(
        {
          authUserId: 'user_viewer',
          issueId: 'BV-12',
          agentTokenId: 'token_codex',
        },
        { store: createStore(async () => ({ status: 'forbidden' })) }
      )
    ).resolves.toEqual({ status: 'forbidden' });
    await expect(
      requestBubblophyAgentRun(
        {
          authUserId: 'user_owner',
          issueId: 'BV-12',
          agentTokenId: 'token_wrong_project',
        },
        { store: createStore(async () => ({ status: 'token_unavailable' })) }
      )
    ).resolves.toEqual({ status: 'token_unavailable' });
  });

  it('returns database_unavailable when no store and no database URL exist', async () => {
    vi.stubEnv('DATABASE_URL', '');

    await expect(
      requestBubblophyAgentRun({
        authUserId: 'user_owner',
        issueId: 'BV-12',
        agentTokenId: 'token_codex',
      })
    ).resolves.toEqual({ status: 'database_unavailable' });
  });
});

describe('Bubblophy agent run request helpers', () => {
  it('maps requested runs without implying execution', () => {
    expect(
      mapRequestedAgentRunToSummary({
        id: 'run_bv_12',
        issueId: 'BV-12',
        agentTokenLabel: 'codex-local-lio',
        requestedByAuthUserId: 'user_owner',
        instructions: '',
        createdAt: '2026-07-18T12:00:00.000Z',
      })
    ).toEqual({
      id: 'run_bv_12',
      issueId: 'BV-12',
      agentLabel: 'codex-local-lio',
      state: 'wartet',
      requestedBy: 'Mensch',
      lastEvent: 'Anfrage gespeichert, keine Ausführung gestartet.',
    });
  });

  it('builds a human run-request event without agent execution actor fields', () => {
    expect(
      buildBubblophyAgentRunRequestedIssueEventInsert({
        issueDatabaseId: 'issue_bv_12',
        issueId: 'BV-12',
        runId: 'run_bv_12',
        authUserId: 'user_owner',
        agentTokenId: 'token_codex',
        agentTokenLabel: 'codex-local-lio',
        projectKey: 'BV',
        instructions: 'Nur vorbereiten.',
      })
    ).toEqual({
      issueId: 'issue_bv_12',
      eventType: 'agent_run_requested',
      actorAuthUserId: 'user_owner',
      actorOauthClientId: null,
      actorAgentTokenId: null,
      agentRunId: 'run_bv_12',
      summary: 'Run für BV-12 mit "codex-local-lio" angefragt.',
      payload: {
        source: 'human',
        projectKey: 'BV',
        issueId: 'BV-12',
        runId: 'run_bv_12',
        selectedAgentTokenId: 'token_codex',
        selectedAgentTokenLabel: 'codex-local-lio',
        instructions: 'Nur vorbereiten.',
        executionStarted: false,
      },
    });
  });

  it('builds an OAuth-attributed request event without execution actor fields', () => {
    expect(
      buildBubblophyAgentRunRequestedIssueEventInsert({
        issueDatabaseId: 'issue_bv_12',
        issueId: 'BV-12',
        runId: 'run_bv_12',
        authUserId: 'user_owner',
        oauthClientId: 'client-1',
        agentTokenId: 'token_codex',
        agentTokenLabel: 'Codex',
        projectKey: 'BV',
        instructions: '',
      })
    ).toMatchObject({
      actorAuthUserId: 'user_owner',
      actorOauthClientId: 'client-1',
      actorAgentTokenId: null,
      payload: { source: 'oauth_mcp', executionStarted: false },
    });
  });
});
