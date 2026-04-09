import { create } from 'zustand'

import type { AppSettings } from '@/types'
import { loadSettings, saveSettings } from '@/lib/storage'

interface SettingsState {
  settings: AppSettings
  loadFromStorage: () => void
  /** Returns the stored value for `key`, or `undefined` if not set. */
  getSetting: (key: string) => string | number | boolean | null | undefined
  /** Persists `key → value` immediately to localStorage and updates state. */
  setSetting: (key: string, value: string | number | boolean | null) => void
}

/**
 * Manages persisted app settings via `lib/storage.ts`.
 * Suitable for cross-session flags such as weekly message markers.
 * Every `setSetting` call writes through to localStorage immediately.
 */
export const useSettingsStore = create<SettingsState>()((set, get) => ({
  settings: {},

  loadFromStorage: () => {
    set({ settings: loadSettings() })
  },

  getSetting: (key) => {
    return get().settings[key]
  },

  setSetting: (key, value) => {
    const next: AppSettings = { ...get().settings, [key]: value }
    saveSettings(next)
    set({ settings: next })
  },
}))
