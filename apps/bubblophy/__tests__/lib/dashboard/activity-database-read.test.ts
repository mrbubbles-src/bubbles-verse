// @vitest-environment node

import type { DashboardActivityPageReadInput } from '@/lib/dashboard/activity';
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
    this.recordJoin(table, condition);
    return this;
  }

  leftJoin(table: DrizzleTable, condition: SQL) {
    this.recordJoin(table, condition);
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

  private recordJoin(table: DrizzleTable, condition: SQL) {
    const query = dialect.sqlToQuery(condition);

    this.call.joinedTables.push(getTableName(table));
    this.call.joinSql.push(`${query.sql} ${JSON.stringify(query.params)}`);
  }
}

const dbMock = {
  select: vi.fn(
    (selection: Record<string, object>) =>
      new MockQuery(Object.keys(selection), queryRows.shift() ?? [])
  ),
};

vi.mock('@/drizzle/db', () => ({ db: dbMock }));

const input: DashboardActivityPageReadInput = {
  authUserId: 'user-1',
  after: null,
  filters: { projectKey: null, kind: null },
};

function makeCandidate(index: number, source: 'issue' | 'project'): Row {
  const projectKey = index % 2 === 0 ? 'BV' : 'NO';
  const occurredAt = new Date(Date.UTC(2026, 6, 21, 12, 0, 40 - index));

  return {
    eventId: `${source}-${String(100 - index).padStart(3, '0')}`,
    projectId: `project-${projectKey.toLowerCase()}`,
    projectKey,
    issueId: source === 'issue' ? `issue-${index}` : null,
    issueNumber: source === 'issue' ? 100 - index : null,
    label: `Ereignis ${index}`,
    actorAuthUserId: index === 0 ? 'human-secret-id' : null,
    actorOauthClientId: index === 1 ? 'oauth-secret-id' : null,
    actorAgentTokenLabel: index === 2 ? 'Claude Windows' : null,
    occurredAt: occurredAt.toISOString(),
  };
}

function makeAccess(candidate: Row): Row {
  return {
    eventId: candidate.eventId,
    projectId: candidate.projectId,
    projectKey: candidate.projectKey,
    issueId: candidate.issueId,
    issueNumber: candidate.issueNumber,
  };
}

describe('selectDashboardActivityPageForUser', () => {
  beforeEach(() => {
    calls.length = 0;
    queryRows = [];
    dbMock.select.mockClear();
  });

  it('merges both event spaces newest-first into a bounded public page', async () => {
    const candidates = Array.from({ length: 21 }, (_, index) =>
      makeCandidate(index, index % 2 === 0 ? 'project' : 'issue')
    );
    const projectCandidates = candidates.filter((row) =>
      String(row.eventId).startsWith('project')
    );
    const issueCandidates = candidates.filter((row) =>
      String(row.eventId).startsWith('issue')
    );
    queryRows = [
      projectCandidates,
      issueCandidates,
      projectCandidates.map(makeAccess),
      issueCandidates.map(makeAccess),
    ];
    const { selectDashboardActivityPageForUser } =
      await import('@/lib/dashboard/activity-database-read');

    const result = await selectDashboardActivityPageForUser(input);

    expect(result?.items).toHaveLength(20);
    expect(result?.items.slice(0, 3)).toEqual([
      expect.objectContaining({ id: 'project:project-100', actor: 'Mensch' }),
      expect.objectContaining({ id: 'issue:issue-099', actor: 'OAuth-Client' }),
      expect.objectContaining({
        id: 'project:project-098',
        actor: 'Agent-Token Claude Windows',
      }),
    ]);
    expect(result?.nextAfter).toEqual({
      occurredAt: candidates[19]?.occurredAt,
      source: 'issue',
      eventId: candidates[19]?.eventId,
    });
    expect(JSON.stringify(result)).not.toContain('secret-id');
    expect(calls[0]).toMatchObject({
      selectedKeys: [
        'eventId',
        'projectId',
        'projectKey',
        'label',
        'actorAuthUserId',
        'actorOauthClientId',
        'actorAgentTokenLabel',
        'occurredAt',
      ],
      fromTable: 'bubblophy_project_members',
      joinedTables: [
        'bubblophy_projects',
        'bubblophy_project_events',
        'bubblophy_agent_tokens',
      ],
      orderBySql: [
        '"bubblophy_project_events"."created_at" desc',
        '"bubblophy_project_events"."id" desc',
      ],
      limit: 21,
    });
    expect(calls[0]?.joinSql[2]).toContain('project_id');
    expect(calls[1]?.joinSql[3]).toContain('project_id');
  });

  it('uses source then event ID as deterministic same-time ties', async () => {
    const project = {
      ...makeCandidate(0, 'project'),
      eventId: 'project-z',
      occurredAt: '2026-07-21T12:00:00.000Z',
    };
    const issue = {
      ...makeCandidate(1, 'issue'),
      eventId: 'issue-z',
      occurredAt: '2026-07-21T12:00:00.000Z',
    };
    queryRows = [
      [project],
      [issue],
      [makeAccess(project)],
      [makeAccess(issue)],
    ];
    const { selectDashboardActivityPageForUser } =
      await import('@/lib/dashboard/activity-database-read');

    const result = await selectDashboardActivityPageForUser(input);

    expect(result?.items.map((item) => item.id)).toEqual([
      'project:project-z',
      'issue:issue-z',
    ]);
  });

  it('queries only the requested event kind and binds the stable cursor', async () => {
    const issue = makeCandidate(3, 'issue');
    queryRows = [[issue], [makeAccess(issue)]];
    const { selectDashboardActivityPageForUser } =
      await import('@/lib/dashboard/activity-database-read');

    const result = await selectDashboardActivityPageForUser({
      ...input,
      after: {
        occurredAt: '2026-07-21T12:00:00.000Z',
        source: 'project',
        eventId: 'project-20',
      },
      filters: { projectKey: null, kind: 'issue' },
    });

    expect(result?.items).toHaveLength(1);
    expect(calls).toHaveLength(2);
    expect(calls[0]?.fromTable).toBe('bubblophy_project_members');
    expect(calls[0]?.joinedTables).toContain('bubblophy_issue_events');
    expect(calls[0]?.whereSql).toContain('created_at');
    expect(calls[0]?.whereParams).toContain('2026-07-21T12:00:00.000Z');
  });

  it('distinguishes an empty concrete project from missing or revoked access', async () => {
    const scope = { projectId: 'project-bv', projectKey: 'BV' };
    const { selectDashboardActivityPageForUser } =
      await import('@/lib/dashboard/activity-database-read');

    queryRows = [[scope], [], [], [scope]];
    await expect(
      selectDashboardActivityPageForUser({
        ...input,
        filters: { projectKey: 'BV', kind: null },
      })
    ).resolves.toEqual({
      filters: { projectKey: 'BV', kind: null },
      items: [],
      nextAfter: null,
    });

    queryRows = [[]];
    await expect(
      selectDashboardActivityPageForUser({
        ...input,
        filters: { projectKey: 'BV', kind: null },
      })
    ).resolves.toBeNull();

    queryRows = [[scope], [], [], []];
    await expect(
      selectDashboardActivityPageForUser({
        ...input,
        filters: { projectKey: 'BV', kind: null },
      })
    ).resolves.toBeNull();
  });

  it('keeps scanning raw chunks after final binding rejects candidates', async () => {
    const firstChunk = Array.from({ length: 21 }, (_, index) =>
      makeCandidate(index, index % 2 === 0 ? 'project' : 'issue')
    );
    const secondChunk = Array.from({ length: 11 }, (_, index) =>
      makeCandidate(index + 21, index % 2 === 0 ? 'project' : 'issue')
    );
    const split = (rows: Row[], source: string) =>
      rows.filter((row) => String(row.eventId).startsWith(source));

    queryRows = [
      split(firstChunk, 'project'),
      split(firstChunk, 'issue'),
      split(firstChunk, 'project').slice(0, 5).map(makeAccess),
      split(firstChunk, 'issue').slice(0, 5).map(makeAccess),
      split(secondChunk, 'project'),
      split(secondChunk, 'issue'),
      split(secondChunk, 'project').map(makeAccess),
      split(secondChunk, 'issue').map(makeAccess),
    ];
    const { selectDashboardActivityPageForUser } =
      await import('@/lib/dashboard/activity-database-read');

    const result = await selectDashboardActivityPageForUser(input);

    expect(result?.items).toHaveLength(20);
    expect(calls).toHaveLength(8);
    expect(calls[4]?.whereSql).toContain('created_at');
  });
});
