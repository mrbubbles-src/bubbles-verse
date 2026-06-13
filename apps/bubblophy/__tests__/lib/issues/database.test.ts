import { getTableName } from 'drizzle-orm';
import { afterEach, describe, expect, it, vi } from 'vitest';

type DrizzleTable = Parameters<typeof getTableName>[0];
type MockPlanStep = {
  id: string;
  text: string;
};
type MockRowValue =
  | string
  | number
  | boolean
  | string[]
  | MockPlanStep[]
  | null;
type MockRow = Record<string, MockRowValue>;

interface QueryCall {
  tableName: string | null;
  joinedTableNames: string[];
  selectedKeys: string[];
  whereCalled: boolean;
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
  issueEvents: [
    {
      id: 'event_issue_ready',
      summary: 'Issue BV-07 auf bereit gesetzt.',
      actorAuthUserId: null,
      actorAgentTokenLabel: 'Codex lokal',
      createdAt: '2026-06-13T16:05:00.000Z',
    },
  ],
  memberCounts: [
    {
      projectId: 'project_visible',
      total: 1,
    },
  ],
  memberships: [
    {
      projectId: 'project_visible',
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
  ],
  projectEvents: [
    {
      id: 'event_project_token_created',
      summary: 'Agent-Token "Codex lokal" für BV erstellt.',
      actorAuthUserId: 'user_owner',
      actorAgentTokenLabel: null,
      createdAt: '2026-06-13T16:00:00.000Z',
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

class MockSelectQuery implements PromiseLike<MockRow[]> {
  private readonly call: QueryCall;

  constructor(selectedKeys: string[]) {
    this.call = {
      tableName: null,
      joinedTableNames: [],
      selectedKeys,
      whereCalled: false,
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

  where() {
    this.call.whereCalled = true;
    return this;
  }

  orderBy() {
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
  select: vi.fn((selection: Record<string, object>) => {
    return new MockSelectQuery(Object.keys(selection));
  }),
};

vi.mock('@/drizzle/db', () => ({
  db: dbMock,
}));

/**
 * Returns deterministic rows for the Drizzle table and aggregate shape.
 *
 * @param call Recorded query call.
 * @returns Mocked rows matching the selector's requested table.
 */
function rowsForCall(call: QueryCall): MockRow[] {
  if (call.tableName === 'bubblophy_project_members') {
    return tableRows.memberships;
  }

  if (call.tableName === 'bubblophy_projects') {
    return tableRows.projects;
  }

  if (call.tableName === 'bubblophy_agent_tokens') {
    return call.groupByCalled
      ? tableRows.agentTokenCounts
      : tableRows.agentTokens;
  }

  if (call.tableName === 'bubblophy_issues') {
    return tableRows.issues;
  }

  if (call.tableName === 'bubblophy_issue_plans') {
    return tableRows.plans;
  }

  if (call.tableName === 'bubblophy_agent_runs') {
    return tableRows.agentRuns;
  }

  if (call.tableName === 'bubblophy_project_events') {
    return tableRows.projectEvents;
  }

  if (call.tableName === 'bubblophy_issue_events') {
    return tableRows.issueEvents;
  }

  return tableRows.memberCounts;
}

describe('selectBubblophyDashboardRowsForUser', () => {
  afterEach(() => {
    calls.length = 0;
    dbMock.select.mockClear();
  });

  it('loads project and issue activity through membership-scoped queries', async () => {
    const { selectBubblophyDashboardRowsForUser } =
      await import('@/lib/issues/database');

    const rows = await selectBubblophyDashboardRowsForUser('user_owner');

    expect(rows.activityRows).toEqual([
      {
        id: 'event_issue_ready',
        summary: 'Issue BV-07 auf bereit gesetzt.',
        actorAuthUserId: null,
        actorAgentTokenLabel: 'Codex lokal',
        createdAt: '2026-06-13T16:05:00.000Z',
      },
      {
        id: 'event_project_token_created',
        summary: 'Agent-Token "Codex lokal" für BV erstellt.',
        actorAuthUserId: 'user_owner',
        actorAgentTokenLabel: null,
        createdAt: '2026-06-13T16:00:00.000Z',
      },
    ]);
    expect(rows.projectIssueRows).toEqual([
      expect.objectContaining({
        issuePlanStepCount: 2,
        issuePlanVersion: 2,
        issuePlanSummary: 'Reload-fähiger Plan.',
        issuePlanSteps: [
          { id: 'step_1', text: 'Gespeicherten Plan laden' },
          { id: 'step_2', text: 'Detailpanel prüfen' },
        ],
      }),
    ]);

    const projectEventCall = calls.find(
      (call) => call.tableName === 'bubblophy_project_events'
    );
    const issueEventCall = calls.find(
      (call) => call.tableName === 'bubblophy_issue_events'
    );
    const issuePlanCall = calls.find(
      (call) => call.tableName === 'bubblophy_issue_plans'
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
    });
    expect(selectedKeys).not.toContain('tokenHash');
    expect(selectedKeys).not.toContain('plaintextToken');
    expect(selectedKeys).not.toContain('requestedByAuthUserId');
  });
});
