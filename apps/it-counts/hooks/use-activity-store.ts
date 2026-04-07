import { create } from 'zustand'

import type { ActivityEntry } from '@/types'
import { getTodayString } from '@/lib/dates'
import { loadEntries, saveEntries } from '@/lib/storage'
import { calculateDailyXp } from '@/lib/xp'
import { getWeekStart } from '@/lib/dates'

export type AddDurationEntryResult = {
  entry: ActivityEntry
  /** Tier delta from this log relative to prior today total (level sync uses the log, not this field). */
  xpEarned: number
  /** `calculateDailyXp` for today after this entry — use for confirmation copy. */
  dailyXpToday: number
}

interface ActivityState {
  entries: ActivityEntry[]
  addEntry: (entry: ActivityEntry) => void
  addDurationEntry: (durationMin: number) => AddDurationEntryResult
  loadFromStorage: () => void
  getDailyEntries: (date: string) => ActivityEntry[]
  getDailyTotalMinutes: (date: string) => number
  getDailyXpForDate: (date: string) => number
  getWeeklyEntries: (weekStart: string) => ActivityEntry[]
  /** Sum of daily XP for each unique day in the given Monday-anchored week. */
  getWeeklyXp: (weekStart: string) => number
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

  addDurationEntry: (durationMin) => {
    const today = getTodayString()
    const entry: ActivityEntry = {
      id: crypto.randomUUID(),
      date: today,
      durationMin,
      loggedAt: new Date().toISOString(),
    }

    const entries = get().entries
    const previousDailyTotal = entries
      .filter((e) => e.date === today)
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
