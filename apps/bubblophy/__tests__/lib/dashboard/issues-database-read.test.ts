// @vitest-environment node

import type { DashboardIssuePageReadInput } from '@/lib/dashboard/issues';
import type { SQL } from 'drizzle-orm';

import { getTableName } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type DrizzleTable = Parameters<typeof getTableName>[0];
type DatabaseValue = string | number | boolean | object | null;
type DatabaseRow = Record<string, DatabaseValue>;

interface SelectCall {
  selectedKeys: string[];
  latestPlanSql: string | null;
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

  constructor(
    selectedKeys: string[],
    latestPlanSql: string | null,
    rows: DatabaseRow[]
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

  orderBy(condition: SQL) {
    this.call.orderBySql = new PgDialect().sqlToQuery(condition).sql;
    return this;
  }

  limit(value: number) {
    this.call.limit = value;
    return this;
  }

  then<TResult1 = DatabaseRow[], TResult2 = never>(
    onfulfilled?:
      | ((value: DatabaseRow[]) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: Error) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.rows).then(onfulfilled, onrejected);
  }

  private captureJoin(table: DrizzleTable, condition: SQL) {
    const query = new PgDialect().sqlToQuery(condition);
    this.call.joinedTables.push(getTableName(table));
    this.call.joinSql.push(`${query.sql} ${JSON.stringify(query.params)}`);
  }
}

const dbMock = {
  select: vi.fn((selection: Record<string, object>) => {
    const latestPlanSelection = selection.issueLatestPlan as SQL | undefined;

    return new MockSelectQuery(
      Object.keys(selection),
      latestPlanSelection
        ? new PgDialect().sqlToQuery(latestPlanSelection).sql
        : null,
      queryRows.shift() ?? []
    );
  }),
};

vi.mock('@/drizzle/db', () => ({ db: dbMock }));

const input: DashboardIssuePageReadInput = {
  authUserId: 'user-1',
  projectKey: 'BV',
  sort: 'newest',
  afterIssueNumber: 30,
};

function makeCandidate(issueNumber: number | null): DatabaseRow {
  return {
    projectId: 'project_bv',
    projectKey: 'BV',
    issueNumber,
    issueTitle: issueNumber === null ? null : `Issue ${issueNumber}`,
    issueStatus: issueNumber === null ? null : 'ready',
    issuePriority: issueNumber === null ? null : 'high',
    issueAssignedAuthUserId: issueNumber === null ? null : 'auth-user-2',
    issueRequiresHumanApproval: issueNumber === null ? null : true,
    issueLatestPlan: issueNumber === null ? null : { version: 2, stepCount: 3 },
  };
}

function makeFinalMembership(
  overrides: Partial<DatabaseRow> = {}
): DatabaseRow {
  return {
    projectId: 'project_bv',
    projectKey: 'BV',
    projectName: 'Bubblesverse',
    projectIsArchived: true,
    currentUserRole: 'viewer',
    ...overrides,
  };
}

function makeDetailCandidate(
  overrides: Partial<DatabaseRow> = {}
): DatabaseRow {
  return {
    projectId: 'project_bv',
    projectKey: 'BV',
    issueNumber: 99,
    issueTitle: 'Direkter Deep Link',
    issueDescription: 'Liegt außerhalb der ersten Queue-Seite.',
    issueStatus: 'ready',
    issuePriority: 'high',
    issueAssignedAuthUserId: 'auth-user-2',
    issueRequiresHumanApproval: true,
    issueCreatedAt: '2026-07-18T10:00:00.000Z',
    issueUpdatedAt: '2026-07-19T10:00:00.000Z',
    issueLatestPlan: {
      version: 3,
      summary: 'Deep Link absichern',
      steps: [
        { id: 'step_1', text: ' Direkt laden ' },
        { id: 'empty', text: ' ' },
        { invalid: true },
      ],
    },
    ...overrides,
  };
}

describe('selectDashboardIssuePageForUser', () => {
  beforeEach(() => {
    calls.length = 0;
    queryRows = [];
    dbMock.select.mockClear();
  });

  it('binds cursor data to membership and rechecks final membership', async () => {
    queryRows = [[makeCandidate(null)], [makeFinalMembership()]];
    const { selectDashboardIssuePageForUser } =
      await import('@/lib/dashboard/issues-database-read');

    await expect(selectDashboardIssuePageForUser(input)).resolves.toEqual({
      project: {
        key: 'BV',
        name: 'Bubblesverse',
        isArchived: true,
        currentUserRole: 'viewer',
      },
      sort: 'newest',
      items: [],
      nextAfterIssueNumber: null,
    });
    expect(calls).toHaveLength(2);
    expect(calls[0]).toMatchObject({
      selectedKeys: [
        'projectId',
        'projectKey',
        'issueNumber',
        'issueTitle',
        'issueStatus',
        'issuePriority',
        'issueAssignedAuthUserId',
        'issueRequiresHumanApproval',
        'issueLatestPlan',
      ],
      fromTable: 'bubblophy_project_members',
      joinedTables: ['bubblophy_projects', 'bubblophy_issues'],
      whereParams: '["user-1","BV"]',
      limit: 26,
    });
    expect(calls[0]?.joinSql[1]).toContain('issue_number');
    expect(calls[0]?.joinSql[1]).toContain('<');
    expect(calls[0]?.joinSql[1]).toContain('30');
    expect(calls[0]?.orderBySql).toContain('desc');
    expect(calls[0]?.latestPlanSql).toContain(
      '"bubblophy_issue_plans"."issue_id" = "bubblophy_issues"."id"'
    );
    expect(calls[0]?.latestPlanSql).toContain(
      '"bubblophy_issue_plans"."version" desc'
    );
    expect(calls[0]?.latestPlanSql).toContain('jsonb_typeof');
    expect(calls[0]?.latestPlanSql).toContain('jsonb_array_length');
    expect(calls[0]?.latestPlanSql).toContain('limit 1');
    expect(calls[1]).toMatchObject({
      selectedKeys: [
        'projectId',
        'projectKey',
        'projectName',
        'projectIsArchived',
        'currentUserRole',
      ],
      fromTable: 'bubblophy_project_members',
      joinedTables: ['bubblophy_projects'],
      whereParams: '["project_bv","user-1"]',
      limit: 1,
    });
  });

  it('keeps an issue without a plan explicit in the lightweight DTO', async () => {
    queryRows = [
      [{ ...makeCandidate(29), issueLatestPlan: null }],
      [makeFinalMembership()],
    ];
    const { selectDashboardIssuePageForUser } =
      await import('@/lib/dashboard/issues-database-read');

    const result = await selectDashboardIssuePageForUser(input);

    expect(result?.items[0]?.latestPlan).toBeNull();
  });

  it('returns 25 raw items and derives the cursor from row 25', async () => {
    queryRows = [
      Array.from({ length: 26 }, (_, index) => makeCandidate(50 - index)),
      [makeFinalMembership({ projectIsArchived: false })],
    ];
    const { selectDashboardIssuePageForUser } =
      await import('@/lib/dashboard/issues-database-read');

    const result = await selectDashboardIssuePageForUser({
      ...input,
      afterIssueNumber: null,
    });

    expect(result?.items).toHaveLength(25);
    expect(result?.items[0]).toEqual({
      key: 'BV-50',
      issueNumber: 50,
      title: 'Issue 50',
      status: 'ready',
      priority: 'high',
      requiresHumanApproval: true,
      assignedAuthUserId: 'auth-user-2',
      latestPlan: { version: 2, stepCount: 3 },
    });
    expect(result?.nextAfterIssueNumber).toBe(26);
    expect(JSON.stringify(result)).not.toMatch(/project_bv|description|notes/i);
  });

  it('uses an ascending cursor for oldest-first pages', async () => {
    queryRows = [[makeCandidate(31)], [makeFinalMembership()]];
    const { selectDashboardIssuePageForUser } =
      await import('@/lib/dashboard/issues-database-read');

    await selectDashboardIssuePageForUser({ ...input, sort: 'oldest' });

    expect(calls[0]?.joinSql[1]).toContain('>');
    expect(calls[0]?.orderBySql).toContain('asc');
  });

  it.each([
    [[], []],
    [[makeCandidate(29)], []],
    [[makeCandidate(29)], [makeFinalMembership({ projectKey: 'OTHER' })]],
  ])(
    'fails closed for missing, removed, or changed membership',
    async (candidateRows, finalRows) => {
      queryRows = [candidateRows, finalRows];
      const { selectDashboardIssuePageForUser } =
        await import('@/lib/dashboard/issues-database-read');

      await expect(selectDashboardIssuePageForUser(input)).resolves.toBeNull();
    }
  );
});

describe('selectDashboardIssueDetailForUser', () => {
  beforeEach(() => {
    calls.length = 0;
    queryRows = [];
    dbMock.select.mockClear();
  });

  it('loads an off-page issue directly and normalizes its latest plan', async () => {
    queryRows = [
      [makeDetailCandidate()],
      [makeFinalMembership({ projectIsArchived: false })],
    ];
    const { selectDashboardIssueDetailForUser } =
      await import('@/lib/dashboard/issues-database-read');

    await expect(
      selectDashboardIssueDetailForUser({
        authUserId: 'user-1',
        projectKey: 'BV',
        issueNumber: 99,
      })
    ).resolves.toEqual({
      project: {
        key: 'BV',
        name: 'Bubblesverse',
        isArchived: false,
        currentUserRole: 'viewer',
      },
      issue: {
        key: 'BV-99',
        issueNumber: 99,
        title: 'Direkter Deep Link',
        description: 'Liegt außerhalb der ersten Queue-Seite.',
        status: 'ready',
        priority: 'high',
        requiresHumanApproval: true,
        assignedAuthUserId: 'auth-user-2',
        createdAt: '2026-07-18T10:00:00.000Z',
        updatedAt: '2026-07-19T10:00:00.000Z',
        latestPlan: {
          version: 3,
          summary: 'Deep Link absichern',
          steps: [{ id: 'step_1', text: 'Direkt laden' }],
        },
      },
    });
    expect(calls[0]).toMatchObject({
      selectedKeys: [
        'projectId',
        'projectKey',
        'issueNumber',
        'issueTitle',
        'issueDescription',
        'issueStatus',
        'issuePriority',
        'issueAssignedAuthUserId',
        'issueRequiresHumanApproval',
        'issueCreatedAt',
        'issueUpdatedAt',
        'issueLatestPlan',
      ],
      fromTable: 'bubblophy_project_members',
      joinedTables: ['bubblophy_projects', 'bubblophy_issues'],
      whereParams: '["user-1","BV",99]',
      limit: 1,
    });
    expect(calls[0]?.latestPlanSql).toContain(
      '"bubblophy_issue_plans"."issue_id" = "bubblophy_issues"."id"'
    );
    expect(calls[0]?.latestPlanSql).toContain(
      '"bubblophy_issue_plans"."version" desc'
    );
    expect(calls[0]?.latestPlanSql).toContain('limit 1');
    expect(JSON.stringify(calls[0]?.selectedKeys)).not.toMatch(
      /notes|run|event|token|createdBy|issueId/i
    );
    expect(calls[1]?.whereParams).toBe('["project_bv","user-1"]');
  });

  it('keeps archived project details readable without a latest plan', async () => {
    queryRows = [
      [makeDetailCandidate({ issueLatestPlan: null })],
      [makeFinalMembership()],
    ];
    const { selectDashboardIssueDetailForUser } =
      await import('@/lib/dashboard/issues-database-read');

    const result = await selectDashboardIssueDetailForUser({
      authUserId: 'user-1',
      projectKey: 'BV',
      issueNumber: 99,
    });

    expect(result?.project.isArchived).toBe(true);
    expect(result?.issue.latestPlan).toBeNull();
  });

  it.each([
    [[], []],
    [[makeDetailCandidate()], []],
    [[makeDetailCandidate()], [makeFinalMembership({ projectKey: 'OTHER' })]],
  ])(
    'fails closed for missing, removed, or changed membership',
    async (candidateRows, finalRows) => {
      queryRows = [candidateRows, finalRows];
      const { selectDashboardIssueDetailForUser } =
        await import('@/lib/dashboard/issues-database-read');

      await expect(
        selectDashboardIssueDetailForUser({
          authUserId: 'user-1',
          projectKey: 'BV',
          issueNumber: 99,
        })
      ).resolves.toBeNull();
    }
  );
});
