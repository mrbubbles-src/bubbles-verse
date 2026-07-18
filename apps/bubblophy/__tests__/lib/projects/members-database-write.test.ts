import { getTableName } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type DrizzleTable = Parameters<typeof getTableName>[0];
type MockRow = Record<string, string | boolean | null>;

const state = {
  targetRole: 'member',
  updateReturnsRow: true,
  deleteReturnsRow: true,
  lockModes: [] as string[],
  orderByCalls: 0,
  updateCalls: 0,
  deleteCalls: 0,
  insertCalls: 0,
};

class MockSelectQuery implements PromiseLike<MockRow[]> {
  private tableName: string | null = null;

  from(table: DrizzleTable) {
    this.tableName = getTableName(table);
    return this;
  }

  where() {
    return this;
  }

  orderBy() {
    state.orderByCalls += 1;
    return this;
  }

  for(lockMode: string) {
    state.lockModes.push(lockMode);
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

  /** Returns deterministic project or membership rows for lock tests. */
  private rows(): MockRow[] {
    if (this.tableName === 'bubblophy_projects') {
      return [{ id: 'project_bv', key: 'BV', isArchived: false }];
    }

    if (this.tableName === 'bubblophy_project_members') {
      return [
        {
          authUserId: 'user_owner',
          role: 'owner',
          createdAt: '2026-07-18T10:00:00.000Z',
        },
        {
          authUserId: 'user_target',
          role: state.targetRole,
          createdAt: '2026-07-18T10:01:00.000Z',
        },
      ];
    }

    throw new Error(`Unexpected select from ${this.tableName ?? 'unset'}.`);
  }
}

class MockUpdateQuery {
  set() {
    return this;
  }

  where() {
    state.updateCalls += 1;
    return this;
  }

  async returning() {
    return state.updateReturnsRow
      ? [
          {
            authUserId: 'user_target',
            role: 'viewer',
            createdAt: '2026-07-18T10:01:00.000Z',
          },
        ]
      : [];
  }
}

class MockDeleteQuery {
  where() {
    state.deleteCalls += 1;
    return this;
  }

  async returning() {
    return state.deleteReturnsRow ? [{ authUserId: 'user_target' }] : [];
  }
}

const txMock = {
  select: vi.fn(() => new MockSelectQuery()),
  update: vi.fn(() => new MockUpdateQuery()),
  delete: vi.fn(() => new MockDeleteQuery()),
  insert: vi.fn(() => {
    state.insertCalls += 1;
    return { values: vi.fn(async () => undefined) };
  }),
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
  state.targetRole = 'member';
  state.updateReturnsRow = true;
  state.deleteReturnsRow = true;
  state.lockModes = [];
  state.orderByCalls = 0;
  state.updateCalls = 0;
  state.deleteCalls = 0;
  state.insertCalls = 0;
  txMock.select.mockClear();
  txMock.update.mockClear();
  txMock.delete.mockClear();
  txMock.insert.mockClear();
  dbMock.transaction.mockClear();
});

describe('Drizzle project member mutation store', () => {
  it('locks the project and sorted actor/target memberships before authorization', async () => {
    const { selectProjectMemberMutationContext } =
      await import('@/lib/projects/members-database-write');

    await expect(
      selectProjectMemberMutationContext(txMock as never, createInput())
    ).resolves.toMatchObject({
      project: { id: 'project_bv', key: 'BV' },
      actorRole: 'owner',
      targetMember: { authUserId: 'user_target', role: 'member' },
    });
    expect(state.lockModes).toEqual(['share', 'update']);
    expect(state.orderByCalls).toBe(1);
  });

  it('rejects a stale expected role without a write or audit event', async () => {
    state.targetRole = 'maintainer';
    const { createDrizzleBubblophyProjectMemberMutationStore } =
      await import('@/lib/projects/members-database-write');

    await expect(
      createDrizzleBubblophyProjectMemberMutationStore().updateProjectMemberRoleWithEvent(
        createInput()
      )
    ).resolves.toEqual({ status: 'conflict' });
    expect(state.lockModes).toEqual(['share', 'update']);
    expect(state.updateCalls).toBe(0);
    expect(state.insertCalls).toBe(0);
  });

  it('returns conflict instead of stale audit when compare-and-set updates no row', async () => {
    state.updateReturnsRow = false;
    const { createDrizzleBubblophyProjectMemberMutationStore } =
      await import('@/lib/projects/members-database-write');

    await expect(
      createDrizzleBubblophyProjectMemberMutationStore().updateProjectMemberRoleWithEvent(
        createInput()
      )
    ).resolves.toEqual({ status: 'conflict' });
    expect(state.updateCalls).toBe(1);
    expect(state.insertCalls).toBe(0);
  });

  it('returns conflict instead of stale audit when compare-and-set removal finds no row', async () => {
    state.deleteReturnsRow = false;
    const { createDrizzleBubblophyProjectMemberMutationStore } =
      await import('@/lib/projects/members-database-write');

    await expect(
      createDrizzleBubblophyProjectMemberMutationStore().removeProjectMemberWithEvent(
        createInput()
      )
    ).resolves.toEqual({ status: 'conflict' });
    expect(state.deleteCalls).toBe(1);
    expect(state.insertCalls).toBe(0);
  });
});

/** Builds one role update with explicit stale-write protection. */
function createInput() {
  return {
    authUserId: 'user_owner',
    projectKey: 'BV',
    memberAuthUserId: 'user_target',
    expectedRole: 'member' as const,
    role: 'viewer' as const,
  };
}
