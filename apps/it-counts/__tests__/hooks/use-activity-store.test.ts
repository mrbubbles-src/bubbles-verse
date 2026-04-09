import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useActivityStore } from '@/hooks/use-activity-store'
import type { ActivityEntry } from '@/types'

vi.mock('@/lib/dates', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/dates')>()
  return {
    ...actual,
    getTodayString: vi.fn(() => '2026-04-07'),
  }
})

const ENTRY_A: ActivityEntry = {
  id: 'a1',
  date: '2026-04-07',
  durationMin: 20,
  loggedAt: '2026-04-07T08:00:00Z',
}

const ENTRY_B: ActivityEntry = {
  id: 'b1',
  date: '2026-04-07',
  durationMin: 15,
  loggedAt: '2026-04-07T12:00:00Z',
}

const ENTRY_C: ActivityEntry = {
  id: 'c1',
  date: '2026-04-08',
  durationMin: 30,
  loggedAt: '2026-04-08T09:00:00Z',
}

function resetStore() {
  useActivityStore.setState({ entries: [] })
}

describe('use-activity-store', () => {
  beforeEach(() => {
    localStorage.clear()
    resetStore()
    vi.useRealTimers()
  })

  it('starts with an empty entries array', () => {
    expect(useActivityStore.getState().entries).toEqual([])
  })

  describe('addEntry — write-through', () => {
    it('adds an entry and persists to localStorage immediately', () => {
      useActivityStore.getState().addEntry(ENTRY_A)

      expect(useActivityStore.getState().entries).toEqual([ENTRY_A])

      const raw = localStorage.getItem('it-counts:entries')
      expect(raw).not.toBeNull()
      expect(JSON.parse(raw!)).toEqual([ENTRY_A])
    })

    it('appends multiple entries in order', () => {
      useActivityStore.getState().addEntry(ENTRY_A)
      useActivityStore.getState().addEntry(ENTRY_B)

      expect(useActivityStore.getState().entries).toEqual([ENTRY_A, ENTRY_B])
    })
  })

  describe('addDurationEntry — generated entry', () => {
    it('creates an entry with generated id, today date, ISO timestamp, and earned XP', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-04-07T10:15:00.000Z'))
      const randomUuidSpy = vi
        .spyOn(globalThis.crypto, 'randomUUID')
        .mockReturnValue('generated-id')

      const result = useActivityStore.getState().addDurationEntry(30)

      expect(result).toEqual({
        entry: {
          id: 'generated-id',
          date: '2026-04-07',
          durationMin: 30,
          loggedAt: '2026-04-07T10:15:00.000Z',
        },
        xpEarned: 5,
        dailyXpToday: 5,
        nextEntries: [
          {
            id: 'generated-id',
            date: '2026-04-07',
            durationMin: 30,
            loggedAt: '2026-04-07T10:15:00.000Z',
          },
        ],
      })
      expect(useActivityStore.getState().entries).toEqual([result.entry])
      expect(JSON.parse(localStorage.getItem('it-counts:entries') ?? '[]')).toEqual([
        result.entry,
      ])

      randomUuidSpy.mockRestore()
    })

    it('creates an entry for a specific past date when date parameter is provided', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-04-07T10:15:00.000Z'))
      const randomUuidSpy = vi
        .spyOn(globalThis.crypto, 'randomUUID')
        .mockReturnValue('past-id')

      const result = useActivityStore.getState().addDurationEntry(25, '2026-04-05')

      expect(result.entry.date).toBe('2026-04-05')
      expect(result.entry.loggedAt).toBe('2026-04-07T10:15:00.000Z')
      expect(result.entry.durationMin).toBe(25)
      expect(result.dailyXpToday).toBe(3) // 25 min → tier 20+ = 3 XP
      expect(result.nextEntries).toEqual([result.entry])

      randomUuidSpy.mockRestore()
    })

    it('falls back to today when the provided date is empty or invalid', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-04-07T10:15:00.000Z'))
      vi.spyOn(globalThis.crypto, 'randomUUID')
        .mockReturnValueOnce('fallback-empty')
        .mockReturnValueOnce('fallback-invalid')

      const emptyResult = useActivityStore.getState().addDurationEntry(25, '')
      const invalidResult = useActivityStore.getState().addDurationEntry(
        15,
        '2026-02-31',
      )

      expect(emptyResult).toMatchObject({
        entry: {
          id: 'fallback-empty',
          date: '2026-04-07',
          durationMin: 25,
        },
        xpEarned: 3,
        dailyXpToday: 3,
      })
      expect(invalidResult).toMatchObject({
        entry: {
          id: 'fallback-invalid',
          date: '2026-04-07',
          durationMin: 15,
        },
        xpEarned: 2,
        dailyXpToday: 5,
      })
      expect(emptyResult.nextEntries).toEqual([emptyResult.entry])
      expect(invalidResult.nextEntries).toEqual([
        emptyResult.entry,
        invalidResult.entry,
      ])
      expect(useActivityStore.getState().entries).toEqual([
        emptyResult.entry,
        invalidResult.entry,
      ])
      expect(JSON.parse(localStorage.getItem('it-counts:entries') ?? '[]')).toEqual([
        emptyResult.entry,
        invalidResult.entry,
      ])

      vi.restoreAllMocks()
    })

    it('calculates past-date XP delta against existing entries for that date', () => {
      useActivityStore.getState().addEntry({
        id: 'existing',
        date: '2026-04-05',
        durationMin: 10,
        loggedAt: '2026-04-05T08:00:00Z',
      })

      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-04-07T12:00:00.000Z'))
      vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('retro-id')

      const result = useActivityStore.getState().addDurationEntry(20, '2026-04-05')

      // existing 10 min = 2 XP, now 30 min total = 5 XP, delta = 3
      expect(result.xpEarned).toBe(3)
      expect(result.dailyXpToday).toBe(5)
      expect(result.nextEntries).toHaveLength(2)

      vi.restoreAllMocks()
    })

    it('calculates XP as cumulative daily delta, not per-entry', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-04-07T08:00:00.000Z'))
      vi.spyOn(globalThis.crypto, 'randomUUID')
        .mockReturnValueOnce('entry-1')
        .mockReturnValueOnce('entry-2')

      const first = useActivityStore.getState().addDurationEntry(15)
      expect(first.xpEarned).toBe(2) // 15 min → tier 10+ = 2 XP

      const second = useActivityStore.getState().addDurationEntry(15)
      // cumulative 30 min → 5 XP total, minus previous 2 XP = 3 XP delta
      expect(second.xpEarned).toBe(3)
      expect(second.dailyXpToday).toBe(5)
      expect(second.nextEntries).toHaveLength(2)

      vi.restoreAllMocks()
    })
  })

  describe('getDailyTotalMinutes and getDailyXpForDate', () => {
    it('sums minutes for a date and maps daily XP from the aggregate', () => {
      useActivityStore.getState().addEntry(ENTRY_A)
      useActivityStore.getState().addEntry(ENTRY_B)

      expect(useActivityStore.getState().getDailyTotalMinutes('2026-04-07')).toBe(35)
      // 35 min → tier 30+ → 5 XP (not per-entry 3+2)
      expect(useActivityStore.getState().getDailyXpForDate('2026-04-07')).toBe(5)
    })
  })

  describe('loadFromStorage', () => {
    it('hydrates entries from localStorage', () => {
      localStorage.setItem(
        'it-counts:entries',
        JSON.stringify([ENTRY_A, ENTRY_C]),
      )

      useActivityStore.getState().loadFromStorage()

      expect(useActivityStore.getState().entries).toEqual([ENTRY_A, ENTRY_C])
    })

    it('returns empty array when localStorage is empty', () => {
      useActivityStore.getState().loadFromStorage()
      expect(useActivityStore.getState().entries).toEqual([])
    })
  })

  describe('getDailyEntries', () => {
    it('filters entries by date', () => {
      useActivityStore.getState().addEntry(ENTRY_A)
      useActivityStore.getState().addEntry(ENTRY_B)
      useActivityStore.getState().addEntry(ENTRY_C)

      const daily = useActivityStore.getState().getDailyEntries('2026-04-07')
      expect(daily).toEqual([ENTRY_A, ENTRY_B])
    })

    it('returns empty array for date with no entries', () => {
      useActivityStore.getState().addEntry(ENTRY_A)
      const daily = useActivityStore.getState().getDailyEntries('2026-01-01')
      expect(daily).toEqual([])
    })
  })

  describe('getWeeklyEntries', () => {
    it('returns entries whose week start matches', () => {
      useActivityStore.getState().addEntry(ENTRY_A)
      useActivityStore.getState().addEntry(ENTRY_C)

      // 2026-04-06 is Monday for both 04-07 (Tue) and 04-08 (Wed)
      const weekly = useActivityStore.getState().getWeeklyEntries('2026-04-06')
      expect(weekly).toEqual([ENTRY_A, ENTRY_C])
    })

    it('excludes entries from a different week', () => {
      const oldEntry: ActivityEntry = {
        id: 'old',
        date: '2026-03-30',
        durationMin: 10,
        loggedAt: '2026-03-30T10:00:00Z',
      }

      useActivityStore.getState().addEntry(oldEntry)
      useActivityStore.getState().addEntry(ENTRY_A)

      const weekly = useActivityStore.getState().getWeeklyEntries('2026-04-06')
      expect(weekly).toEqual([ENTRY_A])
    })
  })
})
