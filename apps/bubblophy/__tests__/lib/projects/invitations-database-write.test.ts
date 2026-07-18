import type { SQL } from 'drizzle-orm';

import { getTableName } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type DrizzleTable = Parameters<typeof getTableName>[0];
type Selection = Record<string, object>;
type MockRow = Record<string, string | boolean | null>;

const state = {
  actorRole: 'owner',
  invitationAcceptedAt: null as string | null,
  invitationRevokedAt: null as string | null,
  invitationUpdatedAt: '2026-07-18T09:00:00.000Z',
  lockCalls: [] as { tableName: string; mode: string }[],
  updateCalls: 0,
  updateReturnsRow: true,
  updatedAtQueries: [] as { sql: string; serializedParams: string }[],
  insertedValues: [] as MockRow[],
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

  for(lockMode: string) {
    state.lockCalls.push({
      tableName: this.tableName ?? 'unset',
      mode: lockMode,
    });
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

  /** Returns deterministic rows for invitation transaction tests. */
  private rows(): MockRow[] {
    if (this.tableName === 'bubblophy_projects') {
      return [{ id: 'project_bv', key: 'BV', isArchived: false }];
    }

    if (this.tableName === 'bubblophy_project_members') {
      return [{ authUserId: 'user_owner', role: state.actorRole }];
    }

    if (this.tableName === 'bubblophy_project_invitations') {
      if ('projectId' in this.selection && !('acceptedAt' in this.selection)) {
        return [{ projectId: 'project_bv' }];
      }

      if ('acceptedAt' in this.selection) {
        return [
          {
            id: 'invitation_1',
            projectId: 'project_bv',
            normalizedEmail: 'martin@example.test',
            role: 'member',
            expiresAt: '2026-07-25T10:00:00.000Z',
            acceptedAt: state.invitationAcceptedAt,
            revokedAt: state.invitationRevokedAt,
            updatedAt: state.invitationUpdatedAt,
          },
        ];
      }

      return [];
    }

    throw new Error(`Unexpected select from ${this.tableName ?? 'unset'}.`);
  }
}

class MockInsertQuery {
  constructor(private readonly tableName: string) {}

  values(values: MockRow) {
    state.insertedValues.push(values);
    return this;
  }

  async returning() {
    if (this.tableName !== 'bubblophy_project_invitations') {
      return [];
    }

    return [
      {
        id: 'invitation_1',
        normalizedEmail: 'martin@example.test',
        role: 'member',
        expiresAt: '2026-07-25T10:00:00.000Z',
        updatedAt: '2026-07-18T10:00:00.000Z',
      },
    ];
  }

  then<TResult1 = void, TResult2 = never>(
    onfulfilled?: ((value: void) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: Error) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve().then(onfulfilled, onrejected);
  }
}

class MockUpdateQuery {
  set(values: { updatedAt?: SQL }) {
    if (values.updatedAt) {
      const query = new PgDialect().sqlToQuery(values.updatedAt);
      state.updatedAtQueries.push({
        sql: query.sql,
        serializedParams: JSON.stringify(query.params),
      });
    }

    return this;
  }

  where() {
    state.updateCalls += 1;
    return this;
  }

  async returning(selection: Selection) {
    if (!state.updateReturnsRow) {
      return [];
    }

    if ('normalizedEmail' in selection) {
      return [
        {
          id: 'invitation_1',
          normalizedEmail: 'martin@example.test',
          role: 'member',
          expiresAt: '2026-07-25T10:00:00.000Z',
          updatedAt: '2026-07-18T10:00:00.000Z',
        },
      ];
    }

    return [
      {
        id: 'invitation_1',
        updatedAt: '2026-07-18T10:00:00.000Z',
      },
    ];
  }
}

const txMock = {
  select: vi.fn((selection: Selection) => new MockSelectQuery(selection)),
  insert: vi.fn(
    (table: DrizzleTable) => new MockInsertQuery(getTableName(table))
  ),
  update: vi.fn(() => new MockUpdateQuery()),
};

const dbMock = {
  transaction: vi.fn(
    async <Result>(
      handler: (tx: typeof txMock) => Promise<Result>
    ): Promise<Result> => handler(txMock)
  ),
};

vi.mock('@/drizzle/db', () => ({ db: dbMock }));

beforeEach(() => {
  state.actorRole = 'owner';
  state.invitationAcceptedAt = null;
  state.invitationRevokedAt = null;
  state.invitationUpdatedAt = '2026-07-18T09:00:00.000Z';
  state.lockCalls = [];
  state.updateCalls = 0;
  state.updateReturnsRow = true;
  state.updatedAtQueries = [];
  state.insertedValues = [];
  txMock.select.mockClear();
  txMock.insert.mockClear();
  txMock.update.mockClear();
  dbMock.transaction.mockClear();
});

describe('Drizzle project invitation mutation store', () => {
  it('creates under project, actor-membership, and open-invitation locks', async () => {
    const { createDrizzleBubblophyProjectInvitationMutationStore } =
      await import('@/lib/projects/invitations-database-write');

    await expect(
      createDrizzleBubblophyProjectInvitationMutationStore().createProjectInvitationWithEvent(
        createInput()
      )
    ).resolves.toMatchObject({
      status: 'created',
      invitation: {
        id: 'invitation_1',
        email: 'martin@example.test',
        role: 'member',
      },
    });

    expect(state.lockCalls).toEqual([
      { tableName: 'bubblophy_projects', mode: 'share' },
      { tableName: 'bubblophy_project_members', mode: 'update' },
      { tableName: 'bubblophy_project_invitations', mode: 'update' },
    ]);
    expect(state.insertedValues).toHaveLength(2);
    const event = state.insertedValues[1];
    expect(event).toMatchObject({
      eventType: 'project_updated',
      actorAuthUserId: 'user_owner',
    });
    expect(JSON.stringify(event)).not.toContain('martin@example.test');
    expect(JSON.stringify(event)).not.toContain('sha256:token');
  });

  it('hides invitation existence from non-managers before locking it', async () => {
    state.actorRole = 'member';
    const { createDrizzleBubblophyProjectInvitationMutationStore } =
      await import('@/lib/projects/invitations-database-write');

    await expect(
      createDrizzleBubblophyProjectInvitationMutationStore().reinviteProjectInvitationWithEvent(
        createReinviteInput()
      )
    ).resolves.toEqual({ status: 'not_found' });

    expect(state.lockCalls).toEqual([
      { tableName: 'bubblophy_projects', mode: 'share' },
      { tableName: 'bubblophy_project_members', mode: 'update' },
    ]);
    expect(state.updateCalls).toBe(0);
    expect(state.insertedValues).toHaveLength(0);
  });

  it('rejects stale reinvites without mutation or audit event', async () => {
    state.updateReturnsRow = false;
    const { createDrizzleBubblophyProjectInvitationMutationStore } =
      await import('@/lib/projects/invitations-database-write');

    await expect(
      createDrizzleBubblophyProjectInvitationMutationStore().reinviteProjectInvitationWithEvent(
        {
          ...createReinviteInput(),
          expectedUpdatedAt: '2026-07-18T08:00:00.000Z',
        }
      )
    ).resolves.toEqual({ status: 'conflict' });

    expect(state.lockCalls).toEqual([
      { tableName: 'bubblophy_projects', mode: 'share' },
      { tableName: 'bubblophy_project_members', mode: 'update' },
      { tableName: 'bubblophy_project_invitations', mode: 'update' },
    ]);
    expect(state.updateCalls).toBe(1);
    expect(state.insertedValues).toHaveLength(0);
  });

  it('rejects terminal invitations without mutation or audit event', async () => {
    state.invitationRevokedAt = '2026-07-18T09:30:00.000Z';
    const { createDrizzleBubblophyProjectInvitationMutationStore } =
      await import('@/lib/projects/invitations-database-write');

    await expect(
      createDrizzleBubblophyProjectInvitationMutationStore().revokeProjectInvitationWithEvent(
        createTransitionInput()
      )
    ).resolves.toEqual({ status: 'terminal' });

    expect(state.updateCalls).toBe(0);
    expect(state.insertedValues).toHaveLength(0);
  });

  it('does not write an audit event after a lost revoke compare-and-set', async () => {
    state.updateReturnsRow = false;
    const { createDrizzleBubblophyProjectInvitationMutationStore } =
      await import('@/lib/projects/invitations-database-write');

    await expect(
      createDrizzleBubblophyProjectInvitationMutationStore().revokeProjectInvitationWithEvent(
        createTransitionInput()
      )
    ).resolves.toEqual({ status: 'conflict' });

    expect(state.updateCalls).toBe(1);
    expect(state.insertedValues).toHaveLength(0);
  });

  it('advances the version in SQL when the wall clock repeats', async () => {
    const { createDrizzleBubblophyProjectInvitationMutationStore } =
      await import('@/lib/projects/invitations-database-write');

    await expect(
      createDrizzleBubblophyProjectInvitationMutationStore().reinviteProjectInvitationWithEvent(
        {
          ...createReinviteInput(),
          now: state.invitationUpdatedAt,
        }
      )
    ).resolves.toMatchObject({ status: 'reinvited' });

    expect(state.updatedAtQueries).toHaveLength(1);
    expect(state.updatedAtQueries[0]?.sql).toContain('greatest');
    expect(state.updatedAtQueries[0]?.sql).toContain(
      `"bubblophy_project_invitations"."updated_at" + interval '1 millisecond'`
    );
    expect(state.updatedAtQueries[0]?.serializedParams).toBe(
      JSON.stringify([state.invitationUpdatedAt])
    );
  });
});

describe('project invitation audit events', () => {
  it('exclude email addresses, plaintext tokens, and token hashes', async () => {
    const { buildBubblophyProjectInvitationEventInsert } =
      await import('@/lib/projects/invitations-database-write');
    const event = buildBubblophyProjectInvitationEventInsert({
      action: 'reinvited',
      projectId: 'project_bv',
      projectKey: 'BV',
      authUserId: 'user_owner',
      invitationId: 'invitation_1',
      role: 'member',
    });
    const serialized = JSON.stringify(event);

    expect(event.payload).toMatchObject({
      entity: 'project_invitation',
      action: 'reinvited',
      invitationId: 'invitation_1',
      role: 'member',
    });
    expect(serialized).not.toContain('@');
    expect(serialized).not.toContain('bubblophy_invite_');
    expect(serialized).not.toContain('sha256:');
  });
});

/** Builds one normalized create-store input. */
function createInput() {
  return {
    authUserId: 'user_owner',
    projectKey: 'BV',
    normalizedEmail: 'martin@example.test',
    role: 'member' as const,
    tokenHash: 'sha256:token',
    now: '2026-07-18T10:00:00.000Z',
    expiresAt: '2026-07-25T10:00:00.000Z',
  };
}

/** Builds one normalized reinvite-store input. */
function createReinviteInput() {
  return {
    ...createTransitionInput(),
    tokenHash: 'sha256:new-token',
    expiresAt: '2026-07-25T10:00:00.000Z',
  };
}

/** Builds one normalized invitation transition input. */
function createTransitionInput() {
  return {
    authUserId: 'user_owner',
    invitationId: 'invitation_1',
    expectedUpdatedAt: '2026-07-18T09:00:00.000Z',
    now: '2026-07-18T10:00:00.000Z',
  };
}
