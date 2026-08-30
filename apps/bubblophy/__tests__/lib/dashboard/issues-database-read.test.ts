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
  filters: { query: 'BV-2', status: 'ready', priority: 'high' },
};

function makeCandidate(issueNumber: number | null): DatabaseRow {
  return {
    projectId: 'project_bv',
    projectKey: 'BV',
    issueId: issueNumber === null ? null : `issue_bv_${issueNumber}`,
    issueNumber,
    issueTitle: issueNumber === null ? null : `Issue ${issueNumber}`,
    issueStatus: issueNumber === null ? null : 'ready',
    issuePriority: issueNumber === null ? null : 'high',
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
    issueId: 'issue_bv_99',
    assignedAuthUserId: 'auth-user-2',
    assigneeMemberAuthUserId: 'auth-user-2',
    assigneeDisplayName: 'Martin',
    ...overrides,
  };
}

function makeFinalAssignment(
  issueNumber: number,
  overrides: Partial<DatabaseRow> = {}
): DatabaseRow {
  return {
    issueId: `issue_bv_${issueNumber}`,
    assignedAuthUserId: 'auth-user-2',
    assigneeMemberAuthUserId: 'auth-user-2',
    assigneeDisplayName: 'Martin',
    ...overrides,
  };
}

function makePageFinalRow(
  issueNumber: number,
  overrides: Partial<DatabaseRow> = {}
): DatabaseRow {
  const row: DatabaseRow = {
    ...makeFinalMembership({ issueId: `issue_bv_${issueNumber}` }),
    ...makeFinalAssignment(issueNumber),
  };
  return Object.assign(row, overrides);
}

function makeDetailCandidate(
  overrides: Partial<DatabaseRow> = {}
): DatabaseRow {
  return {
    projectId: 'project_bv',
    projectKey: 'BV',
    issueId: 'issue_bv_99',
    issueNumber: 99,
    issueTitle: 'Direkter Deep Link',
    issueDescription: 'Liegt außerhalb der ersten Queue-Seite.',
    issueStatus: 'ready',
    issuePriority: 'high',
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
      filters: { query: 'BV-2', status: 'ready', priority: 'high' },
      items: [],
      nextAfterIssueNumber: null,
    });
    expect(calls).toHaveLength(2);
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
      ],
      fromTable: 'bubblophy_project_members',
      joinedTables: ['bubblophy_projects', 'bubblophy_issues'],
      whereParams: '["user-1","BV"]',
      limit: 26,
    });
    expect(calls[0]?.joinSql[1]).toContain('issue_number');
    expect(calls[0]?.joinSql[1]).toContain('title');
    expect(calls[0]?.joinSql[1]).toContain('status');
    expect(calls[0]?.joinSql[1]).toContain('priority');
    expect(calls[0]?.joinSql[1]).toContain('position');
    expect(calls[0]?.joinSql[1]).toContain('lpad');
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
      whereParams: '["project_bv","user-1","BV"]',
      limit: 1,
    });
  });

  it('keeps an issue without a plan explicit in the lightweight DTO', async () => {
    queryRows = [
      [{ ...makeCandidate(29), issueLatestPlan: null }],
      [makePageFinalRow(29)],
    ];
    const { selectDashboardIssuePageForUser } =
      await import('@/lib/dashboard/issues-database-read');

    const result = await selectDashboardIssuePageForUser(input);

    expect(result?.items[0]?.latestPlan).toBeNull();
  });

  it('returns 25 raw items and derives the cursor from row 25', async () => {
    queryRows = [
      Array.from({ length: 26 }, (_, index) => makeCandidate(50 - index)),
      Array.from({ length: 26 }, (_, index) =>
        makePageFinalRow(50 - index, { projectIsArchived: false })
      ),
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
      assigneeLabel: 'Martin',
      latestPlan: { version: 2, stepCount: 3 },
    });
    expect(result?.nextAfterIssueNumber).toBe(26);
    expect(JSON.stringify(result)).not.toMatch(/project_bv|description|notes/i);
  });

  it('uses an ascending cursor for oldest-first pages', async () => {
    queryRows = [[makeCandidate(31)], [makePageFinalRow(31)]];
    const { selectDashboardIssuePageForUser } =
      await import('@/lib/dashboard/issues-database-read');

    await selectDashboardIssuePageForUser({ ...input, sort: 'oldest' });

    expect(calls[0]?.joinSql[1]).toContain('>');
    expect(calls[0]?.orderBySql).toContain('asc');
  });

  it('preserves an authorized empty project after all issue filters', async () => {
    queryRows = [[makeCandidate(null)], [makeFinalMembership()]];
    const { selectDashboardIssuePageForUser } =
      await import('@/lib/dashboard/issues-database-read');

    const result = await selectDashboardIssuePageForUser(input);

    expect(result).toMatchObject({
      project: { key: 'BV' },
      filters: { query: 'BV-2', status: 'ready', priority: 'high' },
      items: [],
    });
    expect(calls[0]?.whereParams).toBe('["user-1","BV"]');
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

  it('hydrates all assignee label states from one final bounded read', async () => {
    queryRows = [
      [
        makeCandidate(29),
        makeCandidate(28),
        makeCandidate(27),
        makeCandidate(26),
      ],
      [
        makePageFinalRow(29),
        makePageFinalRow(28, {
          assignedAuthUserId: 'auth-no-name',
          assigneeMemberAuthUserId: 'auth-no-name',
          assigneeDisplayName: null,
        }),
        makePageFinalRow(27, {
          assignedAuthUserId: 'auth-removed',
          assigneeMemberAuthUserId: null,
          assigneeDisplayName: null,
        }),
        makePageFinalRow(26, {
          assignedAuthUserId: null,
          assigneeMemberAuthUserId: null,
          assigneeDisplayName: null,
        }),
      ],
    ];
    const { selectDashboardIssuePageForUser } =
      await import('@/lib/dashboard/issues-database-read');

    const result = await selectDashboardIssuePageForUser({
      ...input,
      afterIssueNumber: null,
    });

    expect(result?.items.map((item) => item.assigneeLabel)).toEqual([
      'Martin',
      'auth-no-name',
      'Ehemaliges Projektmitglied',
      'Nicht zugewiesen',
    ]);
    expect(calls).toHaveLength(2);
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
      joinedTables: [
        'bubblophy_projects',
        'bubblophy_issues',
        'bubblophy_issue_page_assignees',
        'bubblophy_user_profiles',
      ],
    });
    expect(calls[1]?.selectedKeys).not.toContain('normalizedEmail');
  });

  it('uses the final target membership when it is removed after the candidate read', async () => {
    queryRows = [
      [makeCandidate(29)],
      [
        makePageFinalRow(29, {
          assignedAuthUserId: 'auth-removed',
          assigneeMemberAuthUserId: null,
          assigneeDisplayName: null,
        }),
      ],
    ];
    const { selectDashboardIssuePageForUser } =
      await import('@/lib/dashboard/issues-database-read');

    const result = await selectDashboardIssuePageForUser({
      ...input,
      afterIssueNumber: null,
    });

    expect(result?.items[0]).toMatchObject({
      assignedAuthUserId: 'auth-removed',
      assigneeLabel: 'Ehemaliges Projektmitglied',
    });
    expect(calls).toHaveLength(2);
    expect(calls[1]?.whereParams).toContain('project_bv');
    expect(calls[1]?.whereParams).toContain('BV');
    expect(calls[1]?.whereParams).toContain('issue_bv_29');
    expect(calls[1]?.limit).toBe(1);
  });
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
      [
        {
          id: 'event-human',
          note: 'Menschliche Notiz',
          actorAuthUserId: 'user-1',
          actorAgentTokenLabel: null,
          createdAt: '2026-07-19T12:00:00.000Z',
        },
        {
          id: 'event-agent',
          note: 'Agentische Notiz',
          actorAuthUserId: null,
          actorAgentTokenLabel: 'claude-code',
          createdAt: '2026-07-19T11:00:00.000Z',
        },
      ],
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
        assigneeLabel: 'Martin',
        createdAt: '2026-07-18T10:00:00.000Z',
        updatedAt: '2026-07-19T10:00:00.000Z',
        latestPlan: {
          version: 3,
          summary: 'Deep Link absichern',
          steps: [{ id: 'step_1', text: 'Direkt laden' }],
        },
        notes: [
          {
            id: 'event-human',
            note: 'Menschliche Notiz',
            actor: 'Mensch',
            createdAt: '2026-07-19T12:00:00.000Z',
          },
          {
            id: 'event-agent',
            note: 'Agentische Notiz',
            actor: 'Agent-Token claude-code',
            createdAt: '2026-07-19T11:00:00.000Z',
          },
        ],
        hasMoreNotes: false,
      },
    });
    expect(calls[0]).toMatchObject({
      selectedKeys: [
        'projectId',
        'projectKey',
        'issueId',
        'issueNumber',
        'issueTitle',
        'issueDescription',
        'issueStatus',
        'issuePriority',
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
    expect(calls[1]).toMatchObject({
      selectedKeys: [
        'id',
        'note',
        'actorAuthUserId',
        'actorAgentTokenLabel',
        'createdAt',
      ],
      fromTable: 'bubblophy_issue_events',
      joinedTables: ['bubblophy_agent_tokens'],
      limit: 51,
    });
    expect(calls[1]?.whereSql).toContain('event_type');
    expect(calls[1]?.whereSql).toContain('@>');
    expect(calls[1]?.whereParams).toContain('issue_bv_99');
    expect(calls[1]?.whereParams).toContain('issue_note');
    expect(calls[1]?.orderBySql).toContain('desc');
    expect(calls[2]).toMatchObject({
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
        'bubblophy_issue_detail_assignees',
        'bubblophy_user_profiles',
      ],
      whereParams: '["project_bv","user-1","issue_bv_99"]',
      limit: 1,
    });
    expect(calls[2]?.selectedKeys).not.toContain('normalizedEmail');
  });

  it('keeps archived project details readable without a latest plan', async () => {
    queryRows = [
      [makeDetailCandidate({ issueLatestPlan: null })],
      [],
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

  it('uses the final detail assignment and marks a removed project member', async () => {
    queryRows = [
      [makeDetailCandidate()],
      [],
      [
        makeFinalMembership({
          assignedAuthUserId: 'auth-removed',
          assigneeMemberAuthUserId: null,
          assigneeDisplayName: null,
        }),
      ],
    ];
    const { selectDashboardIssueDetailForUser } =
      await import('@/lib/dashboard/issues-database-read');

    const result = await selectDashboardIssueDetailForUser({
      authUserId: 'user-1',
      projectKey: 'BV',
      issueNumber: 99,
    });

    expect(result?.issue).toMatchObject({
      assignedAuthUserId: 'auth-removed',
      assigneeLabel: 'Ehemaliges Projektmitglied',
    });
  });

  it('returns the newest 50 notes and reports older history', async () => {
    queryRows = [
      [makeDetailCandidate()],
      Array.from({ length: 51 }, (_, index) => ({
        id: `event-${index + 1}`,
        note: `Notiz ${index + 1}`,
        actorAuthUserId: null,
        actorAgentTokenLabel: null,
        createdAt: `2026-07-19T${String(23 - (index % 24)).padStart(2, '0')}:00:00.000Z`,
      })),
      [makeFinalMembership()],
    ];
    const { selectDashboardIssueDetailForUser } =
      await import('@/lib/dashboard/issues-database-read');

    const result = await selectDashboardIssueDetailForUser({
      authUserId: 'user-1',
      projectKey: 'BV',
      issueNumber: 99,
    });

    expect(result?.issue.notes).toHaveLength(50);
    expect(result?.issue.notes[0]?.id).toBe('event-1');
    expect(result?.issue.notes.at(-1)?.id).toBe('event-50');
    expect(result?.issue.hasMoreNotes).toBe(true);
  });

  it('fails closed when the issue disappears or moves after its notes are read', async () => {
    queryRows = [
      [makeDetailCandidate()],
      [
        {
          id: 'event-race',
          note: 'Darf nach dem Race nicht ausgegeben werden.',
          actorAuthUserId: null,
          actorAgentTokenLabel: null,
          createdAt: '2026-07-19T12:00:00.000Z',
        },
      ],
      [],
    ];
    const { selectDashboardIssueDetailForUser } =
      await import('@/lib/dashboard/issues-database-read');

    await expect(
      selectDashboardIssueDetailForUser({
        authUserId: 'user-1',
        projectKey: 'BV',
        issueNumber: 99,
      })
    ).resolves.toBeNull();

    expect(calls[2]).toMatchObject({
      joinedTables: [
        'bubblophy_projects',
        'bubblophy_issues',
        'bubblophy_issue_detail_assignees',
        'bubblophy_user_profiles',
      ],
      whereParams: '["project_bv","user-1","issue_bv_99"]',
    });
  });

  it.each([
    [[], [], []],
    [[makeDetailCandidate()], [], []],
    [
      [makeDetailCandidate()],
      [],
      [makeFinalMembership({ projectKey: 'OTHER' })],
    ],
  ])(
    'fails closed for missing, removed, or changed membership',
    async (candidateRows, noteRows, finalRows) => {
      queryRows = [candidateRows, noteRows, finalRows];
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
