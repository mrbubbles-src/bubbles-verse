import type { BubblophyIssueStatusUpdateStoreInput } from '@/lib/issues/status';

import { getTableName } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type DrizzleTable = Parameters<typeof getTableName>[0];
type MockValue = string | number | boolean | null;
type MockRow = Record<string, MockValue>;

const lockWriteContextMock = vi.fn();
const state = {
  currentStatus: 'in_progress',
  updates: [] as MockRow[],
  events: [] as MockRow[],
  failEventInsert: false,
};

vi.mock('@/lib/issues/contributor-write-context-database', () => ({
  lockBubblophyIssueContributorWriteContext: (
    tx: MockTransaction,
    input: { authUserId: string; projectKey: string; issueNumber: number }
  ) => lockWriteContextMock(tx, input),
}));

class MockSelectQuery implements PromiseLike<MockRow[]> {
  private tableName: string | null = null;

  from(table: DrizzleTable) {
    this.tableName = getTableName(table);
    return this;
  }

  innerJoin() {
    return this;
  }

  where() {
    return this;
  }

  limit() {
    return this;
  }

  then<TResult1 = MockRow[], TResult2 = never>(
    onfulfilled?:
      | ((value: MockRow[]) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: Error) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.rows()).then(onfulfilled, onrejected);
  }

  /** Returns the locked issue reload or its current plan count. */
  private rows(): MockRow[] {
    if (this.tableName === 'bubblophy_issues') {
      return [
        {
          id: 'issue_bv_12',
          issueNumber: 12,
          status: state.currentStatus,
          projectId: 'project_bv',
          projectKey: 'BV',
          projectName: 'Bubblesverse',
        },
      ];
    }

    if (this.tableName === 'bubblophy_issue_plans') {
      return [{ count: 2 }];
    }

    throw new Error(`Unexpected select from ${this.tableName ?? 'unset'}.`);
  }
}

class MockUpdateQuery {
  private valuesInput: MockRow | null = null;

  set(input: MockRow) {
    this.valuesInput = input;
    return this;
  }

  where() {
    return this;
  }

  async returning() {
    if (!this.valuesInput) {
      throw new Error('Update values were not configured.');
    }

    state.updates.push(this.valuesInput);
    state.currentStatus = String(this.valuesInput.status);

    return [
      {
        id: 'issue_bv_12',
        issueNumber: 12,
        title: 'Status sicher schreiben',
        status: state.currentStatus,
        priority: 'high',
        assignedAuthUserId: null,
        requiresHumanApproval: true,
      },
    ];
  }
}

class MockInsertQuery implements PromiseLike<MockRow[]> {
  private valuesInput: MockRow | null = null;

  values(input: MockRow) {
    this.valuesInput = input;
    return this;
  }

  then<TResult1 = MockRow[], TResult2 = never>(
    onfulfilled?:
      | ((value: MockRow[]) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: Error) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return this.insert().then(onfulfilled, onrejected);
  }

  /** Persists one deterministic event or raises the configured failure. */
  private async insert(): Promise<MockRow[]> {
    if (!this.valuesInput) {
      throw new Error('Insert values were not configured.');
    }

    if (state.failEventInsert) {
      throw new Error('Simulated status event failure.');
    }

    state.events.push(this.valuesInput);
    return [];
  }
}

const txMock = {
  select: vi.fn(() => new MockSelectQuery()),
  update: vi.fn(() => new MockUpdateQuery()),
  insert: vi.fn((table: DrizzleTable) => {
    if (getTableName(table) !== 'bubblophy_issue_events') {
      throw new Error(`Unexpected insert into ${getTableName(table)}.`);
    }

    return new MockInsertQuery();
  }),
};

type MockTransaction = typeof txMock;

const dbMock = {
  transaction: vi.fn(
    async <Result>(
      handler: (tx: MockTransaction) => Promise<Result>
    ): Promise<Result> => {
      const previousStatus = state.currentStatus;
      const updateLength = state.updates.length;
      const eventLength = state.events.length;

      try {
        return await handler(txMock);
      } catch (error) {
        state.currentStatus = previousStatus;
        state.updates.length = updateLength;
        state.events.length = eventLength;
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
  state.currentStatus = 'in_progress';
  state.updates = [];
  state.events = [];
  state.failEventInsert = false;
  txMock.select.mockClear();
  txMock.update.mockClear();
  txMock.insert.mockClear();
  dbMock.transaction.mockClear();
});

describe('Drizzle issue status update store', () => {
  it('locks contributor context and writes an OAuth-attributed expected transition', async () => {
    const { createDrizzleBubblophyIssueStatusUpdateStore } =
      await import('@/lib/issues/status-database-write');

    await expect(
      createDrizzleBubblophyIssueStatusUpdateStore().updateIssueStatusWithEvent(
        createInput()
      )
    ).resolves.toMatchObject({
      status: 'updated',
      issue: {
        issue: { status: 'review', planStepCount: 2 },
      },
    });
    expect(lockWriteContextMock).toHaveBeenCalledWith(txMock, {
      authUserId: 'user_member',
      projectKey: 'BV',
      issueNumber: 12,
    });
    expect(state.updates).toHaveLength(1);
    expect(state.updates[0]).toMatchObject({ status: 'review' });
    expect(state.events).toEqual([
      expect.objectContaining({
        issueId: 'issue_bv_12',
        eventType: 'status_changed',
        actorAuthUserId: 'user_member',
        actorOauthClientId: 'client-1',
        actorAgentTokenId: null,
        agentRunId: null,
        payload: {
          source: 'oauth_mcp',
          issueId: 'BV-12',
          previousStatus: 'in_progress',
          nextStatus: 'review',
          reason: 'Zur Prüfung bereit.',
        },
      }),
    ]);
  });

  it.each(['forbidden', 'not_found'] as const)(
    'returns %s from the locked contributor recheck without writes',
    async (status) => {
      lockWriteContextMock.mockResolvedValue({ status });
      const { createDrizzleBubblophyIssueStatusUpdateStore } =
        await import('@/lib/issues/status-database-write');

      await expect(
        createDrizzleBubblophyIssueStatusUpdateStore().updateIssueStatusWithEvent(
          createInput()
        )
      ).resolves.toEqual({ status });
      expect(state.updates).toHaveLength(0);
      expect(state.events).toHaveLength(0);
    }
  );

  it('returns conflict when the locked issue no longer has the expected status', async () => {
    state.currentStatus = 'ready';
    const { createDrizzleBubblophyIssueStatusUpdateStore } =
      await import('@/lib/issues/status-database-write');

    await expect(
      createDrizzleBubblophyIssueStatusUpdateStore().updateIssueStatusWithEvent(
        createInput()
      )
    ).resolves.toEqual({ status: 'conflict' });
    expect(state.updates).toHaveLength(0);
    expect(state.events).toHaveLength(0);
  });

  it('checks expected status before treating the requested target as a no-op', async () => {
    state.currentStatus = 'review';
    const { createDrizzleBubblophyIssueStatusUpdateStore } =
      await import('@/lib/issues/status-database-write');

    await expect(
      createDrizzleBubblophyIssueStatusUpdateStore().updateIssueStatusWithEvent(
        {
          ...createInput(),
          status: 'review',
        }
      )
    ).resolves.toEqual({ status: 'conflict' });
    expect(state.updates).toHaveLength(0);
    expect(state.events).toHaveLength(0);
  });

  it('keeps same-status requests as audit-free no-ops', async () => {
    const { createDrizzleBubblophyIssueStatusUpdateStore } =
      await import('@/lib/issues/status-database-write');

    await expect(
      createDrizzleBubblophyIssueStatusUpdateStore().updateIssueStatusWithEvent(
        {
          ...createInput(),
          status: 'in_progress',
        }
      )
    ).resolves.toEqual({ status: 'unchanged' });
    expect(state.updates).toHaveLength(0);
    expect(state.events).toHaveLength(0);
  });

  it('preserves unrestricted human status targets and human attribution', async () => {
    const { createDrizzleBubblophyIssueStatusUpdateStore } =
      await import('@/lib/issues/status-database-write');

    await createDrizzleBubblophyIssueStatusUpdateStore().updateIssueStatusWithEvent(
      {
        authUserId: 'user_member',
        issueId: 'BV-12',
        status: 'done',
        reason: '',
      }
    );

    expect(state.currentStatus).toBe('done');
    expect(state.events[0]).toMatchObject({
      actorOauthClientId: null,
      payload: { source: 'human' },
    });
  });

  it('rolls the status update back when its audit event fails', async () => {
    state.failEventInsert = true;
    const { createDrizzleBubblophyIssueStatusUpdateStore } =
      await import('@/lib/issues/status-database-write');

    await expect(
      createDrizzleBubblophyIssueStatusUpdateStore().updateIssueStatusWithEvent(
        createInput()
      )
    ).rejects.toThrow('Simulated status event failure.');
    expect(state.currentStatus).toBe('in_progress');
    expect(state.updates).toHaveLength(0);
    expect(state.events).toHaveLength(0);
  });
});

/** Builds one normalized OAuth status transition with stale-write protection. */
function createInput(): BubblophyIssueStatusUpdateStoreInput {
  return {
    authUserId: 'user_member',
    oauthClientId: 'client-1',
    issueId: 'BV-12',
    expectedStatus: 'in_progress',
    status: 'review',
    reason: 'Zur Prüfung bereit.',
  };
}
