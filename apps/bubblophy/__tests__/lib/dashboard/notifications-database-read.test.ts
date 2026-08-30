// @vitest-environment node

import type { DashboardNotificationPageReadInput } from '@/lib/dashboard/notifications';
import type { SQL } from 'drizzle-orm';

import { getTableName } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type DrizzleTable = Parameters<typeof getTableName>[0];
type RowValue = string | number | boolean | object | null | undefined;
type Row = Record<string, RowValue>;

interface Call {
  selectedKeys: string[];
  fromTable: string | null;
  joinedTables: string[];
  joinSql: string[];
  whereSql: string | null;
  whereParams: string;
  orderBySql: string[];
  limit: number | null;
}

const calls: Call[] = [];
let queryRows: Row[][] = [];
const dialect = new PgDialect();

class MockQuery implements PromiseLike<Row[]> {
  private readonly call: Call;
  private readonly rows: Row[];

  constructor(selectedKeys: string[], rows: Row[]) {
    this.rows = rows;
    this.call = {
      selectedKeys,
      fromTable: null,
      joinedTables: [],
      joinSql: [],
      whereSql: null,
      whereParams: '[]',
      orderBySql: [],
      limit: null,
    };
    calls.push(this.call);
  }

  from(table: DrizzleTable) {
    this.call.fromTable = getTableName(table);
    return this;
  }

  innerJoin(table: DrizzleTable, condition: SQL) {
    const query = dialect.sqlToQuery(condition);

    this.call.joinedTables.push(getTableName(table));
    this.call.joinSql.push(`${query.sql} ${JSON.stringify(query.params)}`);
    return this;
  }

  where(condition: SQL) {
    const query = dialect.sqlToQuery(condition);

    this.call.whereSql = query.sql;
    this.call.whereParams = JSON.stringify(query.params);
    return this;
  }

  orderBy(...conditions: SQL[]) {
    this.call.orderBySql = conditions.map(
      (condition) => dialect.sqlToQuery(condition).sql
    );
    return this;
  }

  limit(value: number) {
    this.call.limit = value;
    return this;
  }

  then<TResult1 = Row[], TResult2 = never>(
    onfulfilled?: ((value: Row[]) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: Error) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.rows).then(onfulfilled, onrejected);
  }
}

const dbMock = {
  select: vi.fn(
    (selection: Record<string, object>) =>
      new MockQuery(Object.keys(selection), queryRows.shift() ?? [])
  ),
};

vi.mock('@/drizzle/db', () => ({ db: dbMock }));

const input: DashboardNotificationPageReadInput = {
  authUserId: 'user-1',
  projectKey: null,
  after: null,
};

function makeCandidate(
  index: number,
  state: 'requested' | 'needs_review' | 'failed' = 'requested'
): Row {
  const projectKey = index % 2 === 0 ? 'BV' : 'NO';

  return {
    projectId: `project-${projectKey.toLowerCase()}`,
    projectKey,
    projectName: projectKey === 'BV' ? 'Bubbles Verse' : 'Novari',
    currentUserRole: index === 1 ? 'viewer' : 'owner',
    issueId: `issue-secret-${index}`,
    issueNumber: 100 - index,
    runId: `run-${String(100 - index).padStart(3, '0')}`,
    agentTokenId: `token-secret-${index}`,
    agentLabel: `Agent ${index}`,
    state,
    updatedAt: new Date(Date.UTC(2026, 7, 31, 12, 0, 40 - index)).toISOString(),
  };
}

function makeScope() {
  return {
    projectId: 'project-bv',
    projectKey: 'BV',
    projectName: 'Bubbles Verse',
    currentUserRole: 'owner',
  };
}

describe('selectDashboardNotificationPageForUser', () => {
  beforeEach(() => {
    calls.length = 0;
    queryRows = [];
    dbMock.select.mockClear();
  });

  it('returns only a bounded redacted page of live run states', async () => {
    const candidates = Array.from({ length: 21 }, (_, index) =>
      makeCandidate(
        index,
        (['requested', 'needs_review', 'failed'] as const)[index % 3]
      )
    );
    queryRows = [candidates, candidates];
    const { selectDashboardNotificationPageForUser } =
      await import('@/lib/dashboard/notifications-database-read');

    const result = await selectDashboardNotificationPageForUser(input);

    expect(result?.items).toHaveLength(20);
    expect(result?.items.slice(0, 3)).toEqual([
      expect.objectContaining({
        issueKey: 'BV-100',
        state: 'requested',
        canManage: true,
      }),
      expect.objectContaining({
        issueKey: 'NO-99',
        state: 'needs_review',
        canManage: false,
      }),
      expect.objectContaining({ issueKey: 'BV-98', state: 'failed' }),
    ]);
    expect(result?.nextAfter).toEqual({
      updatedAt: candidates[19]?.updatedAt,
      runId: candidates[19]?.runId,
    });
    expect(JSON.stringify(result)).not.toContain('secret');
    expect(calls[0]).toMatchObject({
      selectedKeys: [
        'projectId',
        'projectKey',
        'projectName',
        'currentUserRole',
        'issueId',
        'issueNumber',
        'runId',
        'agentTokenId',
        'agentLabel',
        'state',
        'updatedAt',
      ],
      fromTable: 'bubblophy_project_members',
      joinedTables: [
        'bubblophy_projects',
        'bubblophy_issues',
        'bubblophy_agent_runs',
        'bubblophy_agent_tokens',
      ],
      orderBySql: [
        '"bubblophy_agent_runs"."updated_at" desc',
        '"bubblophy_agent_runs"."id" desc',
      ],
      limit: 21,
    });
    expect(calls[0]?.whereSql).toContain(
      `"bubblophy_agent_runs"."state" in ('requested', 'needs_review', 'failed')`
    );
    expect(calls[0]?.whereParams).not.toContain('requested');
    expect(calls[0]?.whereParams).not.toContain('needs_review');
    expect(calls[0]?.whereParams).not.toContain('failed');
    expect(calls[0]?.whereParams).not.toContain('active');
    expect(calls[1]?.whereSql).toContain(
      `"bubblophy_agent_runs"."state" in ('requested', 'needs_review', 'failed')`
    );
    expect(calls[0]?.joinSql.at(-1)).toContain('project_id');
  });

  it('keeps requested runs independent of token lifecycle metadata', async () => {
    const runId = 'run-revoked-token';
    const candidate = {
      ...makeCandidate(0, 'requested'),
      runId,
      tokenState: 'revoked',
      tokenExpiresAt: '2020-01-01T00:00:00.000Z',
      tokenScopes: [],
      tokenHash: 'never-public',
    };
    queryRows = [[candidate], [candidate]];
    const { selectDashboardNotificationPageForUser } =
      await import('@/lib/dashboard/notifications-database-read');

    const result = await selectDashboardNotificationPageForUser(input);

    expect(result?.items).toEqual([
      expect.objectContaining({ runId, state: 'requested' }),
    ]);
    expect(JSON.stringify(result)).not.toContain('never-public');
    expect(calls[0]?.selectedKeys).not.toContain('tokenState');
    expect(calls[0]?.selectedKeys).not.toContain('tokenHash');
  });

  it('distinguishes an empty or archived project from missing membership', async () => {
    const scope = makeScope();
    const { selectDashboardNotificationPageForUser } =
      await import('@/lib/dashboard/notifications-database-read');

    queryRows = [[scope], [], [scope]];
    await expect(
      selectDashboardNotificationPageForUser({
        ...input,
        projectKey: 'BV',
      })
    ).resolves.toEqual({
      project: {
        key: 'BV',
        name: 'Bubbles Verse',
        currentUserRole: 'owner',
      },
      items: [],
      nextAfter: null,
    });
    expect(calls[1]?.whereSql).toContain('is_archived');

    queryRows = [[]];
    await expect(
      selectDashboardNotificationPageForUser({
        ...input,
        projectKey: 'BV',
      })
    ).resolves.toBeNull();

    queryRows = [[scope], [], []];
    await expect(
      selectDashboardNotificationPageForUser({
        ...input,
        projectKey: 'BV',
      })
    ).resolves.toBeNull();
  });

  it('skips changed bindings and refills from later raw chunks', async () => {
    const firstChunk = Array.from({ length: 21 }, (_, index) =>
      makeCandidate(index)
    );
    const secondChunk = Array.from({ length: 12 }, (_, index) =>
      makeCandidate(index + 21, 'failed')
    );
    const changedState = {
      ...firstChunk[0],
      state: 'needs_review',
    };
    const changedToken = {
      ...firstChunk[1],
      agentTokenId: 'other-token',
    };
    const currentFirstChunk = [
      changedState,
      changedToken,
      ...firstChunk.slice(2, 10),
    ];
    queryRows = [firstChunk, currentFirstChunk, secondChunk, secondChunk];
    const { selectDashboardNotificationPageForUser } =
      await import('@/lib/dashboard/notifications-database-read');

    const result = await selectDashboardNotificationPageForUser(input);

    expect(result?.items).toHaveLength(20);
    expect(result?.items.map((item) => item.runId)).not.toContain(
      firstChunk[0]?.runId
    );
    expect(result?.items.map((item) => item.runId)).not.toContain(
      firstChunk[1]?.runId
    );
    expect(calls).toHaveLength(4);
    expect(calls[2]?.whereSql).toContain('updated_at');
    expect(calls[2]?.whereParams).toContain(firstChunk.at(-1)?.updatedAt);
  });

  it('skips a project archived before the final read and refills the page', async () => {
    const archivedProjectCandidates: Row[] = Array.from(
      { length: 10 },
      (_, index) => ({
        ...makeCandidate(index),
        projectId: 'project-bv',
        projectKey: 'BV',
        projectName: 'Bubbles Verse',
      })
    );
    const stillVisibleCandidates: Row[] = Array.from(
      { length: 11 },
      (_, index) => ({
        ...makeCandidate(index + 10),
        projectId: 'project-no',
        projectKey: 'NO',
        projectName: 'Novari',
      })
    );
    const firstChunk = [
      ...archivedProjectCandidates,
      ...stillVisibleCandidates,
    ];
    const secondChunk: Row[] = Array.from({ length: 10 }, (_, index) => ({
      ...makeCandidate(index + 21, 'failed'),
      projectId: 'project-no',
      projectKey: 'NO',
      projectName: 'Novari',
    }));
    queryRows = [firstChunk, stillVisibleCandidates, secondChunk, secondChunk];
    const { selectDashboardNotificationPageForUser } =
      await import('@/lib/dashboard/notifications-database-read');

    const result = await selectDashboardNotificationPageForUser(input);

    expect(result?.items).toHaveLength(20);
    expect(result?.items.map((item) => item.runId)).not.toContain(
      archivedProjectCandidates[0]?.runId
    );
    expect(result?.items.map((item) => item.runId)).toContain(
      secondChunk[0]?.runId
    );
    expect(calls).toHaveLength(4);
    expect(calls[1]?.whereSql).toContain('is_archived');
    expect(calls[1]?.whereParams).toContain('false');
  });
});
