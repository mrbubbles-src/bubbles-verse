import type { ActivityEntry } from '@/types';

const XP_TIERS = [
  { minimumMinutes: 30, xp: 5 },
  { minimumMinutes: 20, xp: 3 },
  { minimumMinutes: 10, xp: 2 },
  { minimumMinutes: 5, xp: 1 },
] as const;

/**
 * Returns the fixed daily XP reward for the accumulated walking minutes.
 * The highest qualifying tier wins, and 30+ minutes stays capped at 5 XP.
 */
export function calculateDailyXp(totalMinutes: number): number {
  if (Number.isFinite(totalMinutes) === false || totalMinutes < 5) {
    return 0;
  }

  for (const tier of XP_TIERS) {
    if (totalMinutes >= tier.minimumMinutes) {
      return tier.xp;
    }
  }

  return 0;
}

/**
 * Sums {@link calculateDailyXp} for each calendar day that falls in
 * `[levelStartDate, throughDate]` (inclusive), using aggregated minutes per day.
 * Entries outside that window are ignored. This is the single source for
 * current-level XP derived from the activity log (not per-entry XP).
 */
export function sumLevelXpFromEntries(
  entries: readonly ActivityEntry[],
  levelStartDate: string,
  throughDate: string,
): number {
  const minutesByDate = new Map<string, number>();

  for (const e of entries) {
    if (e.date < levelStartDate || e.date > throughDate) {
      continue;
    }

    minutesByDate.set(e.date, (minutesByDate.get(e.date) ?? 0) + e.durationMin);
  }

  let sum = 0;
  for (const minutes of minutesByDate.values()) {
    sum += calculateDailyXp(minutes);
  }

  return sum;
}
