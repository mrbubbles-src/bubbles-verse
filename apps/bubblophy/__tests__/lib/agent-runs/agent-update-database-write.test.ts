import { getTableName } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type DrizzleTable = Parameters<typeof getTableName>[0];
type MockRowValue = string | string[] | null;
type MockRow = Record<string, MockRowValue>;

interface SelectCall {
  selectedKeys: string[];
  tableName: string | null;
}

const selectCalls: SelectCall[] = [];

const rows = {
  token: [
    {
      id: 'token_attacker',
      projectId: 'project_bv',
      label: 'Second token',
      scopes: ['runs:update'],
      state: 'active',
      expiresAt: null,
    },
  ],
  run: [
    {
      id: 'run_bv_12',
      agentTokenId: 'token_assigned',
      state: 'approved',
      issueDatabaseId: 'issue_bv_12',
      issueNumber: '12',
      projectId: 'project_bv',
      projectKey: 'BV',
    },
  ],
} satisfies Record<string, MockRow[]>;

class MockSelectQuery implements PromiseLike<MockRow[]> {
  private readonly call: SelectCall;

  constructor(selectedKeys: string[]) {
    this.call = { selectedKeys, tableName: null };
    selectCalls.push(this.call);
  }

  from(table: DrizzleTable) {
    this.call.tableName = getTableName(table);
    return this;
  }

  innerJoin() {
    return this;
  }

  where() {
    return this;
  }

  limit() {
    return this;
  }

  then<TResult1 = MockRow[], TResult2 = never>(
    onfulfilled?:
      | ((value: MockRow[]) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: Error) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    const result = this.call.selectedKeys.includes('label')
      ? rows.token
      : rows.run;

    return Promise.resolve(result).then(onfulfilled, onrejected);
  }
}

const txMock = {
  select: vi.fn(
    (selection: Record<string, object>) =>
      new MockSelectQuery(Object.keys(selection))
  ),
  update: vi.fn(),
  insert: vi.fn(),
};

const dbMock = {
  transaction: vi.fn(
    async <Result>(handler: (tx: typeof txMock) => Promise<Result>) =>
      handler(txMock)
  ),
};

vi.mock('@/drizzle/db', () => ({ db: dbMock }));

describe('createDrizzleBubblophyAgentRunAgentUpdateStore', () => {
  beforeEach(() => {
    selectCalls.length = 0;
    txMock.select.mockClear();
    txMock.update.mockClear();
    txMock.insert.mockClear();
    dbMock.transaction.mockClear();
  });

  it('hides a same-project run assigned to another token', async () => {
    const { createDrizzleBubblophyAgentRunAgentUpdateStore } =
      await import('@/lib/agent-runs/agent-update-database-write');

    await expect(
      createDrizzleBubblophyAgentRunAgentUpdateStore().updateRunFromAgent({
        runId: 'run_bv_12',
        tokenHash: 'hashed_attacker_token',
        state: 'running',
        message: '',
        result: null,
      })
    ).resolves.toEqual({ status: 'not_found' });
    expect(txMock.update).not.toHaveBeenCalled();
    expect(txMock.insert).not.toHaveBeenCalled();
  });
});
