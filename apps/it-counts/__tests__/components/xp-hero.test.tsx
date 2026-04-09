import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const heroState = vi.hoisted(() => ({
  levelState: { level: 1, startDate: '2026-04-07', xp: 42, overXp: 0 },
  isEligible: false,
  loadFromStorage: vi.fn(),
  triggerLevelUp: vi.fn(),
}))

vi.mock('@/hooks/use-level-store', () => ({
  useLevelStore: vi.fn((selector) =>
    selector(heroState)
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
  beforeEach(() => {
    heroState.levelState = { level: 1, startDate: '2026-04-07', xp: 42, overXp: 0 }
    heroState.isEligible = false
  })

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
    expect(screen.getByText('Week 1 of 4')).toBeInTheDocument()
  })

  it('switches to a colored open-ended week label after week 4', () => {
    heroState.levelState = { level: 1, startDate: '2026-03-11', xp: 42, overXp: 0 }

    render(<XpHero />)

    const weekLabel = screen.getByText('Week 5')
    expect(screen.queryByText('Week 5 of 4')).not.toBeInTheDocument()
    expect(weekLabel.className).toMatch(/text-ctp-latte-green/)
  })

  it('renders level progress toward 100 XP', () => {
    render(<XpHero />)
    expect(screen.getByRole('progressbar', { name: /42 of 100 xp/i })).toBeInTheDocument()
  })
})
