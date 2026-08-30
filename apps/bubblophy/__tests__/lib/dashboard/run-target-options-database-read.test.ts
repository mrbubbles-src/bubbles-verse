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

  constructor(selectedKeys: string[], rows: DatabaseRow[]) {
    this.rows = rows;
    this.call = {
      selectedKeys,
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

  orderBy(...conditions: SQL[]) {
    const dialect = new PgDialect();
    this.call.orderBySql = conditions
      .map((condition) => dialect.sqlToQuery(condition).sql)
      .join(' ');
    return this;
  }

  limit(value: number) {
    this.call.limit = value;
    return this;
  }

  private captureJoin(table: DrizzleTable, condition: SQL) {
    const query = new PgDialect().sqlToQuery(condition);
    this.call.joinedTables.push(getTableName(table));
    this.call.joinSql.push(`${query.sql} ${JSON.stringify(query.params)}`);
  }

  then<TResult1 = DatabaseRow[], TResult2 = TResult1>(
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

const input = {
  authUserId: 'user-actor',
  projectKey: 'BV',
  issueNumber: 12,
  issueKey: 'BV-12',
  query: null,
  after: null,
  now: '2026-08-30T12:00:00.000Z',
};

function makeContext(overrides: Partial<DatabaseRow> = {}): DatabaseRow {
  return {
    projectId: 'project-bv',
    projectKey: 'BV',
    projectName: 'Bubblesverse',
    projectIsArchived: false,
    currentUserRole: 'member',
    issueId: 'issue-12',
    issueNumber: 12,
    tokenId: null,
    tokenLabel: null,
    tokenNormalizedLabel: null,
    ...overrides,
  };
}

function makeToken(index: number, overrides: Partial<DatabaseRow> = {}) {
  return {
    ...makeContext(),
    tokenId: `token-${index}`,
    tokenLabel: index % 2 === 0 ? 'Duplicate' : `Target ${index}`,
    tokenNormalizedLabel: index % 2 === 0 ? 'duplicate' : `target ${index}`,
    ...overrides,
  };
}

describe('selectDashboardRunTargetOptionsForUser', () => {
  beforeEach(() => {
    calls.length = 0;
    queryRows = [];
    dbMock.select.mockClear();
  });

  it('returns a 20+1 page and only public token fields', async () => {
    queryRows = [
      [makeContext()],
      Array.from({ length: 21 }, (_, index) =>
        makeToken(
          index + 1,
          index === 19
            ? {
                tokenLabel: 'Locale-sensitive label',
                tokenNormalizedLabel: 'postgres-normalized',
              }
            : {}
        )
      ),
    ];
    const { selectDashboardRunTargetOptionsForUser } =
      await import('@/lib/dashboard/run-target-options-database-read');

    const result = await selectDashboardRunTargetOptionsForUser(input);

    expect(result).toMatchObject({
      status: 'success',
      project: {
        key: 'BV',
        name: 'Bubblesverse',
        currentUserRole: 'member',
      },
      issueKey: 'BV-12',
      query: null,
      after: null,
      items: expect.any(Array),
      nextAfter: {
        normalizedLabel: 'postgres-normalized',
        id: 'token-20',
      },
    });

    if (result.status === 'success') {
      expect(result.items).toHaveLength(20);
      expect(Object.keys(result.items[0] ?? {}).sort()).toEqual([
        'id',
        'label',
      ]);
    }

    expect(calls).toHaveLength(2);
    expect(calls[1]?.selectedKeys).toEqual([
      'projectId',
      'projectKey',
      'projectName',
      'projectIsArchived',
      'currentUserRole',
      'issueId',
      'issueNumber',
      'tokenId',
      'tokenLabel',
      'tokenNormalizedLabel',
    ]);
    expect(calls[1]?.selectedKeys).not.toContain('tokenHash');
    expect(calls[1]?.selectedKeys).not.toContain('scopes');
    expect(calls[1]?.selectedKeys).not.toContain('expiresAt');
    expect(calls[1]?.limit).toBe(21);
  });

  it('uses one final left join for executable lifecycle, expiry, scope, and prefix filtering', async () => {
    queryRows = [[makeContext()], [makeToken(1)]];
    const { selectDashboardRunTargetOptionsForUser } =
      await import('@/lib/dashboard/run-target-options-database-read');

    await selectDashboardRunTargetOptionsForUser({
      ...input,
      query: 'A%_\\',
    });

    expect(calls).toHaveLength(2);
    expect(calls[1]?.joinedTables).toEqual([
      'bubblophy_projects',
      'bubblophy_issues',
      'bubblophy_run_target_options_candidates',
    ]);
    const tokenJoin = calls[1]?.joinSql[2] ?? '';
    expect(tokenJoin).toContain('active');
    expect(tokenJoin).toContain('2026-08-30T12:00:00.000Z');
    expect(tokenJoin).toContain('@>');
    expect(tokenJoin).toContain('issues:read');
    expect(tokenJoin).toContain('runs:update');
    expect(calls[1]?.joinSql.join(' ')).toContain('a\\\\%\\\\_\\\\\\\\%');
    expect(calls[1]?.orderBySql).toContain('lower');
    expect(calls[1]?.limit).toBe(21);
  });

  it('applies the cursor to the same token alias used for order', async () => {
    queryRows = [[makeContext()], [makeToken(2)]];
    const { selectDashboardRunTargetOptionsForUser } =
      await import('@/lib/dashboard/run-target-options-database-read');

    await expect(
      selectDashboardRunTargetOptionsForUser({
        ...input,
        after: { normalizedLabel: 'duplicate', id: 'token-1' },
      })
    ).resolves.toMatchObject({
      status: 'success',
      items: [{ id: 'token-2', label: 'Duplicate' }],
    });

    const tokenJoin = calls[1]?.joinSql[2] ?? '';
    expect(tokenJoin).toContain('token-1');
    expect(tokenJoin).toContain('duplicate');
    expect(tokenJoin).toContain('bubblophy_run_target_options_candidates');
  });

  it.each([
    ['viewer', false, 'forbidden'],
    ['member', true, 'not_found'],
  ] as const)(
    'enforces initial role and archive gate (%s)',
    async (role, archived, status) => {
      queryRows = [
        [makeContext({ currentUserRole: role, projectIsArchived: archived })],
      ];
      const { selectDashboardRunTargetOptionsForUser } =
        await import('@/lib/dashboard/run-target-options-database-read');

      await expect(
        selectDashboardRunTargetOptionsForUser(input)
      ).resolves.toEqual({ status });
      expect(calls).toHaveLength(1);
    }
  );

  it('returns not-found when final membership, project key, or issue binding disappears', async () => {
    const { selectDashboardRunTargetOptionsForUser } =
      await import('@/lib/dashboard/run-target-options-database-read');
    const races = [
      makeContext({ currentUserRole: 'viewer' }),
      makeContext({ projectKey: 'OTHER' }),
      makeContext({ issueNumber: 13 }),
    ];

    for (const race of races) {
      calls.length = 0;
      queryRows = [[makeContext()], [race]];
      await expect(
        selectDashboardRunTargetOptionsForUser(input)
      ).resolves.toEqual({
        status: race.currentUserRole === 'viewer' ? 'forbidden' : 'not_found',
      });
    }
  });

  it('keeps the authorized context when the final executable-token window is empty', async () => {
    queryRows = [[makeContext()], [makeContext()]];
    const { selectDashboardRunTargetOptionsForUser } =
      await import('@/lib/dashboard/run-target-options-database-read');

    await expect(
      selectDashboardRunTargetOptionsForUser(input)
    ).resolves.toMatchObject({
      status: 'success',
      project: { key: 'BV', name: 'Bubblesverse' },
      items: [],
      nextAfter: null,
    });
  });
});
