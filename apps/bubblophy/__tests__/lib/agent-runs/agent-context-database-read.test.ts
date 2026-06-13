import { getTableName } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type DrizzleTable = Parameters<typeof getTableName>[0];
type MockPlanStep = {
  id: string;
  text: string;
};
type MockRowValue =
  | string
  | number
  | boolean
  | string[]
  | MockPlanStep[]
  | null;
type MockRow = Record<string, MockRowValue>;

interface SelectCall {
  selectedKeys: string[];
  tableName: string | null;
}

interface UpdateCall {
  tableName: string | null;
  values: Record<string, string>;
}

const selectCalls: SelectCall[] = [];
const updateCalls: UpdateCall[] = [];

const rows = {
  token: [
    {
      id: 'token_reader',
      projectId: 'project_bv',
      scopes: ['issues:read'],
      state: 'active',
      expiresAt: null,
    },
  ],
  run: [
    {
      id: 'run_bv_12',
      state: 'approved',
      updatedAt: '2026-06-14T10:00:00.000Z',
      issueDatabaseId: 'issue_bv_12',
      issueNumber: 12,
      issueTitle: 'Agent-Kontext lesen',
      issueStatus: 'ready',
      issuePriority: 'high',
      projectId: 'project_bv',
      projectKey: 'BV',
      projectName: 'Bubblesverse',
    },
  ],
  plan: [
    {
      version: 2,
      summary: 'Lokalen Agenten mit Kontext versorgen.',
      steps: [{ id: 'step_1', text: 'Run-Kontext abrufen' }],
    },
  ],
} satisfies Record<string, MockRow[]>;

class MockSelectQuery implements PromiseLike<MockRow[]> {
  private readonly call: SelectCall;

  constructor(selectedKeys: string[]) {
    this.call = {
      selectedKeys,
      tableName: null,
    };
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

  orderBy() {
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
    return Promise.resolve(rowsForCall(this.call)).then(
      onfulfilled,
      onrejected
    );
  }
}

class MockUpdateQuery implements PromiseLike<MockRow[]> {
  private readonly call: UpdateCall;

  constructor() {
    this.call = {
      tableName: null,
      values: {},
    };
    updateCalls.push(this.call);
  }

  set(values: Record<string, string>) {
    this.call.values = values;
    return this;
  }

  where() {
    return this;
  }

  then<TResult1 = MockRow[], TResult2 = never>(
    onfulfilled?:
      | ((value: MockRow[]) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: Error) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve([]).then(onfulfilled, onrejected);
  }
}

const txMock = {
  select: vi.fn(
    (selection: Record<string, object>) =>
      new MockSelectQuery(Object.keys(selection))
  ),
  update: vi.fn((table: DrizzleTable) => {
    const query = new MockUpdateQuery();
    updateCalls.at(-1)!.tableName = getTableName(table);
    return query;
  }),
};

const dbMock = {
  transaction: vi.fn(
    async <Result>(handler: (tx: typeof txMock) => Promise<Result>) =>
      handler(txMock)
  ),
};

vi.mock('@/drizzle/db', () => ({
  db: dbMock,
}));

/**
 * Returns deterministic rows based on the selected Drizzle projection.
 *
 * @param call Recorded select call.
 * @returns Mock rows for token, run, or latest plan lookup.
 */
function rowsForCall(call: SelectCall) {
  if (call.selectedKeys.includes('scopes')) {
    return rows.token;
  }

  if (call.selectedKeys.includes('issueTitle')) {
    return rows.run;
  }

  return rows.plan;
}

describe('createDrizzleBubblophyAgentRunContextStore', () => {
  beforeEach(() => {
    selectCalls.length = 0;
    updateCalls.length = 0;
    txMock.select.mockClear();
    txMock.update.mockClear();
    dbMock.transaction.mockClear();
  });

  it('returns minimal context and records last_used_at on successful reads', async () => {
    const { createDrizzleBubblophyAgentRunContextStore } = await import(
      '@/lib/agent-runs/agent-context-database-read'
    );

    const result =
      await createDrizzleBubblophyAgentRunContextStore().readRunContextForAgent(
        {
          runId: 'run_bv_12',
          tokenHash: 'hashed_test_token',
        }
      );

    expect(result).toEqual({
      status: 'found',
      context: {
        run: {
          id: 'run_bv_12',
          state: 'approved',
          updatedAt: '2026-06-14T10:00:00.000Z',
        },
        project: {
          id: 'project_bv',
          key: 'BV',
          name: 'Bubblesverse',
        },
        issue: {
          id: 'BV-12',
          title: 'Agent-Kontext lesen',
          status: 'ready',
          priority: 'high',
        },
        latestPlan: {
          version: 2,
          summary: 'Lokalen Agenten mit Kontext versorgen.',
          steps: [{ id: 'step_1', text: 'Run-Kontext abrufen' }],
        },
      },
    });
    expect(JSON.stringify(result)).not.toContain('token_reader');
    expect(JSON.stringify(result)).not.toContain('hashed_test_token');
    expect(updateCalls).toHaveLength(1);
    expect(updateCalls[0]).toMatchObject({
      tableName: 'bubblophy_agent_tokens',
      values: {
        lastUsedAt: expect.any(String),
      },
    });
  });
});

describe('canAgentReadRunContext', () => {
  it('allows context reads only after human approval', async () => {
    const { canAgentReadRunContext } = await import(
      '@/lib/agent-runs/agent-context-database-read'
    );

    expect(canAgentReadRunContext('approved')).toBe(true);
    expect(canAgentReadRunContext('running')).toBe(true);
    expect(canAgentReadRunContext('needs_review')).toBe(true);
    expect(canAgentReadRunContext('completed')).toBe(true);
    expect(canAgentReadRunContext('failed')).toBe(true);
    expect(canAgentReadRunContext('requested')).toBe(false);
    expect(canAgentReadRunContext('cancelled')).toBe(false);
  });
});
