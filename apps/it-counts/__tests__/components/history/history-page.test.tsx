import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/hooks/use-activity-store', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useActivityStore: vi.fn((selector) => selector({ entries: [] } as any)),
}))

import { useActivityStore } from '@/hooks/use-activity-store'
import HistoryPage from '@/app/history/page'

describe('HistoryPage — empty state', () => {
  it('shows the neutral empty state when no entries exist', () => {
    render(<HistoryPage />)
    expect(
      screen.getByText(/Nothing logged yet. Your history will appear here./i)
    ).toBeInTheDocument()
  })

  it('has no CTA button in the content area', () => {
    render(<HistoryPage />)
    const main = screen.getByRole('main')
    expect(main.querySelector('button')).toBeNull()
  })
})

describe('HistoryPage — with entries', () => {
  const entries = [
    { id: '1', date: '2026-04-07', durationMin: 20, loggedAt: '2026-04-07T08:00:00.000Z' },
    { id: '2', date: '2026-04-07', durationMin: 15, loggedAt: '2026-04-07T16:00:00.000Z' },
    { id: '3', date: '2026-04-06', durationMin: 30, loggedAt: '2026-04-06T10:00:00.000Z' },
  ]

  beforeEach(() => {
    vi.mocked(useActivityStore).mockImplementation((selector) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      selector({ entries } as any)
    )
  })

  it('shows two daily groups', () => {
    render(<HistoryPage />)
    // Each group should have a date heading — 2026-04-07 and 2026-04-06
    const groups = screen.getAllByRole('article')
    expect(groups).toHaveLength(2)
  })

  it('renders most recent day first (2026-04-07 before 2026-04-06)', () => {
    render(<HistoryPage />)
    const groups = screen.getAllByRole('article')
    expect(groups[0]).toHaveTextContent('2026-04-07')
    expect(groups[1]).toHaveTextContent('2026-04-06')
  })

  it('shows daily total minutes and XP for April 7 (35 min → 5 XP)', () => {
    render(<HistoryPage />)
    // 20 + 15 = 35 min → calculateDailyXp(35) = 5 XP (≥30 min)
    expect(screen.getByText(/35 min total · 5 XP/i)).toBeInTheDocument()
  })

  it('shows daily total for April 6 (30 min → 5 XP)', () => {
    render(<HistoryPage />)
    expect(screen.getByText(/30 min total/i)).toBeInTheDocument()
  })

  it('renders both entries for April 7', () => {
    render(<HistoryPage />)
    expect(screen.getByText(/20 min/)).toBeInTheDocument()
    expect(screen.getByText(/15 min/)).toBeInTheDocument()
  })

  it('has no edit or delete buttons', () => {
    render(<HistoryPage />)
    expect(screen.queryByRole('button', { name: /edit|delete|remove/i })).not.toBeInTheDocument()
  })
})
