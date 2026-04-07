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
