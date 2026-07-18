import { getTableName } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type DrizzleTable = Parameters<typeof getTableName>[0];
type MockRowValue = string | number | string[] | null;
type MockRow = Record<string, MockRowValue>;

interface SelectCall {
  selectedKeys: string[];
  tableName: string | null;
}

const selectCalls: SelectCall[] = [];
let executionScopes: string[] = ['issues:read', 'runs:update'];
let tokenState = 'active';
let tokenExpiresAt: string | null = null;
let updateRows: MockRow[] = [];

const lockWriteContextMock = vi.fn(async () => ({
  status: 'ready' as const,
  issueDatabaseId: 'issue_bv_12',
}));

vi.mock('@/lib/issues/contributor-write-context-database', () => ({
  lockBubblophyIssueContributorWriteContext: () => lockWriteContextMock(),
}));

class MockSelectQuery implements PromiseLike<MockRow[]> {
  private readonly call: SelectCall;

  constructor(selectedKeys: string[]) {
    this.call = { selectedKeys, tableName: null };
    selectCalls.push(this.call);
  }

  from(table: DrizzleTable) {
    this.call.tableName = getTableName(table);
    return this;
  }

  innerJoin() {
    return this;
  }

  leftJoin() {
    return this;
  }

  where() {
    return this;
  }

  limit() {
    return this;
  }

  for() {
    return this;
  }

  then<TResult1 = MockRow[], TResult2 = never>(
    onfulfilled?:
      | ((value: MockRow[]) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: Error) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(rowsForSelection(this.call.selectedKeys)).then(
      onfulfilled,
      onrejected
    );
  }
}

/**
 * Returns the request or transition row matching a selected projection.
 *
 * @param selectedKeys Drizzle projection keys recorded by the mock.
 * @returns Deterministic issue, token, or run rows.
 */
function rowsForSelection(selectedKeys: string[]): MockRow[] {
  if (selectedKeys.includes('agentTokenScopes')) {
    return [
      {
        id: 'run_bv_12',
        state: 'requested',
        issueDatabaseId: 'issue_bv_12',
        issueNumber: 12,
        projectId: 'project_bv',
        projectKey: 'BV',
        memberRole: 'member',
        agentTokenLabel: 'Codex',
        agentTokenScopes: executionScopes,
        agentTokenState: tokenState,
        agentTokenExpiresAt: tokenExpiresAt,
      },
    ];
  }

  if (selectedKeys.includes('scopes')) {
    return [
      {
        id: 'token_codex',
        label: 'Codex',
        scopes: executionScopes,
        state: tokenState,
        expiresAt: tokenExpiresAt,
      },
    ];
  }

  return [
    {
      id: 'issue_bv_12',
      projectId: 'project_bv',
      projectKey: 'BV',
      memberRole: 'member',
    },
  ];
}

const updateReturning = vi.fn(async () => updateRows);
const updateWhere = vi.fn(() => ({ returning: updateReturning }));
const updateSet = vi.fn(() => ({ where: updateWhere }));
const insertValues = vi.fn(async () => []);

const txMock = {
  select: vi.fn(
    (selection: Record<string, object>) =>
      new MockSelectQuery(Object.keys(selection))
  ),
  update: vi.fn(() => ({ set: updateSet })),
  insert: vi.fn(() => ({ values: insertValues })),
};

const dbMock = {
  transaction: vi.fn(
    async <Result>(handler: (tx: typeof txMock) => Promise<Result>) =>
      handler(txMock)
  ),
};

vi.mock('@/drizzle/db', () => ({ db: dbMock }));

beforeEach(() => {
  executionScopes = ['issues:read', 'runs:update'];
  tokenState = 'active';
  tokenExpiresAt = null;
  updateRows = [];
  selectCalls.length = 0;
  txMock.select.mockClear();
  txMock.update.mockClear();
  txMock.insert.mockClear();
  updateSet.mockClear();
  updateWhere.mockClear();
  updateReturning.mockClear();
  insertValues.mockClear();
  dbMock.transaction.mockClear();
  lockWriteContextMock.mockClear();
});

describe('run request token execution boundary', () => {
  it('rejects tokens missing a required execution scope', async () => {
    executionScopes = ['issues:read'];
    const { createDrizzleBubblophyAgentRunRequestStore } =
      await import('@/lib/agent-runs/request-database-write');

    await expect(
      createDrizzleBubblophyAgentRunRequestStore().requestAgentRun({
        authUserId: 'user_member',
        issueId: 'BV-12',
        agentTokenId: 'token_codex',
        instructions: '',
      })
    ).resolves.toEqual({ status: 'token_unavailable' });
    expect(txMock.insert).not.toHaveBeenCalled();
  });
});

describe('human run transition security', () => {
  it('rejects approval when the assigned token is not executable', async () => {
    tokenState = 'paused';
    const { createDrizzleBubblophyAgentRunHumanTransitionStore } =
      await import('@/lib/agent-runs/human-transition-database-write');

    await expect(
      createDrizzleBubblophyAgentRunHumanTransitionStore().transitionRun({
        authUserId: 'user_member',
        runId: 'run_bv_12',
        decision: 'approve',
      })
    ).resolves.toEqual({ status: 'token_unavailable' });
    expect(txMock.update).not.toHaveBeenCalled();
    expect(txMock.insert).not.toHaveBeenCalled();
  });

  it('keeps cancellation available when the assigned token is unavailable', async () => {
    tokenState = 'revoked';
    updateRows = [{ id: 'run_bv_12', state: 'cancelled' }];
    const { createDrizzleBubblophyAgentRunHumanTransitionStore } =
      await import('@/lib/agent-runs/human-transition-database-write');

    const result =
      await createDrizzleBubblophyAgentRunHumanTransitionStore().transitionRun({
        authUserId: 'user_member',
        runId: 'run_bv_12',
        decision: 'cancel',
      });

    expect(result.status).toBe('updated');
    expect(txMock.update).toHaveBeenCalledTimes(1);
    expect(txMock.insert).toHaveBeenCalledTimes(1);
  });

  it('returns a conflict without audit when compare-and-set loses', async () => {
    updateRows = [];
    const { createDrizzleBubblophyAgentRunHumanTransitionStore } =
      await import('@/lib/agent-runs/human-transition-database-write');

    await expect(
      createDrizzleBubblophyAgentRunHumanTransitionStore().transitionRun({
        authUserId: 'user_member',
        runId: 'run_bv_12',
        decision: 'approve',
      })
    ).resolves.toEqual({ status: 'invalid_transition' });
    expect(txMock.insert).not.toHaveBeenCalled();
  });
});
