import {
  isDashboardRunPageRequestCurrent,
  parseDashboardRunCursor,
  setDashboardRunPageParams,
} from '@/lib/dashboard/run-query';

import { describe, expect, it } from 'vitest';

describe('dashboard run query', () => {
  it('accepts only complete bounded cursor pairs', () => {
    const cursor = {
      updatedAt: '2026-07-19T12:00:00.000Z',
      id: 'run-20',
    };

    expect(parseDashboardRunCursor(cursor.updatedAt, cursor.id)).toEqual(
      cursor
    );
    expect(parseDashboardRunCursor(cursor.updatedAt, null)).toBeNull();
    expect(parseDashboardRunCursor('invalid', cursor.id)).toBeNull();
    expect(
      parseDashboardRunCursor(cursor.updatedAt, 'x'.repeat(129))
    ).toBeNull();
  });

  it('matches exact requests and writes both URL values atomically', () => {
    const cursor = {
      updatedAt: '2026-07-19T12:00:00.000Z',
      id: 'run-20',
    };

    expect(
      isDashboardRunPageRequestCurrent(
        { projectKey: 'BV', after: cursor },
        'BV',
        cursor
      )
    ).toBe(true);
    expect(
      isDashboardRunPageRequestCurrent(
        { projectKey: 'OTHER', after: cursor },
        'BV',
        cursor
      )
    ).toBe(false);

    const next = setDashboardRunPageParams(
      new URLSearchParams('project=BV&issue=BV-12'),
      cursor
    );
    expect(next.get('runAfterAt')).toBe(cursor.updatedAt);
    expect(next.get('runAfterId')).toBe(cursor.id);
    expect(next.get('issue')).toBe('BV-12');

    const first = setDashboardRunPageParams(next, null);
    expect(first.has('runAfterAt')).toBe(false);
    expect(first.has('runAfterId')).toBe(false);
  });
});
