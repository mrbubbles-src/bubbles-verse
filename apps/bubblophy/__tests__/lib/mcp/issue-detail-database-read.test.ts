// @vitest-environment node

import type { BubblophyMcpIssueDetail } from '@/lib/mcp/issue-detail';
import type { SQL } from 'drizzle-orm';

import { getTableName } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type DrizzleTable = Parameters<typeof getTableName>[0];

const detail: BubblophyMcpIssueDetail = {
  project: { id: 'project_bv', key: 'BV', isArchived: true },
  issue: {
    key: 'BV-12',
    issueNumber: 12,
    title: 'MCP-Zugriff ergänzen',
    description: 'Historischer Detailinhalt',
    status: 'ready',
    priority: 'high',
    requiresHumanApproval: true,
    createdAt: '2026-07-17T12:00:00.000Z',
    updatedAt: '2026-07-18T12:00:00.000Z',
  },
};

const calls: {
  selectedKeys: string[];
  fromTable: string | null;
  joinedTables: string[];
  joinSql: string[];
  whereSql: string | null;
  whereParams: string;
  limit: number | null;
}[] = [];
let rows: BubblophyMcpIssueDetail[] = [];

class MockSelectQuery implements PromiseLike<BubblophyMcpIssueDetail[]> {
  private readonly call = {
    selectedKeys: [] as string[],
    fromTable: null as string | null,
    joinedTables: [] as string[],
    joinSql: [] as string[],
    whereSql: null as string | null,
    whereParams: '[]',
    limit: null as number | null,
  };

  constructor(selectedKeys: string[]) {
    this.call.selectedKeys = selectedKeys;
    calls.push(this.call);
  }

  from(table: DrizzleTable) {
    this.call.fromTable = getTableName(table);
    return this;
  }

  innerJoin(table: DrizzleTable, condition: SQL) {
    const query = new PgDialect().sqlToQuery(condition);
    this.call.joinedTables.push(getTableName(table));
    this.call.joinSql.push(`${query.sql} ${JSON.stringify(query.params)}`);
    return this;
  }

  where(condition: SQL) {
    const query = new PgDialect().sqlToQuery(condition);
    this.call.whereSql = query.sql;
    this.call.whereParams = JSON.stringify(query.params);
    return this;
  }

  limit(value: number) {
    this.call.limit = value;
    return this;
  }

  then<TResult1 = BubblophyMcpIssueDetail[], TResult2 = never>(
    onfulfilled?:
      | ((value: BubblophyMcpIssueDetail[]) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: Error) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(rows).then(onfulfilled, onrejected);
  }
}

const dbMock = {
  select: vi.fn(
    (selection: Record<string, Record<string, object>>) =>
      new MockSelectQuery(
        Object.entries(selection).flatMap(([group, fields]) =>
          Object.keys(fields).map((field) => `${group}.${field}`)
        )
      )
  ),
};

vi.mock('@/drizzle/db', () => ({ db: dbMock }));

describe('selectBubblophyMcpIssueForUser', () => {
  beforeEach(() => {
    calls.length = 0;
    rows = [];
    dbMock.select.mockClear();
  });

  it('binds issue detail to user membership and project in one query', async () => {
    rows = [detail];
    const { selectBubblophyMcpIssueForUser } =
      await import('@/lib/mcp/issue-detail-database-read');

    await expect(
      selectBubblophyMcpIssueForUser({
        authUserId: 'user-1',
        projectId: 'project_bv',
        issueNumber: 12,
      })
    ).resolves.toEqual(detail);
    expect(calls).toEqual([
      {
        selectedKeys: [
          'project.id',
          'project.key',
          'project.isArchived',
          'issue.issueNumber',
          'issue.title',
          'issue.description',
          'issue.status',
          'issue.priority',
          'issue.requiresHumanApproval',
          'issue.createdAt',
          'issue.updatedAt',
        ],
        fromTable: 'bubblophy_project_members',
        joinedTables: ['bubblophy_projects', 'bubblophy_issues'],
        joinSql: [
          '"bubblophy_projects"."id" = "bubblophy_project_members"."project_id" []',
          '"bubblophy_issues"."project_id" = "bubblophy_projects"."id" []',
        ],
        whereSql:
          '("bubblophy_project_members"."auth_user_id" = $1 and "bubblophy_project_members"."project_id" = $2 and "bubblophy_issues"."issue_number" = $3)',
        whereParams: '["user-1","project_bv",12]',
        limit: 1,
      },
    ]);
    expect(JSON.stringify(calls)).not.toMatch(
      /assigned|created_by|parent|token|plan|run|event/i
    );
  });

  it('returns null for missing, foreign, or unauthorized issue details', async () => {
    const { selectBubblophyMcpIssueForUser } =
      await import('@/lib/mcp/issue-detail-database-read');

    await expect(
      selectBubblophyMcpIssueForUser({
        authUserId: 'user-1',
        projectId: 'project_foreign',
        issueNumber: 12,
      })
    ).resolves.toBeNull();
  });
});
