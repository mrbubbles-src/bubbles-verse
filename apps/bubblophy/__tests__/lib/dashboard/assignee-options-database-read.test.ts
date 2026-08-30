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
  fromTable: string | null;
  joinedTables: string[];
  joinSql: string[];
  whereSql: string | null;
  whereParams: string;
  orderBySql: string | null;
  limit: number | null;
}

const calls: SelectCall[] = [];
let queryRows: DatabaseRow[][] = [];

class MockSelectQuery implements PromiseLike<DatabaseRow[]> {
  private readonly call: SelectCall;
  private readonly rows: DatabaseRow[];

  constructor(selectedKeys: string[], rows: DatabaseRow[]) {
    this.rows = rows;
    this.call = {
      selectedKeys,
      fromTable: null,
      joinedTables: [],
      joinSql: [],
      whereSql: null,
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

  innerJoin(table: DrizzleTable, condition: SQL) {
    this.captureJoin(table, condition);
    return this;
  }

  leftJoin(table: DrizzleTable, condition: SQL) {
    this.captureJoin(table, condition);
    return this;
  }

  where(condition: SQL) {
    const query = new PgDialect().sqlToQuery(condition);
    this.call.whereSql = query.sql;
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

  private captureJoin(table: DrizzleTable, condition: SQL) {
    const query = new PgDialect().sqlToQuery(condition);
    this.call.joinedTables.push(getTableName(table));
    this.call.joinSql.push(`${query.sql} ${JSON.stringify(query.params)}`);
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
  select: vi.fn(
    (selection: Record<string, object>) =>
      new MockSelectQuery(Object.keys(selection), queryRows.shift() ?? [])
  ),
};

vi.mock('@/drizzle/db', () => ({ db: dbMock }));

const input = {
  authUserId: 'user-actor',
  projectKey: 'BV',
  issueNumber: 12,
  issueKey: 'BV-12',
  query: 'user',
  after: null,
};

function makeContext(overrides: Partial<DatabaseRow> = {}): DatabaseRow {
  return {
    projectId: 'project-bv',
    projectKey: 'BV',
    projectName: 'Bubblesverse',
    projectIsArchived: false,
    currentUserRole: 'member',
    issueId: 'issue-12',
    issueNumber: 12,
    assignedAuthUserId: 'user-current',
    ...overrides,
  };
}

function makeFinalContext(overrides: Partial<DatabaseRow> = {}): DatabaseRow {
  return {
    ...makeContext(),
    currentAssigneeAuthUserId: 'user-current',
    currentAssigneeDisplayName: 'Aktuelle Person',
    currentAssigneeRole: 'maintainer',
    ...overrides,
  };
}

function makeFinalOption(
  index: number,
  overrides: Partial<DatabaseRow> = {}
): DatabaseRow {
  const row: DatabaseRow = {
    ...makeFinalContext(),
    candidateProjectId: 'project-bv',
    candidateAuthUserId: `user-${index}`,
    candidateDisplayName: index === 2 ? null : `Mitglied ${index}`,
    candidateRole: index % 2 === 0 ? 'viewer' : 'member',
    candidateCreatedAt: `2026-07-${String(index).padStart(2, '0')}T12:00:00.000Z`,
  };
  return Object.assign(row, overrides);
}

describe('selectDashboardAssigneeOptionsForUser', () => {
  beforeEach(() => {
    calls.length = 0;
    queryRows = [];
    dbMock.select.mockClear();
  });

  it('returns a stable 20+1 page, safe labels, and final current assignee', async () => {
    queryRows = [
      [makeContext()],
      Array.from({ length: 22 }, (_, index) => makeFinalOption(index + 1)),
    ];
    const { selectDashboardAssigneeOptionsForUser } =
      await import('@/lib/dashboard/assignee-options-database-read');

    const result = await selectDashboardAssigneeOptionsForUser(input);

    expect(result).toMatchObject({
      status: 'success',
      project: {
        key: 'BV',
        name: 'Bubblesverse',
        currentUserRole: 'member',
      },
      issueKey: 'BV-12',
      query: 'user',
      after: input.after,
      currentAssignee: {
        authUserId: 'user-current',
        label: 'Aktuelle Person',
        role: 'maintainer',
        isCurrentMember: true,
      },
    });
    expect(result.status === 'success' ? result.items : []).toHaveLength(20);
    expect(result.status === 'success' ? result.items[1] : null).toEqual({
      authUserId: 'user-2',
      label: 'user-2',
      role: 'viewer',
    });
    expect(result.status === 'success' ? result.nextAfter : null).toBeNull();
    expect(calls).toHaveLength(2);
    expect(calls[1]?.selectedKeys).toEqual([
      'projectId',
      'projectKey',
      'projectName',
      'projectIsArchived',
      'currentUserRole',
      'issueId',
      'issueNumber',
      'assignedAuthUserId',
      'currentAssigneeAuthUserId',
      'currentAssigneeDisplayName',
      'currentAssigneeRole',
      'candidateProjectId',
      'candidateAuthUserId',
      'candidateDisplayName',
      'candidateRole',
      'candidateCreatedAt',
    ]);
    expect(calls[1]?.joinedTables).toEqual([
      'bubblophy_projects',
      'bubblophy_issues',
      'bubblophy_assignee_option_current_membership',
      'bubblophy_assignee_option_current_profile',
      'bubblophy_assignee_option_candidates',
      'bubblophy_assignee_option_candidate_profiles',
    ]);
    expect(calls[1]?.joinSql.join(' ')).toContain('user%');
    expect(calls[1]?.whereParams).toContain('project-bv');
    expect(calls[1]?.whereParams).toContain('issue-12');
    expect(calls[1]?.limit).toBe(22);
    expect(calls[1]?.selectedKeys).not.toContain('normalizedEmail');
  });

  it('reads a full final window before current-assignee deduplication', async () => {
    queryRows = [
      [makeContext({ assignedAuthUserId: 'user-old' })],
      Array.from({ length: 22 }, (_, index) =>
        makeFinalOption(index + 1, {
          assignedAuthUserId: 'user-2',
          currentAssigneeAuthUserId: 'user-2',
          currentAssigneeDisplayName: null,
          currentAssigneeRole: 'viewer',
        })
      ),
    ];
    const { selectDashboardAssigneeOptionsForUser } =
      await import('@/lib/dashboard/assignee-options-database-read');

    const result = await selectDashboardAssigneeOptionsForUser({
      ...input,
      query: null,
      after: null,
    });

    expect(result).toMatchObject({
      status: 'success',
      currentAssignee: {
        authUserId: 'user-2',
        label: 'user-2',
        role: 'viewer',
        isCurrentMember: true,
      },
      nextAfter: {
        createdAt: '2026-07-21T12:00:00.000Z',
        authUserId: 'user-21',
      },
    });
    expect(result.status === 'success' ? result.items : []).toHaveLength(20);
    expect(
      result.status === 'success'
        ? result.items.some((item) => item.authUserId === 'user-2')
        : true
    ).toBe(false);
    expect(calls[1]?.limit).toBe(22);
  });

  it('applies the cursor to the final candidate membership alias', async () => {
    queryRows = [[makeContext()], [makeFinalOption(2)]];
    const { selectDashboardAssigneeOptionsForUser } =
      await import('@/lib/dashboard/assignee-options-database-read');

    await expect(
      selectDashboardAssigneeOptionsForUser({
        ...input,
        query: null,
        after: {
          createdAt: '2026-07-01T12:00:00.000Z',
          authUserId: 'user-1',
        },
      })
    ).resolves.toMatchObject({
      status: 'success',
      items: [{ authUserId: 'user-2' }],
    });
    expect(calls[1]?.joinSql.join(' ')).toContain('2026-07-01T12:00:00.000Z');
    expect(calls[1]?.joinSql.join(' ')).toContain('user-1');
  });

  it('returns a dangling final assignment without exposing a profile', async () => {
    queryRows = [
      [makeContext()],
      [
        makeFinalContext({
          currentAssigneeAuthUserId: null,
          currentAssigneeDisplayName: null,
          currentAssigneeRole: null,
        }),
      ],
    ];
    const { selectDashboardAssigneeOptionsForUser } =
      await import('@/lib/dashboard/assignee-options-database-read');

    await expect(
      selectDashboardAssigneeOptionsForUser({
        ...input,
        query: null,
        after: null,
      })
    ).resolves.toMatchObject({
      status: 'success',
      currentAssignee: {
        authUserId: 'user-current',
        label: 'Ehemaliges Projektmitglied',
        role: null,
        isCurrentMember: false,
      },
    });
  });

  it('returns null only when the final issue is unassigned', async () => {
    queryRows = [
      [makeContext({ assignedAuthUserId: null })],
      [
        makeFinalContext({
          assignedAuthUserId: null,
          currentAssigneeAuthUserId: null,
          currentAssigneeDisplayName: null,
          currentAssigneeRole: null,
        }),
      ],
    ];
    const { selectDashboardAssigneeOptionsForUser } =
      await import('@/lib/dashboard/assignee-options-database-read');

    await expect(
      selectDashboardAssigneeOptionsForUser({
        ...input,
        query: null,
        after: null,
      })
    ).resolves.toMatchObject({
      status: 'success',
      currentAssignee: null,
    });
  });

  it('enforces active contributor access before and after candidates', async () => {
    const { selectDashboardAssigneeOptionsForUser } =
      await import('@/lib/dashboard/assignee-options-database-read');

    queryRows = [[makeContext({ currentUserRole: 'viewer' })]];
    await expect(selectDashboardAssigneeOptionsForUser(input)).resolves.toEqual(
      { status: 'forbidden' }
    );
    expect(calls).toHaveLength(1);

    calls.length = 0;
    queryRows = [[makeContext({ projectIsArchived: true })]];
    await expect(selectDashboardAssigneeOptionsForUser(input)).resolves.toEqual(
      { status: 'not_found' }
    );
    expect(calls).toHaveLength(1);

    calls.length = 0;
    queryRows = [
      [makeContext()],
      [makeFinalContext({ currentUserRole: 'viewer' })],
    ];
    await expect(selectDashboardAssigneeOptionsForUser(input)).resolves.toEqual(
      { status: 'forbidden' }
    );

    calls.length = 0;
    queryRows = [[makeContext()], []];
    await expect(selectDashboardAssigneeOptionsForUser(input)).resolves.toEqual(
      { status: 'not_found' }
    );
  });

  it('omits a candidate removed before the final statement', async () => {
    queryRows = [[makeContext()], [makeFinalContext()]];
    const { selectDashboardAssigneeOptionsForUser } =
      await import('@/lib/dashboard/assignee-options-database-read');

    await expect(
      selectDashboardAssigneeOptionsForUser({
        ...input,
        query: null,
        after: null,
      })
    ).resolves.toMatchObject({
      status: 'success',
      items: [],
    });
    expect(calls).toHaveLength(2);
    expect(calls[1]?.limit).toBe(22);
  });
});
