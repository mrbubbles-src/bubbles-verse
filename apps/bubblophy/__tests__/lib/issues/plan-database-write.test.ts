import type { BubblophyIssuePlanDraftStoreInput } from '@/lib/issues/plans';

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { getTableName } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type DrizzleTable = Parameters<typeof getTableName>[0];
type PlanStep = BubblophyIssuePlanDraftStoreInput['steps'][number];
type MockRowValue = string | number | null | PlanStep[];
type MockRow = Record<string, MockRowValue>;

interface LockCall {
  strength: string;
  tableNames: string[];
}

interface MockState {
  issueVisible: boolean;
  memberRole: string | null;
  planVersions: number[];
  planInserts: MockRow[];
  eventInserts: MockRow[];
  lockCalls: LockCall[];
}

const state: MockState = {
  issueVisible: true,
  memberRole: 'member',
  planVersions: [],
  planInserts: [],
  eventInserts: [],
  lockCalls: [],
};

let issueLockTail = Promise.resolve();

/** Creates one transaction mock that holds its issue lock until completion. */
function createMockTransaction() {
  let releaseIssueLock: (() => void) | null = null;

  /** Acquires the shared per-issue lock once for this transaction. */
  async function acquireIssueLock() {
    if (releaseIssueLock) {
      return;
    }

    const previousLock = issueLockTail;
    issueLockTail = new Promise<void>((resolve) => {
      releaseIssueLock = resolve;
    });
    await previousLock;
  }

  return {
    select: vi.fn(
      (selection: Record<string, object>) =>
        new MockSelectQuery(Object.keys(selection), acquireIssueLock)
    ),
    insert: vi.fn((table: DrizzleTable) => new MockInsertQuery(table)),
    release() {
      releaseIssueLock?.();
    },
  };
}

type MockTransaction = ReturnType<typeof createMockTransaction>;

class MockSelectQuery implements PromiseLike<MockRow[]> {
  private tableName: string | null = null;
  private locksIssue = false;

  constructor(
    private readonly selectedKeys: string[],
    private readonly acquireIssueLock: () => Promise<void>
  ) {}

  from(table: DrizzleTable) {
    this.tableName = getTableName(table);
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

  for(strength: string, config: { of?: DrizzleTable | DrizzleTable[] } = {}) {
    const tables = config.of
      ? Array.isArray(config.of)
        ? config.of
        : [config.of]
      : [];

    state.lockCalls.push({
      strength,
      tableNames:
        tables.length > 0
          ? tables.map((table) => getTableName(table))
          : this.tableName
            ? [this.tableName]
            : [],
    });
    this.locksIssue =
      strength === 'update' && this.tableName === 'bubblophy_issues';
    return this;
  }

  then<TResult1 = MockRow[], TResult2 = never>(
    onfulfilled?:
      | ((value: MockRow[]) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: Error) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return this.rows().then(onfulfilled, onrejected);
  }

  /** Resolves deterministic rows for the selected table. */
  private async rows(): Promise<MockRow[]> {
    if (this.tableName === 'bubblophy_projects') {
      return state.issueVisible ? [{ id: 'project_bv', projectKey: 'BV' }] : [];
    }

    if (this.tableName === 'bubblophy_issues') {
      if (this.locksIssue) {
        await this.acquireIssueLock();
      }
      return state.issueVisible
        ? [
            {
              id: 'issue_bv_12',
              issueNumber: 12,
              projectId: 'project_bv',
              projectKey: 'BV',
            },
          ]
        : [];
    }

    if (this.tableName === 'bubblophy_project_members') {
      return state.memberRole ? [{ role: state.memberRole }] : [];
    }

    if (this.tableName === 'bubblophy_issue_plans') {
      const version = Math.max(0, ...state.planVersions);
      return version > 0 ? [{ version }] : [];
    }

    throw new Error(
      `Unexpected select from ${this.tableName ?? 'an unset table'} for ${this.selectedKeys.join(', ')}`
    );
  }
}

class MockInsertQuery implements PromiseLike<MockRow[]> {
  private valuesInput: MockRow | null = null;

  constructor(private readonly table: DrizzleTable) {}

  values(input: MockRow) {
    this.valuesInput = input;
    return this;
  }

  async returning(): Promise<MockRow[]> {
    const input = this.requireValues();
    const tableName = getTableName(this.table);

    if (tableName !== 'bubblophy_issue_plans') {
      throw new Error(`Unexpected returning insert into ${tableName}`);
    }

    state.planInserts.push(input);
    state.planVersions.push(Number(input.version));
    return [
      {
        version: Number(input.version),
        summary: String(input.summary),
        steps: input.steps as PlanStep[],
      },
    ];
  }

  then<TResult1 = MockRow[], TResult2 = never>(
    onfulfilled?:
      | ((value: MockRow[]) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: Error) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return this.insertWithoutReturning().then(onfulfilled, onrejected);
  }

  /** Persists an audit event for inserts without a returning clause. */
  private async insertWithoutReturning(): Promise<MockRow[]> {
    const input = this.requireValues();
    const tableName = getTableName(this.table);

    if (tableName !== 'bubblophy_issue_events') {
      throw new Error(`Unexpected insert into ${tableName}`);
    }

    state.eventInserts.push(input);
    return [];
  }

  /** Returns the configured insert payload or fails the malformed mock query. */
  private requireValues(): MockRow {
    if (!this.valuesInput) {
      throw new Error('Insert values were not configured.');
    }

    return this.valuesInput;
  }
}

const dbMock = {
  transaction: vi.fn(
    async <Result>(
      handler: (tx: MockTransaction) => Promise<Result>
    ): Promise<Result> => {
      const tx = createMockTransaction();

      try {
        return await handler(tx);
      } finally {
        tx.release();
      }
    }
  ),
};

beforeEach(() => {
  vi.resetModules();
  vi.doMock('@/drizzle/db', () => ({ db: dbMock }));
  state.issueVisible = true;
  state.memberRole = 'member';
  state.planVersions = [];
  state.planInserts = [];
  state.eventInserts = [];
  state.lockCalls = [];
  issueLockTail = Promise.resolve();
  dbMock.transaction.mockClear();
});

describe('Drizzle issue plan draft store', () => {
  it('serializes concurrent proposals and writes consecutive versions', async () => {
    const { createDrizzleBubblophyIssuePlanDraftStore } =
      await import('@/lib/issues/plan-database-write');
    const store = createDrizzleBubblophyIssuePlanDraftStore();

    const results = await Promise.all([
      store.createIssuePlanVersionWithEvent(createInput('Erster Entwurf')),
      store.createIssuePlanVersionWithEvent(createInput('Zweiter Entwurf')),
    ]);

    expect(results.map((result) => result.status)).toEqual([
      'created',
      'created',
    ]);
    expect(state.planVersions).toEqual([1, 2]);
    expect(state.eventInserts).toHaveLength(2);
    expect(state.lockCalls).toHaveLength(6);
    expect(
      state.lockCalls.filter(
        (call) =>
          call.strength === 'share' &&
          call.tableNames.join(',') === 'bubblophy_projects'
      )
    ).toHaveLength(2);
    expect(
      state.lockCalls.filter(
        (call) =>
          call.strength === 'update' &&
          call.tableNames.join(',') === 'bubblophy_issues'
      )
    ).toHaveLength(2);
    expect(
      state.lockCalls.filter(
        (call) =>
          call.strength === 'update' &&
          call.tableNames.join(',') === 'bubblophy_project_members'
      )
    ).toHaveLength(2);
  });

  it('rejects a locked viewer membership before inserting a plan', async () => {
    state.memberRole = 'viewer';
    const { createDrizzleBubblophyIssuePlanDraftStore } =
      await import('@/lib/issues/plan-database-write');

    await expect(
      createDrizzleBubblophyIssuePlanDraftStore().createIssuePlanVersionWithEvent(
        createInput('Nicht erlaubt')
      )
    ).resolves.toEqual({ status: 'forbidden' });
    expect(state.planInserts).toHaveLength(0);
    expect(state.eventInserts).toHaveLength(0);
  });

  it('keeps its lock order compatible with membership audit writes', async () => {
    const { createDrizzleBubblophyIssuePlanDraftStore } =
      await import('@/lib/issues/plan-database-write');

    await createDrizzleBubblophyIssuePlanDraftStore().createIssuePlanVersionWithEvent(
      createInput('Kompatible Sperren')
    );

    expect(state.lockCalls).toEqual([
      { strength: 'share', tableNames: ['bubblophy_projects'] },
      { strength: 'update', tableNames: ['bubblophy_issues'] },
      { strength: 'update', tableNames: ['bubblophy_project_members'] },
    ]);

    const membershipStoreSource = readFileSync(
      resolve(process.cwd(), 'lib/projects/members-database-write.ts'),
      'utf8'
    );
    expect(membershipStoreSource).toMatch(
      /update\(bubblophyProjectMembers\)[\s\S]*?insert\(bubblophyProjectEvents\)/
    );
    expect(membershipStoreSource).toMatch(
      /delete\(bubblophyProjectMembers\)[\s\S]*?insert\(bubblophyProjectEvents\)/
    );
  });
});

/** Builds one valid normalized store input for direct store tests. */
function createInput(summary: string): BubblophyIssuePlanDraftStoreInput {
  return {
    authUserId: 'user_member',
    oauthClientId: 'client-1',
    issueId: 'BV-12',
    summary,
    steps: [{ id: 'step_1', text: 'Vertrag prüfen' }],
  };
}
