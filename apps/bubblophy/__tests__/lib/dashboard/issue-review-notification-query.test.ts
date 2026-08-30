import {
  buildDashboardIssueReviewPageKey,
  clearDashboardIssueReviewCursor,
  isDashboardIssueReviewPageRequestCurrent,
  parseDashboardIssueReviewCursor,
  setDashboardIssueReviewPageParams,
  writeDashboardIssueReviewQueryParams,
} from '@/lib/dashboard/issue-review-notification-query';

import { describe, expect, it } from 'vitest';

const cursor = {
  updatedAt: '2026-08-31T12:00:00.000Z',
  projectKey: 'BV',
  issueNumber: 42,
};

describe('issue-review notification query state', () => {
  it('parses only a complete bounded cursor', () => {
    expect(
      parseDashboardIssueReviewCursor(` ${cursor.updatedAt} `, ' bv ', '42')
    ).toEqual(cursor);
    expect(
      parseDashboardIssueReviewCursor(cursor.updatedAt, 'BV', null)
    ).toBeNull();
    expect(
      parseDashboardIssueReviewCursor('not-a-date', 'BV', '42')
    ).toBeNull();
    expect(
      parseDashboardIssueReviewCursor(cursor.updatedAt, 'invalid key', '42')
    ).toBeNull();
    expect(
      parseDashboardIssueReviewCursor(cursor.updatedAt, 'BV', '0')
    ).toBeNull();
  });

  it('matches the exact project and cursor fingerprint', () => {
    expect(
      isDashboardIssueReviewPageRequestCurrent(
        { projectKey: 'BV', after: cursor },
        'BV',
        cursor
      )
    ).toBe(true);
    expect(
      isDashboardIssueReviewPageRequestCurrent(
        { projectKey: 'NO', after: cursor },
        'BV',
        cursor
      )
    ).toBe(false);
    expect(
      isDashboardIssueReviewPageRequestCurrent(
        { projectKey: 'BV', after: cursor },
        'BV',
        { ...cursor, issueNumber: 43 }
      )
    ).toBe(false);
  });

  it('writes and clears all cursor fields atomically', () => {
    const params = new URLSearchParams('project=BV&notificationAfterId=run-1');
    const written = setDashboardIssueReviewPageParams(params, cursor);

    expect(written.get('issueReviewAfterAt')).toBe(cursor.updatedAt);
    expect(written.get('issueReviewAfterProject')).toBe('BV');
    expect(written.get('issueReviewAfterIssue')).toBe('42');
    expect(written.get('notificationAfterId')).toBe('run-1');

    const cleared = writeDashboardIssueReviewQueryParams(written, null);
    expect(cleared.has('issueReviewAfterAt')).toBe(false);
    expect(cleared.has('issueReviewAfterProject')).toBe(false);
    expect(cleared.has('issueReviewAfterIssue')).toBe(false);

    written.delete('issueReviewAfterIssue');
    clearDashboardIssueReviewCursor(written);
    expect(written.has('issueReviewAfterAt')).toBe(false);
    expect(written.has('issueReviewAfterProject')).toBe(false);
  });

  it('builds a page-bound local update key', () => {
    expect(buildDashboardIssueReviewPageKey('BV', cursor)).toBe(
      `BV:${cursor.updatedAt}:BV:42`
    );
    expect(buildDashboardIssueReviewPageKey(null, null)).toBe('all:::');
  });
});
