import {
  clearDashboardActivityCursor,
  isDashboardActivityPageRequestCurrent,
  parseDashboardActivityQuery,
  setDashboardActivityKindParams,
  setDashboardActivityPageParams,
  writeDashboardActivityQueryParams,
} from '@/lib/dashboard/activity-query';

import { describe, expect, it } from 'vitest';

const cursor = {
  occurredAt: '2026-07-21T12:00:00.000Z',
  source: 'issue' as const,
  eventId: 'event-20',
};

describe('dashboard activity query', () => {
  it('parses only canonical kinds and complete cursor tuples', () => {
    expect(
      parseDashboardActivityQuery({
        kind: 'issue',
        afterAt: cursor.occurredAt,
        afterSource: cursor.source,
        afterId: cursor.eventId,
      })
    ).toEqual({ kind: 'issue', after: cursor });
    expect(
      parseDashboardActivityQuery({
        kind: 'other',
        afterAt: cursor.occurredAt,
        afterSource: cursor.source,
      })
    ).toEqual({ kind: 'all', after: null });
  });

  it('compares the exact project, kind, and cursor request fingerprint', () => {
    const request = { projectKey: 'BV', kind: 'issue' as const, after: cursor };

    expect(
      isDashboardActivityPageRequestCurrent(request, 'BV', {
        kind: 'issue',
        after: cursor,
      })
    ).toBe(true);
    expect(
      isDashboardActivityPageRequestCurrent(request, 'NO', {
        kind: 'issue',
        after: cursor,
      })
    ).toBe(false);
    expect(
      isDashboardActivityPageRequestCurrent(request, 'BV', {
        kind: 'project',
        after: cursor,
      })
    ).toBe(false);
  });

  it('changes the kind without discarding unrelated URL state', () => {
    const params = new URLSearchParams(
      'project=BV&issue=BV-20&activityAfterAt=x&activityAfterSource=issue&activityAfterId=y'
    );
    const next = setDashboardActivityKindParams(params, 'project');

    expect(next.get('project')).toBe('BV');
    expect(next.get('issue')).toBe('BV-20');
    expect(next.get('activityKind')).toBe('project');
    expect(next.has('activityAfterAt')).toBe(false);
    expect(params.has('activityAfterAt')).toBe(true);
  });

  it('writes and clears the inseparable activity cursor fields', () => {
    const params = new URLSearchParams('project=BV');
    const paged = setDashboardActivityPageParams(params, cursor);
    const canonical = writeDashboardActivityQueryParams(paged, {
      kind: 'issue',
      after: cursor,
    });

    expect(canonical.get('activityKind')).toBe('issue');
    expect(canonical.get('activityAfterAt')).toBe(cursor.occurredAt);
    expect(canonical.get('activityAfterSource')).toBe(cursor.source);
    expect(canonical.get('activityAfterId')).toBe(cursor.eventId);

    clearDashboardActivityCursor(canonical);
    expect(canonical.has('activityAfterAt')).toBe(false);
    expect(canonical.has('activityAfterSource')).toBe(false);
    expect(canonical.has('activityAfterId')).toBe(false);
  });
});
