import {
  isDashboardMemberPageRequestCurrent,
  parseDashboardMemberCursor,
  setDashboardMemberPageParams,
} from '@/lib/dashboard/member-query';

import { describe, expect, it } from 'vitest';

describe('dashboard member query', () => {
  it('accepts only complete bounded cursor pairs', () => {
    const cursor = {
      createdAt: '2026-07-19T12:00:00.000Z',
      authUserId: 'user-20',
    };

    expect(
      parseDashboardMemberCursor(cursor.createdAt, cursor.authUserId)
    ).toEqual(cursor);
    expect(parseDashboardMemberCursor(cursor.createdAt, null)).toBeNull();
    expect(parseDashboardMemberCursor('invalid', cursor.authUserId)).toBeNull();
    expect(
      parseDashboardMemberCursor(cursor.createdAt, 'x'.repeat(129))
    ).toBeNull();
  });

  it('matches exact requests and writes both URL values atomically', () => {
    const cursor = {
      createdAt: '2026-07-19T12:00:00.000Z',
      authUserId: 'user-20',
    };

    expect(
      isDashboardMemberPageRequestCurrent(
        { projectKey: 'BV', after: cursor },
        'BV',
        cursor
      )
    ).toBe(true);
    expect(
      isDashboardMemberPageRequestCurrent(
        { projectKey: 'OTHER', after: cursor },
        'BV',
        cursor
      )
    ).toBe(false);

    const next = setDashboardMemberPageParams(
      new URLSearchParams('project=BV&issue=BV-12'),
      cursor
    );
    expect(next.get('memberAfterAt')).toBe(cursor.createdAt);
    expect(next.get('memberAfterAuthUserId')).toBe(cursor.authUserId);
    expect(next.get('issue')).toBe('BV-12');

    const first = setDashboardMemberPageParams(next, null);
    expect(first.has('memberAfterAt')).toBe(false);
    expect(first.has('memberAfterAuthUserId')).toBe(false);
  });
});
