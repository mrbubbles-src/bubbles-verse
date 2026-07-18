import { getTableName } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type DrizzleTable = Parameters<typeof getTableName>[0];
type Selection = Record<string, object>;
type MockRow = Record<string, string | boolean | null>;
type InsertedValue = Record<string, string | boolean | null | object>;

const state = {
  projectArchived: false,
  existingMembershipRole: null as string | null,
  concurrentMembershipRole: null as string | null,
  membershipInsertReturnsRow: true,
  invitationEmail: 'martin@example.test',
  invitationRole: 'member',
  invitationExpiresAt: '2026-07-25T10:00:00.000Z',
  invitationAcceptedAt: null as string | null,
  invitationAcceptedByAuthUserId: null as string | null,
  invitationRevokedAt: null as string | null,
  updateReturnsRow: true,
  lockCalls: [] as { tableName: string; mode: string }[],
  updateCalls: 0,
  insertedValues: [] as { tableName: string; value: InsertedValue }[],
};

class MockSelectQuery implements PromiseLike<MockRow[]> {
  private tableName: string | null = null;

  constructor(private readonly selection: Selection) {}

  from(table: DrizzleTable) {
    this.tableName = getTableName(table);
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

  for(mode: string) {
    state.lockCalls.push({ tableName: this.tableName ?? 'unset', mode });
    return this;
  }

  then<TResult1 = MockRow[], TResult2 = never>(
    onfulfilled?:
      | ((value: MockRow[]) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: Error) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.rows()).then(onfulfilled, onrejected);
  }

  /** Returns deterministic invitation acceptance transaction rows. */
  private rows(): MockRow[] {
    if (this.tableName === 'bubblophy_projects') {
      return [
        { id: 'project_bv', key: 'BV', isArchived: state.projectArchived },
      ];
    }

    if (this.tableName === 'bubblophy_project_members') {
      if ('authUserId' in this.selection) {
        return state.existingMembershipRole
          ? [
              {
                authUserId: 'user_martin',
                role: state.existingMembershipRole,
              },
            ]
          : [];
      }

      return state.concurrentMembershipRole
        ? [{ role: state.concurrentMembershipRole }]
        : [];
    }

    if (this.tableName === 'bubblophy_project_invitations') {
      if (!('id' in this.selection)) {
        return [{ projectId: 'project_bv' }];
      }

      return [
        {
          id: 'invitation_1',
          projectId: 'project_bv',
          normalizedEmail: state.invitationEmail,
          role: state.invitationRole,
          tokenHash: `sha256:${'a'.repeat(64)}`,
          expiresAt: state.invitationExpiresAt,
          acceptedAt: state.invitationAcceptedAt,
          acceptedByAuthUserId: state.invitationAcceptedByAuthUserId,
          revokedAt: state.invitationRevokedAt,
        },
      ];
    }

    throw new Error(`Unexpected select from ${this.tableName ?? 'unset'}.`);
  }
}

class MockUpdateQuery {
  set() {
    return this;
  }

  where() {
    state.updateCalls += 1;
    return this;
  }

  async returning() {
    return state.updateReturnsRow ? [{ id: 'invitation_1' }] : [];
  }
}

class MockInsertQuery implements PromiseLike<void> {
  private value: InsertedValue | null = null;

  constructor(private readonly tableName: string) {}

  values(value: InsertedValue) {
    this.value = value;
    state.insertedValues.push({ tableName: this.tableName, value });
    return this;
  }

  onConflictDoNothing() {
    return this;
  }

  async returning() {
    if (this.tableName !== 'bubblophy_project_members') {
      return [];
    }

    return state.membershipInsertReturnsRow ? [{ role: 'member' }] : [];
  }

  then<TResult1 = void, TResult2 = never>(
    onfulfilled?: ((value: void) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: Error) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve().then(onfulfilled, onrejected);
  }
}

const txMock = {
  select: vi.fn((selection: Selection) => new MockSelectQuery(selection)),
  update: vi.fn(() => new MockUpdateQuery()),
  insert: vi.fn(
    (table: DrizzleTable) => new MockInsertQuery(getTableName(table))
  ),
};

const dbMock = {
  transaction: vi.fn(
    async <Result>(handler: (tx: typeof txMock) => Promise<Result>) =>
      handler(txMock)
  ),
};

vi.mock('@/drizzle/db', () => ({ db: dbMock }));

beforeEach(() => {
  state.projectArchived = false;
  state.existingMembershipRole = null;
  state.concurrentMembershipRole = null;
  state.membershipInsertReturnsRow = true;
  state.invitationEmail = 'martin@example.test';
  state.invitationRole = 'member';
  state.invitationExpiresAt = '2026-07-25T10:00:00.000Z';
  state.invitationAcceptedAt = null;
  state.invitationAcceptedByAuthUserId = null;
  state.invitationRevokedAt = null;
  state.updateReturnsRow = true;
  state.lockCalls = [];
  state.updateCalls = 0;
  state.insertedValues = [];
  txMock.select.mockClear();
  txMock.update.mockClear();
  txMock.insert.mockClear();
  dbMock.transaction.mockClear();
});

describe('Drizzle project invitation acceptance store', () => {
  it('accepts under stable locks and audits without identity secrets', async () => {
    const store = await createStore();

    await expect(
      store.acceptProjectInvitationWithMembership(createInput())
    ).resolves.toEqual({
      status: 'accepted',
      projectKey: 'BV',
      role: 'member',
      membershipCreated: true,
    });

    expect(state.lockCalls).toEqual([
      { tableName: 'bubblophy_projects', mode: 'share' },
      { tableName: 'bubblophy_project_members', mode: 'update' },
      { tableName: 'bubblophy_project_invitations', mode: 'update' },
    ]);
    expect(state.updateCalls).toBe(1);
    expect(state.insertedValues.map(({ tableName }) => tableName)).toEqual([
      'bubblophy_project_members',
      'bubblophy_project_events',
    ]);
    const audit = state.insertedValues[1]?.value;
    expect(audit).toMatchObject({
      actorAuthUserId: 'user_martin',
      eventType: 'project_updated',
    });
    expect(JSON.stringify(audit)).not.toContain('martin@example.test');
    expect(JSON.stringify(audit)).not.toContain('sha256:');
  });

  it('rejects a different verified email without mutation or audit', async () => {
    state.invitationEmail = 'someone-else@example.test';
    const store = await createStore();

    await expect(
      store.acceptProjectInvitationWithMembership(createInput())
    ).resolves.toEqual({ status: 'email_mismatch' });
    expect(state.updateCalls).toBe(0);
    expect(state.insertedValues).toHaveLength(0);
  });

  it('reports expired and revoked invitations without mutation', async () => {
    state.invitationExpiresAt = '2026-07-18T09:59:59.999Z';
    const store = await createStore();

    await expect(
      store.acceptProjectInvitationWithMembership(createInput())
    ).resolves.toEqual({ status: 'expired' });

    state.invitationExpiresAt = '2026-07-25T10:00:00.000Z';
    state.invitationRevokedAt = '2026-07-18T09:00:00.000Z';
    await expect(
      store.acceptProjectInvitationWithMembership(createInput())
    ).resolves.toEqual({ status: 'unavailable' });
    expect(state.updateCalls).toBe(0);
    expect(state.insertedValues).toHaveLength(0);
  });

  it('returns an idempotent success only to the original accepting member', async () => {
    state.existingMembershipRole = 'viewer';
    state.invitationAcceptedAt = '2026-07-18T09:00:00.000Z';
    state.invitationAcceptedByAuthUserId = 'user_martin';
    const store = await createStore();

    await expect(
      store.acceptProjectInvitationWithMembership(createInput())
    ).resolves.toEqual({
      status: 'already_accepted',
      projectKey: 'BV',
      role: 'viewer',
    });
    expect(state.updateCalls).toBe(0);
    expect(state.insertedValues).toHaveLength(0);
  });

  it('refreshes membership after waiting on a concurrent acceptance', async () => {
    state.concurrentMembershipRole = 'member';
    state.invitationAcceptedAt = '2026-07-18T09:00:00.000Z';
    state.invitationAcceptedByAuthUserId = 'user_martin';
    const store = await createStore();

    await expect(
      store.acceptProjectInvitationWithMembership(createInput())
    ).resolves.toEqual({
      status: 'already_accepted',
      projectKey: 'BV',
      role: 'member',
    });
    expect(state.updateCalls).toBe(0);
    expect(state.insertedValues).toHaveLength(0);
  });

  it('does not create membership or audit after a lost acceptance race', async () => {
    state.updateReturnsRow = false;
    const store = await createStore();

    await expect(
      store.acceptProjectInvitationWithMembership(createInput())
    ).resolves.toEqual({ status: 'conflict' });
    expect(state.updateCalls).toBe(1);
    expect(state.insertedValues).toHaveLength(0);
  });

  it('preserves a membership created before invitation acceptance', async () => {
    state.existingMembershipRole = 'maintainer';
    const store = await createStore();

    await expect(
      store.acceptProjectInvitationWithMembership(createInput())
    ).resolves.toEqual({
      status: 'accepted',
      projectKey: 'BV',
      role: 'maintainer',
      membershipCreated: false,
    });
    expect(state.insertedValues.map(({ tableName }) => tableName)).toEqual([
      'bubblophy_project_events',
    ]);
    expect(state.insertedValues[0]?.value).toMatchObject({
      payload: {
        membershipCreated: false,
        changedFields: ['acceptedAt'],
      },
    });
  });

  it('reads and preserves a concurrently inserted membership', async () => {
    state.membershipInsertReturnsRow = false;
    state.concurrentMembershipRole = 'viewer';
    const store = await createStore();

    await expect(
      store.acceptProjectInvitationWithMembership(createInput())
    ).resolves.toEqual({
      status: 'accepted',
      projectKey: 'BV',
      role: 'viewer',
      membershipCreated: false,
    });
    expect(state.insertedValues.map(({ tableName }) => tableName)).toEqual([
      'bubblophy_project_members',
      'bubblophy_project_events',
    ]);
  });

  it('rejects archived projects and invalid invitation roles', async () => {
    state.projectArchived = true;
    const store = await createStore();

    await expect(
      store.acceptProjectInvitationWithMembership(createInput())
    ).resolves.toEqual({ status: 'archived_project' });

    state.projectArchived = false;
    state.invitationRole = 'owner';
    await expect(
      store.acceptProjectInvitationWithMembership(createInput())
    ).resolves.toEqual({ status: 'unavailable' });
    expect(state.updateCalls).toBe(0);
    expect(state.insertedValues).toHaveLength(0);
  });
});

/** Loads the mocked transactional invitation acceptance store. */
async function createStore() {
  const { createDrizzleBubblophyProjectInvitationAcceptStore } =
    await import('@/lib/projects/accept-invitation-database-write');
  return createDrizzleBubblophyProjectInvitationAcceptStore();
}

/** Returns a valid acceptance input shared by transaction tests. */
function createInput() {
  return {
    authUserId: 'user_martin',
    normalizedEmail: 'martin@example.test',
    tokenHash: `sha256:${'a'.repeat(64)}`,
    now: '2026-07-18T10:00:00.000Z',
  };
}
