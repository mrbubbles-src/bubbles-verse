import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { WeeklySummary } from '@/components/dashboard/weekly-summary'

// Pin today to a known Monday+6 offset — 2026-04-13 is a Monday, so 2026-04-08 is in week starting 2026-04-06
vi.mock('@/lib/dates', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/dates')>()
  return {
    ...actual,
    getTodayString: vi.fn(() => '2026-04-08'),
  }
})

vi.mock('@/hooks/use-level-store', () => ({
  useLevelStore: vi.fn((selector) =>
    selector({
      levelState: { level: 1, startDate: '2026-04-07', xp: 0, overXp: 0 },
      isEligible: false,
    })
  ),
}))

const mockGetWeeklyXp = vi.fn(() => 0)

vi.mock('@/hooks/use-activity-store', () => ({
  useActivityStore: vi.fn((selector) =>
    selector({
      entries: [],
      getWeeklyXp: mockGetWeeklyXp,
    })
  ),
}))

describe('WeeklySummary', () => {
  it('shows "Week 1 of 4+" when 0 weeks have elapsed (started today)', () => {
    render(<WeeklySummary />)
    expect(screen.getByText('Week 1 of 4+')).toBeInTheDocument()
  })

  it('shows "0 XP · Goal: 10 XP" with no entries', () => {
    render(<WeeklySummary />)
    expect(screen.getByText('0 XP · Goal: 10 XP')).toBeInTheDocument()
  })

  it('shows weekly XP without warning language when below 10', () => {
    mockGetWeeklyXp.mockReturnValue(5)
    render(<WeeklySummary />)

    expect(screen.getByText('5 XP · Goal: 10 XP')).toBeInTheDocument()
    // No negative language
    expect(screen.queryByText(/behind/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/not enough/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/warning/i)).not.toBeInTheDocument()
  })

  it('shows "10 XP · Goal: 10 XP" when goal is reached', () => {
    mockGetWeeklyXp.mockReturnValue(10)
    render(<WeeklySummary />)
    expect(screen.getByText('10 XP · Goal: 10 XP')).toBeInTheDocument()
  })
})
