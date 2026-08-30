// @vitest-environment node

import type { DashboardIssueReviewPageReadInput } from '@/lib/dashboard/issue-review-notifications';
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

  innerJoin(table: DrizzleTable) {
    this.call.joinedTables.push(getTableName(table));
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

const input: DashboardIssueReviewPageReadInput = {
  authUserId: 'user-1',
  projectKey: null,
  after: null,
};

function makeReview(index: number): Row {
  const projectKey = index % 2 === 0 ? 'BV' : 'NO';

  return {
    projectId: `project-${projectKey.toLowerCase()}`,
    projectKey,
    projectName: projectKey === 'BV' ? 'Bubbles Verse' : 'Novari',
    currentUserRole: index === 1 ? 'viewer' : 'owner',
    issueId: `issue-secret-${index}`,
    issueNumber: 100 - index,
    title: `Review ${index}`,
    status: 'review',
    updatedAt: new Date(Date.UTC(2026, 7, 31, 12, 0, 40 - index)).toISOString(),
  };
}

function makeScope(): Row {
  return {
    projectId: 'project-bv',
    projectKey: 'BV',
    projectName: 'Bubbles Verse',
    projectIsArchived: false,
    currentUserRole: 'owner',
  };
}

describe('selectDashboardIssueReviewPageForUser', () => {
  beforeEach(() => {
    calls.length = 0;
    queryRows = [];
    dbMock.select.mockClear();
  });

  it('returns a bounded redacted page of current review issues', async () => {
    const candidates = Array.from({ length: 21 }, (_, index) =>
      makeReview(index)
    );
    queryRows = [candidates, candidates];
    const { selectDashboardIssueReviewPageForUser } =
      await import('@/lib/dashboard/issue-review-notifications-database-read');

    const result = await selectDashboardIssueReviewPageForUser(input);

    expect(result?.items).toHaveLength(20);
    expect(result?.items.slice(0, 2)).toEqual([
      {
        issueKey: 'BV-100',
        title: 'Review 0',
        projectKey: 'BV',
        projectName: 'Bubbles Verse',
        updatedAt: candidates[0]?.updatedAt,
      },
      expect.objectContaining({ issueKey: 'NO-99', title: 'Review 1' }),
    ]);
    expect(result?.nextAfter).toEqual({
      updatedAt: candidates[19]?.updatedAt,
      projectKey: candidates[19]?.projectKey,
      issueNumber: candidates[19]?.issueNumber,
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
        'title',
        'status',
        'updatedAt',
      ],
      fromTable: 'bubblophy_project_members',
      joinedTables: ['bubblophy_projects', 'bubblophy_issues'],
      orderBySql: [
        '"bubblophy_issues"."updated_at" desc',
        '"bubblophy_projects"."key" desc',
        '"bubblophy_issues"."issue_number" desc',
      ],
      limit: 21,
    });
    expect(calls[0]?.whereSql).toContain(
      `"bubblophy_issues"."status" = 'review'`
    );
    expect(calls[0]?.whereParams).not.toContain('review');
    expect(calls[1]?.whereSql).toContain(
      `"bubblophy_issues"."status" = 'review'`
    );
  });

  it('distinguishes empty or archived scope from missing membership', async () => {
    const scope = makeScope();
    const { selectDashboardIssueReviewPageForUser } =
      await import('@/lib/dashboard/issue-review-notifications-database-read');

    queryRows = [[scope], [], [scope]];
    await expect(
      selectDashboardIssueReviewPageForUser({
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
      selectDashboardIssueReviewPageForUser({
        ...input,
        projectKey: 'BV',
      })
    ).resolves.toBeNull();

    queryRows = [[scope], [], []];
    await expect(
      selectDashboardIssueReviewPageForUser({
        ...input,
        projectKey: 'BV',
      })
    ).resolves.toBeNull();
  });

  it('empties a concrete page archived during the final scope read', async () => {
    const scope = makeScope();
    const review = {
      ...makeReview(0),
      projectId: 'project-bv',
      projectKey: 'BV',
      projectName: 'Bubbles Verse',
    };
    queryRows = [
      [scope],
      [review],
      [review],
      [{ ...scope, projectIsArchived: true }],
    ];
    const { selectDashboardIssueReviewPageForUser } =
      await import('@/lib/dashboard/issue-review-notifications-database-read');

    const result = await selectDashboardIssueReviewPageForUser({
      ...input,
      projectKey: 'BV',
    });

    expect(result).toEqual({
      project: {
        key: 'BV',
        name: 'Bubbles Verse',
        currentUserRole: 'owner',
      },
      items: [],
      nextAfter: null,
    });
    expect(calls[3]?.selectedKeys).toContain('projectIsArchived');
  });

  it('skips resolved or changed issues and refills from later chunks', async () => {
    const firstChunk = Array.from({ length: 21 }, (_, index) =>
      makeReview(index)
    );
    const changedTimestamp = {
      ...firstChunk[0],
      updatedAt: '2026-08-31T13:00:00.000Z',
    };
    const movedIssue = {
      ...firstChunk[1],
      projectId: 'other-project',
    };
    const currentFirstChunk = [
      changedTimestamp,
      movedIssue,
      ...firstChunk.slice(2, 10),
    ];
    const secondChunk = Array.from({ length: 12 }, (_, index) =>
      makeReview(index + 21)
    );
    queryRows = [firstChunk, currentFirstChunk, secondChunk, secondChunk];
    const { selectDashboardIssueReviewPageForUser } =
      await import('@/lib/dashboard/issue-review-notifications-database-read');

    const result = await selectDashboardIssueReviewPageForUser(input);

    expect(result?.items).toHaveLength(20);
    expect(result?.items.map((item) => item.issueKey)).not.toContain('BV-100');
    expect(result?.items.map((item) => item.issueKey)).not.toContain('NO-99');
    expect(calls).toHaveLength(4);
    expect(calls[2]?.whereSql).toContain('updated_at');
    expect(calls[2]?.whereParams).toContain(firstChunk.at(-1)?.updatedAt);
  });

  it('skips an archived project during final access and refills', async () => {
    const archivedCandidates: Row[] = Array.from(
      { length: 10 },
      (_, index) => ({
        ...makeReview(index),
        projectId: 'project-bv',
        projectKey: 'BV',
        projectName: 'Bubbles Verse',
      })
    );
    const visibleCandidates: Row[] = Array.from({ length: 11 }, (_, index) => ({
      ...makeReview(index + 10),
      projectId: 'project-no',
      projectKey: 'NO',
      projectName: 'Novari',
    }));
    const firstChunk = [...archivedCandidates, ...visibleCandidates];
    const secondChunk: Row[] = Array.from({ length: 10 }, (_, index) => ({
      ...makeReview(index + 21),
      projectId: 'project-no',
      projectKey: 'NO',
      projectName: 'Novari',
    }));
    queryRows = [firstChunk, visibleCandidates, secondChunk, secondChunk];
    const { selectDashboardIssueReviewPageForUser } =
      await import('@/lib/dashboard/issue-review-notifications-database-read');

    const result = await selectDashboardIssueReviewPageForUser(input);

    expect(result?.items).toHaveLength(20);
    expect(result?.items.map((item) => item.issueKey)).not.toContain('BV-100');
    expect(result?.items.map((item) => item.issueKey)).toContain('NO-79');
    expect(calls[1]?.whereSql).toContain('is_archived');
    expect(calls[1]?.whereParams).toContain('false');
  });
});
