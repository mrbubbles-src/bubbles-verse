// @vitest-environment node

import type { SQL } from 'drizzle-orm';

import { getTableName } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type DrizzleTable = Parameters<typeof getTableName>[0];
type DatabaseValue = string | number | boolean | object | null;
type DatabaseRow = Record<string, DatabaseValue>;

interface SelectCall {
  selectedKeys: string[];
  fromTable: string | null;
  joinedTables: string[];
  whereParams: string;
  orderBySql: string | null;
  limit: number | null;
}

const calls: SelectCall[] = [];
let queryRows: DatabaseRow[][] = [];

class MockSelectQuery implements PromiseLike<DatabaseRow[]> {
  private readonly call: SelectCall;
  private readonly rows: DatabaseRow[];

  constructor(selectedKeys: string[], rows: DatabaseRow[]) {
    this.rows = rows;
    this.call = {
      selectedKeys,
      fromTable: null,
      joinedTables: [],
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

  innerJoin(table: DrizzleTable) {
    this.call.joinedTables.push(getTableName(table));
    return this;
  }

  where(condition: SQL) {
    const query = new PgDialect().sqlToQuery(condition);
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
}

const dbMock = {
  select: vi.fn(
    (selection: Record<string, object>) =>
      new MockSelectQuery(Object.keys(selection), queryRows.shift() ?? [])
  ),
};

vi.mock('@/drizzle/db', () => ({ db: dbMock }));

function makeProject(overrides: Partial<DatabaseRow> = {}): DatabaseRow {
  return {
    projectId: 'project-bv',
    projectKey: 'BV',
    projectName: 'Bubblesverse',
    projectIsArchived: false,
    currentUserRole: 'member',
    ...overrides,
  };
}

function makeRun(index: number): DatabaseRow {
  return {
    ...makeProject(),
    id: `run-${String(index).padStart(2, '0')}`,
    issueNumber: index,
    agentLabel: 'codex',
    state: index === 1 ? 'needs_review' : 'running',
    updatedAt: `2026-07-19T12:${String(60 - index).padStart(2, '0')}:00.000Z`,
    result: index === 1 ? { summary: 'Review bereit.' } : null,
  };
}

describe('selectDashboardRunPageForUser', () => {
  beforeEach(() => {
    calls.length = 0;
    queryRows = [];
    dbMock.select.mockClear();
  });

  it('binds runs to membership and returns a stable 20-item cursor', async () => {
    queryRows = [
      [makeProject()],
      Array.from({ length: 21 }, (_, i) => makeRun(i + 1)),
    ];
    const { selectDashboardRunPageForUser } =
      await import('@/lib/dashboard/runs-database-read');

    const result = await selectDashboardRunPageForUser({
      authUserId: 'user-1',
      projectKey: 'BV',
      after: {
        updatedAt: '2026-07-20T00:00:00.000Z',
        id: 'run-after',
      },
    });

    expect(result?.items).toHaveLength(20);
    expect(result?.items[0]).toEqual({
      id: 'run-01',
      issueKey: 'BV-01',
      agentLabel: 'codex',
      state: 'needs_review',
      updatedAt: '2026-07-19T12:59:00.000Z',
      resultSummary: 'Review bereit.',
    });
    expect(result?.nextAfter).toEqual({
      updatedAt: '2026-07-19T12:40:00.000Z',
      id: 'run-20',
    });
    expect(calls[1]).toMatchObject({
      fromTable: 'bubblophy_project_members',
      joinedTables: [
        'bubblophy_projects',
        'bubblophy_issues',
        'bubblophy_agent_runs',
        'bubblophy_agent_tokens',
      ],
      limit: 21,
    });
    expect(calls[1]?.whereParams).toContain('user-1');
    expect(calls[1]?.whereParams).toContain('project-bv');
    expect(calls[1]?.whereParams).toContain('2026-07-20T00:00:00.000Z');
    expect(calls[1]?.whereParams).toContain('run-after');
    expect(calls[1]?.orderBySql).toContain('desc');
  });

  it('proves an empty project with a final membership read', async () => {
    queryRows = [
      [makeProject()],
      [],
      [makeProject({ currentUserRole: 'viewer' })],
    ];
    const { selectDashboardRunPageForUser } =
      await import('@/lib/dashboard/runs-database-read');

    await expect(
      selectDashboardRunPageForUser({
        authUserId: 'user-1',
        projectKey: 'BV',
        after: null,
      })
    ).resolves.toMatchObject({
      project: { currentUserRole: 'viewer' },
      items: [],
      nextAfter: null,
    });
    expect(calls).toHaveLength(3);
  });

  it('fails closed when membership disappears before an empty result returns', async () => {
    queryRows = [[makeProject()], [], []];
    const { selectDashboardRunPageForUser } =
      await import('@/lib/dashboard/runs-database-read');

    await expect(
      selectDashboardRunPageForUser({
        authUserId: 'user-1',
        projectKey: 'BV',
        after: null,
      })
    ).resolves.toBeNull();
  });
});
