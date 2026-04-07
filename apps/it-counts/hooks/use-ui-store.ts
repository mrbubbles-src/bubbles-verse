import { create } from 'zustand'

interface UiState {
  sessionMessageShown: boolean
  setSessionMessageShown: () => void
}

/**
 * Tracks ephemeral UI state that resets on every app session.
 * No persistence — the flag lives only in memory.
 */
export const useUiStore = create<UiState>()((set) => ({
  sessionMessageShown: false,

  setSessionMessageShown: () => {
    set({ sessionMessageShown: true })
  },
}))
