// @vitest-environment node

import type {
  BubblophyMcpIssuePage,
  BubblophyMcpIssueReadInput,
} from '@/lib/mcp/issues';
import type { SQL } from 'drizzle-orm';

import { getTableName } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type DrizzleTable = Parameters<typeof getTableName>[0];

interface SelectCall {
  selectedKeys: string[];
  fromTable: string | null;
  joinedTables: string[];
  joinSql: string[];
  whereParams: string;
  whereSql: string | null;
  orderByCalls: number;
  limit: number | null;
}

interface IssueRow {
  projectId: string;
  projectKey: string;
  projectIsArchived: boolean;
  issueNumber: number | null;
  issueTitle: string | null;
  issueStatus: 'ready' | null;
  issuePriority: 'high' | null;
  issueRequiresHumanApproval: boolean | null;
  issueUpdatedAt: string | null;
}

const selectCalls: SelectCall[] = [];
let rows: IssueRow[] = [];

class MockSelectQuery implements PromiseLike<IssueRow[]> {
  private readonly call: SelectCall;

  constructor(selectedKeys: string[]) {
    this.call = {
      selectedKeys,
      fromTable: null,
      joinedTables: [],
      joinSql: [],
      whereParams: '[]',
      whereSql: null,
      orderByCalls: 0,
      limit: null,
    };
    selectCalls.push(this.call);
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
    this.call.whereParams = JSON.stringify(query.params);
    this.call.whereSql = query.sql;
    return this;
  }

  orderBy() {
    this.call.orderByCalls += 1;
    return this;
  }

  limit(value: number) {
    this.call.limit = value;
    return this;
  }

  then<TResult1 = IssueRow[], TResult2 = never>(
    onfulfilled?:
      | ((value: IssueRow[]) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: Error) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(rows).then(onfulfilled, onrejected);
  }

  private captureJoin(table: DrizzleTable, condition: SQL) {
    const query = new PgDialect().sqlToQuery(condition);
    this.call.joinedTables.push(getTableName(table));
    this.call.joinSql.push(`${query.sql} ${JSON.stringify(query.params)}`);
  }
}

const dbMock = {
  select: vi.fn(
    (selection: Record<string, object>) =>
      new MockSelectQuery(Object.keys(selection))
  ),
};

vi.mock('@/drizzle/db', () => ({ db: dbMock }));

const input: BubblophyMcpIssueReadInput = {
  authUserId: 'user-1',
  projectId: 'project_bv',
  limit: 2,
  afterIssueNumber: 10,
};

describe('selectBubblophyMcpIssuesForUser', () => {
  beforeEach(() => {
    selectCalls.length = 0;
    dbMock.select.mockClear();
    rows = [];
  });

  it('starts at membership and selects only bounded public issue fields', async () => {
    rows = [
      {
        projectId: 'project_bv',
        projectKey: 'BV',
        projectIsArchived: false,
        issueNumber: null,
        issueTitle: null,
        issueStatus: null,
        issuePriority: null,
        issueRequiresHumanApproval: null,
        issueUpdatedAt: null,
      },
    ];
    const { selectBubblophyMcpIssuesForUser } =
      await import('@/lib/mcp/issues-database-read');

    await expect(selectBubblophyMcpIssuesForUser(input)).resolves.toEqual({
      project: { id: 'project_bv', key: 'BV', isArchived: false },
      issues: [],
      nextAfterIssueNumber: null,
    } satisfies BubblophyMcpIssuePage);
    expect(selectCalls).toHaveLength(1);
    expect(selectCalls[0]).toMatchObject({
      selectedKeys: [
        'projectId',
        'projectKey',
        'projectIsArchived',
        'issueNumber',
        'issueTitle',
        'issueStatus',
        'issuePriority',
        'issueRequiresHumanApproval',
        'issueUpdatedAt',
      ],
      fromTable: 'bubblophy_project_members',
      joinedTables: ['bubblophy_projects', 'bubblophy_issues'],
      whereParams: '["user-1","project_bv"]',
      orderByCalls: 1,
      limit: 3,
    });
    expect(selectCalls[0]?.whereSql).toContain('auth_user_id');
    expect(selectCalls[0]?.whereSql).toContain('project_id');
    expect(selectCalls[0]?.joinSql.join(' ')).toContain('issue_number');
    expect(selectCalls[0]?.joinSql.join(' ')).toContain('10');
    expect(JSON.stringify(selectCalls)).not.toMatch(
      /description|assigned|created_by|token|plan|run|event/i
    );
  });

  it('returns null without revealing foreign or missing projects', async () => {
    const { selectBubblophyMcpIssuesForUser } =
      await import('@/lib/mcp/issues-database-read');

    await expect(selectBubblophyMcpIssuesForUser(input)).resolves.toBeNull();
  });

  it('returns a stable issue-number page and one next cursor', async () => {
    rows = [11, 12, 13].map((issueNumber) => ({
      projectId: 'project_bv',
      projectKey: 'BV',
      projectIsArchived: true,
      issueNumber,
      issueTitle: `Issue ${issueNumber}`,
      issueStatus: 'ready',
      issuePriority: 'high',
      issueRequiresHumanApproval: true,
      issueUpdatedAt: `2026-07-${issueNumber}T12:00:00.000Z`,
    }));
    const { selectBubblophyMcpIssuesForUser } =
      await import('@/lib/mcp/issues-database-read');

    await expect(selectBubblophyMcpIssuesForUser(input)).resolves.toEqual({
      project: { id: 'project_bv', key: 'BV', isArchived: true },
      issues: [
        {
          key: 'BV-11',
          issueNumber: 11,
          title: 'Issue 11',
          status: 'ready',
          priority: 'high',
          requiresHumanApproval: true,
          updatedAt: '2026-07-11T12:00:00.000Z',
        },
        {
          key: 'BV-12',
          issueNumber: 12,
          title: 'Issue 12',
          status: 'ready',
          priority: 'high',
          requiresHumanApproval: true,
          updatedAt: '2026-07-12T12:00:00.000Z',
        },
      ],
      nextAfterIssueNumber: 12,
    });
  });
});
