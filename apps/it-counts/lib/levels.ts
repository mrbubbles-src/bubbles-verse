export type OverXpPace = 'on-track' | 'slightly-over' | 'well-over'

export type LevelDefinition = {
  readonly level: number
  readonly weeklyXpTarget: number | null
  readonly requirements: readonly string[]
  readonly unlockedAbilities: readonly string[]
}

const LEVEL_UP_XP_THRESHOLD = 100
const LEVEL_UP_WEEKS_THRESHOLD = 4
const SLIGHTLY_OVER_THRESHOLD = 20

/**
 * Defines the first shipping levels as append-only data so later levels can be
 * added without changing the persisted `LevelState` shape.
 */
export const LEVEL_DEFINITIONS: readonly LevelDefinition[] = [
  {
    level: 1,
    weeklyXpTarget: null,
    requirements: ['Flexible pace. Earn what you earn during the opening month.'],
    unlockedAbilities: ['Core XP tracking'],
  },
  {
    level: 2,
    weeklyXpTarget: null,
    requirements: ['One intentional 10-20 minute walk per week.'],
    unlockedAbilities: ['Intentional weekly walk focus'],
  },
  {
    level: 3,
    weeklyXpTarget: 12,
    requirements: ['Keep the same activities and aim for 12 XP per week.'],
    unlockedAbilities: ['Higher weekly target for steady consistency'],
  },
] as const satisfies readonly LevelDefinition[]

/**
 * Returns whether the current level can be completed.
 * Both the XP threshold and four fully elapsed weeks must be satisfied.
 */
export function isLevelUpEligible(xp: number, weeksElapsed: number): boolean {
  return (
    Number.isFinite(xp) &&
    Number.isFinite(weeksElapsed) &&
    xp >= LEVEL_UP_XP_THRESHOLD &&
    weeksElapsed >= LEVEL_UP_WEEKS_THRESHOLD
  )
}

/**
 * Returns only the XP earned beyond the level-up threshold.
 * Negative values are normalized to zero for downstream UI code.
 */
export function calculateOverXp(xp: number): number {
  if (Number.isFinite(xp) === false) {
    return 0
  }

  return Math.max(0, xp - LEVEL_UP_XP_THRESHOLD)
}

/**
 * Buckets surplus XP into the domain pace labels used by later UI stories.
 */
export function getOverXpPace(overXp: number): OverXpPace {
  if (Number.isFinite(overXp) === false || overXp <= 0) {
    return 'on-track'
  }

  if (overXp < SLIGHTLY_OVER_THRESHOLD) {
    return 'slightly-over'
  }

  return 'well-over'
}
