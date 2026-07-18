import { beforeEach, describe, expect, it, vi } from 'vitest';

type MockRow = Record<string, string | string[] | boolean | null>;

const lockProjectMock = vi.fn();
const lockMembersMock = vi.fn();
const state = {
  selectRows: [] as MockRow[][],
  tokenLockModes: [] as string[],
};

vi.mock('@/lib/projects/human-write-locks-database', () => ({
  lockBubblophyProjectForHumanWrite: (tx: never, input: never) =>
    lockProjectMock(tx, input),
  lockBubblophyProjectMembersForHumanWrite: (tx: never, input: never) =>
    lockMembersMock(tx, input),
}));

class MockSelectQuery implements PromiseLike<MockRow[]> {
  constructor(private readonly rows: MockRow[]) {}

  from() {
    return this;
  }

  where() {
    return this;
  }

  limit() {
    return this;
  }

  for(lockMode: string) {
    state.tokenLockModes.push(lockMode);
    return this;
  }

  then<TResult1 = MockRow[], TResult2 = never>(
    onfulfilled?:
      | ((value: MockRow[]) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: Error) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.rows).then(onfulfilled, onrejected);
  }
}

const txMock = {
  select: vi.fn(() => new MockSelectQuery(state.selectRows.shift() ?? [])),
  update: vi.fn(),
  insert: vi.fn(),
};
const dbMock = {
  transaction: vi.fn(
    async <Result>(
      handler: (tx: typeof txMock) => Promise<Result>
    ): Promise<Result> => handler(txMock)
  ),
};

vi.mock('@/drizzle/db', () => ({ db: dbMock }));

beforeEach(() => {
  lockProjectMock.mockReset();
  lockMembersMock.mockReset();
  lockProjectMock.mockResolvedValue({
    id: 'project_bv',
    key: 'BV',
    isArchived: false,
  });
  lockMembersMock.mockResolvedValue([
    { authUserId: 'user_owner', role: 'owner' },
  ]);
  state.selectRows = [[{ id: 'token_1', projectId: 'project_bv' }]];
  state.tokenLockModes = [];
  txMock.select.mockClear();
  txMock.update.mockReset();
  txMock.insert.mockReset();
  dbMock.transaction.mockClear();
});

describe('Drizzle agent token lifecycle authorization locks', () => {
  it('stops before token mutation when the locked actor is no longer a manager', async () => {
    lockMembersMock.mockResolvedValue([
      { authUserId: 'user_owner', role: 'member' },
    ]);
    const { createDrizzleBubblophyAgentTokenLifecycleStore } =
      await import('@/lib/agent-tokens/lifecycle-database-write');

    await expect(
      createDrizzleBubblophyAgentTokenLifecycleStore().updateAgentTokenLifecycle(
        createInput()
      )
    ).resolves.toEqual({ status: 'forbidden' });
    expect(lockProjectMock).toHaveBeenCalledWith(txMock, {
      project: { id: 'project_bv' },
      lockMode: 'share',
    });
    expect(lockMembersMock).toHaveBeenCalledWith(txMock, {
      projectId: 'project_bv',
      authUserIds: ['user_owner'],
    });
    expect(txMock.select).toHaveBeenCalledTimes(1);
    expect(txMock.update).not.toHaveBeenCalled();
    expect(txMock.insert).not.toHaveBeenCalled();
  });

  it('evaluates current token state only after the token UPDATE lock', async () => {
    state.selectRows.push([
      {
        id: 'token_1',
        label: 'Runner',
        projectId: 'project_bv',
        scopes: ['issues:read'],
        state: 'revoked',
        lastUsedAt: null,
        expiresAt: null,
      },
    ]);
    const { createDrizzleBubblophyAgentTokenLifecycleStore } =
      await import('@/lib/agent-tokens/lifecycle-database-write');

    await expect(
      createDrizzleBubblophyAgentTokenLifecycleStore().updateAgentTokenLifecycle(
        createInput()
      )
    ).resolves.toEqual({
      status: 'invalid_transition',
      reason: 'revoked',
    });
    expect(state.tokenLockModes).toEqual(['update']);
    expect(txMock.update).not.toHaveBeenCalled();
    expect(txMock.insert).not.toHaveBeenCalled();
  });
});

/** Builds one normalized lifecycle store input. */
function createInput() {
  return {
    authUserId: 'user_owner',
    tokenId: 'token_1',
    decision: 'resume' as const,
  };
}
