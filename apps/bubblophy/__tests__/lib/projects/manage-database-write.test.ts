import { beforeEach, describe, expect, it, vi } from 'vitest';

const lockProjectMock = vi.fn();
const lockMembersMock = vi.fn();

vi.mock('@/lib/projects/human-write-locks-database', () => ({
  lockBubblophyProjectForHumanWrite: (...args: never[]) =>
    lockProjectMock(...args),
  lockBubblophyProjectMembersForHumanWrite: (...args: never[]) =>
    lockMembersMock(...args),
}));

const selectQuery = {
  from: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
};
selectQuery.from.mockReturnValue(selectQuery);
selectQuery.where.mockReturnValue(selectQuery);
selectQuery.limit.mockResolvedValue([
  {
    id: 'project_bv',
    key: 'BV',
    name: 'Bubblesverse',
    description: 'Projekt',
    isArchived: false,
  },
]);

const txMock = {
  select: vi.fn(() => selectQuery),
};

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
  txMock.select.mockClear();
  selectQuery.from.mockClear();
  selectQuery.where.mockClear();
  selectQuery.limit.mockClear();
  selectQuery.from.mockReturnValue(selectQuery);
  selectQuery.where.mockReturnValue(selectQuery);
  selectQuery.limit.mockResolvedValue([
    {
      id: 'project_bv',
      key: 'BV',
      name: 'Bubblesverse',
      description: 'Projekt',
      isArchived: false,
    },
  ]);
});

describe('locked project manager mutation context', () => {
  it('locks project then actor membership before returning manager data', async () => {
    const { lockProjectManagerMutationContext } =
      await import('@/lib/projects/manage-database-write');

    await expect(
      lockProjectManagerMutationContext(txMock as never, {
        authUserId: 'user_owner',
        projectKey: 'BV',
      })
    ).resolves.toMatchObject({
      status: 'ready',
      project: { id: 'project_bv', key: 'BV' },
    });
    expect(lockProjectMock).toHaveBeenCalledWith(txMock, {
      project: { key: 'BV' },
      lockMode: 'no key update',
    });
    expect(lockMembersMock).toHaveBeenCalledWith(txMock, {
      projectId: 'project_bv',
      authUserIds: ['user_owner'],
    });
    expect(lockProjectMock.mock.invocationCallOrder[0]).toBeLessThan(
      lockMembersMock.mock.invocationCallOrder[0] ?? 0
    );
  });

  it('stops before project reload when the locked actor is no longer a manager', async () => {
    lockMembersMock.mockResolvedValue([
      { authUserId: 'user_owner', role: 'member' },
    ]);
    const { lockProjectManagerMutationContext } =
      await import('@/lib/projects/manage-database-write');

    await expect(
      lockProjectManagerMutationContext(txMock as never, {
        authUserId: 'user_owner',
        projectKey: 'BV',
      })
    ).resolves.toEqual({ status: 'forbidden' });
    expect(txMock.select).not.toHaveBeenCalled();
  });
});
