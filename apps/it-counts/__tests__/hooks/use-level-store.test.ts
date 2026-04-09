import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useLevelStore } from '@/hooks/use-level-store'
import type { ActivityEntry, LevelState } from '@/types'

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
      levelStartAt: '2026-04-07T00:00:00.000Z',
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

  afterEach(() => {
    vi.useRealTimers()
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

      expect(useLevelStore.getState().levelState).toEqual({
        ...stored,
        levelStartAt: new Date(2026, 2, 1).toISOString(),
      })
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

  describe('syncXpFromEntries — write-through', () => {
    it('sets xp to sum of daily XP for days in the level window', () => {
      useLevelStore.setState({
        levelState: {
          level: 1,
          startDate: '2026-04-06',
          xp: 0,
          overXp: 0,
        },
        isEligible: false,
      })

      const entries: ActivityEntry[] = [
        {
          id: '1',
          date: '2026-04-06',
          durationMin: 30,
          loggedAt: '2026-04-06T08:00:00Z',
        },
        {
          id: '2',
          date: '2026-04-07',
          durationMin: 10,
          loggedAt: '2026-04-07T09:00:00Z',
        },
      ]

      useLevelStore.getState().syncXpFromEntries(entries)

      const { levelState } = useLevelStore.getState()
      expect(levelState.xp).toBe(7)
      expect(levelState.overXp).toBe(0)
      expect(
        JSON.parse(localStorage.getItem('it-counts:current-level') ?? 'null'),
      ).toEqual(levelState)
    })

    it('aggregates fragmented same-day entries into one daily XP (tier from total)', () => {
      useLevelStore.setState({
        levelState: {
          level: 1,
          startDate: '2026-04-07',
          xp: 0,
          overXp: 0,
        },
        isEligible: false,
      })

      const entries: ActivityEntry[] = [
        {
          id: '1',
          date: '2026-04-07',
          durationMin: 10,
          loggedAt: '2026-04-07T08:00:00Z',
        },
        {
          id: '2',
          date: '2026-04-07',
          durationMin: 5,
          loggedAt: '2026-04-07T09:00:00Z',
        },
        {
          id: '3',
          date: '2026-04-07',
          durationMin: 15,
          loggedAt: '2026-04-07T10:00:00Z',
        },
      ]

      useLevelStore.getState().syncXpFromEntries(entries)

      expect(useLevelStore.getState().levelState.xp).toBe(5)
    })

    it('ignores entries before level startDate', () => {
      useLevelStore.setState({
        levelState: {
          level: 2,
          startDate: '2026-04-07',
          levelStartAt: '2026-04-07T00:00:00.000Z',
          xp: 0,
          overXp: 0,
        },
        isEligible: false,
      })

      const entries: ActivityEntry[] = [
        {
          id: 'old',
          date: '2026-04-06',
          durationMin: 60,
          loggedAt: '2026-04-06T10:00:00Z',
        },
        {
          id: 'new',
          date: '2026-04-07',
          durationMin: 30,
          loggedAt: '2026-04-07T10:00:00Z',
        },
      ]

      useLevelStore.getState().syncXpFromEntries(entries)

      expect(useLevelStore.getState().levelState.xp).toBe(5)
    })

    it('establishes the level 1 anchor from the first known retroactive log', () => {
      useLevelStore.setState({
        levelState: {
          level: 1,
          startDate: '2026-04-07',
          levelStartAt: '2026-04-07T12:00:00.000Z',
          xp: 0,
          overXp: 0,
        },
        isEligible: false,
      })

      const entries: ActivityEntry[] = [
        {
          id: 'retro',
          date: '2026-04-06',
          durationMin: 30,
          loggedAt: '2026-04-07T09:00:00.000Z',
        },
      ]

      useLevelStore.getState().syncXpFromEntries(entries, {
        establishLevelOneAnchor: true,
      })

      expect(useLevelStore.getState().levelState).toMatchObject({
        level: 1,
        startDate: '2026-04-06',
        xp: 5,
        overXp: 0,
      })
      expect(useLevelStore.getState().levelState.levelStartAt).toBe(
        new Date(2026, 3, 6).toISOString(),
      )
    })

    it('does not move a locked level 1 anchor backward after it has been established', () => {
      useLevelStore.setState({
        levelState: {
          level: 1,
          startDate: '2026-04-07',
          levelStartAt: new Date(2026, 3, 7).toISOString(),
          xp: 5,
          overXp: 0,
        },
        isEligible: false,
      })

      const entries: ActivityEntry[] = [
        {
          id: 'first-known',
          date: '2026-04-07',
          durationMin: 30,
          loggedAt: '2026-04-07T11:00:00.000Z',
        },
        {
          id: 'too-old',
          date: '2026-04-01',
          durationMin: 30,
          loggedAt: '2026-04-09T12:00:00.000Z',
        },
      ]

      useLevelStore.getState().syncXpFromEntries(entries)

      expect(useLevelStore.getState().levelState).toMatchObject({
        level: 1,
        startDate: '2026-04-07',
        xp: 5,
        overXp: 0,
      })
    })

    it('backfills unlocked legacy level 1 data once and then locks that earlier day', () => {
      useLevelStore.setState({
        levelState: {
          level: 1,
          startDate: '2026-04-07',
          levelStartAt: '2026-04-07T12:00:00.000Z',
          xp: 5,
          overXp: 0,
        },
        isEligible: false,
      })

      const entries: ActivityEntry[] = [
        {
          id: 'backfill-old',
          date: '2026-04-06',
          durationMin: 30,
          loggedAt: '2026-04-09T11:00:00.000Z',
        },
        {
          id: 'backfill-new',
          date: '2026-04-07',
          durationMin: 30,
          loggedAt: '2026-04-09T12:00:00.000Z',
        },
      ]

      useLevelStore.getState().syncXpFromEntries(entries, {
        establishLevelOneAnchor: true,
      })

      expect(useLevelStore.getState().levelState).toMatchObject({
        level: 1,
        startDate: '2026-04-06',
        xp: 10,
        overXp: 0,
      })
      expect(useLevelStore.getState().levelState.levelStartAt).toBe(
        new Date(2026, 3, 6).toISOString(),
      )
    })

    it('derives overXp and eligibility from recomputed total across many days', () => {
      useLevelStore.setState({
        levelState: {
          level: 1,
          startDate: '2026-03-01',
          xp: 0,
          overXp: 0,
        },
        isEligible: false,
      })

      const entries: ActivityEntry[] = Array.from({ length: 21 }, (_, i) => {
        const day = i + 1
        return {
          id: `day-${day}`,
          date: `2026-03-${String(day).padStart(2, '0')}`,
          durationMin: 30,
          loggedAt: `2026-03-${String(day).padStart(2, '0')}T10:00:00Z`,
        }
      })

      useLevelStore.getState().syncXpFromEntries(entries)

      const { levelState, isEligible } = useLevelStore.getState()
      expect(levelState.xp).toBe(105)
      expect(levelState.overXp).toBe(5)
      expect(isEligible).toBe(true)
    })
  })

  describe('triggerLevelUp — write-through', () => {
    it('increments level, resets xp, sets new startDate to today', () => {
      useLevelStore.setState({
        levelState: {
          level: 1,
          startDate: '2026-03-01',
          levelStartAt: '2026-03-01T00:00:00.000Z',
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

    it('does not re-credit same-day entries logged before level-up', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-04-07T12:00:00.000Z'))

      useLevelStore.setState({
        levelState: {
          level: 1,
          startDate: '2026-04-01',
          levelStartAt: '2026-04-01T00:00:00.000Z',
          xp: 100,
          overXp: 0,
        },
        isEligible: true,
      })

      useLevelStore.getState().triggerLevelUp()

      const entries: ActivityEntry[] = [
        {
          id: 'before-level-up',
          date: '2026-04-07',
          durationMin: 30,
          loggedAt: '2026-04-07T10:00:00.000Z',
        },
        {
          id: 'after-level-up',
          date: '2026-04-07',
          durationMin: 30,
          loggedAt: '2026-04-07T13:00:00.000Z',
        },
      ]

      useLevelStore.getState().syncXpFromEntries(entries)
      expect(useLevelStore.getState().levelState.xp).toBe(5)
    })
  })
})
