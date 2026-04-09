import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { LevelBadge } from '@/components/dashboard/level-badge'

vi.mock('@/hooks/use-level-store', () => ({
  useLevelStore: vi.fn((selector) =>
    selector({
      levelState: { level: 1, startDate: '2026-04-07', xp: 0, overXp: 0 },
      isEligible: false,
    })
  ),
}))

import { useLevelStore } from '@/hooks/use-level-store'

describe('LevelBadge', () => {
  it('shows "Level 1" for level 1', () => {
    render(<LevelBadge />)
    expect(screen.getByText('Level 1')).toBeInTheDocument()
  })

  it('shows "Level 3" for level 3', () => {
    vi.mocked(useLevelStore).mockImplementation((selector) =>
      selector({
        levelState: { level: 3, startDate: '2026-01-01', xp: 50, overXp: 0 },
        isEligible: false,
        syncXpFromEntries: vi.fn(),
        loadFromStorage: vi.fn(),
        triggerLevelUp: vi.fn(),
      })
    )

    render(<LevelBadge />)
    expect(screen.getByText('Level 3')).toBeInTheDocument()
  })
})
