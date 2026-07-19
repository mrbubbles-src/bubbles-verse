import type {
  DashboardIssuePage,
  DashboardIssuePageReader,
} from '@/lib/dashboard/issues';

import { readDashboardIssuePage } from '@/lib/dashboard/issues';

import { describe, expect, it, vi } from 'vitest';

const page: DashboardIssuePage = {
  project: {
    key: 'BV',
    name: 'Bubblesverse',
    isArchived: false,
    currentUserRole: 'member',
  },
  sort: 'oldest',
  items: [],
  nextAfterIssueNumber: null,
};

describe('readDashboardIssuePage', () => {
  it('normalizes the project key and forwards a bounded cursor contract', async () => {
    const readPage = vi.fn<DashboardIssuePageReader>();
    readPage.mockResolvedValue(page);

    await expect(
      readDashboardIssuePage(
        ' user-1 ',
        { projectKey: ' bv ', sort: 'oldest', afterIssueNumber: 12 },
        { readPage }
      )
    ).resolves.toEqual({ status: 'success', ...page });
    expect(readPage).toHaveBeenCalledWith({
      authUserId: 'user-1',
      projectKey: 'BV',
      sort: 'oldest',
      afterIssueNumber: 12,
    });
  });

  it('uses newest without a cursor by default', async () => {
    const readPage = vi.fn<DashboardIssuePageReader>();
    readPage.mockResolvedValue({ ...page, sort: 'newest' });

    await readDashboardIssuePage('user-1', { projectKey: 'BV' }, { readPage });

    expect(readPage).toHaveBeenCalledWith(
      expect.objectContaining({ sort: 'newest', afterIssueNumber: null })
    );
  });

  it('does not distinguish inaccessible and unknown projects', async () => {
    const readPage = vi.fn<DashboardIssuePageReader>();
    readPage.mockResolvedValue(null);

    await expect(
      readDashboardIssuePage('user-1', { projectKey: 'FOREIGN' }, { readPage })
    ).resolves.toEqual({ status: 'not_found' });
  });

  it.each([
    ['', { projectKey: 'BV' }, 'empty_auth_user'],
    ['user-1', { projectKey: ' ' }, 'invalid_project_key'],
    ['user-1', { projectKey: 'A' }, 'invalid_project_key'],
    ['user-1', { projectKey: 'TOO-LONG-KEY' }, 'invalid_project_key'],
    ['user-1', { projectKey: 'BV', sort: 'random' }, 'invalid_sort'],
    ['user-1', { projectKey: 'BV', afterIssueNumber: 0 }, 'invalid_cursor'],
    ['user-1', { projectKey: 'BV', afterIssueNumber: -1 }, 'invalid_cursor'],
    ['user-1', { projectKey: 'BV', afterIssueNumber: 1.5 }, 'invalid_cursor'],
    [
      'user-1',
      { projectKey: 'BV', afterIssueNumber: 2_147_483_648 },
      'invalid_cursor',
    ],
  ] as const)(
    'rejects invalid page input',
    async (authUserId, input, reason) => {
      const readPage = vi.fn<DashboardIssuePageReader>();

      await expect(
        readDashboardIssuePage(
          authUserId,
          input as Parameters<typeof readDashboardIssuePage>[1],
          { readPage }
        )
      ).resolves.toEqual({ status: 'invalid', reason });
      expect(readPage).not.toHaveBeenCalled();
    }
  );

  it('returns a safe unavailable state when the reader fails', async () => {
    const readPage = vi.fn<DashboardIssuePageReader>();
    readPage.mockRejectedValue(new Error('connection detail'));

    await expect(
      readDashboardIssuePage('user-1', { projectKey: 'BV' }, { readPage })
    ).resolves.toEqual({ status: 'database_unavailable' });
  });

  it('accepts the largest PostgreSQL integer cursor', async () => {
    const readPage = vi.fn<DashboardIssuePageReader>();
    readPage.mockResolvedValue({ ...page, sort: 'newest' });

    await expect(
      readDashboardIssuePage(
        'user-1',
        { projectKey: 'BV', afterIssueNumber: 2_147_483_647 },
        { readPage }
      )
    ).resolves.toMatchObject({ status: 'success' });
    expect(readPage).toHaveBeenCalledWith(
      expect.objectContaining({ afterIssueNumber: 2_147_483_647 })
    );
  });
});
