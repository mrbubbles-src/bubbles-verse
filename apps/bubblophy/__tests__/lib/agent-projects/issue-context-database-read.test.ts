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

interface MockRows {
  token: MockRow[];
  project: MockRow[];
  issues: MockRow[];
  plans: MockRow[];
}

const selectCalls: SelectCall[] = [];
const updateCalls: UpdateCall[] = [];
const defaultRows = {
  token: [
    {
      id: 'token_reader',
      projectId: 'project_bv',
      scopes: ['issues:read'],
      state: 'active',
      expiresAt: null,
    },
  ],
  project: [
    {
      id: 'project_bv',
      key: 'BV',
      name: 'Bubblesverse',
      isArchived: false,
    },
  ],
  issues: [
    {
      databaseId: 'issue_bv_12',
      issueNumber: 12,
      title: 'Lokalen Agenten mit Issues versorgen',
      description: 'Nur lesen, nichts starten.',
      status: 'ready',
      priority: 'high',
      assignedAuthUserId: 'user_member',
    },
    {
      databaseId: 'issue_bv_13',
      issueNumber: 13,
      title: 'Unzugewiesenes Issue',
      description: '',
      status: 'blocked',
      priority: 'medium',
      assignedAuthUserId: null,
    },
    {
      databaseId: 'issue_bv_14',
      issueNumber: 14,
      title: 'Erledigtes Issue bleibt verborgen',
      description: 'Darf nicht an Agenten gehen.',
      status: 'done',
      priority: 'low',
      assignedAuthUserId: null,
    },
  ],
  plans: [
    {
      issueId: 'issue_bv_12',
      version: 2,
      summary: 'Issue-Kontext bereitstellen.',
      steps: [{ id: 'step_1', text: 'Offene Issues abrufen' }],
    },
    {
      issueId: 'issue_bv_12',
      version: 1,
      summary: 'Alt.',
      steps: [{ id: 'step_old', text: 'Nicht nutzen' }],
    },
  ],
} satisfies MockRows;
let rows: MockRows = defaultRows;

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

  constructor(table: DrizzleTable) {
    this.call = {
      tableName: getTableName(table),
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
  update: vi.fn((table: DrizzleTable) => new MockUpdateQuery(table)),
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
 * @returns Mock rows for token, project, issue, or plan lookup.
 */
function rowsForCall(call: SelectCall) {
  if (call.selectedKeys.includes('scopes')) {
    return rows.token;
  }

  if (call.selectedKeys.includes('isArchived')) {
    return rows.project;
  }

  if (call.selectedKeys.includes('issueNumber')) {
    return rows.issues.filter((row) => row.status !== 'done');
  }

  return rows.plans;
}

describe('createDrizzleBubblophyAgentProjectIssuesStore', () => {
  beforeEach(() => {
    rows = defaultRows;
    selectCalls.length = 0;
    updateCalls.length = 0;
    txMock.select.mockClear();
    txMock.update.mockClear();
    dbMock.transaction.mockClear();
  });

  it('returns open issues and records last_used_at on successful reads', async () => {
    const { createDrizzleBubblophyAgentProjectIssuesStore } = await import(
      '@/lib/agent-projects/issue-context-database-read'
    );

    const result =
      await createDrizzleBubblophyAgentProjectIssuesStore().readProjectIssuesForAgent(
        {
          projectId: 'project_bv',
          tokenHash: 'hashed_test_token',
        }
      );

    expect(result).toEqual({
      status: 'found',
      context: {
        project: {
          id: 'project_bv',
          key: 'BV',
          name: 'Bubblesverse',
        },
        issues: [
          {
            id: 'BV-12',
            title: 'Lokalen Agenten mit Issues versorgen',
            description: 'Nur lesen, nichts starten.',
            status: 'ready',
            priority: 'high',
            assignee: 'assigned',
            latestPlan: {
              version: 2,
              summary: 'Issue-Kontext bereitstellen.',
              steps: [{ id: 'step_1', text: 'Offene Issues abrufen' }],
            },
          },
          {
            id: 'BV-13',
            title: 'Unzugewiesenes Issue',
            description: '',
            status: 'blocked',
            priority: 'medium',
            assignee: 'unassigned',
            latestPlan: null,
          },
        ],
      },
    });
    expect(JSON.stringify(result)).not.toContain('token_reader');
    expect(JSON.stringify(result)).not.toContain('hashed_test_token');
    expect(JSON.stringify(result)).not.toContain('user_member');
    expect(JSON.stringify(result)).not.toContain('issue_bv_14');
    expect(JSON.stringify(result)).not.toContain('Erledigtes Issue');
    expect(updateCalls).toHaveLength(1);
    expect(updateCalls[0]).toMatchObject({
      tableName: 'bubblophy_agent_tokens',
      values: {
        lastUsedAt: expect.any(String),
      },
    });
  });

  it('rejects missing, unavailable, wrong-scope, and cross-project tokens', async () => {
    const { createDrizzleBubblophyAgentProjectIssuesStore } = await import(
      '@/lib/agent-projects/issue-context-database-read'
    );
    const store = createDrizzleBubblophyAgentProjectIssuesStore();

    rows = { ...defaultRows, token: [] };
    await expect(
      store.readProjectIssuesForAgent({
        projectId: 'project_bv',
        tokenHash: 'missing',
      })
    ).resolves.toEqual({ status: 'invalid_token' });
    expect(updateCalls).toHaveLength(0);

    rows = {
      ...defaultRows,
      token: [{ ...defaultRows.token[0]!, state: 'paused' }],
    };
    await expect(
      store.readProjectIssuesForAgent({
        projectId: 'project_bv',
        tokenHash: 'paused',
      })
    ).resolves.toEqual({ status: 'token_unavailable', reason: 'paused' });
    expect(updateCalls).toHaveLength(0);

    rows = {
      ...defaultRows,
      token: [{ ...defaultRows.token[0]!, state: 'revoked' }],
    };
    await expect(
      store.readProjectIssuesForAgent({
        projectId: 'project_bv',
        tokenHash: 'revoked',
      })
    ).resolves.toEqual({ status: 'token_unavailable', reason: 'revoked' });
    expect(updateCalls).toHaveLength(0);

    rows = {
      ...defaultRows,
      token: [{ ...defaultRows.token[0]!, scopes: ['runs:update'] }],
    };
    await expect(
      store.readProjectIssuesForAgent({
        projectId: 'project_bv',
        tokenHash: 'wrong_scope',
      })
    ).resolves.toEqual({ status: 'forbidden_scope' });
    expect(updateCalls).toHaveLength(0);

    rows = {
      ...defaultRows,
      token: [{ ...defaultRows.token[0]!, projectId: 'project_other' }],
    };
    await expect(
      store.readProjectIssuesForAgent({
        projectId: 'project_bv',
        tokenHash: 'wrong_project',
      })
    ).resolves.toEqual({ status: 'project_mismatch' });
    expect(updateCalls).toHaveLength(0);
  });

  it('rejects expired tokens and archived projects before updating last_used_at', async () => {
    const { createDrizzleBubblophyAgentProjectIssuesStore } = await import(
      '@/lib/agent-projects/issue-context-database-read'
    );
    const store = createDrizzleBubblophyAgentProjectIssuesStore();

    rows = {
      ...defaultRows,
      token: [
        {
          ...defaultRows.token[0]!,
          expiresAt: '2000-01-01T00:00:00.000Z',
        },
      ],
    };
    await expect(
      store.readProjectIssuesForAgent({
        projectId: 'project_bv',
        tokenHash: 'expired',
      })
    ).resolves.toEqual({ status: 'token_unavailable', reason: 'expired' });

    rows = {
      ...defaultRows,
      project: [{ ...defaultRows.project[0]!, isArchived: true }],
    };
    await expect(
      store.readProjectIssuesForAgent({
        projectId: 'project_bv',
        tokenHash: 'archived_project',
      })
    ).resolves.toEqual({ status: 'not_found' });

    expect(updateCalls).toHaveLength(0);
  });
});
