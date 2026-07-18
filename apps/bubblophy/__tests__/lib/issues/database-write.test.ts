import type { BubblophyIssueDraftCreateStoreInput } from '@/lib/issues/create';
import type { SQL } from 'drizzle-orm';

import { getTableName } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type DrizzleTable = Parameters<typeof getTableName>[0];
type MockValue =
  | string
  | number
  | boolean
  | null
  | MockValue[]
  | { [key: string]: MockValue };
type MockRow = Record<string, MockValue>;

interface LockCall {
  strength: string;
  tableName: string;
}

interface WhereCall {
  tableName: string;
  sql: string;
  serializedParams: string;
}

interface MockState {
  projectVisible: boolean;
  memberRoles: Map<string, string>;
  issueNumbers: number[];
  issueInserts: MockRow[];
  eventInserts: MockRow[];
  lockCalls: LockCall[];
  whereCalls: WhereCall[];
  failEventInsert: boolean;
}

const state: MockState = {
  projectVisible: true,
  memberRoles: new Map(),
  issueNumbers: [],
  issueInserts: [],
  eventInserts: [],
  lockCalls: [],
  whereCalls: [],
  failEventInsert: false,
};

let projectLockTail = Promise.resolve();

/** Creates one transaction mock that holds its project lock until completion. */
function createMockTransaction() {
  let releaseProjectLock: (() => void) | null = null;

  /** Acquires the shared project-numbering lock once for this transaction. */
  async function acquireProjectLock() {
    if (releaseProjectLock) {
      return;
    }

    const previousLock = projectLockTail;
    projectLockTail = new Promise<void>((resolve) => {
      releaseProjectLock = resolve;
    });
    await previousLock;
  }

  return {
    select: vi.fn(
      (selection: Record<string, object>) =>
        new MockSelectQuery(Object.keys(selection), acquireProjectLock)
    ),
    insert: vi.fn((table: DrizzleTable) => new MockInsertQuery(table)),
    release() {
      releaseProjectLock?.();
    },
  };
}

type MockTransaction = ReturnType<typeof createMockTransaction>;

class MockSelectQuery implements PromiseLike<MockRow[]> {
  private tableName: string | null = null;
  private params: MockValue[] = [];
  private locksProject = false;

  constructor(
    private readonly selectedKeys: string[],
    private readonly acquireProjectLock: () => Promise<void>
  ) {}

  from(table: DrizzleTable) {
    this.tableName = getTableName(table);
    return this;
  }

  where(condition: SQL) {
    const query = new PgDialect().sqlToQuery(condition);
    this.params = query.params as MockValue[];
    state.whereCalls.push({
      tableName: this.tableName ?? 'unset',
      sql: query.sql,
      serializedParams: JSON.stringify(query.params),
    });
    return this;
  }

  orderBy() {
    return this;
  }

  limit() {
    return this;
  }

  for(strength: string) {
    state.lockCalls.push({
      strength,
      tableName: this.tableName ?? 'unset',
    });
    this.locksProject =
      strength === 'no key update' && this.tableName === 'bubblophy_projects';
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
      if (this.locksProject) {
        await this.acquireProjectLock();
      }

      return state.projectVisible
        ? [{ id: 'project_bv', key: 'BV', name: 'Bubblophy' }]
        : [];
    }

    if (this.tableName === 'bubblophy_project_members') {
      const authUserId = String(this.params[1] ?? '');
      const role = state.memberRoles.get(authUserId);
      return role ? [{ role }] : [];
    }

    if (this.tableName === 'bubblophy_issues') {
      const issueNumber = Math.max(0, ...state.issueNumbers);
      return issueNumber > 0 ? [{ issueNumber }] : [];
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

    if (tableName !== 'bubblophy_issues') {
      throw new Error(`Unexpected returning insert into ${tableName}`);
    }

    state.issueInserts.push(input);
    state.issueNumbers.push(Number(input.issueNumber));
    return [
      {
        id: `issue_bv_${String(input.issueNumber)}`,
        issueNumber: Number(input.issueNumber),
        title: String(input.title),
        description: String(input.description),
        status: 'triage',
        priority: String(input.priority),
        assignedAuthUserId: null,
        requiresHumanApproval: true,
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

    if (state.failEventInsert) {
      throw new Error('Simulated audit insert failure.');
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
      const issueInsertLength = state.issueInserts.length;
      const eventInsertLength = state.eventInserts.length;
      const issueNumbersLength = state.issueNumbers.length;

      try {
        return await handler(tx);
      } catch (error) {
        state.issueInserts.length = issueInsertLength;
        state.eventInserts.length = eventInsertLength;
        state.issueNumbers.length = issueNumbersLength;
        throw error;
      } finally {
        tx.release();
      }
    }
  ),
};

beforeEach(() => {
  vi.resetModules();
  vi.doMock('@/drizzle/db', () => ({ db: dbMock }));
  state.projectVisible = true;
  state.memberRoles = new Map([
    ['user_one', 'member'],
    ['user_two', 'maintainer'],
  ]);
  state.issueNumbers = [];
  state.issueInserts = [];
  state.eventInserts = [];
  state.lockCalls = [];
  state.whereCalls = [];
  state.failEventInsert = false;
  projectLockTail = Promise.resolve();
  dbMock.transaction.mockClear();
});

describe('Drizzle issue draft store', () => {
  it('serializes two contributors into consecutive issue numbers', async () => {
    const { createDrizzleBubblophyIssueDraftStore } =
      await import('@/lib/issues/database-write');
    const store = createDrizzleBubblophyIssueDraftStore();

    const results = await Promise.all([
      store.createIssueWithCreatedEvent(
        createInput('user_one', 'Erstes Issue')
      ),
      store.createIssueWithCreatedEvent(
        createInput('user_two', 'Zweites Issue')
      ),
    ]);

    expect(results.map((result) => result?.issue.issueNumber)).toEqual([1, 2]);
    expect(state.issueNumbers).toEqual([1, 2]);
    expect(state.eventInserts).toHaveLength(2);
    expect(
      state.lockCalls.filter(
        (call) =>
          call.strength === 'no key update' &&
          call.tableName === 'bubblophy_projects'
      )
    ).toHaveLength(2);
    expect(
      state.lockCalls.filter(
        (call) =>
          call.strength === 'update' &&
          call.tableName === 'bubblophy_project_members'
      )
    ).toHaveLength(2);
  });

  it('writes only a triage draft and one OAuth-attributed created event', async () => {
    const { createDrizzleBubblophyIssueDraftStore } =
      await import('@/lib/issues/database-write');

    await createDrizzleBubblophyIssueDraftStore().createIssueWithCreatedEvent(
      createInput('user_one', 'Sicheres Issue')
    );

    expect(state.issueInserts).toEqual([
      expect.objectContaining({
        projectId: 'project_bv',
        issueNumber: 1,
        status: 'triage',
        priority: 'high',
        createdByAuthUserId: 'user_one',
        assignedAuthUserId: null,
        requiresHumanApproval: true,
      }),
    ]);
    expect(state.eventInserts).toEqual([
      expect.objectContaining({
        issueId: 'issue_bv_1',
        eventType: 'created',
        actorAuthUserId: 'user_one',
        actorOauthClientId: 'client-1',
        actorAgentTokenId: null,
        agentRunId: null,
        payload: expect.objectContaining({ source: 'oauth_mcp' }),
      }),
    ]);

    const projectWhere = state.whereCalls.find(
      (call) => call.tableName === 'bubblophy_projects'
    );
    const membershipWhere = state.whereCalls.find(
      (call) => call.tableName === 'bubblophy_project_members'
    );
    expect(projectWhere).toMatchObject({ serializedParams: '["BV",false]' });
    expect(projectWhere?.sql).toContain('"key" = $1');
    expect(projectWhere?.sql).toContain('"is_archived" = $2');
    expect(membershipWhere).toMatchObject({
      serializedParams: '["project_bv","user_one"]',
    });
    expect(membershipWhere?.sql).toContain('"project_id" = $1');
    expect(membershipWhere?.sql).toContain('"auth_user_id" = $2');
  });

  it.each([
    ['viewer', true, 'user_viewer'],
    ['removed member', true, 'user_removed'],
    ['archived project', false, 'user_one'],
  ])('rejects a %s before inserts', async (_label, projectVisible, userId) => {
    state.projectVisible = projectVisible;
    state.memberRoles.set('user_viewer', 'viewer');
    const { createDrizzleBubblophyIssueDraftStore } =
      await import('@/lib/issues/database-write');

    await expect(
      createDrizzleBubblophyIssueDraftStore().createIssueWithCreatedEvent(
        createInput(userId, 'Nicht erlaubt')
      )
    ).resolves.toBeNull();
    expect(state.issueInserts).toHaveLength(0);
    expect(state.eventInserts).toHaveLength(0);
  });

  it('rolls the issue insert back when its audit event fails', async () => {
    state.failEventInsert = true;
    const { createDrizzleBubblophyIssueDraftStore } =
      await import('@/lib/issues/database-write');

    await expect(
      createDrizzleBubblophyIssueDraftStore().createIssueWithCreatedEvent(
        createInput('user_one', 'Rollback')
      )
    ).rejects.toThrow('Simulated audit insert failure.');
    expect(state.issueInserts).toHaveLength(0);
    expect(state.issueNumbers).toHaveLength(0);
    expect(state.eventInserts).toHaveLength(0);
  });
});

/** Builds one valid normalized direct-store input. */
function createInput(
  authUserId: string,
  title: string
): BubblophyIssueDraftCreateStoreInput {
  return {
    authUserId,
    oauthClientId: 'client-1',
    projectKey: 'BV',
    title,
    description: 'Nur Draft und Audit.',
    priority: 'high',
  };
}
