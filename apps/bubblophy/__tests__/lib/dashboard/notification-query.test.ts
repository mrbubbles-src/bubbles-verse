import {
  buildDashboardNotificationPageKey,
  clearDashboardNotificationCursor,
  isDashboardNotificationPageRequestCurrent,
  parseDashboardNotificationCursor,
  setDashboardNotificationPageParams,
  writeDashboardNotificationQueryParams,
} from '@/lib/dashboard/notification-query';

import { describe, expect, it } from 'vitest';

const cursor = {
  updatedAt: '2026-08-31T12:00:00.000Z',
  runId: 'run-20',
};

describe('dashboard notification query', () => {
  it('parses only complete bounded cursor tuples', () => {
    expect(
      parseDashboardNotificationCursor(
        ` ${cursor.updatedAt} `,
        ` ${cursor.runId} `
      )
    ).toEqual(cursor);
    expect(parseDashboardNotificationCursor(cursor.updatedAt, null)).toBeNull();
    expect(parseDashboardNotificationCursor(null, cursor.runId)).toBeNull();
    expect(
      parseDashboardNotificationCursor('not-a-date', cursor.runId)
    ).toBeNull();
    expect(
      parseDashboardNotificationCursor(cursor.updatedAt, 'x'.repeat(129))
    ).toBeNull();
  });

  it('compares the exact project and cursor request fingerprint', () => {
    const request = { projectKey: 'BV', after: cursor };

    expect(
      isDashboardNotificationPageRequestCurrent(request, 'BV', cursor)
    ).toBe(true);
    expect(
      isDashboardNotificationPageRequestCurrent(request, 'NO', cursor)
    ).toBe(false);
    expect(
      isDashboardNotificationPageRequestCurrent(request, 'BV', {
        ...cursor,
        runId: 'other-run',
      })
    ).toBe(false);
  });

  it('writes and clears the independent cursor without changing other state', () => {
    const params = new URLSearchParams('project=BV&issue=BV-20');
    const paged = setDashboardNotificationPageParams(params, cursor);
    const canonical = writeDashboardNotificationQueryParams(paged, cursor);

    expect(canonical.get('project')).toBe('BV');
    expect(canonical.get('issue')).toBe('BV-20');
    expect(canonical.get('notificationAfterAt')).toBe(cursor.updatedAt);
    expect(canonical.get('notificationAfterId')).toBe(cursor.runId);
    expect(params.has('notificationAfterAt')).toBe(false);

    clearDashboardNotificationCursor(canonical);
    expect(canonical.has('notificationAfterAt')).toBe(false);
    expect(canonical.has('notificationAfterId')).toBe(false);
  });

  it('builds distinct page keys for project and cursor changes', () => {
    expect(buildDashboardNotificationPageKey('BV', cursor)).not.toBe(
      buildDashboardNotificationPageKey('NO', cursor)
    );
    expect(buildDashboardNotificationPageKey('BV', cursor)).not.toBe(
      buildDashboardNotificationPageKey('BV', null)
    );
  });
});
