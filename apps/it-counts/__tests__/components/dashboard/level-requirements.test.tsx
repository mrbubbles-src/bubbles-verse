import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { LevelRequirements } from '@/components/dashboard/level-requirements'

vi.mock('@/hooks/use-level-store', () => ({
  useLevelStore: vi.fn((selector) =>
    selector({
      levelState: { level: 1, startDate: '2026-04-07', xp: 0, overXp: 0 },
      isEligible: false,
    })
  ),
}))

import { useLevelStore } from '@/hooks/use-level-store'

describe('LevelRequirements', () => {
  it('renders requirements text for level 1', () => {
    render(<LevelRequirements />)
    expect(
      screen.getByText('Flexible pace. Earn what you earn during the opening month.')
    ).toBeInTheDocument()
  })

  it('renders unlocked abilities for level 1', () => {
    render(<LevelRequirements />)
    expect(screen.getByText('Core XP tracking')).toBeInTheDocument()
  })

  it('renders section headings', () => {
    render(<LevelRequirements />)
    expect(screen.getByText('Requirements')).toBeInTheDocument()
    expect(screen.getByText('Unlocked')).toBeInTheDocument()
  })

  it('shows level 2 requirements when level is 2', () => {
    vi.mocked(useLevelStore).mockImplementation((selector) =>
      selector({
        levelState: { level: 2, startDate: '2026-01-01', xp: 0, overXp: 0 },
        isEligible: false,
        syncXpFromEntries: vi.fn(),
        loadFromStorage: vi.fn(),
        triggerLevelUp: vi.fn(),
      })
    )

    render(<LevelRequirements />)
    expect(
      screen.getByText('One intentional 10-20 minute walk per week.')
    ).toBeInTheDocument()
    expect(screen.getByText('Intentional weekly walk focus')).toBeInTheDocument()
  })

  it('renders nothing for an unknown level', () => {
    vi.mocked(useLevelStore).mockImplementation((selector) =>
      selector({
        levelState: { level: 99, startDate: '2026-01-01', xp: 0, overXp: 0 },
        isEligible: false,
        syncXpFromEntries: vi.fn(),
        loadFromStorage: vi.fn(),
        triggerLevelUp: vi.fn(),
      })
    )

    const { container } = render(<LevelRequirements />)
    expect(container.firstChild).toBeNull()
  })
})
