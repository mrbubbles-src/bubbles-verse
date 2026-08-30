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

function makeProject(overrides: Partial<DatabaseRow> = {}): DatabaseRow {
  return {
    projectId: 'project-bv',
    projectKey: 'BV',
    projectName: 'Bubblesverse',
    projectIsArchived: false,
    currentUserRole: 'owner',
    ...overrides,
  };
}

function makeToken(
  index: number,
  overrides: Partial<DatabaseRow> = {}
): DatabaseRow {
  const label =
    index === 1 ? 'ALPHA' : `Token ${String(index).padStart(2, '0')}`;

  return {
    ...makeProject(),
    id: `token-${String(index).padStart(2, '0')}`,
    label,
    normalizedLabel: label.toLowerCase(),
    scopes: ['issues:read'],
    state: 'active',
    lastUsedAt: null,
    expiresAt: null,
    ...overrides,
  };
}

describe('selectDashboardAgentTokenPageForUser', () => {
  beforeEach(() => {
    calls.length = 0;
    queryRows = [];
    dbMock.select.mockClear();
  });

  it('returns a hash-free stable all-project 20+1 page', async () => {
    queryRows = [
      Array.from({ length: 21 }, (_, index) => makeToken(index + 1)),
      [makeProject()],
    ];
    const { selectDashboardAgentTokenPageForUser } =
      await import('@/lib/dashboard/agent-tokens-database-read');

    const result = await selectDashboardAgentTokenPageForUser({
      authUserId: 'user-1',
      projectKey: null,
      query: null,
      after: null,
      now: '2026-08-31T10:00:00.000Z',
    });

    expect(result?.project).toBeNull();
    expect(result?.items).toHaveLength(20);
    expect(result?.items[0]).toEqual({
      id: 'token-01',
      label: 'ALPHA',
      projectKey: 'BV',
      scopes: ['issues:read'],
      state: 'aktiv',
      lastUsedAt: 'noch nie verwendet',
      expiresAt: 'läuft nicht automatisch ab',
      projectIsArchived: false,
      currentUserRole: 'owner',
    });
    expect(result?.nextAfter).toEqual({
      projectKey: 'BV',
      normalizedLabel: 'token 20',
      tokenId: 'token-20',
    });
    expect(calls[0]).toMatchObject({
      fromTable: 'bubblophy_project_members',
      joinedTables: ['bubblophy_projects', 'bubblophy_agent_tokens'],
      limit: 21,
    });
    expect(calls[0]?.selectedKeys).toEqual([
      'projectId',
      'projectKey',
      'projectName',
      'projectIsArchived',
      'currentUserRole',
      'id',
      'label',
      'normalizedLabel',
      'scopes',
      'state',
      'lastUsedAt',
      'expiresAt',
    ]);
    expect(JSON.stringify(result)).not.toMatch(
      /tokenHash|plaintextToken|createdByAuthUserId|revokedAt/
    );
    expect(calls[0]?.orderBySql?.match(/asc/g)).toHaveLength(3);
  });

  it('keeps a concrete empty project distinct from lost access', async () => {
    queryRows = [[makeProject()], [], [makeProject()]];
    const { selectDashboardAgentTokenPageForUser } =
      await import('@/lib/dashboard/agent-tokens-database-read');

    await expect(
      selectDashboardAgentTokenPageForUser({
        authUserId: 'user-1',
        projectKey: 'BV',
        query: null,
        after: null,
        now: '2026-08-31T10:00:00.000Z',
      })
    ).resolves.toEqual({
      project: {
        key: 'BV',
        name: 'Bubblesverse',
        isArchived: false,
        currentUserRole: 'owner',
      },
      query: null,
      items: [],
      nextAfter: null,
    });
  });

  it('refreshes role, archive state, and expiry at the final mapping boundary', async () => {
    queryRows = [
      [
        makeToken(1, {
          expiresAt: '2026-08-31T10:00:00.000Z',
          currentUserRole: 'owner',
        }),
      ],
      [
        makeProject({
          currentUserRole: 'viewer',
          projectIsArchived: true,
        }),
      ],
    ];
    const { selectDashboardAgentTokenPageForUser } =
      await import('@/lib/dashboard/agent-tokens-database-read');

    const result = await selectDashboardAgentTokenPageForUser({
      authUserId: 'user-1',
      projectKey: null,
      query: null,
      after: null,
      now: '2026-08-31T10:00:00.000Z',
    });

    expect(result?.items[0]).toMatchObject({
      state: 'abgelaufen',
      projectIsArchived: true,
      currentUserRole: 'viewer',
    });
  });

  it('applies a literal label prefix together with the stable cursor', async () => {
    queryRows = [
      Array.from({ length: 21 }, (_, index) => makeToken(index + 21)),
      [makeProject()],
    ];
    const { selectDashboardAgentTokenPageForUser } =
      await import('@/lib/dashboard/agent-tokens-database-read');

    const result = await selectDashboardAgentTokenPageForUser({
      authUserId: 'user-1',
      projectKey: null,
      query: '%_\\Codex',
      after: {
        projectKey: 'BV',
        normalizedLabel: 'token 20',
        tokenId: 'token-20',
      },
      now: '2026-08-31T10:00:00.000Z',
    });

    expect(result?.query).toBe('%_\\Codex');
    expect(result?.items).toHaveLength(20);
    expect(result?.nextAfter).toEqual({
      projectKey: 'BV',
      normalizedLabel: 'token 40',
      tokenId: 'token-40',
    });
    expect(calls[0]?.whereParams).toContain('\\\\%\\\\_\\\\\\\\codex%');
    expect(calls[0]?.whereParams).toContain('token 20');
  });

  it('skips invalidated projects and continues to later visible rows', async () => {
    queryRows = [
      Array.from({ length: 21 }, (_, index) =>
        makeToken(index + 1, {
          projectId: 'project-old',
          projectKey: 'AA',
        })
      ),
      [],
      [
        makeToken(22, {
          projectId: 'project-bv',
          projectKey: 'BV',
          normalizedLabel: 'visible token',
          label: 'Visible Token',
        }),
      ],
      [makeProject()],
    ];
    const { selectDashboardAgentTokenPageForUser } =
      await import('@/lib/dashboard/agent-tokens-database-read');

    const result = await selectDashboardAgentTokenPageForUser({
      authUserId: 'user-1',
      projectKey: null,
      query: null,
      after: null,
      now: '2026-08-31T10:00:00.000Z',
    });

    expect(result?.items).toEqual([
      expect.objectContaining({
        id: 'token-22',
        projectKey: 'BV',
        label: 'Visible Token',
      }),
    ]);
    expect(calls).toHaveLength(4);
    expect(calls[2]?.whereParams).toContain('AA');
  });

  it('fails closed after concrete project identity or membership changes', async () => {
    queryRows = [
      [makeProject()],
      [makeToken(1)],
      [makeProject()],
      [makeProject({ projectKey: 'NEW' })],
    ];
    const { selectDashboardAgentTokenPageForUser } =
      await import('@/lib/dashboard/agent-tokens-database-read');

    await expect(
      selectDashboardAgentTokenPageForUser({
        authUserId: 'user-1',
        projectKey: 'BV',
        query: null,
        after: null,
        now: '2026-08-31T10:00:00.000Z',
      })
    ).resolves.toBeNull();
  });
});
