// @vitest-environment node

import type { DashboardIssueReviewPageReader } from '@/lib/dashboard/issue-review-notifications';

import { readDashboardIssueReviewPage } from '@/lib/dashboard/issue-review-notifications';

import { describe, expect, it, vi } from 'vitest';

const cursor = {
  updatedAt: '2026-08-31T12:00:00.000Z',
  projectKey: 'BV',
  issueNumber: 42,
};

describe('readDashboardIssueReviewPage', () => {
  it('normalizes scope and delegates the safe cursor', async () => {
    const readPage = vi.fn<DashboardIssueReviewPageReader>().mockResolvedValue({
      project: {
        key: 'BV',
        name: 'Bubbles Verse',
        currentUserRole: 'viewer',
      },
      items: [],
      nextAfter: null,
    });

    const result = await readDashboardIssueReviewPage(
      ' user-1 ',
      { projectKey: ' bv ', after: cursor },
      { readPage }
    );

    expect(result).toMatchObject({ status: 'success', items: [] });
    expect(readPage).toHaveBeenCalledWith({
      authUserId: 'user-1',
      projectKey: 'BV',
      after: cursor,
    });
  });

  it('rejects invalid identity, scope, and cursor input', async () => {
    const readPage = vi.fn<DashboardIssueReviewPageReader>();

    await expect(
      readDashboardIssueReviewPage(' ', {}, { readPage })
    ).resolves.toEqual({ status: 'invalid', reason: 'empty_auth_user' });
    await expect(
      readDashboardIssueReviewPage(
        'user-1',
        { projectKey: 'not valid' },
        { readPage }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'invalid_project_key' });
    await expect(
      readDashboardIssueReviewPage(
        'user-1',
        { after: { ...cursor, issueNumber: 0 } },
        { readPage }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'invalid_cursor' });
    await expect(
      readDashboardIssueReviewPage(
        'user-1',
        { projectKey: 'NO', after: cursor },
        { readPage }
      )
    ).resolves.toEqual({ status: 'invalid', reason: 'invalid_cursor' });
    expect(readPage).not.toHaveBeenCalled();
  });

  it('maps missing scope and database failures without leaking errors', async () => {
    const missingReader = vi
      .fn<DashboardIssueReviewPageReader>()
      .mockResolvedValue(null);
    const failingReader = vi
      .fn<DashboardIssueReviewPageReader>()
      .mockRejectedValue(new Error('secret database detail'));

    await expect(
      readDashboardIssueReviewPage(
        'user-1',
        { projectKey: 'BV' },
        { readPage: missingReader }
      )
    ).resolves.toEqual({ status: 'not_found' });
    await expect(
      readDashboardIssueReviewPage('user-1', {}, { readPage: failingReader })
    ).resolves.toEqual({ status: 'database_unavailable' });
  });
});
