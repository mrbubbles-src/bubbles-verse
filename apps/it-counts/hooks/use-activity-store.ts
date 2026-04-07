import { create } from 'zustand'

import type { ActivityEntry } from '@/types'
import { loadEntries, saveEntries } from '@/lib/storage'
import { getWeekStart } from '@/lib/dates'

interface ActivityState {
  entries: ActivityEntry[]
  addEntry: (entry: ActivityEntry) => void
  loadFromStorage: () => void
  getDailyEntries: (date: string) => ActivityEntry[]
  getWeeklyEntries: (weekStart: string) => ActivityEntry[]
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

  getDailyEntries: (date) => {
    return get().entries.filter((e) => e.date === date)
  },

  getWeeklyEntries: (weekStart) => {
    return get().entries.filter((e) => getWeekStart(e.date) === weekStart)
  },
}))
