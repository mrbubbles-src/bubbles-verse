import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/hooks/use-level-store', () => ({
  useLevelStore: vi.fn((selector) =>
    selector({
      levelState: { level: 1, startDate: '2026-04-07', xp: 112, overXp: 12 },
      isEligible: false,
    })
  ),
}))

import { useLevelStore } from '@/hooks/use-level-store'
import { OverXpSection } from '@/components/dashboard/over-xp-section'

describe('OverXpSection', () => {
  it('shows "+12 XP over" when overXp is 12', () => {
    render(<OverXpSection />)
    expect(screen.getByText('+12 XP over')).toBeInTheDocument()
  })

  it('shows "Slightly over" badge when overXp is 12', () => {
    render(<OverXpSection />)
    expect(screen.getByText('Slightly over')).toBeInTheDocument()
  })

  it('is hidden entirely when overXp is 0', () => {
    vi.mocked(useLevelStore).mockImplementation((selector) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      selector({ levelState: { level: 1, startDate: '2026-04-07', xp: 80, overXp: 0 }, isEligible: false } as any)
    )
    render(<OverXpSection />)
    expect(screen.queryByText(/\+\d+ XP over/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Slightly over|Well over/)).not.toBeInTheDocument()
  })

  it('shows "Well over" badge when overXp is 25', () => {
    vi.mocked(useLevelStore).mockImplementation((selector) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      selector({ levelState: { level: 1, startDate: '2026-04-07', xp: 125, overXp: 25 }, isEligible: false } as any)
    )
    render(<OverXpSection />)
    expect(screen.getByText('+25 XP over')).toBeInTheDocument()
    expect(screen.getByText('Well over')).toBeInTheDocument()
  })
})
