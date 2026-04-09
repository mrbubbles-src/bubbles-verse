import { create } from 'zustand'

import type { ActivityEntry } from '@/types'
import { getTodayString, getWeekStart, parseLocalDate } from '@/lib/dates'
import { createEntryId } from '@/lib/create-entry-id'
import { loadEntries, saveEntries } from '@/lib/storage'
import { calculateDailyXp } from '@/lib/xp'

export type AddDurationEntryResult = {
  entry: ActivityEntry
  /** Tier delta from this log relative to prior today total (level sync uses the log, not this field). */
  xpEarned: number
  /** `calculateDailyXp` for today after this entry — use for confirmation copy. */
  dailyXpToday: number
  /** Snapshot of all entries after insertion, used to keep cross-store sync deterministic. */
  nextEntries: ActivityEntry[]
}

interface ActivityState {
  entries: ActivityEntry[]
  addEntry: (entry: ActivityEntry) => void
  addDurationEntry: (durationMin: number, date?: string) => AddDurationEntryResult
  loadFromStorage: () => void
  getDailyEntries: (date: string) => ActivityEntry[]
  getDailyTotalMinutes: (date: string) => number
  getDailyXpForDate: (date: string) => number
  getWeeklyEntries: (weekStart: string) => ActivityEntry[]
  /** Sum of daily XP for each unique day in the given Monday-anchored week. */
  getWeeklyXp: (weekStart: string) => number
}

/**
 * Returns `true` when the provided value is a valid persisted local day key.
 */
function isValidEntryDate(value: string | undefined): value is string {
  if (typeof value !== 'string' || value.length === 0) {
    return false
  }

  try {
    parseLocalDate(value)
    return true
  } catch {
    return false
  }
}

/**
 * Manages the persisted activity log.
 * Every mutation writes through to `lib/storage.ts` immediately.
 */
export const useActivityStore = create<ActivityState>()((set, get) => ({
  entries: [],

  loadFromStorage: () => {
    set({ entries: loadEntries() })
  },

  addEntry: (entry) => {
    const next = [...get().entries, entry]
    saveEntries(next)
    set({ entries: next })
  },

  addDurationEntry: (durationMin, date) => {
    const targetDate = isValidEntryDate(date) ? date : getTodayString()
    const entry: ActivityEntry = {
      id: createEntryId(),
      date: targetDate,
      durationMin,
      loggedAt: new Date().toISOString(),
    }

    const entries = get().entries
    const previousDailyTotal = entries
      .filter((e) => e.date === targetDate)
      .reduce((sum, e) => sum + e.durationMin, 0)

    const previousXp = calculateDailyXp(previousDailyTotal)
    const newDailyTotal = previousDailyTotal + durationMin
    const dailyXpToday = calculateDailyXp(newDailyTotal)

    const next = [...entries, entry]
    saveEntries(next)
    set({ entries: next })

    return {
      entry,
      xpEarned: dailyXpToday - previousXp,
      dailyXpToday,
      nextEntries: next,
    }
  },

  getDailyEntries: (date) => {
    return get().entries.filter((e) => e.date === date)
  },

  getDailyTotalMinutes: (date) => {
    return get()
      .entries.filter((e) => e.date === date)
      .reduce((sum, e) => sum + e.durationMin, 0)
  },

  getDailyXpForDate: (date) => {
    const minutes = get().getDailyTotalMinutes(date)
    return calculateDailyXp(minutes)
  },

  getWeeklyEntries: (weekStart) => {
    return get().entries.filter((e) => getWeekStart(e.date) === weekStart)
  },

  getWeeklyXp: (weekStart) => {
    const weekEntries = get().getWeeklyEntries(weekStart)
    const uniqueDates = [...new Set(weekEntries.map((e) => e.date))]
    return uniqueDates.reduce((sum, date) => sum + get().getDailyXpForDate(date), 0)
  },
}))
