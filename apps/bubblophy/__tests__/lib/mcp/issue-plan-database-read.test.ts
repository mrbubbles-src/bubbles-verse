// @vitest-environment node

import type { JsonValue } from '@/drizzle/db/schema';
import type { SQL } from 'drizzle-orm';

import { getTableName } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type DrizzleTable = Parameters<typeof getTableName>[0];

interface PlanRow {
  project: { id: string; key: string; isArchived: boolean };
  issue: { issueNumber: number; title: string };
  plan: {
    version: number;
    summary: string;
    steps: JsonValue;
    approvedAt: string | null;
    createdAt: string;
  } | null;
}

const calls: {
  selectedKeys: string[];
  fromTable: string | null;
  joinedTables: string[];
  joinSql: string[];
  whereSql: string | null;
  whereParams: string;
  orderBySql: string[];
  limit: number | null;
}[] = [];
let rows: PlanRow[] = [];

class MockSelectQuery implements PromiseLike<PlanRow[]> {
  private readonly call = {
    selectedKeys: [] as string[],
    fromTable: null as string | null,
    joinedTables: [] as string[],
    joinSql: [] as string[],
    whereSql: null as string | null,
    whereParams: '[]',
    orderBySql: [] as string[],
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

  orderBy(...expressions: SQL[]) {
    this.call.orderBySql = expressions.map((expression) => {
      const query = new PgDialect().sqlToQuery(expression);
      return `${query.sql} ${JSON.stringify(query.params)}`;
    });
    return this;
  }

  limit(value: number) {
    this.call.limit = value;
    return this;
  }

  then<TResult1 = PlanRow[], TResult2 = never>(
    onfulfilled?:
      | ((value: PlanRow[]) => TResult1 | PromiseLike<TResult1>)
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
    (selection: Record<string, Record<string, object>>) =>
      new MockSelectQuery(
        Object.entries(selection).flatMap(([group, fields]) =>
          Object.keys(fields).map((field) => `${group}.${field}`)
        )
      )
  ),
};

vi.mock('@/drizzle/db', () => ({ db: dbMock }));

const input = {
  authUserId: 'user-1',
  projectId: 'project_bv',
  issueNumber: 12,
};

describe('selectBubblophyMcpIssuePlanForUser', () => {
  beforeEach(() => {
    calls.length = 0;
    rows = [];
    dbMock.select.mockClear();
  });

  it('binds the latest plan to membership, project, and issue in one query', async () => {
    rows = [
      {
        project: { id: 'project_bv', key: 'BV', isArchived: true },
        issue: { issueNumber: 12, title: 'MCP planen' },
        plan: {
          version: 3,
          summary: 'Sicherer Plan',
          steps: [{ id: 'step_1', text: ' Vertrag prüfen ' }],
          approvedAt: null,
          createdAt: '2026-07-18T12:00:00.000Z',
        },
      },
    ];
    const { selectBubblophyMcpIssuePlanForUser } =
      await import('@/lib/mcp/issue-plan-database-read');

    await expect(selectBubblophyMcpIssuePlanForUser(input)).resolves.toEqual({
      project: { id: 'project_bv', key: 'BV', isArchived: true },
      issue: { key: 'BV-12', issueNumber: 12, title: 'MCP planen' },
      plan: {
        version: 3,
        summary: 'Sicherer Plan',
        steps: [{ id: 'step_1', text: 'Vertrag prüfen' }],
        approvalStatus: 'draft',
        approvedAt: null,
        createdAt: '2026-07-18T12:00:00.000Z',
      },
    });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      selectedKeys: [
        'project.id',
        'project.key',
        'project.isArchived',
        'issue.issueNumber',
        'issue.title',
        'plan.version',
        'plan.summary',
        'plan.steps',
        'plan.approvedAt',
        'plan.createdAt',
      ],
      fromTable: 'bubblophy_project_members',
      joinedTables: [
        'bubblophy_projects',
        'bubblophy_issues',
        'bubblophy_issue_plans',
      ],
      whereParams: '["user-1","project_bv",12]',
      orderBySql: [
        '"bubblophy_issue_plans"."version" desc []',
        '"bubblophy_issue_plans"."created_at" desc []',
      ],
      limit: 1,
    });
    expect(calls[0]?.joinSql).toEqual([
      '"bubblophy_projects"."id" = "bubblophy_project_members"."project_id" []',
      '"bubblophy_issues"."project_id" = "bubblophy_projects"."id" []',
      '"bubblophy_issue_plans"."issue_id" = "bubblophy_issues"."id" []',
    ]);
    expect(JSON.stringify(calls)).not.toMatch(
      /createdBy|approvedBy|authUser|token|run|event|plan\.id|issue\.id/i
    );
  });

  it('returns a visible issue with plan null when no version exists', async () => {
    rows = [
      {
        project: { id: 'project_bv', key: 'BV', isArchived: false },
        issue: { issueNumber: 12, title: 'MCP planen' },
        plan: null,
      },
    ];
    const { selectBubblophyMcpIssuePlanForUser } =
      await import('@/lib/mcp/issue-plan-database-read');

    await expect(
      selectBubblophyMcpIssuePlanForUser(input)
    ).resolves.toMatchObject({ plan: null });
  });

  it('marks an approved latest plan and preserves its approval timestamp', async () => {
    rows = [
      {
        project: { id: 'project_bv', key: 'BV', isArchived: false },
        issue: { issueNumber: 12, title: 'MCP planen' },
        plan: {
          version: 4,
          summary: 'Freigegebener Plan',
          steps: [],
          approvedAt: '2026-07-18T13:00:00.000Z',
          createdAt: '2026-07-18T12:00:00.000Z',
        },
      },
    ];
    const { selectBubblophyMcpIssuePlanForUser } =
      await import('@/lib/mcp/issue-plan-database-read');

    await expect(
      selectBubblophyMcpIssuePlanForUser(input)
    ).resolves.toMatchObject({
      plan: {
        version: 4,
        approvalStatus: 'approved',
        approvedAt: '2026-07-18T13:00:00.000Z',
      },
    });
  });

  it('returns null without revealing foreign or missing resources', async () => {
    const { selectBubblophyMcpIssuePlanForUser } =
      await import('@/lib/mcp/issue-plan-database-read');

    await expect(selectBubblophyMcpIssuePlanForUser(input)).resolves.toBeNull();
  });
});
