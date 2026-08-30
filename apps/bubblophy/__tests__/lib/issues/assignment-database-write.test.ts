import type { SQL } from 'drizzle-orm';

import { getTableName } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type DrizzleTable = Parameters<typeof getTableName>[0];
type MockValue = string | number | boolean | object | null;
type MockRow = Record<string, MockValue>;

interface SelectCall {
  selectedKeys: string[];
  fromTable: string | null;
  joinedTables: string[];
  whereSql: string | null;
}

const lockWriteContextMock = vi.fn();
const selectCalls: SelectCall[] = [];
const state = {
  assignedAuthUserId: null as string | null,
  assigneeDisplayName: 'Martin' as string | null,
  events: [] as MockRow[],
};

vi.mock('@/lib/issues/contributor-write-context-database', () => ({
  lockBubblophyIssueContributorWriteContext: (
    tx: MockTransaction,
    input: {
      authUserId: string;
      projectKey: string;
      issueNumber: number;
      relatedAuthUserIds: string[];
    }
  ) => lockWriteContextMock(tx, input),
}));

class MockSelectQuery implements PromiseLike<MockRow[]> {
  private readonly call: SelectCall;

  constructor(selectedKeys: string[]) {
    this.call = {
      selectedKeys,
      fromTable: null,
      joinedTables: [],
      whereSql: null,
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
    this.call.whereSql = new PgDialect().sqlToQuery(condition).sql;
    return this;
  }

  limit() {
    return this;
  }

  then<TResult1 = MockRow[], TResult2 = TResult1>(
    onfulfilled?:
      | ((value: MockRow[]) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: Error) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.rows()).then(onfulfilled, onrejected);
  }

  /** Returns rows for the current issue, target member, or plan count. */
  private rows(): MockRow[] {
    if (this.call.fromTable === 'bubblophy_issues') {
      return [
        {
          id: 'issue_bv_12',
          issueNumber: 12,
          assignedAuthUserId: state.assignedAuthUserId,
          projectName: 'Bubblesverse',
        },
      ];
    }

    if (this.call.fromTable === 'bubblophy_project_members') {
      return [
        {
          authUserId: state.assignedAuthUserId,
          displayName: state.assigneeDisplayName,
        },
      ];
    }

    if (this.call.fromTable === 'bubblophy_issue_plans') {
      return [{ count: 2 }];
    }

    throw new Error(
      `Unexpected select from ${this.call.fromTable ?? 'unset'}.`
    );
  }
}

class MockUpdateQuery {
  private valuesInput: MockRow | null = null;

  set(input: MockRow) {
    this.valuesInput = input;
    return this;
  }

  where() {
    return this;
  }

  async returning() {
    if (!this.valuesInput) {
      throw new Error('Update values were not configured.');
    }

    state.assignedAuthUserId = this.valuesInput.assignedAuthUserId as
      | string
      | null;

    return [
      {
        id: 'issue_bv_12',
        issueNumber: 12,
        title: 'Zuweisung testen',
        description: '',
        status: 'ready',
        priority: 'high',
        assignedAuthUserId: state.assignedAuthUserId,
        requiresHumanApproval: false,
      },
    ];
  }
}

class MockInsertQuery implements PromiseLike<MockRow[]> {
  values(input: MockRow) {
    state.events.push(input);
    return this;
  }

  then<TResult1 = MockRow[], TResult2 = TResult1>(
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
  update: vi.fn(() => new MockUpdateQuery()),
  insert: vi.fn(() => new MockInsertQuery()),
};

type MockTransaction = typeof txMock;

const dbMock = {
  transaction: vi.fn(
    async <Result>(
      handler: (tx: MockTransaction) => Promise<Result>
    ): Promise<Result> => handler(txMock)
  ),
};

vi.mock('@/drizzle/db', () => ({ db: dbMock }));

beforeEach(() => {
  state.assignedAuthUserId = null;
  state.assigneeDisplayName = 'Martin';
  state.events = [];
  selectCalls.length = 0;
  lockWriteContextMock.mockReset();
  lockWriteContextMock.mockResolvedValue({
    status: 'ready',
    issueDatabaseId: 'issue_bv_12',
    projectId: 'project_bv',
    projectKey: 'BV',
    memberships: [
      { authUserId: 'user-member', role: 'member' },
      { authUserId: 'auth-martin', role: 'member' },
    ],
  });
  txMock.select.mockClear();
  txMock.update.mockClear();
  txMock.insert.mockClear();
  dbMock.transaction.mockClear();
});

describe('Drizzle issue assignment update store', () => {
  it('loads the locked target label after the update without selecting e-mail', async () => {
    const { createDrizzleBubblophyIssueAssigneeUpdateStore } =
      await import('@/lib/issues/assignment-database-write');

    await expect(
      createDrizzleBubblophyIssueAssigneeUpdateStore().updateIssueAssigneeWithEvent(
        {
          authUserId: 'user-member',
          issueId: 'BV-12',
          assigneeAuthUserId: 'auth-martin',
        }
      )
    ).resolves.toMatchObject({
      status: 'updated',
      issue: {
        issue: {
          assignedAuthUserId: 'auth-martin',
          assigneeLabel: 'Martin',
          planStepCount: 2,
        },
      },
    });
    expect(lockWriteContextMock).toHaveBeenCalledWith(txMock, {
      authUserId: 'user-member',
      projectKey: 'BV',
      issueNumber: 12,
      relatedAuthUserIds: ['auth-martin'],
    });
    expect(selectCalls[1]).toMatchObject({
      selectedKeys: ['authUserId', 'displayName'],
      fromTable: 'bubblophy_project_members',
      joinedTables: ['bubblophy_user_profiles'],
    });
    expect(selectCalls[1]?.selectedKeys).not.toContain('normalizedEmail');
    expect(state.events).toHaveLength(1);
  });

  it('falls back to the locked target auth ID when no display name exists', async () => {
    state.assigneeDisplayName = null;
    const { createDrizzleBubblophyIssueAssigneeUpdateStore } =
      await import('@/lib/issues/assignment-database-write');

    const result =
      await createDrizzleBubblophyIssueAssigneeUpdateStore().updateIssueAssigneeWithEvent(
        {
          authUserId: 'user-member',
          issueId: 'BV-12',
          assigneeAuthUserId: 'auth-martin',
        }
      );

    expect(result).toMatchObject({
      status: 'updated',
      issue: { issue: { assigneeLabel: 'auth-martin' } },
    });
  });

  it('returns the unassigned label without a target-profile read', async () => {
    state.assignedAuthUserId = 'auth-martin';
    const { createDrizzleBubblophyIssueAssigneeUpdateStore } =
      await import('@/lib/issues/assignment-database-write');

    const result =
      await createDrizzleBubblophyIssueAssigneeUpdateStore().updateIssueAssigneeWithEvent(
        {
          authUserId: 'user-member',
          issueId: 'BV-12',
          assigneeAuthUserId: null,
        }
      );

    expect(result).toMatchObject({
      status: 'updated',
      issue: { issue: { assigneeLabel: 'Nicht zugewiesen' } },
    });
    expect(
      selectCalls.some((call) => call.fromTable === 'bubblophy_project_members')
    ).toBe(false);
  });
});
