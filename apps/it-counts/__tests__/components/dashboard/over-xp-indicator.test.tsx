import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { OverXpIndicator } from '@/components/dashboard/over-xp-indicator'

describe('OverXpIndicator', () => {
  it('shows "+12 XP over" for overXp of 12', () => {
    render(<OverXpIndicator overXp={12} />)
    expect(screen.getByText('+12 XP over')).toBeInTheDocument()
  })

  it('shows "+1 XP over" for overXp of 1', () => {
    render(<OverXpIndicator overXp={1} />)
    expect(screen.getByText('+1 XP over')).toBeInTheDocument()
  })

  it('shows "+25 XP over" for overXp of 25', () => {
    render(<OverXpIndicator overXp={25} />)
    expect(screen.getByText('+25 XP over')).toBeInTheDocument()
  })
})
