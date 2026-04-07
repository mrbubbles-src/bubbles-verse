import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { StatusBadge } from '@/components/dashboard/status-badge'

describe('StatusBadge', () => {
  it('shows "Slightly over" for overXp of 1', () => {
    render(<StatusBadge overXp={1} />)
    expect(screen.getByText('Slightly over')).toBeInTheDocument()
  })

  it('shows "Slightly over" for overXp of 19', () => {
    render(<StatusBadge overXp={19} />)
    expect(screen.getByText('Slightly over')).toBeInTheDocument()
  })

  it('shows "Well over" for overXp of 20', () => {
    render(<StatusBadge overXp={20} />)
    expect(screen.getByText('Well over')).toBeInTheDocument()
  })

  it('shows "Well over" for overXp of 50', () => {
    render(<StatusBadge overXp={50} />)
    expect(screen.getByText('Well over')).toBeInTheDocument()
  })

  it('label is visible text, not color alone', () => {
    render(<StatusBadge overXp={5} />)
    expect(screen.getByText('Slightly over')).toBeVisible()
  })

  it('does not use warning or alarming language', () => {
    const { container } = render(<StatusBadge overXp={25} />)
    expect(container.textContent).not.toMatch(/!/)
    expect(container.textContent?.toLowerCase()).not.toMatch(/warning/)
    expect(container.textContent?.toLowerCase()).not.toMatch(/alert/)
    expect(container.textContent?.toLowerCase()).not.toMatch(/danger/)
  })
})
