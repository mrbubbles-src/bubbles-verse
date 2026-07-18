import { beforeEach, describe, expect, it, vi } from 'vitest';

const lockProjectMock = vi.fn();
const lockMembersMock = vi.fn();

vi.mock('@/lib/projects/human-write-locks-database', () => ({
  lockBubblophyProjectForHumanWrite: (tx: never, input: never) =>
    lockProjectMock(tx, input),
  lockBubblophyProjectMembersForHumanWrite: (tx: never, input: never) =>
    lockMembersMock(tx, input),
}));

const txMock = {
  insert: vi.fn(),
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
  lockProjectMock.mockReset();
  lockMembersMock.mockReset();
  lockProjectMock.mockResolvedValue({
    id: 'project_bv',
    key: 'BV',
    isArchived: false,
  });
  lockMembersMock.mockResolvedValue([
    { authUserId: 'user_owner', role: 'owner' },
  ]);
  txMock.insert.mockReset();
  dbMock.transaction.mockClear();
});

describe('Drizzle agent token create authorization locks', () => {
  it('locks project then actor membership and denies a concurrently demoted manager', async () => {
    lockMembersMock.mockResolvedValue([
      { authUserId: 'user_owner', role: 'member' },
    ]);
    const { createDrizzleBubblophyAgentTokenCreateStore } =
      await import('@/lib/agent-tokens/database-write');

    await expect(
      createDrizzleBubblophyAgentTokenCreateStore().createAgentToken(
        createInput()
      )
    ).resolves.toEqual({ status: 'forbidden' });
    expect(lockProjectMock).toHaveBeenCalledWith(txMock, {
      project: { key: 'BV' },
      lockMode: 'share',
    });
    expect(lockMembersMock).toHaveBeenCalledWith(txMock, {
      projectId: 'project_bv',
      authUserIds: ['user_owner'],
    });
    expect(lockProjectMock.mock.invocationCallOrder[0]).toBeLessThan(
      lockMembersMock.mock.invocationCallOrder[0] ?? 0
    );
    expect(txMock.insert).not.toHaveBeenCalled();
  });

  it('does not lock membership or write when the project is missing or archived', async () => {
    const { createDrizzleBubblophyAgentTokenCreateStore } =
      await import('@/lib/agent-tokens/database-write');
    const store = createDrizzleBubblophyAgentTokenCreateStore();

    lockProjectMock.mockResolvedValueOnce(null);
    await expect(store.createAgentToken(createInput())).resolves.toEqual({
      status: 'forbidden',
    });
    lockProjectMock.mockResolvedValueOnce({
      id: 'project_bv',
      key: 'BV',
      isArchived: true,
    });
    await expect(store.createAgentToken(createInput())).resolves.toEqual({
      status: 'forbidden',
    });
    expect(lockMembersMock).not.toHaveBeenCalled();
    expect(txMock.insert).not.toHaveBeenCalled();
  });
});

/** Builds one normalized token create store input. */
function createInput() {
  return {
    authUserId: 'user_owner',
    projectKey: 'BV',
    label: 'Runner',
    scopes: ['issues:read' as const],
    tokenHash: 'sha256:test',
    expiresAt: null,
  };
}
