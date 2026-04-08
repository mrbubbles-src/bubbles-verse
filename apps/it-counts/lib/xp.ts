import type { ActivityEntry } from '@/types';

export const XP_TIERS = [
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
  levelStartAt?: string,
): number {
  const levelStartDay = parseLocalDateToDayNumber(levelStartDate);
  const throughDay = parseLocalDateToDayNumber(throughDate);
  const levelStartAtMs =
    typeof levelStartAt === 'string' ? Date.parse(levelStartAt) : Number.NaN;

  if (
    levelStartDay === null ||
    throughDay === null ||
    Number.isFinite(levelStartDay) === false ||
    Number.isFinite(throughDay) === false
  ) {
    return 0;
  }

  const minutesByDate = new Map<string, number>();

  for (const e of entries) {
    const entryDay = parseLocalDateToDayNumber(e.date);
    if (entryDay === null) {
      continue;
    }

    if (entryDay < levelStartDay || entryDay > throughDay) {
      continue;
    }

    if (
      entryDay === levelStartDay &&
      Number.isFinite(levelStartAtMs) &&
      Date.parse(e.loggedAt) < levelStartAtMs
    ) {
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

/**
 * Parses a strict `YYYY-MM-DD` local date string to UTC-day milliseconds.
 */
function parseLocalDateToDayNumber(date: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const normalized = new Date(Date.UTC(year, month - 1, day));
  const isValid =
    normalized.getUTCFullYear() === year &&
    normalized.getUTCMonth() === month - 1 &&
    normalized.getUTCDate() === day;

  return isValid ? normalized.getTime() : null;
}
