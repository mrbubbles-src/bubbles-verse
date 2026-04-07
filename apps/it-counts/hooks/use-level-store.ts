import { create } from 'zustand'

import type { LevelState } from '@/types'
import { loadCurrentLevel, saveCurrentLevel } from '@/lib/storage'
import { getTodayString, getWeeksElapsedInLevel } from '@/lib/dates'
import { calculateOverXp, isLevelUpEligible } from '@/lib/levels'

/**
 * Builds a fresh default level state using today's date at call time,
 * avoiding a stale module-level constant.
 */
function createDefaultLevelState(): LevelState {
  return {
    level: 1,
    startDate: getTodayString(),
    xp: 0,
    overXp: 0,
  }
}

interface LevelStoreState {
  levelState: LevelState
  addXp: (xpToAdd: number) => void
  loadFromStorage: () => void
  triggerLevelUp: () => void
  isEligible: boolean
}

/**
 * Manages the current level progress.
 * `isEligible` is derived on every state change from XP + weeks elapsed.
 * Every mutation writes through to `lib/storage.ts` immediately.
 */
export const useLevelStore = create<LevelStoreState>()((set, get) => ({
  levelState: createDefaultLevelState(),
  isEligible: false,

  addXp: (xpToAdd) => {
    if (Number.isFinite(xpToAdd) === false || xpToAdd <= 0) {
      return
    }

    const current = get().levelState
    const nextXp = current.xp + xpToAdd
    const today = getTodayString()
    const weeksElapsed = getWeeksElapsedInLevel(current.startDate, today)
    const next: LevelState = {
      ...current,
      xp: nextXp,
      overXp: calculateOverXp(nextXp),
    }

    saveCurrentLevel(next)
    set({
      levelState: next,
      isEligible: isLevelUpEligible(nextXp, weeksElapsed),
    })
  },

  loadFromStorage: () => {
    const loaded = loadCurrentLevel()
    const state = loaded ?? createDefaultLevelState()
    const weeksElapsed = getWeeksElapsedInLevel(state.startDate, getTodayString())

    set({
      levelState: state,
      isEligible: isLevelUpEligible(state.xp, weeksElapsed),
    })
  },

  triggerLevelUp: () => {
    const current = get().levelState
    const today = getTodayString()
    const next: LevelState = {
      level: current.level + 1,
      startDate: today,
      xp: 0,
      overXp: 0,
    }

    saveCurrentLevel(next)
    set({
      levelState: next,
      isEligible: false,
    })
  },
}))
