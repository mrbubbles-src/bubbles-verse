import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/hooks/use-activity-store', () => ({
  useActivityStore: vi.fn((selector) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selector({ entries: [] } as any)
  ),
}))

import { useActivityStore } from '@/hooks/use-activity-store'
import HistoryPage from '@/app/history/page'

// 2026-04-07 is Tuesday → weekStart = 2026-04-06
// 2026-03-30 is Monday → weekStart = 2026-03-30
const multiWeekEntries = [
  { id: '1', date: '2026-04-07', durationMin: 30, loggedAt: '2026-04-07T08:00:00.000Z' },
  { id: '2', date: '2026-04-08', durationMin: 20, loggedAt: '2026-04-08T09:00:00.000Z' },
  { id: '3', date: '2026-03-30', durationMin: 15, loggedAt: '2026-03-30T10:00:00.000Z' },
  { id: '4', date: '2026-03-31', durationMin: 25, loggedAt: '2026-03-31T11:00:00.000Z' },
]

describe('HistoryPage — weekly grouping', () => {
  beforeEach(() => {
    vi.mocked(useActivityStore).mockImplementation((selector) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selector({ entries: multiWeekEntries } as any)
    )
  })

  it('renders two WeeklyGroup regions', () => {
    render(<HistoryPage />)
    const regions = screen.getAllByRole('region')
    expect(regions).toHaveLength(2)
  })

  it('shows most recent week first (Apr 2026 before Mar 2026)', () => {
    render(<HistoryPage />)
    const regions = screen.getAllByRole('region')
    expect(regions[0]).toHaveTextContent(/Apr/)
    expect(regions[1]).toHaveTextContent(/Mar/)
  })

  it('shows the week range label for the current week', () => {
    render(<HistoryPage />)
    // weekStart 2026-04-06 → "Apr 6 – Apr 12"
    expect(screen.getByText(/Apr 6\s*[–-]\s*Apr 12/i)).toBeInTheDocument()
  })

  it('shows the weekly XP total for the current week', () => {
    render(<HistoryPage />)
    // 2026-04-07: 30 min → 5 XP; 2026-04-08: 20 min → 3 XP; total = 8 XP
    expect(screen.getByText(/8 XP/i)).toBeInTheDocument()
  })

  it('each week contains daily groups for days with entries only', () => {
    render(<HistoryPage />)
    const articles = screen.getAllByRole('article')
    // 2 days in week1 + 2 days in week2 = 4 daily groups
    expect(articles).toHaveLength(4)
  })

  it('empty state shown when there are no entries', () => {
    vi.mocked(useActivityStore).mockImplementation((selector) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selector({ entries: [] } as any)
    )
    render(<HistoryPage />)
    expect(screen.getByText(/Nothing logged yet/i)).toBeInTheDocument()
    expect(screen.queryByRole('region')).not.toBeInTheDocument()
  })
})
