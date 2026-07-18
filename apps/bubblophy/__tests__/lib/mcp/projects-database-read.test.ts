// @vitest-environment node

import type { BubblophyMcpProject } from '@/lib/mcp/projects';
import type { SQL } from 'drizzle-orm';

import { getTableName } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type DrizzleTable = Parameters<typeof getTableName>[0];

interface SelectCall {
  selectedKeys: string[];
  fromTable: string | null;
  joinedTables: string[];
  whereCalls: number;
  whereParams: string;
  whereSql: string | null;
  orderByCalls: number;
}

const selectCalls: SelectCall[] = [];
const projectRows: BubblophyMcpProject[] = [
  {
    id: 'project_bv',
    key: 'BV',
    name: 'Bubblesverse',
    description: 'Aktives Projekt',
    role: 'owner',
    isArchived: false,
  },
  {
    id: 'project_old',
    key: 'OLD',
    name: 'Archiv',
    description: '',
    role: 'viewer',
    isArchived: true,
  },
];

class MockSelectQuery implements PromiseLike<BubblophyMcpProject[]> {
  private readonly call: SelectCall;

  constructor(selectedKeys: string[]) {
    this.call = {
      selectedKeys,
      fromTable: null,
      joinedTables: [],
      whereCalls: 0,
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

  where(condition: SQL) {
    const query = new PgDialect().sqlToQuery(condition);
    this.call.whereCalls += 1;
    this.call.whereParams = JSON.stringify(query.params);
    this.call.whereSql = query.sql;
    return this;
  }

  orderBy() {
    this.call.orderByCalls += 1;
    return this;
  }

  then<TResult1 = BubblophyMcpProject[], TResult2 = never>(
    onfulfilled?:
      | ((value: BubblophyMcpProject[]) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: Error) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(projectRows).then(onfulfilled, onrejected);
  }
}

const dbMock = {
  select: vi.fn(
    (selection: Record<string, object>) =>
      new MockSelectQuery(Object.keys(selection))
  ),
};

vi.mock('@/drizzle/db', () => ({ db: dbMock }));

describe('selectBubblophyMcpProjectsForUser', () => {
  beforeEach(() => {
    selectCalls.length = 0;
    dbMock.select.mockClear();
  });

  it('starts at memberships and selects only public project fields plus role', async () => {
    const { selectBubblophyMcpProjectsForUser } =
      await import('@/lib/mcp/projects-database-read');

    await expect(selectBubblophyMcpProjectsForUser('user-1')).resolves.toEqual(
      projectRows
    );
    expect(selectCalls).toEqual([
      {
        selectedKeys: [
          'id',
          'key',
          'name',
          'description',
          'role',
          'isArchived',
        ],
        fromTable: 'bubblophy_project_members',
        joinedTables: ['bubblophy_projects'],
        whereCalls: 1,
        whereParams: '["user-1"]',
        whereSql: '"bubblophy_project_members"."auth_user_id" = $1',
        orderByCalls: 1,
      },
    ]);
    expect(JSON.stringify(selectCalls)).not.toContain('token');
    expect(JSON.stringify(selectCalls)).not.toContain('authUserId');
  });
});
