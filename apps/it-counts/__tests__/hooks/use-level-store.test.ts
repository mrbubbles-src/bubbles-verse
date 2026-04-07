import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useLevelStore } from '@/hooks/use-level-store'
import type { LevelState } from '@/types'

vi.mock('@/lib/dates', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/dates')>()
  return {
    ...actual,
    getTodayString: vi.fn(() => '2026-04-07'),
  }
})

function resetStore() {
  useLevelStore.setState({
    levelState: {
      level: 1,
      startDate: '2026-04-07',
      xp: 0,
      overXp: 0,
    },
    isEligible: false,
  })
}

describe('use-level-store', () => {
  beforeEach(() => {
    localStorage.clear()
    resetStore()
  })

  it('starts with default level state', () => {
    const { levelState, isEligible } = useLevelStore.getState()

    expect(levelState.level).toBe(1)
    expect(levelState.xp).toBe(0)
    expect(levelState.overXp).toBe(0)
    expect(isEligible).toBe(false)
  })

  describe('loadFromStorage', () => {
    it('hydrates from localStorage', () => {
      const stored: LevelState = {
        level: 2,
        startDate: '2026-03-01',
        xp: 55,
        overXp: 0,
      }

      localStorage.setItem('it-counts:current-level', JSON.stringify(stored))
      useLevelStore.getState().loadFromStorage()

      expect(useLevelStore.getState().levelState).toEqual(stored)
    })

    it('uses default when localStorage is empty', () => {
      useLevelStore.getState().loadFromStorage()
      expect(useLevelStore.getState().levelState.level).toBe(1)
    })

    it('derives isEligible from xp + weeksElapsed', () => {
      const eligible: LevelState = {
        level: 1,
        startDate: '2026-03-01',
        xp: 100,
        overXp: 0,
      }

      localStorage.setItem(
        'it-counts:current-level',
        JSON.stringify(eligible),
      )

      useLevelStore.getState().loadFromStorage()

      // 2026-03-01 → 2026-04-07 = 37 days = 5 weeks ≥ 4, xp 100 ≥ 100
      expect(useLevelStore.getState().isEligible).toBe(true)
    })

    it('isEligible is false when xp is below threshold', () => {
      const notEnoughXp: LevelState = {
        level: 1,
        startDate: '2026-03-01',
        xp: 50,
        overXp: 0,
      }

      localStorage.setItem(
        'it-counts:current-level',
        JSON.stringify(notEnoughXp),
      )

      useLevelStore.getState().loadFromStorage()
      expect(useLevelStore.getState().isEligible).toBe(false)
    })
  })

  describe('addXp — write-through', () => {
    it('increments xp, derives overXp, and persists immediately', () => {
      useLevelStore.setState({
        levelState: {
          level: 1,
          startDate: '2026-03-01',
          xp: 98,
          overXp: 0,
        },
        isEligible: false,
      })

      useLevelStore.getState().addXp(5)

      const { levelState } = useLevelStore.getState()
      expect(levelState.xp).toBe(103)
      expect(levelState.overXp).toBe(3)
      expect(useLevelStore.getState().isEligible).toBe(true)
      expect(
        JSON.parse(localStorage.getItem('it-counts:current-level') ?? 'null'),
      ).toEqual(levelState)
    })

    it('ignores zero or negative xp updates', () => {
      useLevelStore.getState().addXp(0)
      useLevelStore.getState().addXp(-2)

      expect(useLevelStore.getState().levelState.xp).toBe(0)
      expect(localStorage.getItem('it-counts:current-level')).toBeNull()
    })
  })

  describe('triggerLevelUp — write-through', () => {
    it('increments level, resets xp, sets new startDate to today', () => {
      useLevelStore.setState({
        levelState: {
          level: 1,
          startDate: '2026-03-01',
          xp: 120,
          overXp: 20,
        },
        isEligible: true,
      })

      useLevelStore.getState().triggerLevelUp()

      const { levelState, isEligible } = useLevelStore.getState()
      expect(levelState.level).toBe(2)
      expect(levelState.xp).toBe(0)
      expect(levelState.overXp).toBe(0)
      expect(levelState.startDate).toBe('2026-04-07')
      expect(isEligible).toBe(false)
    })

    it('persists the new level state to localStorage', () => {
      useLevelStore.getState().triggerLevelUp()

      const raw = localStorage.getItem('it-counts:current-level')
      expect(raw).not.toBeNull()

      const stored = JSON.parse(raw!) as LevelState
      expect(stored.level).toBe(2)
      expect(stored.xp).toBe(0)
    })
  })
})
