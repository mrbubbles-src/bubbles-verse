import type {
  DashboardIssueDetail,
  DashboardIssueDetailReader,
  DashboardIssuePage,
  DashboardIssuePageReader,
} from '@/lib/dashboard/issues';

import {
  readDashboardIssueDetail,
  readDashboardIssuePage,
} from '@/lib/dashboard/issues';

import { describe, expect, it, vi } from 'vitest';

const page: DashboardIssuePage = {
  project: {
    key: 'BV',
    name: 'Bubblesverse',
    isArchived: false,
    currentUserRole: 'member',
  },
  sort: 'oldest',
  filters: { query: 'oauth', status: 'ready', priority: 'high' },
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
        {
          projectKey: ' bv ',
          sort: 'oldest',
          afterIssueNumber: 12,
          query: ' oauth ',
          status: 'ready',
          priority: 'high',
        },
        { readPage }
      )
    ).resolves.toEqual({ status: 'success', ...page });
    expect(readPage).toHaveBeenCalledWith({
      authUserId: 'user-1',
      projectKey: 'BV',
      sort: 'oldest',
      afterIssueNumber: 12,
      filters: { query: 'oauth', status: 'ready', priority: 'high' },
    });
  });

  it('uses newest without a cursor by default', async () => {
    const readPage = vi.fn<DashboardIssuePageReader>();
    readPage.mockResolvedValue({ ...page, sort: 'newest' });

    await readDashboardIssuePage('user-1', { projectKey: 'BV' }, { readPage });

    expect(readPage).toHaveBeenCalledWith(
      expect.objectContaining({
        sort: 'newest',
        afterIssueNumber: null,
        filters: { query: null, status: null, priority: null },
      })
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
    ['user-1', { projectKey: 'BV', query: 'x'.repeat(101) }, 'query_too_long'],
    ['user-1', { projectKey: 'BV', status: 'unknown' }, 'invalid_status'],
    ['user-1', { projectKey: 'BV', priority: 'urgent' }, 'invalid_priority'],
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

  it('normalizes blank and all filters to the unfiltered contract', async () => {
    const readPage = vi.fn<DashboardIssuePageReader>();
    readPage.mockResolvedValue({
      ...page,
      sort: 'newest',
      filters: { query: null, status: null, priority: null },
    });

    await readDashboardIssuePage(
      'user-1',
      { projectKey: 'BV', query: '  ', status: 'all', priority: 'all' },
      { readPage }
    );

    expect(readPage).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: { query: null, status: null, priority: null },
      })
    );
  });
});

const detail: DashboardIssueDetail = {
  project: {
    key: 'BV',
    name: 'Bubblesverse',
    isArchived: false,
    currentUserRole: 'member',
  },
  issue: {
    key: 'BV-99',
    issueNumber: 99,
    title: 'Direkter Deep Link',
    description: 'Liegt außerhalb der ersten Queue-Seite.',
    status: 'ready',
    priority: 'high',
    requiresHumanApproval: true,
    assignedAuthUserId: null,
    assigneeLabel: 'Nicht zugewiesen',
    createdAt: '2026-07-18T10:00:00.000Z',
    updatedAt: '2026-07-19T10:00:00.000Z',
    latestPlan: null,
    notes: [],
    hasMoreNotes: false,
  },
};

describe('readDashboardIssueDetail', () => {
  it('normalizes and parses a stable issue key', async () => {
    const readDetail = vi.fn<DashboardIssueDetailReader>();
    readDetail.mockResolvedValue(detail);

    await expect(
      readDashboardIssueDetail(
        ' user-1 ',
        { issueKey: ' bv-99 ' },
        { readDetail }
      )
    ).resolves.toEqual({ status: 'success', ...detail });
    expect(readDetail).toHaveBeenCalledWith({
      authUserId: 'user-1',
      projectKey: 'BV',
      issueNumber: 99,
    });
  });

  it('does not distinguish missing, foreign, and unauthorized issues', async () => {
    const readDetail = vi.fn<DashboardIssueDetailReader>();
    readDetail.mockResolvedValue(null);

    await expect(
      readDashboardIssueDetail('user-1', { issueKey: 'BV-99' }, { readDetail })
    ).resolves.toEqual({ status: 'not_found' });
  });

  it.each([
    ['', { issueKey: 'BV-99' }],
    ['user-1', { issueKey: '' }],
    ['user-1', { issueKey: 'A-1' }],
    ['user-1', { issueKey: 'BV-0' }],
    ['user-1', { issueKey: 'BV-nope' }],
    ['user-1', { issueKey: 'BV-2147483648' }],
  ] as const)('rejects invalid detail input', async (authUserId, input) => {
    const readDetail = vi.fn<DashboardIssueDetailReader>();

    await expect(
      readDashboardIssueDetail(authUserId, input, { readDetail })
    ).resolves.toEqual({
      status: 'invalid',
      reason: authUserId ? 'invalid_issue_key' : 'empty_auth_user',
    });
    expect(readDetail).not.toHaveBeenCalled();
  });

  it('accepts the largest PostgreSQL issue number', async () => {
    const readDetail = vi.fn<DashboardIssueDetailReader>();
    readDetail.mockResolvedValue(detail);

    await readDashboardIssueDetail(
      'user-1',
      { issueKey: 'BV-2147483647' },
      { readDetail }
    );

    expect(readDetail).toHaveBeenCalledWith(
      expect.objectContaining({ issueNumber: 2_147_483_647 })
    );
  });

  it('returns a safe unavailable state when the reader fails', async () => {
    const readDetail = vi.fn<DashboardIssueDetailReader>();
    readDetail.mockRejectedValue(new Error('connection detail'));

    await expect(
      readDashboardIssueDetail('user-1', { issueKey: 'BV-99' }, { readDetail })
    ).resolves.toEqual({ status: 'database_unavailable' });
  });
});
