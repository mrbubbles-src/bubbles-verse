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

vi.mock('@/lib/dates', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/dates')>()
  return {
    ...actual,
    getTodayString: vi.fn(() => '2026-04-08'),
  }
})

import { XpHero } from '@/components/dashboard/xp-hero'

describe('XpHero', () => {
  it('displays current XP as a dominant number with secondary "/ 100 XP"', () => {
    render(<XpHero />)
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('/ 100 XP')).toBeInTheDocument()
  })

  it('has an accessible label for screen readers', () => {
    render(<XpHero />)
    expect(screen.getByLabelText('42 of 100 XP')).toBeInTheDocument()
  })

  it('uses heading font family on the dominant number', () => {
    render(<XpHero />)
    const xpElement = screen.getByText('42')
    expect(xpElement.className).toMatch(/font-heading/)
  })

  it('shows combined level and week context label', () => {
    render(<XpHero />)
    expect(screen.getByText(/Level 1 · Week \d+ of 4/)).toBeInTheDocument()
  })

  it('renders level progress toward 100 XP', () => {
    render(<XpHero />)
    expect(screen.getByRole('progressbar', { name: /42 of 100 xp/i })).toBeInTheDocument()
  })
})
