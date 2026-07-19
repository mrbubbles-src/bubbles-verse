import {
  isDashboardAllIssuePageRequestCurrent,
  parseDashboardAllIssueQuery,
  patchDashboardAllIssueQueryParams,
  setDashboardAllIssuePageParams,
  writeDashboardAllIssueQueryParams,
} from '@/lib/dashboard/all-issue-query';

import { describe, expect, it } from 'vitest';

const cursor = {
  updatedAt: '2026-07-19T12:00:00.000Z',
  projectKey: 'BV',
  issueNumber: 14,
};

describe('all-project issue query state', () => {
  it('normalizes shared filters and a complete cursor', () => {
    expect(
      parseDashboardAllIssueQuery({
        query: ' OAuth ',
        status: 'ready',
        priority: 'high',
        sort: 'oldest',
        afterAt: ` ${cursor.updatedAt} `,
        afterProject: ' bv ',
        afterIssue: '14',
      })
    ).toEqual({
      filters: { query: 'OAuth', status: 'ready', priority: 'high' },
      sort: 'oldest',
      after: cursor,
    });
  });

  it.each([
    { afterAt: cursor.updatedAt, afterProject: 'BV' },
    { afterAt: 'invalid', afterProject: 'BV', afterIssue: '14' },
    { afterAt: cursor.updatedAt, afterProject: 'B', afterIssue: '14' },
    {
      afterAt: cursor.updatedAt,
      afterProject: 'BV',
      afterIssue: '2147483648',
    },
  ])('discards a partial or invalid cursor', (values) => {
    expect(parseDashboardAllIssueQuery(values).after).toBeNull();
  });

  it('canonicalizes global cursor fields without dropping unrelated state', () => {
    const params = writeDashboardAllIssueQueryParams(
      new URLSearchParams(
        'tab=audit&after=42&allAfterAt=invalid&allAfterProject=nope'
      ),
      {
        filters: { query: 'OAuth', status: null, priority: 'high' },
        sort: 'oldest',
        after: cursor,
      }
    );

    expect(params.toString()).toBe(
      'tab=audit&allAfterAt=2026-07-19T12%3A00%3A00.000Z&allAfterProject=BV&q=OAuth&priority=high&sort=oldest&allAfterIssue=14'
    );
  });

  it('resets cursor and detail selection when filters change', () => {
    const params = patchDashboardAllIssueQueryParams(
      new URLSearchParams(
        'issue=BV-14&allAfterAt=2026-07-19T12%3A00%3A00.000Z&allAfterProject=BV&allAfterIssue=14&priority=high&tab=audit'
      ),
      { status: 'ready' }
    );

    expect(params.toString()).toBe('priority=high&tab=audit&status=ready');
  });

  it('sets a forward cursor and clears concrete cursor plus detail state', () => {
    const params = setDashboardAllIssuePageParams(
      new URLSearchParams('project=all&issue=BV-14&after=42&q=OAuth'),
      cursor
    );

    expect(params.toString()).toBe(
      'project=all&q=OAuth&allAfterAt=2026-07-19T12%3A00%3A00.000Z&allAfterProject=BV&allAfterIssue=14'
    );
  });

  it('matches results only to the exact three-part URL request', () => {
    const query = {
      filters: { query: 'OAuth', status: null, priority: null },
      sort: 'newest' as const,
      after: cursor,
    };

    expect(isDashboardAllIssuePageRequestCurrent(query, query)).toBe(true);
    expect(
      isDashboardAllIssuePageRequestCurrent(query, {
        ...query,
        after: { ...cursor, issueNumber: 13 },
      })
    ).toBe(false);
  });
});
