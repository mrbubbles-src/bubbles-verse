import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  loadCurrentLevel,
  loadEntries,
  loadSettings,
  saveCurrentLevel,
  saveEntries,
  saveSettings,
} from '@/lib/storage'
import type { ActivityEntry, AppSettings, LevelState } from '@/types'

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('returns safe defaults when storage is empty', () => {
    expect(loadEntries()).toEqual([])
    expect(loadCurrentLevel()).toBeNull()
    expect(loadSettings()).toEqual({})
  })

  it('round-trips typed entries, level state, and settings', () => {
    const entries: ActivityEntry[] = [
      {
        id: 'entry-1',
        date: '2026-04-07',
        durationMin: 25,
        loggedAt: '2026-04-07T08:30:00.000Z',
      },
    ]
    const levelState: LevelState = {
      level: 2,
      startDate: '2026-04-01',
      xp: 42,
      overXp: 3,
    }
    const settings: AppSettings = {
      reducedMotion: true,
      reminderHour: 18,
      welcomeMessage: 'Keep going',
    }

    saveEntries(entries)
    saveCurrentLevel(levelState)
    saveSettings(settings)

    expect(loadEntries()).toEqual(entries)
    expect(loadCurrentLevel()).toEqual(levelState)
    expect(loadSettings()).toEqual(settings)
  })

  it('falls back gracefully when stored payloads are malformed', () => {
    localStorage.setItem('it-counts:entries', '{bad json')
    localStorage.setItem('it-counts:current-level', JSON.stringify({ level: '2' }))
    localStorage.setItem('it-counts:settings', JSON.stringify(['not-an-object']))

    expect(loadEntries()).toEqual([])
    expect(loadCurrentLevel()).toBeNull()
    expect(loadSettings()).toEqual({})
  })

  it('rejects payloads with impossible persisted dates', () => {
    localStorage.setItem(
      'it-counts:entries',
      JSON.stringify([
        {
          id: 'entry-1',
          date: '2026-02-31',
          durationMin: 20,
          loggedAt: '2026-04-07T08:30:00.000Z',
        },
      ]),
    )
    localStorage.setItem(
      'it-counts:current-level',
      JSON.stringify({
        level: 2,
        startDate: '2026-02-31',
        xp: 40,
        overXp: 2,
      }),
    )

    expect(loadEntries()).toEqual([])
    expect(loadCurrentLevel()).toBeNull()
  })

  it('returns safe defaults when localStorage access throws', () => {
    const localStorageGetter = vi
      .spyOn(window, 'localStorage', 'get')
      .mockImplementation(() => {
        throw new DOMException('Blocked', 'SecurityError')
      })

    expect(loadEntries()).toEqual([])
    expect(loadCurrentLevel()).toBeNull()
    expect(loadSettings()).toEqual({})

    expect(() =>
      saveEntries([
        {
          id: 'entry-1',
          date: '2026-04-07',
          durationMin: 25,
          loggedAt: '2026-04-07T08:30:00.000Z',
        },
      ]),
    ).not.toThrow()

    localStorageGetter.mockRestore()
  })
})
