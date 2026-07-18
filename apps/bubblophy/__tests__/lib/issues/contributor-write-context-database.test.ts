import { lockBubblophyIssueContributorWriteContext } from '@/lib/issues/contributor-write-context-database';

import { getTableName } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type DrizzleTable = Parameters<typeof getTableName>[0];

const state = {
  project: {
    id: 'project_bv',
    key: 'BV',
    isArchived: false,
  } as { id: string; key: string; isArchived: boolean } | null,
  issueRows: [{ id: 'issue_bv_12' }],
  memberships: [
    { authUserId: 'user_member', role: 'member' },
    { authUserId: 'user_target', role: 'viewer' },
  ],
  lockModes: [] as string[],
};

const { lockProjectMock, lockMembersMock } = vi.hoisted(() => ({
  lockProjectMock: vi.fn(),
  lockMembersMock: vi.fn(),
}));

vi.mock('@/lib/projects/human-write-locks-database', () => ({
  lockBubblophyProjectForHumanWrite: lockProjectMock,
  lockBubblophyProjectMembersForHumanWrite: lockMembersMock,
}));

class MockSelectQuery implements PromiseLike<Array<{ id: string }>> {
  private tableName: string | null = null;

  from(table: DrizzleTable) {
    this.tableName = getTableName(table);
    return this;
  }

  where() {
    return this;
  }

  limit() {
    return this;
  }

  for(lockMode: string) {
    state.lockModes.push(lockMode);
    return this;
  }

  then<TResult1 = Array<{ id: string }>, TResult2 = never>(
    onfulfilled?:
      | ((value: Array<{ id: string }>) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: Error) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    if (this.tableName !== 'bubblophy_issues') {
      return Promise.reject(
        new Error(`Unexpected select from ${this.tableName ?? 'unset'}.`)
      ).then(onfulfilled, onrejected);
    }

    return Promise.resolve(state.issueRows).then(onfulfilled, onrejected);
  }
}

const txMock = {
  select: vi.fn(() => new MockSelectQuery()),
};

beforeEach(() => {
  state.project = { id: 'project_bv', key: 'BV', isArchived: false };
  state.issueRows = [{ id: 'issue_bv_12' }];
  state.memberships = [
    { authUserId: 'user_member', role: 'member' },
    { authUserId: 'user_target', role: 'viewer' },
  ];
  state.lockModes = [];
  txMock.select.mockClear();
  lockProjectMock.mockClear();
  lockMembersMock.mockClear();
  lockProjectMock.mockResolvedValue(state.project);
  lockMembersMock.mockResolvedValue(state.memberships);
});

describe('locked contributor write context', () => {
  it('locks project, issue, actor, and related memberships in order', async () => {
    await expect(
      lockBubblophyIssueContributorWriteContext(txMock as never, {
        authUserId: 'user_member',
        projectKey: 'BV',
        issueNumber: 12,
        relatedAuthUserIds: ['user_target'],
      })
    ).resolves.toEqual({
      status: 'ready',
      issueDatabaseId: 'issue_bv_12',
      projectId: 'project_bv',
      projectKey: 'BV',
      memberships: state.memberships,
    });
    expect(lockProjectMock).toHaveBeenCalledWith(txMock, {
      project: { key: 'BV' },
      lockMode: 'share',
    });
    expect(state.lockModes).toEqual(['no key update']);
    expect(lockMembersMock).toHaveBeenCalledWith(txMock, {
      projectId: 'project_bv',
      authUserIds: ['user_member', 'user_target'],
    });
    expect(lockProjectMock.mock.invocationCallOrder[0]).toBeLessThan(
      lockMembersMock.mock.invocationCallOrder[0] ?? 0
    );
  });

  it('denies a viewer after the locked membership recheck', async () => {
    state.memberships = [{ authUserId: 'user_member', role: 'viewer' }];
    lockMembersMock.mockResolvedValueOnce(state.memberships);

    await expect(
      lockBubblophyIssueContributorWriteContext(txMock as never, {
        authUserId: 'user_member',
        projectKey: 'BV',
        issueNumber: 12,
      })
    ).resolves.toEqual({ status: 'forbidden' });
  });

  it('stops before issue and membership locks for archived projects', async () => {
    state.project = { id: 'project_bv', key: 'BV', isArchived: true };
    lockProjectMock.mockResolvedValueOnce(state.project);

    await expect(
      lockBubblophyIssueContributorWriteContext(txMock as never, {
        authUserId: 'user_member',
        projectKey: 'BV',
        issueNumber: 12,
      })
    ).resolves.toEqual({ status: 'not_found' });
    expect(txMock.select).not.toHaveBeenCalled();
    expect(lockMembersMock).not.toHaveBeenCalled();
  });
});
