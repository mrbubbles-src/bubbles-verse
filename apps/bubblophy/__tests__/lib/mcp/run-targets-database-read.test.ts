// @vitest-environment node

import type { BubblophyMcpRunTargetReadResult } from '@/lib/mcp/run-targets';
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
  tokenState: 'active' | null;
  tokenScopes: ('issues:read' | 'runs:update')[] | null;
  tokenExpiresAt: string | null;
}

interface SelectCall {
  selectedKeys: string[];
  fromTable: string | null;
  joinedTables: string[];
  whereParams: string;
  whereSql: string | null;
  orderByCalls: number;
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
      whereParams: '[]',
      whereSql: null,
      orderByCalls: 0,
    };
    selectCalls.push(this.call);
  }

  from(table: DrizzleTable) {
    this.call.fromTable = getTableName(table);
    return this;
  }

  innerJoin(table: DrizzleTable) {
    this.call.joinedTables.push(getTableName(table));
    return this;
  }

  leftJoin(table: DrizzleTable) {
    this.call.joinedTables.push(getTableName(table));
    return this;
  }

  where(condition: SQL) {
    const query = new PgDialect().sqlToQuery(condition);
    this.call.whereParams = JSON.stringify(query.params);
    this.call.whereSql = query.sql;
    return this;
  }

  orderBy() {
    this.call.orderByCalls += 1;
    return this;
  }

  then<TResult1 = RunTargetRow[], TResult2 = never>(
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

describe('selectBubblophyMcpRunTargetsForUser', () => {
  beforeEach(() => {
    rows = [];
    selectCalls.length = 0;
    dbMock.select.mockClear();
  });

  it('starts at membership and never selects token secrets or lifecycle actors', async () => {
    rows = [createRow('token_codex', 'Codex')];
    const { selectBubblophyMcpRunTargetsForUser } =
      await import('@/lib/mcp/run-targets-database-read');

    await expect(
      selectBubblophyMcpRunTargetsForUser({
        authUserId: 'user-1',
        projectId: 'project_bv',
      })
    ).resolves.toEqual({
      project: {
        id: 'project_bv',
        key: 'BV',
        isArchived: false,
        role: 'member',
      },
      candidates: [
        {
          id: 'token_codex',
          label: 'Codex',
          state: 'active',
          scopes: ['issues:read', 'runs:update'],
          expiresAt: null,
        },
      ],
    } satisfies BubblophyMcpRunTargetReadResult);
    expect(selectCalls).toHaveLength(1);
    expect(selectCalls[0]).toMatchObject({
      selectedKeys: [
        'projectId',
        'projectKey',
        'projectIsArchived',
        'memberRole',
        'tokenId',
        'tokenLabel',
        'tokenState',
        'tokenScopes',
        'tokenExpiresAt',
      ],
      fromTable: 'bubblophy_project_members',
      joinedTables: ['bubblophy_projects', 'bubblophy_agent_tokens'],
      whereParams:
        '["user-1","project_bv",false,"owner","maintainer","member"]',
      orderByCalls: 1,
    });
    expect(selectCalls[0]?.whereSql).toContain('auth_user_id');
    expect(selectCalls[0]?.whereSql).toContain('"bubblophy_projects"."id"');
    expect(selectCalls[0]?.whereSql).toContain('is_archived');
    expect(selectCalls[0]?.whereSql).toContain('"role" in');
    expect(JSON.stringify(selectCalls)).not.toMatch(
      /tokenHash|createdBy|lastUsed|revokedAt/i
    );
  });

  it('returns an empty target set for a visible project without tokens', async () => {
    rows = [createRow(null, null)];
    const { selectBubblophyMcpRunTargetsForUser } =
      await import('@/lib/mcp/run-targets-database-read');

    await expect(
      selectBubblophyMcpRunTargetsForUser({
        authUserId: 'user-1',
        projectId: 'project_bv',
      })
    ).resolves.toMatchObject({ candidates: [] });
  });

  it('returns null without revealing foreign or missing projects', async () => {
    const { selectBubblophyMcpRunTargetsForUser } =
      await import('@/lib/mcp/run-targets-database-read');

    await expect(
      selectBubblophyMcpRunTargetsForUser({
        authUserId: 'user-1',
        projectId: 'foreign',
      })
    ).resolves.toBeNull();
  });
});

/** Builds one deterministic membership/project/token join row. */
function createRow(
  tokenId: string | null,
  tokenLabel: string | null
): RunTargetRow {
  return {
    projectId: 'project_bv',
    projectKey: 'BV',
    projectIsArchived: false,
    memberRole: 'member',
    tokenId,
    tokenLabel,
    tokenState: tokenId ? 'active' : null,
    tokenScopes: tokenId ? ['issues:read', 'runs:update'] : null,
    tokenExpiresAt: null,
  };
}
