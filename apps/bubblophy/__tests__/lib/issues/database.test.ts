import type { SQLWrapper } from 'drizzle-orm';

import { getTableName } from 'drizzle-orm';
import { integer, jsonb, PgDialect, pgTable, text } from 'drizzle-orm/pg-core';
import { afterEach, describe, expect, it, vi } from 'vitest';

type DrizzleTable = Parameters<typeof getTableName>[0];
type MockPlanStep = {
  id: string;
  text: string;
};
type MockPayload = Record<string, string>;
type MockRowValue =
  | string
  | number
  | boolean
  | string[]
  | MockPlanStep[]
  | MockPayload
  | null;
type MockRow = Record<string, MockRowValue>;

interface QueryCall {
  tableName: string | null;
  joinedTableNames: string[];
  selectedKeys: string[];
  selectionSql: Record<string, string>;
  distinctOnCalled: boolean;
  distinctOnSql: string[];
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
  issues: [
    {
      id: 'issue_visible',
      projectId: 'project_visible',
      issueNumber: 7,
      title: 'Reload-Activity sichtbar machen',
      description: 'Issue-Event muss nach Reload im Feed bleiben.',
      status: 'ready',
      priority: 'high',
      assignedAuthUserId: 'user_owner',
      requiresHumanApproval: true,
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
  issueNoteEvents: [
    {
      id: 'event_issue_note',
      projectId: 'project_visible',
      issueId: 'issue_visible',
      summary: 'Plan-Review als Issue-Notiz festgehalten.',
      payload: {
        source: 'human',
        entity: 'issue_note',
        action: 'created',
        issueId: 'BV-07',
      },
      actorAuthUserId: 'user_owner',
      actorAgentTokenLabel: null,
      createdAt: '2026-06-13T16:06:00.000Z',
    },
    {
      id: 'event_issue_ready',
      projectId: 'project_visible',
      issueId: 'issue_visible',
      summary: 'Issue BV-07 auf bereit gesetzt.',
      payload: {
        source: 'human',
        entity: 'issue',
        action: 'status_changed',
        issueId: 'BV-07',
      },
      actorAuthUserId: 'user_owner',
      actorAgentTokenLabel: null,
      createdAt: '2026-06-13T16:05:00.000Z',
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
  plans: [
    {
      issueId: 'issue_visible',
      version: 2,
      summary: 'Reload-fähiger Plan.',
      steps: [
        { id: 'step_1', text: 'Gespeicherten Plan laden' },
        { id: 'step_2', text: 'Detailpanel prüfen' },
      ],
    },
    {
      issueId: 'issue_visible',
      version: 1,
      summary: 'Veralteter Plan.',
      steps: [{ id: 'step_old', text: 'Nicht mehr laden' }],
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

  constructor(
    selection: Record<string, SQLWrapper>,
    distinctOnSql: string[] = []
  ) {
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
      distinctOnCalled: distinctOnSql.length > 0,
      distinctOnSql,
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

  as(aliasName: string) {
    return pgTable(aliasName, {
      id: text('id'),
      projectId: text('project_id'),
      issueId: text('issue_id'),
      summary: text('summary'),
      payload: jsonb('payload').$type<MockPayload>(),
      actorAuthUserId: text('actor_auth_user_id'),
      actorAgentTokenLabel: text('actor_agent_token_label'),
      createdAt: text('created_at'),
      noteRank: integer('note_rank'),
    });
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
  selectDistinctOn: vi.fn(
    (on: SQLWrapper[], selection: Record<string, SQLWrapper>) =>
      new MockSelectQuery(
        selection,
        on.map((expression) => pgDialect.sqlToQuery(expression.getSQL()).sql)
      )
  ),
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
    return call.groupByCalled
      ? rowsForTable('issueCounts')
      : rowsForTable('issues');
  }

  if (call.tableName === 'bubblophy_issue_plans') {
    const planRows = rowsForTable('plans');

    if (!call.distinctOnCalled) {
      return planRows;
    }

    const seenIssueIds = new Set<string>();

    return planRows.filter((row) => {
      if (typeof row.issueId !== 'string') {
        return false;
      }

      if (seenIssueIds.has(row.issueId)) {
        return false;
      }

      seenIssueIds.add(row.issueId);
      return true;
    });
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

  if (call.tableName === 'ranked_issue_notes') {
    return rowsForTable('issueNoteEvents');
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
    dbMock.selectDistinctOn.mockClear();
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
    expect(rows.projectIssueRows).toEqual([
      expect.objectContaining({
        projectCurrentUserRole: 'owner',
        projectOpenIssueCount: 1,
        projectReadyIssueCount: 1,
        projectBlockedIssueCount: 0,
        issuePlanStepCount: 2,
        issuePlanVersion: 2,
        issuePlanSummary: 'Reload-fähiger Plan.',
        issuePlanSteps: [
          { id: 'step_1', text: 'Gespeicherten Plan laden' },
          { id: 'step_2', text: 'Detailpanel prüfen' },
        ],
        issueNotes: [
          {
            id: 'event_issue_note',
            note: 'Plan-Review als Issue-Notiz festgehalten.',
            actor: 'Mensch',
            createdAt: '2026-06-13T16:06:00.000Z',
          },
        ],
        issueHasMoreNotes: false,
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
    const rankedNotesCall = calls.find(
      (call) =>
        call.tableName === 'bubblophy_issue_events' &&
        call.selectedKeys.includes('noteRank')
    );
    const boundedNotesCall = calls.find(
      (call) => call.tableName === 'ranked_issue_notes'
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
    expect(issuePlanCall).toMatchObject({
      selectedKeys: expect.arrayContaining([
        'issueId',
        'version',
        'summary',
        'steps',
      ]),
      whereCalled: true,
      groupByCalled: false,
      distinctOnCalled: true,
      distinctOnSql: ['"bubblophy_issue_plans"."issue_id"'],
      orderBySql: [
        '"bubblophy_issue_plans"."issue_id" asc',
        '"bubblophy_issue_plans"."version" desc',
        '"bubblophy_issue_plans"."created_at" desc',
      ],
    });
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
    expect(rankedNotesCall).toMatchObject({
      joinedTableNames: ['bubblophy_issues', 'bubblophy_agent_tokens'],
      selectionSql: {
        noteRank:
          'row_number() over (partition by "bubblophy_issue_events"."issue_id" order by "bubblophy_issue_events"."created_at" desc, "bubblophy_issue_events"."id" desc)',
      },
      whereCalled: true,
    });
    expect(rankedNotesCall?.whereSql).toContain('event_type');
    expect(rankedNotesCall?.whereSql).toContain('@>');
    expect(JSON.stringify(rankedNotesCall?.whereParams)).toContain(
      'issue_note'
    );
    expect(boundedNotesCall).toMatchObject({
      selectedKeys: [
        'id',
        'projectId',
        'issueId',
        'summary',
        'payload',
        'actorAuthUserId',
        'actorAgentTokenLabel',
        'createdAt',
      ],
      whereCalled: true,
      whereParams: [51],
      orderBySql: [
        '"ranked_issue_notes"."project_id" asc',
        '"ranked_issue_notes"."issue_id" asc',
        '"ranked_issue_notes"."note_rank" asc',
      ],
    });
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

  it('keeps 50 newest notes plus a history sentinel for every issue', async () => {
    const firstIssue = tableRows.issues[0];

    if (!firstIssue) {
      throw new Error('Expected the shared issue fixture.');
    }

    tableRowOverrides.issues = [
      firstIssue,
      {
        ...firstIssue,
        id: 'issue_second',
        issueNumber: 8,
        title: 'Zweites Issue',
      },
    ];
    tableRowOverrides.issueNoteEvents = [
      ...makeIssueNoteRows('issue_visible', 'BV-07'),
      ...makeIssueNoteRows('issue_second', 'BV-08'),
    ];
    const { selectBubblophyDashboardRowsForUser } =
      await import('@/lib/issues/database');

    const rows = await selectBubblophyDashboardRowsForUser('user_owner');
    const firstRow = rows.projectIssueRows.find(
      (row) => row.issueDatabaseId === 'issue_visible'
    );
    const secondRow = rows.projectIssueRows.find(
      (row) => row.issueDatabaseId === 'issue_second'
    );

    expect(firstRow?.issueNotes).toHaveLength(50);
    expect(firstRow?.issueHasMoreNotes).toBe(true);
    expect(firstRow?.issueNotes[0]?.id).toBe('issue_visible-note-1');
    expect(firstRow?.issueNotes.at(-1)?.id).toBe('issue_visible-note-50');
    expect(secondRow?.issueNotes).toHaveLength(50);
    expect(secondRow?.issueHasMoreNotes).toBe(true);
    expect(secondRow?.issueNotes[0]?.id).toBe('issue_second-note-1');
    expect(secondRow?.issueNotes.at(-1)?.id).toBe('issue_second-note-50');
  });

  it('does not attach moved-issue notes to the old project after access loss', async () => {
    const firstIssue = tableRows.issues[0];

    if (!firstIssue) {
      throw new Error('Expected the shared issue fixture.');
    }

    membershipReadResults = [
      [
        { projectId: 'project_a', projectKey: 'PA', role: 'owner' },
        { projectId: 'project_b', projectKey: 'PB', role: 'owner' },
      ],
      [{ projectId: 'project_a', projectKey: 'PA', role: 'owner' }],
    ];
    tableRowOverrides = {
      projects: [
        {
          id: 'project_a',
          key: 'PA',
          name: 'Project A',
          description: 'Altes Candidate-Projekt',
          isArchived: false,
        },
        {
          id: 'project_b',
          key: 'PB',
          name: 'Project B',
          description: 'Temporäres Zielprojekt',
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
      agentTokenCounts: [],
      issues: [
        {
          ...firstIssue,
          id: 'issue_moved',
          projectId: 'project_a',
          issueNumber: 1,
        },
      ],
      issueNoteEvents: [
        {
          id: 'note_in_project_b',
          projectId: 'project_b',
          issueId: 'issue_moved',
          summary: 'Darf nicht an Project A hängen.',
          payload: {
            source: 'human',
            entity: 'issue_note',
            action: 'created',
            issueId: 'PB-01',
          },
          actorAuthUserId: 'user_owner',
          actorAgentTokenLabel: null,
          createdAt: '2026-07-19T12:00:00.000Z',
        },
      ],
      projectMembers: [],
      agentTokens: [],
      agentRuns: [],
      projectEvents: [],
      issueEvents: [],
      plans: [],
    };
    const { selectBubblophyDashboardRowsForUser } =
      await import('@/lib/issues/database');

    const rows = await selectBubblophyDashboardRowsForUser('user_owner');

    expect(rows.projectIssueRows).toEqual([
      expect.objectContaining({
        projectId: 'project_a',
        issueDatabaseId: 'issue_moved',
        issueNotes: [],
        issueHasMoreNotes: false,
      }),
    ]);
  });

  it('drops every row group when membership disappears before the final gate', async () => {
    membershipReadResults = [tableRows.memberships, []];
    const { selectBubblophyDashboardRowsForUser } =
      await import('@/lib/issues/database');

    await expect(
      selectBubblophyDashboardRowsForUser('user_owner')
    ).resolves.toEqual({
      projectIssueRows: [],
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

    expect(restricted.projectIssueRows[0]?.projectCurrentUserRole).toBe(
      'member'
    );
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

    expect(rows.projectIssueRows).toEqual([
      expect.objectContaining({
        projectId: 'project_b',
        projectKey: 'OLD',
      }),
    ]);
    expect(rows.projectMemberRows).toEqual([]);
    expect(rows.agentTokenRows).toEqual([]);
    expect(rows.agentRunRows).toEqual([]);
    expect(rows.activityRows).toEqual([]);
  });
});

describe('selectBubblophyProjectIssueRowsForUser', () => {
  afterEach(() => {
    calls.length = 0;
    membershipReadResults = [];
    tableRowOverrides = {};
    dbMock.select.mockClear();
    dbMock.selectDistinctOn.mockClear();
  });

  it('drops project rows when membership disappears before its final gate', async () => {
    membershipReadResults = [tableRows.memberships, []];
    const { selectBubblophyProjectIssueRowsForUser } =
      await import('@/lib/issues/database');

    await expect(
      selectBubblophyProjectIssueRowsForUser('user_owner')
    ).resolves.toEqual([]);
  });
});

/** Builds 51 ordered note rows for one issue's bounded-history contract. */
function makeIssueNoteRows(issueId: string, issueKey: string): MockRow[] {
  return Array.from({ length: 51 }, (_, index) => ({
    id: `${issueId}-note-${index + 1}`,
    projectId: 'project_visible',
    issueId,
    summary: `Notiz ${index + 1} für ${issueKey}`,
    payload: {
      source: 'human',
      entity: 'issue_note',
      action: 'created',
      issueId: issueKey,
    },
    actorAuthUserId: 'user_owner',
    actorAgentTokenLabel: null,
    createdAt: `2026-07-${String(19 - Math.floor(index / 24)).padStart(2, '0')}T${String(23 - (index % 24)).padStart(2, '0')}:00:00.000Z`,
  }));
}

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
    issues: [],
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
    issueNoteEvents: [],
    plans: [],
  };
}
