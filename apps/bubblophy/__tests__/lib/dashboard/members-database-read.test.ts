// @vitest-environment node

import type { SQL } from 'drizzle-orm';

import { getTableName } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type DrizzleTable = Parameters<typeof getTableName>[0];
type DatabaseValue = string | number | boolean | object | null;
type DatabaseRow = Record<string, DatabaseValue>;

interface SelectCall {
  selectedKeys: string[];
  normalizedEmailSql: string | null;
  fromTable: string | null;
  joinedTables: string[];
  whereParams: string;
  orderBySql: string | null;
  limit: number | null;
}

const calls: SelectCall[] = [];
let queryRows: DatabaseRow[][] = [];

class MockSelectQuery implements PromiseLike<DatabaseRow[]> {
  private readonly call: SelectCall;
  private readonly rows: DatabaseRow[];

  constructor(
    selectedKeys: string[],
    normalizedEmailSql: string | null,
    rows: DatabaseRow[]
  ) {
    this.rows = rows;
    this.call = {
      selectedKeys,
      normalizedEmailSql,
      fromTable: null,
      joinedTables: [],
      whereParams: '[]',
      orderBySql: null,
      limit: null,
    };
    calls.push(this.call);
  }

  from(table: DrizzleTable) {
    this.call.fromTable = getTableName(table);
    return this;
  }

  innerJoin(table: DrizzleTable) {
    this.call.joinedTables.push(getTableName(table));
    return this;
  }

  leftJoin(table: DrizzleTable) {
    this.call.joinedTables.push(getTableName(table));
    return this;
  }

  where(condition: SQL) {
    const query = new PgDialect().sqlToQuery(condition);
    this.call.whereParams = JSON.stringify(query.params);
    return this;
  }

  orderBy(...conditions: SQL[]) {
    const dialect = new PgDialect();
    this.call.orderBySql = conditions
      .map((condition) => dialect.sqlToQuery(condition).sql)
      .join(' ');
    return this;
  }

  limit(value: number) {
    this.call.limit = value;
    return this;
  }

  then<TResult1 = DatabaseRow[], TResult2 = TResult1>(
    onfulfilled?:
      | ((value: DatabaseRow[]) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: Error) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.rows).then(onfulfilled, onrejected);
  }
}

const dbMock = {
  select: vi.fn((selection: Record<string, object>) => {
    const normalizedEmailSelection = selection.normalizedEmail as
      | SQL
      | undefined;

    return new MockSelectQuery(
      Object.keys(selection),
      normalizedEmailSelection
        ? new PgDialect().sqlToQuery(normalizedEmailSelection).sql
        : null,
      queryRows.shift() ?? []
    );
  }),
};

vi.mock('@/drizzle/db', () => ({ db: dbMock }));

function makeProject(overrides: Partial<DatabaseRow> = {}): DatabaseRow {
  return {
    projectId: 'project-bv',
    projectKey: 'BV',
    projectName: 'Bubblesverse',
    projectIsArchived: false,
    currentUserRole: 'maintainer',
    ...overrides,
  };
}

function makeMember(index: number): DatabaseRow {
  const authUserId = index === 1 ? 'user-1' : `user-${index}`;

  return {
    projectId: 'project-bv',
    projectKey: 'BV',
    authUserId,
    displayName: `Mitglied ${index}`,
    normalizedEmail: `member-${index}@example.com`,
    role: index === 1 ? 'maintainer' : 'member',
    createdAt: `2026-07-${String(index).padStart(2, '0')}T12:00:00.000Z`,
  };
}

describe('selectDashboardMemberPageForUser', () => {
  beforeEach(() => {
    calls.length = 0;
    queryRows = [];
    dbMock.select.mockClear();
  });

  it('returns stable oldest-first 20+1 data and manager-visible e-mail', async () => {
    queryRows = [
      [makeProject()],
      Array.from({ length: 21 }, (_, index) => makeMember(index + 1)),
      [makeProject()],
    ];
    const { selectDashboardMemberPageForUser } =
      await import('@/lib/dashboard/members-database-read');

    const result = await selectDashboardMemberPageForUser({
      authUserId: 'user-1',
      projectKey: 'BV',
      after: {
        createdAt: '2026-07-01T00:00:00.000Z',
        authUserId: 'user-after',
      },
    });

    expect(result?.items).toHaveLength(20);
    expect(result?.items[1]).toMatchObject({
      id: 'BV:user-2',
      projectKey: 'BV',
      label: 'Mitglied 2',
      email: 'member-2@example.com',
      role: 'member',
    });
    expect(result?.nextAfter).toEqual({
      createdAt: '2026-07-20T12:00:00.000Z',
      authUserId: 'user-20',
    });
    expect(calls[1]).toMatchObject({
      selectedKeys: [
        'projectId',
        'projectKey',
        'authUserId',
        'displayName',
        'normalizedEmail',
        'role',
        'createdAt',
      ],
      fromTable: 'bubblophy_project_members',
      limit: 21,
    });
    expect(calls[1]?.joinedTables).toContain('bubblophy_projects');
    expect(calls[1]?.joinedTables).toContain('bubblophy_user_profiles');
    expect(calls[1]?.whereParams).toContain('project-bv');
    expect(calls[1]?.whereParams).toContain('2026-07-01T00:00:00.000Z');
    expect(calls[1]?.whereParams).toContain('user-after');
    expect(calls[1]?.orderBySql?.match(/asc/g)).toHaveLength(2);
    expect(calls[1]?.normalizedEmailSql).toContain(
      "in ('owner', 'maintainer')"
    );
  });

  it('keeps names but redacts foreign e-mail after a concurrent demotion', async () => {
    queryRows = [
      [makeProject({ currentUserRole: 'maintainer' })],
      [makeMember(1), makeMember(2), makeMember(3)],
      [makeProject({ currentUserRole: 'viewer' })],
    ];
    const { selectDashboardMemberPageForUser } =
      await import('@/lib/dashboard/members-database-read');

    const result = await selectDashboardMemberPageForUser({
      authUserId: 'user-1',
      projectKey: 'BV',
      after: null,
    });

    expect(result?.project.currentUserRole).toBe('viewer');
    expect(result?.items).toEqual([
      expect.objectContaining({
        authUserId: 'user-1',
        label: 'Mitglied 1',
        email: 'member-1@example.com',
      }),
      expect.objectContaining({
        authUserId: 'user-2',
        label: 'Mitglied 2',
        email: null,
      }),
      expect.objectContaining({
        authUserId: 'user-3',
        label: 'Mitglied 3',
        email: null,
      }),
    ]);
  });

  it('fails closed when project access disappears before the final gate', async () => {
    queryRows = [[makeProject()], [makeMember(1)], []];
    const { selectDashboardMemberPageForUser } =
      await import('@/lib/dashboard/members-database-read');

    await expect(
      selectDashboardMemberPageForUser({
        authUserId: 'user-1',
        projectKey: 'BV',
        after: null,
      })
    ).resolves.toBeNull();
  });
});
