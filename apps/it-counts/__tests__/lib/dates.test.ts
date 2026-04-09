import {
  getTodayString,
  getWeeksElapsedInLevel,
  getWeekStart,
  isSameDay,
} from '@/lib/dates';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('dates', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the local day string for today', () => {
    vi.setSystemTime(new Date(2026, 3, 7, 9, 30, 0));

    expect(getTodayString()).toBe('2026-04-07');
  });

  it('uses Monday as the week start across the Sunday boundary', () => {
    expect(getWeekStart('2026-04-12')).toBe('2026-04-06');
    expect(getWeekStart('2026-04-13')).toBe('2026-04-13');
  });

  it('counts only full elapsed weeks for level progression', () => {
    expect(getWeeksElapsedInLevel('2026-04-07', '2026-04-13')).toBe(0);
    expect(getWeeksElapsedInLevel('2026-04-07', '2026-04-14')).toBe(1);
  });

  it('compares day keys exactly', () => {
    expect(isSameDay('2026-04-07', '2026-04-07')).toBe(true);
    expect(isSameDay('2026-04-07', '2026-04-08')).toBe(false);
  });
});
