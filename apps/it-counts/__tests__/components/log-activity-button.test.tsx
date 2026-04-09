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

  it('keeps the shared primary CTA sizing', () => {
    render(<LogActivityButton />)
    const button = screen.getByRole('button', { name: /log activity/i })
    expect(button.className).toMatch(/h-12/)
  })
})
