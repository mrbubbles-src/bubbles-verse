// @vitest-environment node

import type { SQL } from 'drizzle-orm';

import { getTableName } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type DrizzleTable = Parameters<typeof getTableName>[0];

interface RunTargetRow {
  projectId: string;
  projectKey: string;
  projectIsArchived: boolean;
  memberRole: 'member';
  tokenId: string | null;
  tokenLabel: string | null;
  tokenNormalizedLabel: string | null;
}

interface SelectCall {
  selectedKeys: string[];
  fromTable: string | null;
  joinedTables: string[];
  joinSql: string[];
  whereParams: string;
  whereSql: string | null;
  orderBySql: string | null;
  limit: number | null;
}

const selectCalls: SelectCall[] = [];
let rows: RunTargetRow[] = [];

class MockSelectQuery implements PromiseLike<RunTargetRow[]> {
  private readonly call: SelectCall;

  constructor(selectedKeys: string[]) {
    this.call = {
      selectedKeys,
      fromTable: null,
      joinedTables: [],
      joinSql: [],
      whereParams: '[]',
      whereSql: null,
      orderBySql: null,
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

  then<TResult1 = RunTargetRow[], TResult2 = TResult1>(
    onfulfilled?:
      | ((value: RunTargetRow[]) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: Error) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(rows).then(onfulfilled, onrejected);
  }
}

const dbMock = {
  select: vi.fn(
    (selection: Record<string, object>) =>
      new MockSelectQuery(Object.keys(selection))
  ),
};

vi.mock('@/drizzle/db', () => ({ db: dbMock }));

const input = {
  authUserId: 'user-1',
  projectId: 'project_bv',
  query: null,
  after: null,
  now: '2026-08-30T12:00:00.000Z',
};

describe('selectBubblophyMcpRunTargetsForUser', () => {
  beforeEach(() => {
    rows = [];
    selectCalls.length = 0;
    dbMock.select.mockClear();
  });

  it('returns a 20+1 public page without selecting token internals', async () => {
    rows = Array.from({ length: 21 }, (_, index) =>
      createRow(
        `token-${index + 1}`,
        `Target ${index + 1}`,
        index === 19 ? 'postgres-normalized' : `target ${index + 1}`
      )
    );
    const { selectBubblophyMcpRunTargetsForUser } =
      await import('@/lib/mcp/run-targets-database-read');

    const result = await selectBubblophyMcpRunTargetsForUser(input);

    expect(result).toMatchObject({
      project: {
        id: 'project_bv',
        key: 'BV',
        isArchived: false,
        role: 'member',
      },
      targets: expect.any(Array),
      nextAfter: {
        normalizedLabel: 'postgres-normalized',
        id: 'token-20',
      },
    });
    expect(result?.targets).toHaveLength(20);
    expect(Object.keys(result?.targets[0] ?? {}).sort()).toEqual([
      'id',
      'label',
    ]);
    expect(selectCalls[0]?.selectedKeys).toEqual([
      'projectId',
      'projectKey',
      'projectIsArchived',
      'memberRole',
      'tokenId',
      'tokenLabel',
      'tokenNormalizedLabel',
    ]);
    expect(JSON.stringify(selectCalls)).not.toMatch(
      /tokenHash|tokenScopes|tokenState|tokenExpiresAt|createdBy|lastUsed|revokedAt/i
    );
    expect(selectCalls[0]?.limit).toBe(21);
  });

  it('binds membership and filters executability, prefix, and cursor in SQL', async () => {
    rows = [createRow('token-21', 'Target 21', 'target 21')];
    const { selectBubblophyMcpRunTargetsForUser } =
      await import('@/lib/mcp/run-targets-database-read');

    await selectBubblophyMcpRunTargetsForUser({
      ...input,
      query: 'A%_\\',
      after: { normalizedLabel: 'target 20', id: 'token-20' },
    });

    expect(selectCalls[0]).toMatchObject({
      fromTable: 'bubblophy_project_members',
      joinedTables: [
        'bubblophy_projects',
        'bubblophy_mcp_run_target_candidates',
      ],
      limit: 21,
    });
    expect(selectCalls[0]?.whereParams).toBe(
      '["user-1","project_bv",false,"owner","maintainer","member"]'
    );
    const tokenJoin = selectCalls[0]?.joinSql[1] ?? '';
    expect(tokenJoin).toContain('active');
    expect(tokenJoin).toContain('2026-08-30T12:00:00.000Z');
    expect(tokenJoin).toContain('@>');
    expect(tokenJoin).toContain('issues:read');
    expect(tokenJoin).toContain('runs:update');
    expect(tokenJoin).toContain('a\\\\%\\\\_\\\\\\\\%');
    expect(tokenJoin).toContain('target 20');
    expect(tokenJoin).toContain('token-20');
    expect(selectCalls[0]?.orderBySql).toContain('lower');
  });

  it('advances duplicate case-folded labels by token ID', async () => {
    rows = [createRow('token-2', 'CODEX', 'codex')];
    const { selectBubblophyMcpRunTargetsForUser } =
      await import('@/lib/mcp/run-targets-database-read');

    await expect(
      selectBubblophyMcpRunTargetsForUser({
        ...input,
        query: 'Co',
        after: { normalizedLabel: 'codex', id: 'token-1' },
      })
    ).resolves.toMatchObject({
      targets: [{ id: 'token-2', label: 'CODEX' }],
    });

    const tokenJoin = selectCalls[0]?.joinSql[1] ?? '';
    expect(tokenJoin).toContain('codex');
    expect(tokenJoin).toContain('token-1');
    expect(selectCalls[0]?.orderBySql).toContain('lower');
    expect(selectCalls[0]?.orderBySql).toContain('"id"');
  });

  it('preserves an authorized project with no executable targets', async () => {
    rows = [createRow(null, null, null)];
    const { selectBubblophyMcpRunTargetsForUser } =
      await import('@/lib/mcp/run-targets-database-read');

    await expect(
      selectBubblophyMcpRunTargetsForUser(input)
    ).resolves.toMatchObject({ targets: [], nextAfter: null });
  });

  it('returns null without revealing foreign or missing projects', async () => {
    const { selectBubblophyMcpRunTargetsForUser } =
      await import('@/lib/mcp/run-targets-database-read');

    await expect(
      selectBubblophyMcpRunTargetsForUser({
        ...input,
        projectId: 'foreign',
      })
    ).resolves.toBeNull();
  });
});

/** Builds one deterministic membership/project/public-token row. */
function createRow(
  tokenId: string | null,
  tokenLabel: string | null,
  tokenNormalizedLabel: string | null
): RunTargetRow {
  return {
    projectId: 'project_bv',
    projectKey: 'BV',
    projectIsArchived: false,
    memberRole: 'member',
    tokenId,
    tokenLabel,
    tokenNormalizedLabel,
  };
}
