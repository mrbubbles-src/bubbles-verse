// @vitest-environment node

import type { JsonValue } from '@/drizzle/db/schema';
import type { SQL } from 'drizzle-orm';

import { getTableName } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type DrizzleTable = Parameters<typeof getTableName>[0];

interface RunRow {
  project: { id: string; key: string; isArchived: boolean };
  issue: { issueNumber: number; title: string };
  run: {
    id: string;
    state:
      | 'requested'
      | 'approved'
      | 'running'
      | 'needs_review'
      | 'completed'
      | 'cancelled'
      | 'failed';
    agentLabel: string;
    approvedAt: string | null;
    startedAt: string | null;
    finishedAt: string | null;
    createdAt: string;
    updatedAt: string;
    result: JsonValue | null;
  };
}

const calls: {
  selectedKeys: string[];
  fromTable: string | null;
  joinedTables: string[];
  joinSql: string[];
  whereSql: string | null;
  whereParams: string;
  limit: number | null;
}[] = [];
let rows: RunRow[] = [];

class MockSelectQuery implements PromiseLike<RunRow[]> {
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

  then<TResult1 = RunRow[], TResult2 = never>(
    onfulfilled?:
      | ((value: RunRow[]) => TResult1 | PromiseLike<TResult1>)
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

const input = {
  authUserId: 'user-1',
  projectId: 'project_bv',
  runId: 'run_bv_12',
};

describe('selectBubblophyMcpRunForUser', () => {
  beforeEach(() => {
    calls.length = 0;
    rows = [];
    dbMock.select.mockClear();
  });

  it('binds membership, project, issue, run, and project token in one query', async () => {
    rows = [
      {
        project: { id: 'project_bv', key: 'BV', isArchived: true },
        issue: { issueNumber: 12, title: 'MCP planen' },
        run: {
          id: 'run_bv_12',
          state: 'needs_review',
          agentLabel: 'Codex',
          approvedAt: '2026-07-18T11:00:00.000Z',
          startedAt: '2026-07-18T11:05:00.000Z',
          finishedAt: null,
          createdAt: '2026-07-18T10:55:00.000Z',
          updatedAt: '2026-07-18T12:00:00.000Z',
          result: { summary: ' Bereit für Review ' },
        },
      },
    ];
    const { selectBubblophyMcpRunForUser } =
      await import('@/lib/mcp/run-detail-database-read');

    await expect(selectBubblophyMcpRunForUser(input)).resolves.toEqual({
      project: { id: 'project_bv', key: 'BV', isArchived: true },
      issue: { key: 'BV-12', issueNumber: 12, title: 'MCP planen' },
      run: {
        id: 'run_bv_12',
        state: 'needs_review',
        agentLabel: 'Codex',
        approvedAt: '2026-07-18T11:00:00.000Z',
        startedAt: '2026-07-18T11:05:00.000Z',
        finishedAt: null,
        createdAt: '2026-07-18T10:55:00.000Z',
        updatedAt: '2026-07-18T12:00:00.000Z',
        resultSummary: 'Bereit für Review',
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
        'run.id',
        'run.state',
        'run.agentLabel',
        'run.approvedAt',
        'run.startedAt',
        'run.finishedAt',
        'run.createdAt',
        'run.updatedAt',
        'run.result',
      ],
      fromTable: 'bubblophy_project_members',
      joinedTables: [
        'bubblophy_projects',
        'bubblophy_issues',
        'bubblophy_agent_runs',
        'bubblophy_agent_tokens',
      ],
      whereParams: '["user-1","project_bv","run_bv_12"]',
      limit: 1,
    });
    expect(calls[0]?.joinSql).toEqual([
      '"bubblophy_projects"."id" = "bubblophy_project_members"."project_id" []',
      '"bubblophy_issues"."project_id" = "bubblophy_projects"."id" []',
      '"bubblophy_agent_runs"."issue_id" = "bubblophy_issues"."id" []',
      '("bubblophy_agent_tokens"."id" = "bubblophy_agent_runs"."agent_token_id" and "bubblophy_agent_tokens"."project_id" = "bubblophy_projects"."id") []',
    ]);
    expect(JSON.stringify(calls)).not.toMatch(
      /requestedBy|approvedBy|tokenHash|authUser|event|password|secret/i
    );
  });

  it('drops sensitive raw result content from the public summary', async () => {
    rows = [
      {
        project: { id: 'project_bv', key: 'BV', isArchived: false },
        issue: { issueNumber: 12, title: 'MCP planen' },
        run: {
          id: 'run_bv_12',
          state: 'failed',
          agentLabel: 'Codex',
          approvedAt: null,
          startedAt: null,
          finishedAt: '2026-07-18T12:00:00.000Z',
          createdAt: '2026-07-18T10:55:00.000Z',
          updatedAt: '2026-07-18T12:00:00.000Z',
          result: { error: 'Bearer super-secret-token' },
        },
      },
    ];
    const { selectBubblophyMcpRunForUser } =
      await import('@/lib/mcp/run-detail-database-read');

    const result = await selectBubblophyMcpRunForUser(input);
    expect(result?.run.resultSummary).toBeNull();
    expect(JSON.stringify(result)).not.toContain('super-secret-token');
  });

  it('returns null without revealing foreign or missing resources', async () => {
    const { selectBubblophyMcpRunForUser } =
      await import('@/lib/mcp/run-detail-database-read');

    await expect(selectBubblophyMcpRunForUser(input)).resolves.toBeNull();
  });
});
