import { createContext, type ReactNode, useContext } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { calculateDailyXp } from '@/lib/xp'
import type { ActivityEntry } from '@/types'

const sheetMocks = vi.hoisted(() => ({
  entries: [] as ActivityEntry[],
  addDurationEntry: vi.fn(),
  syncXpFromEntries: vi.fn(),
}))

vi.mock('@/hooks/use-activity-store', () => ({
  useActivityStore: Object.assign(
    (
      selector: (state: {
        addDurationEntry: typeof sheetMocks.addDurationEntry
        entries: ActivityEntry[]
        getDailyTotalMinutes: (date: string) => number
      }) => unknown,
    ) =>
      selector({
        addDurationEntry: sheetMocks.addDurationEntry,
        entries: sheetMocks.entries,
        getDailyTotalMinutes: (date: string) =>
          sheetMocks.entries
            .filter((entry) => entry.date === date)
            .reduce((sum, entry) => sum + entry.durationMin, 0),
      }),
    {
      getState: () => ({
        entries: [...sheetMocks.entries],
        addDurationEntry: sheetMocks.addDurationEntry,
        getWeeklyXp: vi.fn(() => 0),
      }),
    },
  ),
}))

vi.mock('@/hooks/use-level-store', () => ({
  useLevelStore: vi.fn((selector: (state: { syncXpFromEntries: typeof sheetMocks.syncXpFromEntries }) => unknown) =>
    selector({
      syncXpFromEntries: sheetMocks.syncXpFromEntries,
    })
  ),
}))

vi.mock('@/lib/dates', () => ({
  getTodayString: vi.fn(() => '2026-04-07'),
  getWeekStart: vi.fn(() => '2026-03-31'),
}))

vi.mock('@/hooks/use-settings-store', () => ({
  useSettingsStore: Object.assign(vi.fn(), {
    getState: () => ({
      getSetting: vi.fn(() => undefined),
      setSetting: vi.fn(),
    }),
  }),
}))

vi.mock('@/lib/messages', () => ({
  getRandomMessage: vi.fn(() => 'Quiet win.'),
}))

type SheetContextValue = {
  open: boolean
  onOpenChange?: (nextOpen: boolean) => void
}

const SheetContext = createContext<SheetContextValue>({ open: false })

vi.mock('@bubbles/ui/shadcn/sheet', () => {
  function Sheet({
    open = false,
    onOpenChange,
    children,
  }: {
    open?: boolean
    onOpenChange?: (nextOpen: boolean) => void
    children: ReactNode
  }) {
    return (
      <SheetContext.Provider value={{ open, onOpenChange }}>
        {children}
      </SheetContext.Provider>
    )
  }

  function SheetContent({ children }: { children: ReactNode }) {
    const context = useContext(SheetContext)

    if (!context.open) {
      return null
    }

    return <div role="dialog">{children}</div>
  }

  function SheetHeader({ children }: { children: ReactNode }) {
    return <div>{children}</div>
  }

  function SheetTitle({ children, className }: { children: ReactNode; className?: string }) {
    return <h2 className={className}>{children}</h2>
  }

  function SheetDescription({
    children,
    className,
  }: {
    children: ReactNode
    className?: string
  }) {
    return <p className={className}>{children}</p>
  }

  return {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
  }
})

import { useUiStore } from '@/hooks/use-ui-store'
import { LogEntrySheet } from '@/components/logging/log-entry-sheet'

describe('LogEntrySheet', () => {
  beforeEach(() => {
    useUiStore.setState({ logSheetOpen: true })
    sheetMocks.entries = []
    sheetMocks.addDurationEntry.mockReset()
    sheetMocks.syncXpFromEntries.mockReset()
    sheetMocks.addDurationEntry.mockImplementation((durationMin: number) => {
      const entry: ActivityEntry = {
        id: 'generated-id',
        date: '2026-04-07',
        durationMin,
        loggedAt: '2026-04-07T10:15:00.000Z',
      }
      sheetMocks.entries = [...sheetMocks.entries, entry]
      const totalMin = sheetMocks.entries.reduce((sum, e) => sum + e.durationMin, 0)
      const dailyXpToday = calculateDailyXp(totalMin)
      const previousTotal = totalMin - durationMin
      return {
        entry,
        xpEarned: dailyXpToday - calculateDailyXp(previousTotal),
        dailyXpToday,
      }
    })
  })

  it('toggles to time-range mode and back to duration mode', () => {
    render(<LogEntrySheet />)

    expect(screen.getByLabelText(/minutes/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /use start \/ end time instead/i }))

    expect(screen.queryByLabelText(/^minutes$/i)).not.toBeInTheDocument()
    expect(screen.getByLabelText(/start time/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/end time/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/non-walking/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /use duration instead/i }))

    expect(screen.getByLabelText(/^minutes$/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/start time/i)).not.toBeInTheDocument()
  })

  it('shows an error below end time when end is not after start', () => {
    render(<LogEntrySheet />)

    fireEvent.click(screen.getByRole('button', { name: /use start \/ end time instead/i }))

    fireEvent.change(screen.getByLabelText(/start time/i), { target: { value: '10:00' } })
    fireEvent.change(screen.getByLabelText(/end time/i), { target: { value: '09:30' } })

    expect(screen.getByRole('alert')).toHaveTextContent('End time must be after start time.')
    expect(screen.getByRole('button', { name: /log it/i })).toBeDisabled()
  })

  it('shows an error when non-walking exceeds total trip duration', () => {
    render(<LogEntrySheet />)

    fireEvent.click(screen.getByRole('button', { name: /use start \/ end time instead/i }))

    fireEvent.change(screen.getByLabelText(/start time/i), { target: { value: '09:00' } })
    fireEvent.change(screen.getByLabelText(/end time/i), { target: { value: '09:30' } })
    fireEvent.change(screen.getByLabelText(/non-walking/i), { target: { value: '40' } })

    expect(screen.getByRole('alert')).toHaveTextContent('Non-walking time exceeds trip duration.')
    expect(screen.getByRole('button', { name: /log it/i })).toBeDisabled()
  })

  it('submits with correct walking minutes in time-range mode', () => {
    render(<LogEntrySheet />)

    fireEvent.click(screen.getByRole('button', { name: /use start \/ end time instead/i }))

    // 09:00 → 10:00 = 60 min total, 15 min non-walking → 45 min walking
    fireEvent.change(screen.getByLabelText(/start time/i), { target: { value: '09:00' } })
    fireEvent.change(screen.getByLabelText(/end time/i), { target: { value: '10:00' } })
    fireEvent.change(screen.getByLabelText(/non-walking/i), { target: { value: '15' } })

    fireEvent.click(screen.getByRole('button', { name: /log it/i }))

    expect(sheetMocks.addDurationEntry).toHaveBeenCalledWith(45, '2026-04-07')
    expect(sheetMocks.syncXpFromEntries).toHaveBeenCalledWith(
      expect.arrayContaining(sheetMocks.entries),
    )
    const syncedEntries = sheetMocks.syncXpFromEntries.mock.calls.at(-1)?.[0] as ActivityEntry[]
    expect(syncedEntries).not.toBe(sheetMocks.entries)
    expect(screen.getByText('Today total: 5 XP · That counted.')).toBeInTheDocument()
  })

  it('submit is disabled in time-range mode when fields are incomplete', () => {
    render(<LogEntrySheet />)

    fireEvent.click(screen.getByRole('button', { name: /use start \/ end time instead/i }))

    // Only fill start time, leave end empty
    fireEvent.change(screen.getByLabelText(/start time/i), { target: { value: '09:00' } })

    expect(screen.getByRole('button', { name: /log it/i })).toBeDisabled()
  })

  it('focuses the minutes input when sheet opens and previews XP live', async () => {
    render(<LogEntrySheet />)

    const input = screen.getByLabelText(/minutes/i)

    await waitFor(() => {
      expect(input).toHaveFocus()
    })

    fireEvent.change(input, { target: { value: '30' } })

    expect(screen.getByText('= 5 XP today')).toBeInTheDocument()
  })

  it('submits the duration, mirrors earned xp into the level store, and shows inline confirmation', async () => {
    render(<LogEntrySheet />)

    fireEvent.change(screen.getByLabelText(/minutes/i), {
      target: { value: '30' },
    })
    fireEvent.click(screen.getByRole('button', { name: /log it/i }))

    expect(sheetMocks.addDurationEntry).toHaveBeenCalledWith(30, '2026-04-07')
    expect(sheetMocks.syncXpFromEntries).toHaveBeenCalledWith(
      expect.arrayContaining(sheetMocks.entries),
    )
    expect(screen.getByText('Today total: 5 XP · That counted.')).toBeInTheDocument()
    expect(screen.getByText('Quiet win.')).toBeInTheDocument()

    await waitFor(
      () => {
        expect(screen.queryByText('Today total: 5 XP · That counted.')).not.toBeInTheDocument()
      },
      { timeout: 1500 },
    )
  })

  it('shows recalculated daily total when a third entry crosses the tier threshold', () => {
    sheetMocks.entries = [
      {
        id: 'entry-1',
        date: '2026-04-07',
        durationMin: 10,
        loggedAt: '2026-04-07T08:00:00.000Z',
      },
      {
        id: 'entry-2',
        date: '2026-04-07',
        durationMin: 5,
        loggedAt: '2026-04-07T09:00:00.000Z',
      },
    ]

    render(<LogEntrySheet />)
    fireEvent.change(screen.getByLabelText(/minutes/i), { target: { value: '15' } })
    fireEvent.click(screen.getByRole('button', { name: /log it/i }))

    expect(screen.getByText('Today total: 5 XP · That counted.')).toBeInTheDocument()
  })

  it('shows a validation error when the input is empty or invalid', () => {
    render(<LogEntrySheet />)

    fireEvent.click(screen.getByRole('button', { name: /log it/i }))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Enter whole minutes greater than 0.',
    )
    expect(sheetMocks.addDurationEntry).not.toHaveBeenCalled()
  })
})
