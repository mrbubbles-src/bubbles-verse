import { calculateDailyXp } from '@/lib/xp';

import { describe, expect, it } from 'vitest';

describe('calculateDailyXp', () => {
  it.each([
    [0, 0],
    [4, 0],
    [5, 1],
    [9, 1],
    [10, 2],
    [20, 3],
    [30, 5],
    [60, 5],
  ])('returns %i→%i XP for given total minutes', (totalMinutes, expectedXp) => {
    expect(calculateDailyXp(totalMinutes)).toBe(expectedXp);
  });
});
