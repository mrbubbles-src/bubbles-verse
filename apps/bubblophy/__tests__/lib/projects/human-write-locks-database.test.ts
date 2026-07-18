import {
  lockBubblophyProjectForHumanWrite,
  lockBubblophyProjectMembersForHumanWrite,
  normalizeBubblophyHumanWriteAuthUserIds,
} from '@/lib/projects/human-write-locks-database';

import { getTableName } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type DrizzleTable = Parameters<typeof getTableName>[0];
type MockRow = Record<string, string | boolean | null>;

const state = {
  projectRows: [] as MockRow[],
  membershipRows: [] as MockRow[],
  lockModes: [] as string[],
  orderByCalls: 0,
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

  limit() {
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

  then<TResult1 = MockRow[], TResult2 = never>(
    onfulfilled?:
      | ((value: MockRow[]) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: Error) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.rows()).then(onfulfilled, onrejected);
  }

  /** Returns configured rows for the selected table. */
  private rows() {
    if (this.tableName === 'bubblophy_projects') {
      return state.projectRows;
    }

    if (this.tableName === 'bubblophy_project_members') {
      return state.membershipRows;
    }

    throw new Error(`Unexpected select from ${this.tableName ?? 'unset'}.`);
  }
}

const txMock = {
  select: vi.fn(() => new MockSelectQuery()),
};

beforeEach(() => {
  state.projectRows = [{ id: 'project_bv', key: 'BV', isArchived: false }];
  state.membershipRows = [
    { authUserId: 'user_a', role: 'owner' },
    { authUserId: 'user_b', role: 'maintainer' },
  ];
  state.lockModes = [];
  state.orderByCalls = 0;
  txMock.select.mockClear();
});

describe('human project write locks', () => {
  it('locks projects by key or ID with the requested strength', async () => {
    await expect(
      lockBubblophyProjectForHumanWrite(txMock as never, {
        project: { key: 'BV' },
        lockMode: 'no key update',
      })
    ).resolves.toEqual(state.projectRows[0]);
    await expect(
      lockBubblophyProjectForHumanWrite(txMock as never, {
        project: { id: 'project_bv' },
        lockMode: 'share',
      })
    ).resolves.toEqual(state.projectRows[0]);
    expect(state.lockModes).toEqual(['no key update', 'share']);
  });

  it('returns null for missing projects without inventing authorization state', async () => {
    state.projectRows = [];

    await expect(
      lockBubblophyProjectForHumanWrite(txMock as never, {
        project: { key: 'MISSING' },
        lockMode: 'share',
      })
    ).resolves.toBeNull();
  });

  it('locks existing memberships with one sorted UPDATE query', async () => {
    await expect(
      lockBubblophyProjectMembersForHumanWrite(txMock as never, {
        projectId: 'project_bv',
        authUserIds: [' user_b ', 'user_a', 'user_b'],
      })
    ).resolves.toEqual(state.membershipRows);
    expect(state.lockModes).toEqual(['update']);
    expect(state.orderByCalls).toBe(1);
  });

  it('skips the database for an empty membership lock set', async () => {
    await expect(
      lockBubblophyProjectMembersForHumanWrite(txMock as never, {
        projectId: 'project_bv',
        authUserIds: [' ', ''],
      })
    ).resolves.toEqual([]);
    expect(txMock.select).not.toHaveBeenCalled();
  });

  it('normalizes actor and target IDs into one deterministic lock order', () => {
    expect(
      normalizeBubblophyHumanWriteAuthUserIds([
        ' user_z ',
        'user_a',
        'user_z',
        '',
      ])
    ).toEqual(['user_a', 'user_z']);
  });
});
