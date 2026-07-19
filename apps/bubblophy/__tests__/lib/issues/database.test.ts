import type { SQLWrapper } from 'drizzle-orm';

import { getTableName } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { afterEach, describe, expect, it, vi } from 'vitest';

type DrizzleTable = Parameters<typeof getTableName>[0];
type MockRowValue = string | number | boolean | string[] | null;
type MockRow = Record<string, MockRowValue>;

interface QueryCall {
  tableName: string | null;
  joinedTableNames: string[];
  selectedKeys: string[];
  selectionSql: Record<string, string>;
  orderBySql: string[];
  whereCalled: boolean;
  whereSql: string | null;
  whereParams: MockRowValue[];
  groupByCalled: boolean;
  limitValue: number | null;
}

const tableRows = {
  agentRuns: [
    {
      id: 'run_visible',
      projectKey: 'BV',
      issueNumber: 7,
      agentTokenLabel: 'Codex lokal',
      state: 'requested',
      updatedAt: '2026-06-13T16:15:00.000Z',
    },
  ],
  agentTokenCounts: [
    {
      projectId: 'project_visible',
      total: 1,
    },
  ],
  agentTokens: [
    {
      id: 'token_visible',
      label: 'Codex lokal',
      projectKey: 'BV',
      scopes: ['projects:read', 'issues:read'],
      state: 'active',
      lastUsedAt: null,
      expiresAt: null,
    },
  ],
  issueCounts: [
    {
      projectId: 'project_visible',
      open: 1,
      ready: 1,
      blocked: 0,
    },
  ],
  issueEvents: [
    {
      id: 'event_issue_note',
      summary: 'Plan-Review als Issue-Notiz festgehalten.',
      actorAuthUserId: 'user_owner',
      actorAgentTokenLabel: null,
      createdAt: '2026-06-13T16:06:00.000Z',
      projectKey: 'BV',
      issueNumber: 7,
    },
    {
      id: 'event_issue_ready',
      summary: 'Issue BV-07 auf bereit gesetzt.',
      actorAuthUserId: null,
      actorAgentTokenLabel: 'Codex lokal',
      createdAt: '2026-06-13T16:05:00.000Z',
      projectKey: 'BV',
      issueNumber: 7,
    },
  ],
  memberCounts: [
    {
      projectId: 'project_visible',
      total: 1,
    },
  ],
  memberRoles: [
    {
      projectId: 'project_visible',
      role: 'owner',
    },
  ],
  projectMembers: [
    {
      projectKey: 'BV',
      authUserId: 'user_owner',
      displayName: 'Owner Name',
      normalizedEmail: 'owner@example.test',
      role: 'owner',
      createdAt: '2026-06-13T10:00:00.000Z',
    },
    {
      projectKey: 'BV',
      authUserId: 'user_viewer',
      displayName: 'Viewer Name',
      normalizedEmail: 'viewer@example.test',
      role: 'viewer',
      createdAt: '2026-06-13T11:00:00.000Z',
    },
  ],
  memberships: [
    {
      projectId: 'project_visible',
      projectKey: 'BV',
      role: 'owner',
    },
  ],
  projectEvents: [
    {
      id: 'event_project_token_created',
      summary: 'Agent-Token "Codex lokal" für BV erstellt.',
      actorAuthUserId: 'user_owner',
      actorAgentTokenLabel: null,
      createdAt: '2026-06-13T16:00:00.000Z',
      projectKey: 'BV',
      issueNumber: null,
    },
  ],
  projects: [
    {
      id: 'project_visible',
      key: 'BV',
      name: 'Bubblesverse',
      isArchived: false,
    },
  ],
} satisfies Record<string, MockRow[]>;

const calls: QueryCall[] = [];
const pgDialect = new PgDialect();
let membershipReadResults: (MockRow[] | Error)[] = [];
let tableRowOverrides: Partial<Record<keyof typeof tableRows, MockRow[]>> = {};

class MockSelectQuery implements PromiseLike<MockRow[]> {
  private readonly call: QueryCall;

  constructor(selection: Record<string, SQLWrapper>) {
    this.call = {
      tableName: null,
      joinedTableNames: [],
      selectedKeys: Object.keys(selection),
      selectionSql: Object.fromEntries(
        Object.entries(selection).map(([key, expression]) => [
          key,
          compileSql(expression).sql,
        ])
      ),
      orderBySql: [],
      whereCalled: false,
      whereSql: null,
      whereParams: [],
      groupByCalled: false,
      limitValue: null,
    };
    calls.push(this.call);
  }

  from(table: DrizzleTable) {
    this.call.tableName = getTableName(table);
    return this;
  }

  innerJoin(table: DrizzleTable) {
    this.call.joinedTableNames.push(getTableName(table));
    return this;
  }

  leftJoin(table: DrizzleTable) {
    this.call.joinedTableNames.push(getTableName(table));
    return this;
  }

  where(condition: SQLWrapper) {
    const query = compileSql(condition);

    this.call.whereCalled = true;
    this.call.whereSql = query.sql;
    this.call.whereParams = query.params;
    return this;
  }

  orderBy(...expressions: SQLWrapper[]) {
    this.call.orderBySql = expressions.map(
      (expression) => pgDialect.sqlToQuery(expression.getSQL()).sql
    );
    return this;
  }

  groupBy() {
    this.call.groupByCalled = true;
    return this;
  }

  limit(value: number) {
    this.call.limitValue = value;
    return this;
  }

  then<TResult1 = MockRow[], TResult2 = never>(
    onfulfilled?:
      | ((value: MockRow[]) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: Error) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(rowsForCall(this.call)).then(
      onfulfilled,
      onrejected
    );
  }
}

const dbMock = {
  select: vi.fn((selection: Record<string, SQLWrapper>) => {
    return new MockSelectQuery(selection);
  }),
};

vi.mock('@/drizzle/db', () => ({
  db: dbMock,
}));

/** Compiles one Drizzle expression for query-contract assertions. */
function compileSql(expression: SQLWrapper) {
  const query = pgDialect.sqlToQuery(expression.getSQL());

  return {
    sql: query.sql,
    params: query.params as MockRowValue[],
  };
}

/**
 * Returns deterministic rows for the Drizzle table and aggregate shape.
 *
 * @param call Recorded query call.
 * @returns Mocked rows matching the selector's requested table.
 */
function rowsForCall(call: QueryCall): MockRow[] {
  if (call.tableName === 'bubblophy_project_members') {
    if (call.groupByCalled) {
      return rowsForTable('memberCounts');
    }

    if (call.selectedKeys.includes('role') && call.selectedKeys.length === 2) {
      return rowsForTable('memberRoles');
    }

    if (call.selectedKeys.includes('authUserId')) {
      return rowsForTable('projectMembers');
    }

    const result = membershipReadResults.shift() ?? tableRows.memberships;

    if (result instanceof Error) {
      throw result;
    }

    return result;
  }

  if (call.tableName === 'bubblophy_projects') {
    return rowsForTable('projects');
  }

  if (call.tableName === 'bubblophy_agent_tokens') {
    return call.groupByCalled
      ? rowsForTable('agentTokenCounts')
      : rowsForTable('agentTokens');
  }

  if (call.tableName === 'bubblophy_issues') {
    return rowsForTable('issueCounts');
  }

  if (call.tableName === 'bubblophy_agent_runs') {
    return rowsForTable('agentRuns');
  }

  if (call.tableName === 'bubblophy_project_events') {
    return rowsForTable('projectEvents');
  }

  if (call.tableName === 'bubblophy_issue_events') {
    return rowsForTable('issueEvents');
  }

  return [];
}

/** Returns a per-test table override or the shared default fixture rows. */
function rowsForTable(table: keyof typeof tableRows): MockRow[] {
  return tableRowOverrides[table] ?? tableRows[table];
}

describe('selectBubblophyDashboardRowsForUser', () => {
  afterEach(() => {
    calls.length = 0;
    membershipReadResults = [];
    tableRowOverrides = {};
    dbMock.select.mockClear();
  });

  it('loads project and issue activity through membership-scoped queries', async () => {
    const { selectBubblophyDashboardRowsForUser } =
      await import('@/lib/issues/database');

    const rows = await selectBubblophyDashboardRowsForUser('user_owner');

    expect(rows.activityRows).toEqual([
      {
        id: 'event_issue_note',
        summary: 'Plan-Review als Issue-Notiz festgehalten.',
        actorAuthUserId: 'user_owner',
        actorAgentTokenLabel: null,
        createdAt: '2026-06-13T16:06:00.000Z',
        projectKey: 'BV',
        issueNumber: 7,
      },
      {
        id: 'event_issue_ready',
        summary: 'Issue BV-07 auf bereit gesetzt.',
        actorAuthUserId: null,
        actorAgentTokenLabel: 'Codex lokal',
        createdAt: '2026-06-13T16:05:00.000Z',
        projectKey: 'BV',
        issueNumber: 7,
      },
      {
        id: 'event_project_token_created',
        summary: 'Agent-Token "Codex lokal" für BV erstellt.',
        actorAuthUserId: 'user_owner',
        actorAgentTokenLabel: null,
        createdAt: '2026-06-13T16:00:00.000Z',
        projectKey: 'BV',
        issueNumber: null,
      },
    ]);
    expect(rows.projectRows).toEqual([
      expect.objectContaining({
        currentUserRole: 'owner',
        openIssueCount: 1,
        readyIssueCount: 1,
        blockedIssueCount: 0,
      }),
    ]);
    expect(rows.projectMemberRows).toEqual([
      {
        projectKey: 'BV',
        authUserId: 'user_owner',
        displayName: 'Owner Name',
        normalizedEmail: 'owner@example.test',
        role: 'owner',
        createdAt: '2026-06-13T10:00:00.000Z',
      },
      {
        projectKey: 'BV',
        authUserId: 'user_viewer',
        displayName: 'Viewer Name',
        normalizedEmail: 'viewer@example.test',
        role: 'viewer',
        createdAt: '2026-06-13T11:00:00.000Z',
      },
    ]);

    const projectEventCall = calls.find(
      (call) => call.tableName === 'bubblophy_project_events'
    );
    const issueEventCall = calls.find(
      (call) =>
        call.tableName === 'bubblophy_issue_events' &&
        call.selectedKeys.includes('issueNumber')
    );
    const issuePlanCall = calls.find(
      (call) => call.tableName === 'bubblophy_issue_plans'
    );
    const issueAggregateCall = calls.find(
      (call) => call.tableName === 'bubblophy_issues' && call.groupByCalled
    );
    const projectMemberCall = calls.find(
      (call) =>
        call.tableName === 'bubblophy_project_members' &&
        call.selectedKeys.includes('displayName')
    );
    const selectedKeys = calls.flatMap((call) => call.selectedKeys);

    expect(projectEventCall).toMatchObject({
      whereCalled: true,
      limitValue: 20,
    });
    expect(issueEventCall).toMatchObject({
      joinedTableNames: expect.arrayContaining(['bubblophy_issues']),
      whereCalled: true,
      limitValue: 20,
    });
    expect(issuePlanCall).toBeUndefined();
    expect(issueAggregateCall).toMatchObject({
      selectedKeys: ['projectId', 'open', 'ready', 'blocked'],
      whereCalled: true,
      groupByCalled: true,
      limitValue: null,
    });
    expect(issueAggregateCall?.selectionSql.open).toContain(
      'count(*) filter (where "bubblophy_issues"."status" <> \'done\')::int'
    );
    expect(issueAggregateCall?.selectionSql.ready).toContain(
      'count(*) filter (where "bubblophy_issues"."status" = \'ready\')::int'
    );
    expect(issueAggregateCall?.selectionSql.blocked).toContain(
      'count(*) filter (where "bubblophy_issues"."status" = \'blocked\')::int'
    );
    expect(
      calls.find(
        (call) => call.tableName === 'bubblophy_issues' && !call.groupByCalled
      )
    ).toBeUndefined();
    expect(
      calls.find((call) => call.tableName === 'ranked_issue_notes')
    ).toBeUndefined();
    expect(projectMemberCall).toMatchObject({
      joinedTableNames: expect.arrayContaining([
        'bubblophy_projects',
        'bubblophy_actor_memberships',
        'bubblophy_user_profiles',
      ]),
      whereCalled: true,
    });
    expect(selectedKeys).not.toContain('tokenHash');
    expect(selectedKeys).not.toContain('plaintextToken');
    expect(selectedKeys).not.toContain('requestedByAuthUserId');
  });

  it('keeps empty and archived projects without reading issue details', async () => {
    const memberships = [
      { projectId: 'project_empty', projectKey: 'LP', role: 'member' },
      { projectId: 'project_archived', projectKey: 'AR', role: 'viewer' },
    ];
    membershipReadResults = [memberships, memberships];
    tableRowOverrides = {
      projects: [
        {
          id: 'project_empty',
          key: 'LP',
          name: 'Leeres Projekt',
          description: 'Noch ohne Issues.',
          isArchived: false,
        },
        {
          id: 'project_archived',
          key: 'AR',
          name: 'Archiv',
          description: 'Nicht mehr operativ.',
          isArchived: true,
        },
      ],
      memberRoles: [
        { projectId: 'project_empty', role: 'member' },
        { projectId: 'project_archived', role: 'viewer' },
      ],
      memberCounts: [],
      agentTokenCounts: [],
      issueCounts: [],
      projectMembers: [],
      agentTokens: [],
      agentRuns: [],
      projectEvents: [],
      issueEvents: [],
    };
    const { selectBubblophyDashboardRowsForUser } =
      await import('@/lib/issues/database');

    const rows = await selectBubblophyDashboardRowsForUser('user_owner');

    expect(rows.projectRows).toEqual([
      expect.objectContaining({
        id: 'project_empty',
        key: 'LP',
        currentUserRole: 'member',
        openIssueCount: 0,
      }),
      expect.objectContaining({
        id: 'project_archived',
        key: 'AR',
        currentUserRole: 'viewer',
        openIssueCount: 0,
      }),
    ]);
    expect(
      calls.find(
        (call) => call.tableName === 'bubblophy_issues' && !call.groupByCalled
      )
    ).toBeUndefined();
  });

  it('drops every row group when membership disappears before the final gate', async () => {
    membershipReadResults = [tableRows.memberships, []];
    const { selectBubblophyDashboardRowsForUser } =
      await import('@/lib/issues/database');

    await expect(
      selectBubblophyDashboardRowsForUser('user_owner')
    ).resolves.toEqual({
      projectRows: [],
      projectMemberRows: [],
      agentTokenRows: [],
      agentRunRows: [],
      activityRows: [],
    });
  });

  it('refreshes roles and redacts foreign e-mails after manager demotion', async () => {
    membershipReadResults = [
      tableRows.memberships,
      [{ projectId: 'project_visible', projectKey: 'BV', role: 'member' }],
    ];
    const { selectBubblophyDashboardRowsForUser } =
      await import('@/lib/issues/database');
    const restricted = await selectBubblophyDashboardRowsForUser('user_owner');

    expect(restricted.projectRows[0]?.currentUserRole).toBe('member');
    expect(restricted.projectMemberRows).toEqual([
      expect.objectContaining({
        authUserId: 'user_owner',
        normalizedEmail: 'owner@example.test',
      }),
      expect.objectContaining({
        authUserId: 'user_viewer',
        normalizedEmail: null,
      }),
    ]);
  });

  it('fails closed when the final membership lookup fails', async () => {
    membershipReadResults = [
      tableRows.memberships,
      new Error('membership lookup failed'),
    ];
    const { selectBubblophyDashboardRowsForUser } =
      await import('@/lib/issues/database');

    await expect(
      selectBubblophyDashboardRowsForUser('user_owner')
    ).rejects.toThrow('membership lookup failed');
  });

  it('drops key-only rows when a remaining project reuses a revoked project key', async () => {
    const candidateMemberships = [
      { projectId: 'project_a', projectKey: 'OLD', role: 'owner' },
      { projectId: 'project_b', projectKey: 'NEW', role: 'owner' },
    ];
    membershipReadResults = [
      candidateMemberships,
      [{ projectId: 'project_b', projectKey: 'OLD', role: 'owner' }],
    ];
    tableRowOverrides = createProjectKeyReuseRows();
    const { selectBubblophyDashboardRowsForUser } =
      await import('@/lib/issues/database');

    const rows = await selectBubblophyDashboardRowsForUser('user_owner');

    expect(rows.projectRows).toEqual([
      expect.objectContaining({
        id: 'project_b',
        key: 'OLD',
      }),
    ]);
    expect(rows.projectMemberRows).toEqual([]);
    expect(rows.agentTokenRows).toEqual([]);
    expect(rows.agentRunRows).toEqual([]);
    expect(rows.activityRows).toEqual([]);
  });
});

/** Builds two candidate projects for the concurrent key-reuse regression. */
function createProjectKeyReuseRows(): Partial<
  Record<keyof typeof tableRows, MockRow[]>
> {
  return {
    projects: [
      {
        id: 'project_a',
        key: 'OLD',
        name: 'Project A',
        description: 'Revoked project',
        isArchived: false,
      },
      {
        id: 'project_b',
        key: 'NEW',
        name: 'Project B',
        description: 'Remaining project',
        isArchived: false,
      },
    ],
    memberRoles: [
      { projectId: 'project_a', role: 'owner' },
      { projectId: 'project_b', role: 'owner' },
    ],
    memberCounts: [
      { projectId: 'project_a', total: 1 },
      { projectId: 'project_b', total: 1 },
    ],
    agentTokenCounts: [
      { projectId: 'project_a', total: 1 },
      { projectId: 'project_b', total: 0 },
    ],
    issueCounts: [],
    projectMembers: [
      {
        projectKey: 'OLD',
        authUserId: 'user_a',
        displayName: 'Project A member',
        normalizedEmail: 'a@example.test',
        role: 'member',
        createdAt: '2026-06-13T10:00:00.000Z',
      },
    ],
    agentTokens: [
      {
        id: 'token_a',
        label: 'Project A token',
        projectKey: 'OLD',
        scopes: ['projects:read'],
        state: 'active',
        lastUsedAt: null,
        expiresAt: null,
      },
    ],
    agentRuns: [
      {
        id: 'run_a',
        projectKey: 'OLD',
        issueNumber: 1,
        agentTokenLabel: 'Project A token',
        state: 'requested',
        updatedAt: '2026-06-13T16:15:00.000Z',
      },
    ],
    projectEvents: [
      {
        id: 'event_a',
        summary: 'Project A event',
        actorAuthUserId: 'user_a',
        actorAgentTokenLabel: null,
        createdAt: '2026-06-13T16:00:00.000Z',
        projectKey: 'OLD',
        issueNumber: null,
      },
    ],
    issueEvents: [],
  };
}
