import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BottomNav } from '@/components/global/bottom-nav';

describe('BottomNav', () => {
  it('renders 2 navigation links and 1 log button', () => {
    render(<BottomNav />);
    const nav = screen.getByRole('navigation', { name: /main/i });
    const links = nav.querySelectorAll('a');
    expect(links.length).toBe(2);
    expect(
      screen.getByRole('button', { name: /log activity/i })
    ).toBeInTheDocument();
  });

  it('applies touch-hitbox class to all interactive elements', () => {
    render(<BottomNav />);
    const nav = screen.getByRole('navigation', { name: /main/i });
    const links = nav.querySelectorAll('a');
    links.forEach((link) => {
      expect(link.className).toMatch(/touch-hitbox/);
    });
    expect(
      screen.getByRole('button', { name: /log activity/i }).getAttribute('class')
    ).toMatch(/touch-hitbox/);
  });

  it('has Dashboard link pointing to /', () => {
    render(<BottomNav />);
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink?.getAttribute('href')).toBe('/');
  });

  it('has History link pointing to /history', () => {
    render(<BottomNav />);
    const historyLink = screen.getByText('History').closest('a');
    expect(historyLink?.getAttribute('href')).toBe('/history');
  });

});
