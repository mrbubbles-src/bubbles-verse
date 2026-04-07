import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { BottomNav } from '@/components/dashboard/bottom-nav'

describe('BottomNav', () => {
  it('renders exactly 3 navigation links', () => {
    render(<BottomNav />)
    const nav = screen.getByRole('navigation', { name: /main/i })
    const links = nav.querySelectorAll('a')
    expect(links.length).toBe(3)
  })

  it('applies touch-hitbox class to all links', () => {
    render(<BottomNav />)
    const nav = screen.getByRole('navigation', { name: /main/i })
    const links = nav.querySelectorAll('a')
    links.forEach((link) => {
      expect(link.className).toMatch(/touch-hitbox/)
    })
  })

  it('has Dashboard link pointing to /', () => {
    render(<BottomNav />)
    const dashboardLink = screen.getByText('Dashboard').closest('a')
    expect(dashboardLink?.getAttribute('href')).toBe('/')
  })

  it('has History link pointing to /history', () => {
    render(<BottomNav />)
    const historyLink = screen.getByText('History').closest('a')
    expect(historyLink?.getAttribute('href')).toBe('/history')
  })
})
