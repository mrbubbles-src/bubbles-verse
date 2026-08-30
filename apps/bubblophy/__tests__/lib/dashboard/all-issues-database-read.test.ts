// @vitest-environment node

import type { DashboardAllIssuePageReadInput } from '@/lib/dashboard/all-issues';
import type { SQL } from 'drizzle-orm';

import { getTableName } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type DrizzleTable = Parameters<typeof getTableName>[0];
type RowValue = string | number | boolean | object | null;
type Row = Record<string, RowValue>;

interface Call {
  selectedKeys: string[];
  latestPlanSql: string | null;
  fromTable: string | null;
  joinedTables: string[];
  joinSql: string[];
  whereSql: string | null;
  whereParams: string;
  orderBySql: string[];
  limit: number | null;
}

const calls: Call[] = [];
let queryRows: Row[][] = [];
const dialect = new PgDialect();

class MockQuery implements PromiseLike<Row[]> {
  private readonly call: Call;
  private readonly rows: Row[];

  constructor(
    selectedKeys: string[],
    latestPlanSql: string | null,
    rows: Row[]
  ) {
    this.rows = rows;
    this.call = {
      selectedKeys,
      latestPlanSql,
      fromTable: null,
      joinedTables: [],
      joinSql: [],
      whereSql: null,
      whereParams: '[]',
      orderBySql: [],
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

  private captureJoin(table: DrizzleTable, condition: SQL) {
    const query = dialect.sqlToQuery(condition);

    this.call.joinedTables.push(getTableName(table));
    this.call.joinSql.push(`${query.sql} ${JSON.stringify(query.params)}`);
  }

  where(condition: SQL) {
    const query = dialect.sqlToQuery(condition);
    this.call.whereSql = query.sql;
    this.call.whereParams = JSON.stringify(query.params);
    return this;
  }

  orderBy(...conditions: SQL[]) {
    this.call.orderBySql = conditions.map(
      (condition) => dialect.sqlToQuery(condition).sql
    );
    return this;
  }

  limit(value: number) {
    this.call.limit = value;
    return this;
  }

  then<TResult1 = Row[], TResult2 = never>(
    onfulfilled?: ((value: Row[]) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: Error) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.rows).then(onfulfilled, onrejected);
  }
}

const dbMock = {
  select: vi.fn((selection: Record<string, object>) => {
    const latestPlanSelection = selection.issueLatestPlan as SQL | undefined;

    return new MockQuery(
      Object.keys(selection),
      latestPlanSelection ? dialect.sqlToQuery(latestPlanSelection).sql : null,
      queryRows.shift() ?? []
    );
  }),
};

vi.mock('@/drizzle/db', () => ({ db: dbMock }));

const input: DashboardAllIssuePageReadInput = {
  authUserId: 'user-1',
  sort: 'newest',
  after: {
    updatedAt: '2026-07-19T12:00:00.000Z',
    projectKey: 'BV',
    issueNumber: 30,
  },
  filters: { query: 'oauth', status: 'ready', priority: 'high' },
};

function makeCandidate(index: number): Row {
  const projectKey = index % 2 === 0 ? 'BV' : 'NO';

  return {
    projectId: `project_${projectKey.toLowerCase()}`,
    projectKey,
    issueId: `issue-${index}`,
    issueNumber: 100 - index,
    issueTitle: `Issue ${index}`,
    issueStatus: 'ready',
    issuePriority: 'high',
    issueRequiresHumanApproval: true,
    issueLatestPlan: { version: 2, stepCount: 3 },
    issueUpdatedAt: `2026-07-18T${String(23 - (index % 24)).padStart(2, '0')}:00:00.000Z`,
  };
}

function makeCurrentAccess(index: number, overrides: Partial<Row> = {}): Row {
  const projectKey = index % 2 === 0 ? 'BV' : 'NO';

  return {
    projectId: `project_${projectKey.toLowerCase()}`,
    projectKey,
    projectName: projectKey === 'BV' ? 'Bubblesverse' : 'Novari',
    projectIsArchived: false,
    currentUserRole: projectKey === 'BV' ? 'owner' : 'viewer',
    issueId: `issue-${index}`,
    assignedAuthUserId: null,
    assigneeMemberAuthUserId: null,
    assigneeDisplayName: null,
    ...overrides,
  };
}

describe('selectDashboardAllIssuePageForUser', () => {
  beforeEach(() => {
    calls.length = 0;
    queryRows = [];
    dbMock.select.mockClear();
  });

  it('binds filters and cursor, then rechecks every represented project', async () => {
    queryRows = [
      Array.from({ length: 26 }, (_, index) => makeCandidate(index)),
      Array.from({ length: 26 }, (_, index) => makeCurrentAccess(index)),
    ];
    const { selectDashboardAllIssuePageForUser } =
      await import('@/lib/dashboard/all-issues-database-read');

    const result = await selectDashboardAllIssuePageForUser(input);

    expect(result.items).toHaveLength(25);
    expect(result.items[0]).toMatchObject({
      project: { key: 'BV', currentUserRole: 'owner' },
      key: 'BV-100',
    });
    expect(result.nextAfter).toEqual({
      updatedAt: result.items[24]?.updatedAt,
      projectKey: result.items[24]?.project.key,
      issueNumber: result.items[24]?.issueNumber,
    });
    expect(calls[0]).toMatchObject({
      selectedKeys: [
        'projectId',
        'projectKey',
        'issueId',
        'issueNumber',
        'issueTitle',
        'issueStatus',
        'issuePriority',
        'issueRequiresHumanApproval',
        'issueLatestPlan',
        'issueUpdatedAt',
      ],
      fromTable: 'bubblophy_project_members',
      joinedTables: ['bubblophy_projects', 'bubblophy_issues'],
      limit: 26,
      orderBySql: [
        '"bubblophy_issues"."updated_at" desc',
        '"bubblophy_projects"."key" desc',
        '"bubblophy_issues"."issue_number" desc',
      ],
    });
    expect(calls[0]?.joinSql[0]).toContain('project_id');
    expect(calls[0]?.joinSql[1]).toContain('project_id');
    expect(calls[0]?.whereSql).toContain('updated_at');
    expect(calls[0]?.whereSql).toContain('status');
    expect(calls[0]?.whereSql).toContain('priority');
    expect(calls[0]?.whereSql).toContain('position');
    expect(calls[0]?.whereSql).toContain('is_archived');
    expect(calls[0]?.whereParams).toContain('oauth');
    expect(calls[0]?.latestPlanSql).toContain(
      '"bubblophy_issue_plans"."issue_id" = "bubblophy_issues"."id"'
    );
    expect(calls[0]?.latestPlanSql).toContain('limit 1');
    expect(calls[1]).toMatchObject({
      selectedKeys: [
        'projectId',
        'projectKey',
        'projectName',
        'projectIsArchived',
        'currentUserRole',
        'issueId',
        'assignedAuthUserId',
        'assigneeMemberAuthUserId',
        'assigneeDisplayName',
      ],
      fromTable: 'bubblophy_project_members',
      joinedTables: [
        'bubblophy_projects',
        'bubblophy_issues',
        'bubblophy_all_issue_page_assignees',
        'bubblophy_user_profiles',
      ],
    });
    expect(calls).toHaveLength(2);
    expect(calls[1]?.selectedKeys).not.toContain('normalizedEmail');
  });

  it('hydrates assignee labels from the final bounded access read', async () => {
    queryRows = [
      [makeCandidate(0), makeCandidate(1), makeCandidate(2), makeCandidate(3)],
      [
        makeCurrentAccess(0, {
          assignedAuthUserId: 'auth-martin',
          assigneeMemberAuthUserId: 'auth-martin',
          assigneeDisplayName: 'Martin',
        }),
        makeCurrentAccess(1, {
          assignedAuthUserId: 'auth-no-name',
          assigneeMemberAuthUserId: 'auth-no-name',
        }),
        makeCurrentAccess(2, {
          assignedAuthUserId: 'auth-removed',
        }),
        makeCurrentAccess(3),
      ],
    ];
    const { selectDashboardAllIssuePageForUser } =
      await import('@/lib/dashboard/all-issues-database-read');

    const result = await selectDashboardAllIssuePageForUser({
      ...input,
      after: null,
    });

    expect(result.items.map((item) => item.assigneeLabel)).toEqual([
      'Martin',
      'auth-no-name',
      'Ehemaliges Projektmitglied',
      'Nicht zugewiesen',
    ]);
  });

  it('reverses every cursor and ordering comparison for oldest first', async () => {
    queryRows = [[makeCandidate(0)], [makeCurrentAccess(0)]];
    const { selectDashboardAllIssuePageForUser } =
      await import('@/lib/dashboard/all-issues-database-read');

    await selectDashboardAllIssuePageForUser({
      ...input,
      sort: 'oldest',
      filters: { query: null, status: null, priority: null },
    });

    expect(calls[0]?.whereSql).toContain(' > ');
    expect(calls[0]?.whereSql).not.toContain(' < ');
    expect(calls[0]?.orderBySql).toEqual([
      '"bubblophy_issues"."updated_at" asc',
      '"bubblophy_projects"."key" asc',
      '"bubblophy_issues"."issue_number" asc',
    ]);
  });

  it('drops rows after membership loss, key change, or archival', async () => {
    queryRows = [
      [makeCandidate(0), makeCandidate(1)],
      [
        makeCurrentAccess(0, { projectKey: 'CHANGED' }),
        makeCurrentAccess(1, { projectIsArchived: true }),
      ],
    ];
    const { selectDashboardAllIssuePageForUser } =
      await import('@/lib/dashboard/all-issues-database-read');

    const result = await selectDashboardAllIssuePageForUser({
      ...input,
      after: null,
    });

    expect(result.items).toEqual([]);
    expect(result.nextAfter).toBeNull();
  });

  it('continues past a fully invalidated raw chunk to later visible issues', async () => {
    queryRows = [
      Array.from({ length: 26 }, (_, index) => makeCandidate(index)),
      [],
      [makeCandidate(26)],
      [makeCurrentAccess(26)],
    ];
    const { selectDashboardAllIssuePageForUser } =
      await import('@/lib/dashboard/all-issues-database-read');

    const result = await selectDashboardAllIssuePageForUser({
      ...input,
      after: null,
    });

    expect(result.items).toEqual([
      expect.objectContaining({ key: 'BV-74', issueNumber: 74 }),
    ]);
    expect(result.nextAfter).toBeNull();
    expect(calls).toHaveLength(4);
    expect(calls[2]?.whereSql).toContain('updated_at');
  });

  it('returns an honest empty page without a follow-up query', async () => {
    queryRows = [[]];
    const { selectDashboardAllIssuePageForUser } =
      await import('@/lib/dashboard/all-issues-database-read');

    await expect(
      selectDashboardAllIssuePageForUser({ ...input, after: null })
    ).resolves.toEqual({
      sort: 'newest',
      filters: input.filters,
      items: [],
      nextAfter: null,
    });
    expect(calls).toHaveLength(1);
  });
});
