import { getTableName } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type DrizzleTable = Parameters<typeof getTableName>[0];
type MockRowValue = string | number | string[] | null;
type MockRow = Record<string, MockRowValue>;

interface SelectCall {
  selectedKeys: string[];
  tableName: string | null;
}

interface LockCall {
  selectedKeys: string[];
  lockMode: string;
  targetsSelectionTable: boolean;
}

const selectCalls: SelectCall[] = [];
const lockCalls: LockCall[] = [];
const operationOrder: string[] = [];
let executionScopes: string[] = ['issues:read', 'runs:update'];
let tokenState = 'active';
let tokenExpiresAt: string | null = null;
let runState = 'requested';
let updateRows: MockRow[] = [];
let lockedProject: {
  id: string;
  key: string;
  isArchived: boolean;
} | null = {
  id: 'project_bv',
  key: 'BV',
  isArchived: false,
};
let lockedMemberships: Array<{ authUserId: string; role: string }> = [
  { authUserId: 'user_member', role: 'member' },
];

const lockWriteContextMock = vi.fn(async () => ({
  status: 'ready' as const,
  issueDatabaseId: 'issue_bv_12',
}));

vi.mock('@/lib/issues/contributor-write-context-database', () => ({
  lockBubblophyIssueContributorWriteContext: () => lockWriteContextMock(),
}));

const lockProjectMock = vi.fn(async () => {
  operationOrder.push('project');
  return lockedProject;
});
const lockMembersMock = vi.fn(async () => {
  operationOrder.push('membership');
  return lockedMemberships;
});

vi.mock('@/lib/projects/human-write-locks-database', () => ({
  lockBubblophyProjectForHumanWrite: () => lockProjectMock(),
  lockBubblophyProjectMembersForHumanWrite: () => lockMembersMock(),
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

  for(lockMode: string, config?: { of?: DrizzleTable }) {
    const targetsSelectionTable = Boolean(config?.of);
    lockCalls.push({
      selectedKeys: this.call.selectedKeys,
      lockMode,
      targetsSelectionTable,
    });

    if (this.call.selectedKeys.includes('agentTokenId')) {
      operationOrder.push('run');
    } else if (this.call.selectedKeys.includes('scopes')) {
      operationOrder.push('token');
    }

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
  if (selectedKeys.length === 1 && selectedKeys.includes('projectId')) {
    return [{ projectId: 'project_bv' }];
  }

  if (selectedKeys.includes('agentTokenId')) {
    return [
      {
        id: 'run_bv_12',
        state: runState,
        issueDatabaseId: 'issue_bv_12',
        issueNumber: 12,
        agentTokenId: 'token_codex',
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
  runState = 'requested';
  updateRows = [];
  lockedProject = {
    id: 'project_bv',
    key: 'BV',
    isArchived: false,
  };
  lockedMemberships = [{ authUserId: 'user_member', role: 'member' }];
  selectCalls.length = 0;
  lockCalls.length = 0;
  operationOrder.length = 0;
  txMock.select.mockClear();
  txMock.update.mockClear();
  txMock.insert.mockClear();
  updateSet.mockClear();
  updateWhere.mockClear();
  updateReturning.mockClear();
  insertValues.mockClear();
  dbMock.transaction.mockClear();
  lockWriteContextMock.mockClear();
  lockProjectMock.mockClear();
  lockMembersMock.mockClear();
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
    expect(operationOrder).toEqual(['project', 'membership', 'run', 'token']);
    expect(lockCalls).toEqual([
      {
        selectedKeys: [
          'id',
          'state',
          'issueDatabaseId',
          'issueNumber',
          'agentTokenId',
        ],
        lockMode: 'update',
        targetsSelectionTable: true,
      },
      {
        selectedKeys: ['id', 'label', 'scopes', 'state', 'expiresAt'],
        lockMode: 'update',
        targetsSelectionTable: false,
      },
    ]);
    expect(txMock.update).not.toHaveBeenCalled();
    expect(txMock.insert).not.toHaveBeenCalled();
  });

  it('rejects an actor demoted before the locked authorization check', async () => {
    lockedMemberships = [{ authUserId: 'user_member', role: 'viewer' }];
    const { createDrizzleBubblophyAgentRunHumanTransitionStore } =
      await import('@/lib/agent-runs/human-transition-database-write');

    await expect(
      createDrizzleBubblophyAgentRunHumanTransitionStore().transitionRun({
        authUserId: 'user_member',
        runId: 'run_bv_12',
        decision: 'approve',
      })
    ).resolves.toEqual({ status: 'forbidden' });
    expect(operationOrder).toEqual(['project', 'membership']);
    expect(txMock.update).not.toHaveBeenCalled();
    expect(txMock.insert).not.toHaveBeenCalled();
  });

  it('checks run state under its row lock before locking the token', async () => {
    runState = 'approved';
    const { createDrizzleBubblophyAgentRunHumanTransitionStore } =
      await import('@/lib/agent-runs/human-transition-database-write');

    await expect(
      createDrizzleBubblophyAgentRunHumanTransitionStore().transitionRun({
        authUserId: 'user_member',
        runId: 'run_bv_12',
        decision: 'approve',
      })
    ).resolves.toEqual({ status: 'invalid_transition' });
    expect(operationOrder).toEqual(['project', 'membership', 'run']);
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
