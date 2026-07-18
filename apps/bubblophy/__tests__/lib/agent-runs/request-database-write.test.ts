import type { BubblophyAgentRunRequestStoreInput } from '@/lib/agent-runs/request';
import type { SQL } from 'drizzle-orm';

import { getTableName } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type DrizzleTable = Parameters<typeof getTableName>[0];
type MockValue =
  | string
  | number
  | boolean
  | null
  | MockValue[]
  | { [key: string]: MockValue };
type MockRow = Record<string, MockValue>;

const lockWriteContextMock = vi.fn();
const state = {
  tokenState: 'active' as 'active' | 'paused' | 'revoked',
  tokenScopes: ['issues:read', 'runs:update'] as string[],
  tokenExpiresAt: null as string | null,
  runInserts: [] as MockRow[],
  eventInserts: [] as MockRow[],
  tokenLockCalls: 0,
  tokenWhereParams: '[]',
  failEventInsert: false,
};

let releaseTokenRead: (() => void) | null = null;
let tokenReadGate: Promise<void> | null = null;

vi.mock('@/lib/issues/contributor-write-context-database', () => ({
  lockBubblophyIssueContributorWriteContext: (
    tx: MockTransaction,
    input: { authUserId: string; projectKey: string; issueNumber: number }
  ) => lockWriteContextMock(tx, input),
}));

class MockSelectQuery implements PromiseLike<MockRow[]> {
  private tableName: string | null = null;
  private locksToken = false;

  constructor(private readonly selectedKeys: string[]) {}

  from(table: DrizzleTable) {
    this.tableName = getTableName(table);
    return this;
  }

  innerJoin() {
    return this;
  }

  where(condition: SQL) {
    if (this.tableName === 'bubblophy_agent_tokens') {
      const query = new PgDialect().sqlToQuery(condition);
      state.tokenWhereParams = JSON.stringify(query.params);
    }
    return this;
  }

  limit() {
    return this;
  }

  for(strength: string) {
    if (strength === 'update' && this.tableName === 'bubblophy_agent_tokens') {
      this.locksToken = true;
      state.tokenLockCalls += 1;
    }
    return this;
  }

  then<TResult1 = MockRow[], TResult2 = never>(
    onfulfilled?:
      | ((value: MockRow[]) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: Error) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return this.rows().then(onfulfilled, onrejected);
  }

  /** Resolves deterministic issue or token rows for the requested projection. */
  private async rows(): Promise<MockRow[]> {
    if (this.tableName === 'bubblophy_issues') {
      return [
        {
          id: 'issue_bv_12',
          issueNumber: 12,
          title: 'Run vorbereiten',
          projectId: 'project_bv',
          projectKey: 'BV',
        },
      ];
    }

    if (this.tableName === 'bubblophy_agent_tokens') {
      if (!this.locksToken) {
        throw new Error('Agent token must be selected FOR UPDATE.');
      }

      if (tokenReadGate) {
        await tokenReadGate;
      }

      return [
        {
          id: 'token_codex',
          label: 'Codex',
          scopes: state.tokenScopes,
          state: state.tokenState,
          expiresAt: state.tokenExpiresAt,
        },
      ];
    }

    throw new Error(
      `Unexpected select from ${this.tableName ?? 'unset'} for ${this.selectedKeys.join(', ')}`
    );
  }
}

class MockInsertQuery implements PromiseLike<MockRow[]> {
  private valuesInput: MockRow | null = null;

  constructor(private readonly table: DrizzleTable) {}

  values(input: MockRow) {
    this.valuesInput = input;
    return this;
  }

  async returning(): Promise<MockRow[]> {
    const input = this.requireValues();
    const tableName = getTableName(this.table);

    if (tableName !== 'bubblophy_agent_runs') {
      throw new Error(`Unexpected returning insert into ${tableName}`);
    }

    state.runInserts.push(input);
    return [
      {
        id: 'run_bv_12',
        state: 'requested',
        createdAt: '2026-07-18T12:00:00.000Z',
      },
    ];
  }

  then<TResult1 = MockRow[], TResult2 = never>(
    onfulfilled?:
      | ((value: MockRow[]) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: Error) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return this.insertWithoutReturning().then(onfulfilled, onrejected);
  }

  /** Persists one audit event for an insert without returning fields. */
  private async insertWithoutReturning(): Promise<MockRow[]> {
    const input = this.requireValues();
    const tableName = getTableName(this.table);

    if (tableName !== 'bubblophy_issue_events') {
      throw new Error(`Unexpected insert into ${tableName}`);
    }

    if (state.failEventInsert) {
      throw new Error('Simulated run event failure.');
    }

    state.eventInserts.push(input);
    return [];
  }

  /** Returns configured insert values or fails a malformed mock query. */
  private requireValues() {
    if (!this.valuesInput) {
      throw new Error('Insert values were not configured.');
    }

    return this.valuesInput;
  }
}

const txMock = {
  select: vi.fn(
    (selection: Record<string, object>) =>
      new MockSelectQuery(Object.keys(selection))
  ),
  insert: vi.fn((table: DrizzleTable) => new MockInsertQuery(table)),
};

type MockTransaction = typeof txMock;

const dbMock = {
  transaction: vi.fn(
    async <Result>(
      handler: (tx: MockTransaction) => Promise<Result>
    ): Promise<Result> => {
      const runLength = state.runInserts.length;
      const eventLength = state.eventInserts.length;

      try {
        return await handler(txMock);
      } catch (error) {
        state.runInserts.length = runLength;
        state.eventInserts.length = eventLength;
        throw error;
      }
    }
  ),
};

vi.mock('@/drizzle/db', () => ({ db: dbMock }));

beforeEach(() => {
  lockWriteContextMock.mockReset();
  lockWriteContextMock.mockResolvedValue({
    status: 'ready',
    issueDatabaseId: 'issue_bv_12',
  });
  state.tokenState = 'active';
  state.tokenScopes = ['issues:read', 'runs:update'];
  state.tokenExpiresAt = null;
  state.runInserts = [];
  state.eventInserts = [];
  state.tokenLockCalls = 0;
  state.tokenWhereParams = '[]';
  state.failEventInsert = false;
  releaseTokenRead = null;
  tokenReadGate = null;
  txMock.select.mockClear();
  txMock.insert.mockClear();
  dbMock.transaction.mockClear();
});

describe('Drizzle agent run request store', () => {
  it('rechecks the locked issue context and token before writing one request', async () => {
    const { createDrizzleBubblophyAgentRunRequestStore } =
      await import('@/lib/agent-runs/request-database-write');

    await expect(
      createDrizzleBubblophyAgentRunRequestStore().requestAgentRun(
        createInput()
      )
    ).resolves.toEqual({
      status: 'requested',
      run: {
        id: 'run_bv_12',
        issueId: 'BV-12',
        agentTokenLabel: 'Codex',
        requestedByAuthUserId: 'user_member',
        instructions: 'Nur vorbereiten.',
        createdAt: '2026-07-18T12:00:00.000Z',
      },
    });
    expect(lockWriteContextMock).toHaveBeenCalledWith(txMock, {
      authUserId: 'user_member',
      projectKey: 'BV',
      issueNumber: 12,
    });
    expect(state.tokenLockCalls).toBe(1);
    expect(state.tokenWhereParams).toBe('["token_codex","project_bv"]');
    expect(state.runInserts).toEqual([
      {
        issueId: 'issue_bv_12',
        agentTokenId: 'token_codex',
        state: 'requested',
        requestedByAuthUserId: 'user_member',
      },
    ]);
    expect(state.runInserts[0]).not.toHaveProperty('approvedByAuthUserId');
    expect(state.runInserts[0]).not.toHaveProperty('approvedAt');
    expect(state.runInserts[0]).not.toHaveProperty('startedAt');
    expect(state.eventInserts).toEqual([
      expect.objectContaining({
        issueId: 'issue_bv_12',
        eventType: 'agent_run_requested',
        actorAuthUserId: 'user_member',
        actorOauthClientId: 'client-1',
        actorAgentTokenId: null,
        agentRunId: 'run_bv_12',
        payload: expect.objectContaining({
          source: 'oauth_mcp',
          executionStarted: false,
        }),
      }),
    ]);
  });

  it.each(['forbidden', 'not_found'] as const)(
    'returns %s from the locked contributor recheck without inserts',
    async (status) => {
      lockWriteContextMock.mockResolvedValue({ status });
      const { createDrizzleBubblophyAgentRunRequestStore } =
        await import('@/lib/agent-runs/request-database-write');

      await expect(
        createDrizzleBubblophyAgentRunRequestStore().requestAgentRun(
          createInput()
        )
      ).resolves.toEqual({ status });
      expect(state.runInserts).toHaveLength(0);
      expect(state.eventInserts).toHaveLength(0);
    }
  );

  it('observes a pause that wins before the token lock is acquired', async () => {
    tokenReadGate = new Promise<void>((resolve) => {
      releaseTokenRead = resolve;
    });
    const { createDrizzleBubblophyAgentRunRequestStore } =
      await import('@/lib/agent-runs/request-database-write');
    const request =
      createDrizzleBubblophyAgentRunRequestStore().requestAgentRun(
        createInput()
      );

    state.tokenState = 'paused';
    releaseTokenRead?.();

    await expect(request).resolves.toEqual({ status: 'token_unavailable' });
    expect(state.runInserts).toHaveLength(0);
    expect(state.eventInserts).toHaveLength(0);
  });

  it('rolls the run back when its audit event fails', async () => {
    state.failEventInsert = true;
    const { createDrizzleBubblophyAgentRunRequestStore } =
      await import('@/lib/agent-runs/request-database-write');

    await expect(
      createDrizzleBubblophyAgentRunRequestStore().requestAgentRun(
        createInput()
      )
    ).rejects.toThrow('Simulated run event failure.');
    expect(state.runInserts).toHaveLength(0);
    expect(state.eventInserts).toHaveLength(0);
  });
});

/** Builds one normalized OAuth-attributed direct-store request. */
function createInput(): BubblophyAgentRunRequestStoreInput {
  return {
    authUserId: 'user_member',
    oauthClientId: 'client-1',
    issueId: 'BV-12',
    agentTokenId: 'token_codex',
    instructions: 'Nur vorbereiten.',
  };
}
