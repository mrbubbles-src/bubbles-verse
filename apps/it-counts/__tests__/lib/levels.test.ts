import { getWeeksElapsedInLevel } from '@/lib/dates'
import {
  LEVEL_DEFINITIONS,
  calculateOverXp,
  getOverXpPace,
  isLevelUpEligible,
} from '@/lib/levels'

import { describe, expect, it } from 'vitest'

describe('levels', () => {
  it('defines the first three levels as extensible data', () => {
    expect(LEVEL_DEFINITIONS.map((level) => level.level)).toEqual([1, 2, 3])
    expect(LEVEL_DEFINITIONS.map((level) => level.weeklyXpTarget)).toEqual([
      null,
      null,
      12,
    ])

    for (const level of LEVEL_DEFINITIONS) {
      expect(level.requirements.length).toBeGreaterThan(0)
      expect(level.unlockedAbilities.length).toBeGreaterThan(0)
    }
  })

  it('requires both 100 XP and four full weeks for level-up eligibility', () => {
    const weeksAfterTwentySevenDays = getWeeksElapsedInLevel(
      '2026-04-07',
      '2026-05-04',
    )
    const weeksAfterTwentyEightDays = getWeeksElapsedInLevel(
      '2026-04-07',
      '2026-05-05',
    )

    expect(isLevelUpEligible(100, weeksAfterTwentySevenDays)).toBe(false)
    expect(isLevelUpEligible(99, weeksAfterTwentyEightDays)).toBe(false)
    expect(isLevelUpEligible(100, weeksAfterTwentyEightDays)).toBe(true)
  })

  it.each([
    [0, 0],
    [99, 0],
    [100, 0],
    [112, 12],
  ])('calculates %i over-XP from %i total XP', (xp, expectedOverXp) => {
    expect(calculateOverXp(xp)).toBe(expectedOverXp)
  })

  it.each([
    [0, 'on-track'],
    [1, 'slightly-over'],
    [19, 'slightly-over'],
    [20, 'well-over'],
  ] as const)(
    'classifies %i over-XP as %s',
    (overXp, expectedPace) => {
      expect(getOverXpPace(overXp)).toBe(expectedPace)
    },
  )
})
