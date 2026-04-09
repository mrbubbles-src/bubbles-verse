import * as React from 'react'

import { render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ActivityEntry } from '@/types'

const LEVEL_ONE_START_DATE_LOCK_KEY = 'levelOneStartDateLocked'

const storeMocks = vi.hoisted(() => {
  const activityListeners = new Set<() => void>()
  const hydratedEntries: ActivityEntry[] = []

  const activityState = {
    entries: [] as ActivityEntry[],
    loadFromStorage: vi.fn(() => {
      activityState.entries = hydratedEntries
      activityListeners.forEach((listener) => listener())
    }),
  }

  const levelState = {
    levelState: {
      level: 1,
    },
    loadFromStorage: vi.fn(),
    syncXpFromEntries: vi.fn(),
  }

  const settingsState = {
    settings: {} as Record<string, boolean>,
    loadFromStorage: vi.fn(),
    setSetting: vi.fn((key: string, value: boolean) => {
      settingsState.settings = { ...settingsState.settings, [key]: value }
    }),
  }

  return {
    activityState,
    hydratedEntries,
    levelState,
    settingsState,
    reset() {
      activityListeners.clear()
      hydratedEntries.splice(0, hydratedEntries.length)
      hydratedEntries.push({
        id: 'entry-1',
        date: '2026-04-07',
        durationMin: 30,
        loggedAt: '2026-04-07T10:00:00.000Z',
      })
      activityState.entries = []
      activityState.loadFromStorage.mockClear()
      levelState.loadFromStorage.mockClear()
      levelState.syncXpFromEntries.mockClear()
      levelState.levelState.level = 1
      settingsState.loadFromStorage.mockClear()
      settingsState.settings = {}
      settingsState.setSetting.mockClear()
    },
    subscribeActivity(listener: () => void) {
      activityListeners.add(listener)
      return () => {
        activityListeners.delete(listener)
      }
    },
  }
})

vi.mock('@/hooks/use-activity-store', () => ({
  useActivityStore: (selector: (state: typeof storeMocks.activityState) => unknown) => {
    const [, forceRender] = React.useReducer((count: number) => count + 1, 0)

    React.useEffect(() => storeMocks.subscribeActivity(() => forceRender()), [])

    return selector(storeMocks.activityState)
  },
}))

vi.mock('@/hooks/use-level-store', () => ({
  LEVEL_ONE_START_DATE_LOCK_KEY: 'levelOneStartDateLocked',
  useLevelStore: (selector: (state: typeof storeMocks.levelState) => unknown) =>
    selector(storeMocks.levelState),
}))

vi.mock('@/hooks/use-settings-store', () => ({
  useSettingsStore: (selector: (state: typeof storeMocks.settingsState) => unknown) =>
    selector(storeMocks.settingsState),
}))

import { StoreHydrator } from '@/components/shared/store-hydrator'

describe('StoreHydrator', () => {
  beforeEach(() => {
    storeMocks.reset()
  })

  it('waits for hydrated entries before syncing level xp', async () => {
    render(<StoreHydrator />)

    await waitFor(() => {
      expect(storeMocks.levelState.syncXpFromEntries).toHaveBeenCalledWith(
        storeMocks.hydratedEntries,
        { establishLevelOneAnchor: true },
      )
    })

    const firstSyncEntries = storeMocks.levelState.syncXpFromEntries.mock.calls[0]?.[0]
    expect(firstSyncEntries).toEqual(storeMocks.hydratedEntries)
    expect(storeMocks.activityState.loadFromStorage).toHaveBeenCalledOnce()
    expect(storeMocks.levelState.loadFromStorage).toHaveBeenCalledOnce()
    expect(storeMocks.settingsState.loadFromStorage).toHaveBeenCalledOnce()
    expect(storeMocks.settingsState.setSetting).toHaveBeenCalledWith(
      LEVEL_ONE_START_DATE_LOCK_KEY,
      true,
    )
  })

  it('does not lock level 1 during hydration when there are no entries yet', async () => {
    storeMocks.hydratedEntries.splice(0, storeMocks.hydratedEntries.length)

    render(<StoreHydrator />)

    await waitFor(() => {
      expect(storeMocks.levelState.syncXpFromEntries).toHaveBeenCalledWith(
        storeMocks.hydratedEntries,
        undefined,
      )
    })

    expect(storeMocks.settingsState.setSetting).not.toHaveBeenCalled()
  })

  it('does not re-lock level 1 when the anchor flag is already present', async () => {
    storeMocks.settingsState.settings = {
      [LEVEL_ONE_START_DATE_LOCK_KEY]: true,
    }

    render(<StoreHydrator />)

    await waitFor(() => {
      expect(storeMocks.levelState.syncXpFromEntries).toHaveBeenCalledWith(
        storeMocks.hydratedEntries,
        undefined,
      )
    })

    expect(storeMocks.settingsState.setSetting).not.toHaveBeenCalled()
  })

  it('skips level 1 anchor work for later levels', async () => {
    storeMocks.levelState.levelState.level = 2

    render(<StoreHydrator />)

    await waitFor(() => {
      expect(storeMocks.levelState.syncXpFromEntries).toHaveBeenCalledWith(
        storeMocks.hydratedEntries,
        undefined,
      )
    })

    expect(storeMocks.settingsState.setSetting).not.toHaveBeenCalled()
  })
})
