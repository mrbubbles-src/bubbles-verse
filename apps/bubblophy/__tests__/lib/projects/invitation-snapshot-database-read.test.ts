import type { SQL } from 'drizzle-orm';

import { getTableName } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type DrizzleTable = Parameters<typeof getTableName>[0];

const state = {
  selectedKeys: [] as string[],
  fromTable: '',
  joins: [] as {
    kind: 'inner' | 'left';
    tableName: string;
    sql: string;
    serializedParams: string;
  }[],
  whereSql: '',
  whereSerializedParams: '',
  orderByCalls: 0,
};

class MockSelectQuery implements PromiseLike<never[]> {
  from(table: DrizzleTable) {
    state.fromTable = getTableName(table);
    return this;
  }

  innerJoin(table: DrizzleTable, condition: SQL) {
    recordJoin('inner', table, condition);
    return this;
  }

  leftJoin(table: DrizzleTable, condition: SQL) {
    recordJoin('left', table, condition);
    return this;
  }

  where(condition: SQL) {
    const query = new PgDialect().sqlToQuery(condition);
    state.whereSql = query.sql;
    state.whereSerializedParams = JSON.stringify(query.params);
    return this;
  }

  orderBy() {
    state.orderByCalls += 1;
    return this;
  }

  then<TResult1 = never[], TResult2 = never>(
    onfulfilled?: ((value: never[]) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: Error) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve([]).then(onfulfilled, onrejected);
  }
}

const dbMock = {
  select: vi.fn((selection: Record<string, object>) => {
    state.selectedKeys = Object.keys(selection);
    return new MockSelectQuery();
  }),
};

vi.mock('@/drizzle/db', () => ({ db: dbMock }));

beforeEach(() => {
  state.selectedKeys = [];
  state.fromTable = '';
  state.joins = [];
  state.whereSql = '';
  state.whereSerializedParams = '';
  state.orderByCalls = 0;
  dbMock.select.mockClear();
});

describe('project invitation manager database reader', () => {
  it('binds manager authorization and a redacted invitation projection in one query', async () => {
    const { selectBubblophyProjectInvitationManagerRows } =
      await import('@/lib/projects/invitation-snapshot-database-read');

    await expect(
      selectBubblophyProjectInvitationManagerRows('user_owner', 'BV')
    ).resolves.toEqual([]);

    expect(dbMock.select).toHaveBeenCalledOnce();
    expect(state.fromTable).toBe('bubblophy_projects');
    expect(
      state.joins.map(({ kind, tableName }) => ({ kind, tableName }))
    ).toEqual([
      { kind: 'inner', tableName: 'bubblophy_project_members' },
      { kind: 'left', tableName: 'bubblophy_project_invitations' },
    ]);
    expect(state.joins[0]?.sql).toContain(
      '"bubblophy_project_members"."auth_user_id" = $1'
    );
    expect(state.joins[0]?.sql).toContain(
      '"bubblophy_project_members"."role" in ($2, $3)'
    );
    expect(state.joins[0]?.serializedParams).toBe(
      JSON.stringify(['user_owner', 'owner', 'maintainer'])
    );
    expect(state.whereSql).toContain('"bubblophy_projects"."key" = $1');
    expect(state.whereSerializedParams).toBe(JSON.stringify(['BV']));
    expect(state.orderByCalls).toBe(1);
  });

  it('never selects invitation secrets or actor user IDs', async () => {
    const { selectBubblophyProjectInvitationManagerRows } =
      await import('@/lib/projects/invitation-snapshot-database-read');

    await selectBubblophyProjectInvitationManagerRows('user_owner', 'BV');

    expect(state.selectedKeys).toEqual([
      'projectKey',
      'managerRole',
      'isArchived',
      'invitationId',
      'normalizedEmail',
      'invitationRole',
      'createdAt',
      'expiresAt',
      'acceptedAt',
      'revokedAt',
      'updatedAt',
    ]);
    expect(state.selectedKeys).not.toContain('tokenHash');
    expect(state.selectedKeys).not.toContain('invitedByAuthUserId');
    expect(state.selectedKeys).not.toContain('acceptedByAuthUserId');
    expect(state.selectedKeys).not.toContain('revokedByAuthUserId');
  });
});

/** Records one rendered join condition for authorization contract assertions. */
function recordJoin(
  kind: 'inner' | 'left',
  table: DrizzleTable,
  condition: SQL
) {
  const query = new PgDialect().sqlToQuery(condition);
  state.joins.push({
    kind,
    tableName: getTableName(table),
    sql: query.sql,
    serializedParams: JSON.stringify(query.params),
  });
}
