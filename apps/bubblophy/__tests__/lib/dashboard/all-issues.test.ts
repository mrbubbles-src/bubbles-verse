import type {
  DashboardAllIssuePage,
  DashboardAllIssuePageReader,
} from '@/lib/dashboard/all-issues';

import { readDashboardAllIssuePage } from '@/lib/dashboard/all-issues';

import { describe, expect, it, vi } from 'vitest';

const page: DashboardAllIssuePage = {
  sort: 'newest',
  filters: { query: null, status: null, priority: null },
  items: [],
  nextAfter: null,
};

describe('readDashboardAllIssuePage', () => {
  it('normalizes filters and the public stable cursor', async () => {
    const readPage = vi.fn<DashboardAllIssuePageReader>();
    readPage.mockResolvedValue(page);

    await expect(
      readDashboardAllIssuePage(
        ' user-1 ',
        {
          sort: 'oldest',
          query: ' oauth ',
          status: 'ready',
          priority: 'high',
          after: {
            updatedAt: ' 2026-07-19T12:00:00.000Z ',
            projectKey: ' bv ',
            issueNumber: 14,
          },
        },
        { readPage }
      )
    ).resolves.toEqual({ status: 'success', ...page });
    expect(readPage).toHaveBeenCalledWith({
      authUserId: 'user-1',
      sort: 'oldest',
      after: {
        updatedAt: '2026-07-19T12:00:00.000Z',
        projectKey: 'BV',
        issueNumber: 14,
      },
      filters: { query: 'oauth', status: 'ready', priority: 'high' },
    });
  });

  it('uses newest and empty filters by default', async () => {
    const readPage = vi.fn<DashboardAllIssuePageReader>();
    readPage.mockResolvedValue(page);

    await readDashboardAllIssuePage('user-1', {}, { readPage });

    expect(readPage).toHaveBeenCalledWith({
      authUserId: 'user-1',
      sort: 'newest',
      after: null,
      filters: { query: null, status: null, priority: null },
    });
  });

  it.each([
    ['', {}, 'empty_auth_user'],
    ['user-1', { sort: 'random' }, 'invalid_sort'],
    ['user-1', { query: 'x'.repeat(101) }, 'query_too_long'],
    ['user-1', { status: 'unknown' }, 'invalid_status'],
    ['user-1', { priority: 'urgent' }, 'invalid_priority'],
    [
      'user-1',
      {
        after: {
          updatedAt: 'invalid',
          projectKey: 'BV',
          issueNumber: 1,
        },
      },
      'invalid_cursor',
    ],
  ] as const)('rejects invalid input', async (authUserId, input, reason) => {
    const readPage = vi.fn<DashboardAllIssuePageReader>();

    await expect(
      readDashboardAllIssuePage(
        authUserId,
        input as Parameters<typeof readDashboardAllIssuePage>[1],
        { readPage }
      )
    ).resolves.toEqual({ status: 'invalid', reason });
    expect(readPage).not.toHaveBeenCalled();
  });

  it('returns a safe unavailable state when the reader fails', async () => {
    const readPage = vi.fn<DashboardAllIssuePageReader>();
    readPage.mockRejectedValue(new Error('database detail'));

    await expect(
      readDashboardAllIssuePage('user-1', {}, { readPage })
    ).resolves.toEqual({ status: 'database_unavailable' });
  });
});
