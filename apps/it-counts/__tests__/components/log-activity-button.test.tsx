import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { LogActivityButton } from '@/components/dashboard/log-activity-button'

describe('LogActivityButton', () => {
  it('renders a button with "Log Activity" text', () => {
    render(<LogActivityButton />)
    expect(
      screen.getByRole('button', { name: /log activity/i })
    ).toBeInTheDocument()
  })

  it('is wrapped in a link to /log', () => {
    render(<LogActivityButton />)
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe('/log')
  })
})
