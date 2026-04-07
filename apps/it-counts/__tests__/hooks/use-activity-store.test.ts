import { beforeEach, describe, expect, it } from 'vitest'

import { useActivityStore } from '@/hooks/use-activity-store'
import type { ActivityEntry } from '@/types'

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
