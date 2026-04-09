import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useSettingsStore } from '@/hooks/use-settings-store'
import * as storage from '@/lib/storage'

vi.mock('@/lib/storage', () => ({
  loadSettings: vi.fn(() => ({})),
  saveSettings: vi.fn(),
}))

function resetStore() {
  useSettingsStore.setState({ settings: {} })
}

describe('useSettingsStore', () => {
  beforeEach(() => {
    resetStore()
    vi.mocked(storage.loadSettings).mockReturnValue({})
    vi.mocked(storage.saveSettings).mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('starts with empty settings', () => {
    expect(useSettingsStore.getState().settings).toEqual({})
  })

  it('getSetting returns undefined for unknown keys', () => {
    expect(useSettingsStore.getState().getSetting('unknown')).toBeUndefined()
  })

  it('setSetting stores a value and persists it', () => {
    useSettingsStore.getState().setSetting('weeklyResetShownForWeek', '2026-04-06')

    expect(useSettingsStore.getState().getSetting('weeklyResetShownForWeek')).toBe('2026-04-06')
    expect(storage.saveSettings).toHaveBeenCalledWith({ weeklyResetShownForWeek: '2026-04-06' })
  })

  it('setSetting supports boolean and null values', () => {
    useSettingsStore.getState().setSetting('flag', true)
    useSettingsStore.getState().setSetting('empty', null)

    expect(useSettingsStore.getState().getSetting('flag')).toBe(true)
    expect(useSettingsStore.getState().getSetting('empty')).toBeNull()
  })

  it('multiple keys coexist', () => {
    useSettingsStore.getState().setSetting('keyA', 'valueA')
    useSettingsStore.getState().setSetting('keyB', 42)

    expect(useSettingsStore.getState().getSetting('keyA')).toBe('valueA')
    expect(useSettingsStore.getState().getSetting('keyB')).toBe(42)
  })

  it('loadFromStorage hydrates settings from storage', () => {
    vi.mocked(storage.loadSettings).mockReturnValue({ weeklyResetShownForWeek: '2026-03-30' })

    useSettingsStore.getState().loadFromStorage()

    expect(useSettingsStore.getState().getSetting('weeklyResetShownForWeek')).toBe('2026-03-30')
  })

  it('setSetting overwrites an existing key', () => {
    useSettingsStore.getState().setSetting('weeklyResetShownForWeek', '2026-03-30')
    useSettingsStore.getState().setSetting('weeklyResetShownForWeek', '2026-04-06')

    expect(useSettingsStore.getState().getSetting('weeklyResetShownForWeek')).toBe('2026-04-06')
  })
})
