import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/hooks/use-level-store', () => ({
  useLevelStore: vi.fn((selector) =>
    selector({
      levelState: { level: 1, startDate: '2026-04-07', xp: 42, overXp: 0 },
      isEligible: false,
      loadFromStorage: vi.fn(),
      triggerLevelUp: vi.fn(),
    })
  ),
}))

import { XpHero } from '@/components/dashboard/xp-hero'

describe('XpHero', () => {
  it('displays current XP out of 100', () => {
    render(<XpHero />)
    expect(screen.getByText('42 / 100 XP')).toBeInTheDocument()
  })

  it('has an accessible label for screen readers', () => {
    render(<XpHero />)
    expect(screen.getByLabelText('42 of 100 XP')).toBeInTheDocument()
  })

  it('uses heading font family', () => {
    render(<XpHero />)
    const xpElement = screen.getByText('42 / 100 XP')
    expect(xpElement.className).toMatch(/font-heading/)
  })

  it('renders level progress toward 100 XP', () => {
    render(<XpHero />)
    expect(screen.getByRole('progressbar', { name: /42 of 100 xp/i })).toBeInTheDocument()
  })
})
