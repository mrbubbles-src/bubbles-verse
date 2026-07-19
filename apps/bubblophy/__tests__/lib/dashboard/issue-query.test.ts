import {
  isDashboardIssuePageRequestCurrent,
  parseDashboardIssueQuery,
  patchDashboardIssueQueryParams,
  setDashboardIssuePageParams,
  writeDashboardIssueQueryParams,
} from '@/lib/dashboard/issue-query';

import { describe, expect, it } from 'vitest';

describe('parseDashboardIssueQuery', () => {
  it('normalizes valid queue values', () => {
    expect(
      parseDashboardIssueQuery({
        query: ' OAuth ',
        status: 'ready',
        priority: 'high',
        sort: 'oldest',
        after: '42',
      })
    ).toEqual({
      filters: { query: 'OAuth', status: 'ready', priority: 'high' },
      sort: 'oldest',
      afterIssueNumber: 42,
    });
  });

  it('omits invalid and default queue values', () => {
    expect(
      parseDashboardIssueQuery({
        query: 'x'.repeat(101),
        status: 'unknown',
        priority: 'urgent',
        sort: 'random',
        after: '2147483648',
      })
    ).toEqual({
      filters: { query: null, status: null, priority: null },
      sort: 'newest',
      afterIssueNumber: null,
    });
  });

  it('accepts the int4 cursor boundary and rejects non-integers', () => {
    expect(
      parseDashboardIssueQuery({ after: '2147483647' }).afterIssueNumber
    ).toBe(2_147_483_647);
    expect(parseDashboardIssueQuery({ after: '1.5' }).afterIssueNumber).toBe(
      null
    );
  });

  it('canonicalizes issue params without dropping unrelated URL state', () => {
    const params = writeDashboardIssueQueryParams(
      new URLSearchParams(
        'project=BV&tab=audit&q=%20OAuth%20&status=unknown&sort=random&after=nope'
      ),
      parseDashboardIssueQuery({
        query: ' OAuth ',
        status: 'unknown',
        sort: 'random',
        after: 'nope',
      })
    );

    expect(params.toString()).toBe('project=BV&tab=audit&q=OAuth');
  });

  it('resets cursor and issue when filters change', () => {
    const params = patchDashboardIssueQueryParams(
      new URLSearchParams(
        'project=BV&issue=BV-14&after=42&priority=high&tab=audit'
      ),
      { status: 'ready' }
    );

    expect(params.toString()).toBe(
      'project=BV&priority=high&tab=audit&status=ready'
    );
  });

  it('sets a forward cursor and resets the selected issue', () => {
    const params = setDashboardIssuePageParams(
      new URLSearchParams('project=BV&issue=BV-14&q=OAuth'),
      14
    );

    expect(params.toString()).toBe('project=BV&q=OAuth&after=14');
  });

  it('returns to the first page while preserving canonical filters and sort', () => {
    const filteredParams = patchDashboardIssueQueryParams(
      new URLSearchParams(
        'project=BV&issue=BV-14&after=14&status=ready&priority=high'
      ),
      { status: null, priority: 'low', sort: 'oldest' }
    );
    const firstPageParams = setDashboardIssuePageParams(filteredParams, null);

    expect(firstPageParams.toString()).toBe(
      'project=BV&priority=low&sort=oldest'
    );
  });

  it('matches server page results only to their exact URL request', () => {
    const query = parseDashboardIssueQuery({
      query: 'OAuth',
      status: 'ready',
      sort: 'oldest',
      after: '14',
    });
    const request = { projectKey: 'BV', ...query };

    expect(isDashboardIssuePageRequestCurrent(request, 'BV', query)).toBe(true);
    expect(
      isDashboardIssuePageRequestCurrent(
        request,
        'BV',
        parseDashboardIssueQuery({ query: 'OAuth', status: 'done' })
      )
    ).toBe(false);
  });
});
