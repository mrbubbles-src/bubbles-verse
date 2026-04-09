import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SessionStartMessage } from '@/components/dashboard/session-start-message'
import { useSettingsStore } from '@/hooks/use-settings-store'
import { useUiStore } from '@/hooks/use-ui-store'

vi.mock('@/lib/messages', () => ({
  getRandomMessage: vi.fn((context: string) => {
    if (context === 'weekly-reset') return 'New week, fresh start.'
    return 'Everything you logged before still counts today.'
  }),
}))

vi.mock('@/lib/dates', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/dates')>()
  return {
    ...actual,
    getTodayString: vi.fn(() => '2026-04-08'),
    // 2026-04-08 is a Wednesday; week starts on 2026-04-06
    getWeekStart: vi.fn(() => '2026-04-06'),
  }
})

vi.mock('@/lib/storage', () => ({
  loadSettings: vi.fn(() => ({})),
  saveSettings: vi.fn(),
  loadEntries: vi.fn(() => []),
  saveEntries: vi.fn(),
  loadCurrentLevel: vi.fn(() => null),
  saveCurrentLevel: vi.fn(),
}))

function resetStores() {
  useUiStore.setState({ sessionMessageShown: false })
  useSettingsStore.setState({ settings: {} })
}

describe('SessionStartMessage', () => {
  beforeEach(() => {
    resetStores()
  })

  it('shows weekly-reset message on first open of a new week', async () => {
    render(<SessionStartMessage />)

    await waitFor(() => {
      expect(screen.getByText('New week, fresh start.')).toBeInTheDocument()
    })
  })

  it('marks weeklyResetShownForWeek in settings after showing weekly-reset', async () => {
    render(<SessionStartMessage />)

    await waitFor(() => {
      expect(useSettingsStore.getState().getSetting('weeklyResetShownForWeek')).toBe('2026-04-06')
    })
  })

  it('sets sessionMessageShown after showing weekly-reset', async () => {
    render(<SessionStartMessage />)

    await waitFor(() => {
      expect(useUiStore.getState().sessionMessageShown).toBe(true)
    })
  })

  it('falls back to session-start when weekly-reset already shown this week', async () => {
    useSettingsStore.setState({ settings: { weeklyResetShownForWeek: '2026-04-06' } })

    render(<SessionStartMessage />)

    await waitFor(() => {
      expect(
        screen.getByText('Everything you logged before still counts today.')
      ).toBeInTheDocument()
    })
  })

  it('shows nothing after session flag is already set', () => {
    useUiStore.getState().setSessionMessageShown()

    render(<SessionStartMessage />)

    expect(screen.queryByText('New week, fresh start.')).not.toBeInTheDocument()
    expect(
      screen.queryByText('Everything you logged before still counts today.')
    ).not.toBeInTheDocument()
  })

  it('does not re-show weekly-reset on same-session navigation (session flag guards it)', async () => {
    render(<SessionStartMessage />)
    await waitFor(() => {
      expect(screen.getByText('New week, fresh start.')).toBeInTheDocument()
    })

    // Simulate same-session re-render (flag already set)
    const { unmount } = render(<SessionStartMessage />)
    expect(screen.queryAllByText('New week, fresh start.')).toHaveLength(1)
    unmount()
  })
})
