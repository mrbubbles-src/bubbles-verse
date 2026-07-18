import type {
  BubblophyIssuePlanDraftStore,
  BubblophyIssuePlanDraftStoreInput,
} from '@/lib/issues/plans';

import {
  buildBubblophyIssuePlanInsert,
  buildBubblophyIssuePlanUpdatedEventInsert,
  getNextBubblophyIssuePlanVersion,
  parseBubblophyIssueKey,
} from '@/lib/issues/plan-database-write';
import {
  createOrUpdateBubblophyIssuePlanDraft,
  normalizeBubblophyIssuePlanSteps,
} from '@/lib/issues/plans';

import { afterEach, describe, expect, it, vi } from 'vitest';

function createStore(
  handler: (
    input: BubblophyIssuePlanDraftStoreInput
  ) => ReturnType<
    BubblophyIssuePlanDraftStore['createIssuePlanVersionWithEvent']
  >
): BubblophyIssuePlanDraftStore {
  return {
    createIssuePlanVersionWithEvent: vi.fn(handler),
  };
}

describe('createOrUpdateBubblophyIssuePlanDraft', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejects invalid plan drafts before touching the store', async () => {
    const store = createStore(async () => {
      throw new Error('store should not be called');
    });

    await expect(
      createOrUpdateBubblophyIssuePlanDraft(
        {
          authUserId: 'user_owner',
          issueId: '   ',
          steps: ['Plan prüfen'],
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_issue' });
    await expect(
      createOrUpdateBubblophyIssuePlanDraft(
        {
          authUserId: 'user_owner',
          issueId: 'BV-12',
          steps: ['   '],
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_steps' });
    await expect(
      createOrUpdateBubblophyIssuePlanDraft(
        {
          authUserId: 'user_owner',
          issueId: 'BV-12',
          steps: Array.from({ length: 13 }, (_, index) => `Schritt ${index}`),
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'too_many_steps' });
    await expect(
      createOrUpdateBubblophyIssuePlanDraft(
        {
          authUserId: 'user_owner',
          issueId: 'BV-12',
          summary: 'x'.repeat(241),
          steps: ['Plan prüfen'],
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'summary_too_long' });
    await expect(
      createOrUpdateBubblophyIssuePlanDraft(
        {
          authUserId: 'user_owner',
          issueId: 'BV-12',
          steps: ['x'.repeat(281)],
        },
        { store }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'step_too_long' });

    expect(store.createIssuePlanVersionWithEvent).not.toHaveBeenCalled();
  });

  it('passes normalized plan data to the store', async () => {
    const store = createStore(async (input) => ({
      status: 'created',
      plan: {
        issueId: input.issueId,
        version: 2,
        summary: input.summary,
        steps: input.steps,
      },
    }));

    await expect(
      createOrUpdateBubblophyIssuePlanDraft(
        {
          authUserId: 'user_owner',
          issueId: ' BV-12 ',
          summary: '  Ruhig planen  ',
          steps: ['  Kontext lesen  ', '', 'Tests ergänzen'],
        },
        { store }
      )
    ).resolves.toEqual({
      status: 'created',
      plan: {
        issueId: 'BV-12',
        version: 2,
        summary: 'Ruhig planen',
        steps: [
          { id: 'step_1', text: 'Kontext lesen' },
          { id: 'step_2', text: 'Tests ergänzen' },
        ],
      },
    });

    expect(store.createIssuePlanVersionWithEvent).toHaveBeenCalledTimes(1);
    expect(store.createIssuePlanVersionWithEvent).toHaveBeenCalledWith({
      authUserId: 'user_owner',
      issueId: 'BV-12',
      summary: 'Ruhig planen',
      steps: [
        { id: 'step_1', text: 'Kontext lesen' },
        { id: 'step_2', text: 'Tests ergänzen' },
      ],
    });
  });

  it('normalizes optional OAuth client attribution for personal MCP writes', async () => {
    const store = createStore(async (input) => ({
      status: 'created',
      plan: {
        issueId: input.issueId,
        version: 2,
        summary: input.summary,
        steps: input.steps,
      },
    }));

    await createOrUpdateBubblophyIssuePlanDraft(
      {
        authUserId: 'user_owner',
        oauthClientId: ' client-1 ',
        issueId: 'BV-12',
        steps: ['Plan prüfen'],
      },
      { store }
    );

    expect(store.createIssuePlanVersionWithEvent).toHaveBeenCalledWith(
      expect.objectContaining({ oauthClientId: 'client-1' })
    );
  });

  it('returns store not_found and forbidden results unchanged', async () => {
    await expect(
      createOrUpdateBubblophyIssuePlanDraft(
        {
          authUserId: 'user_owner',
          issueId: 'BV-99',
          steps: ['Plan prüfen'],
        },
        { store: createStore(async () => ({ status: 'not_found' })) }
      )
    ).resolves.toEqual({ status: 'not_found' });
    await expect(
      createOrUpdateBubblophyIssuePlanDraft(
        {
          authUserId: 'user_viewer',
          issueId: 'BV-12',
          steps: ['Plan prüfen'],
        },
        { store: createStore(async () => ({ status: 'forbidden' })) }
      )
    ).resolves.toEqual({ status: 'forbidden' });
  });

  it('returns database_unavailable when no store and no database URL exist', async () => {
    vi.stubEnv('DATABASE_URL', '');

    await expect(
      createOrUpdateBubblophyIssuePlanDraft({
        authUserId: 'user_owner',
        issueId: 'BV-12',
        steps: ['Plan prüfen'],
      })
    ).resolves.toEqual({ status: 'database_unavailable' });
  });
});

describe('Bubblophy issue plan helpers', () => {
  it('normalizes plan steps', () => {
    expect(normalizeBubblophyIssuePlanSteps([' Eins ', '', 'Zwei'])).toEqual([
      { id: 'step_1', text: 'Eins' },
      { id: 'step_2', text: 'Zwei' },
    ]);
  });

  it('parses human-facing issue keys', () => {
    expect(parseBubblophyIssueKey('BV-12')).toEqual({
      projectKey: 'BV',
      issueNumber: 12,
    });
    expect(parseBubblophyIssueKey('bad')).toBeNull();
    expect(parseBubblophyIssueKey('BV-0')).toBeNull();
  });

  it('calculates the next per-issue plan version', () => {
    expect(getNextBubblophyIssuePlanVersion(undefined)).toBe(1);
    expect(getNextBubblophyIssuePlanVersion(null)).toBe(1);
    expect(getNextBubblophyIssuePlanVersion(4)).toBe(5);
  });

  it('builds a human plan-updated event without agent run fields', () => {
    expect(
      buildBubblophyIssuePlanUpdatedEventInsert({
        issueDatabaseId: 'issue_bv_12',
        authUserId: 'user_owner',
        issueId: 'BV-12',
        version: 3,
        stepCount: 2,
      })
    ).toEqual({
      issueId: 'issue_bv_12',
      eventType: 'plan_updated',
      actorAuthUserId: 'user_owner',
      actorOauthClientId: null,
      actorAgentTokenId: null,
      agentRunId: null,
      summary: 'Plan BV-12 v3 aktualisiert.',
      payload: {
        source: 'human',
        issueId: 'BV-12',
        version: 3,
        stepCount: 2,
      },
    });
  });

  it('builds OAuth-attributed plan and event inserts for personal MCP writes', () => {
    expect(
      buildBubblophyIssuePlanInsert({
        issueDatabaseId: 'issue_bv_12',
        authUserId: 'user_owner',
        oauthClientId: 'client-1',
        version: 4,
        summary: 'Agent-Entwurf',
        steps: [{ id: 'step_1', text: 'Vertrag prüfen' }],
      })
    ).toMatchObject({
      issueId: 'issue_bv_12',
      createdByAuthUserId: 'user_owner',
      createdByOauthClientId: 'client-1',
      createdByAgentTokenId: null,
      approvedByAuthUserId: null,
      approvedAt: null,
    });
    expect(
      buildBubblophyIssuePlanUpdatedEventInsert({
        issueDatabaseId: 'issue_bv_12',
        authUserId: 'user_owner',
        oauthClientId: 'client-1',
        issueId: 'BV-12',
        version: 4,
        stepCount: 1,
      })
    ).toMatchObject({
      actorAuthUserId: 'user_owner',
      actorOauthClientId: 'client-1',
      actorAgentTokenId: null,
      payload: { source: 'oauth_mcp' },
    });
  });
});
