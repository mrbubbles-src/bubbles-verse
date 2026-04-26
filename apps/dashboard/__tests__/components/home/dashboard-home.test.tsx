import { buildDashboardHomeModel } from '@/lib/dashboard/home';

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DashboardHome } from '@/components/home/dashboard-home';

describe('DashboardHome', () => {
  it('renders the flatter home work area and hides profile completion UI', () => {
    const model = buildDashboardHomeModel({
      identity: {
        displayName: 'Manuel Fahrenholz',
        githubUsername: 'mrbubbles-src',
        email: 'manuel.fahrenholz@mrbubbles-src.dev',
        role: 'owner',
        roleLabel: 'Owner',
      },
      recentItems: [
        {
          id: 'entry-1',
          title: 'Async rendering notes',
          appSlug: 'vault',
          status: 'draft',
          updatedAt: '2026-04-18T08:00:00.000Z',
        },
        {
          id: 'entry-2',
          title: 'Released design review',
          appSlug: 'vault',
          status: 'published',
          updatedAt: '2026-04-18T09:00:00.000Z',
        },
      ],
      appSummaries: [
        {
          appSlug: 'vault',
          appName: 'Coding Vault',
          draftCount: 1,
          publishedCount: 4,
        },
      ],
      draftCount: 1,
      publishedCount: 4,
      categoryCount: 3,
      profileStatus: {
        slug: 'manuel-fahrenholz',
        bioComplete: true,
        avatarComplete: true,
        socialLinkCount: 2,
      },
    });

    render(<DashboardHome model={model} />);

    expect(
      screen.getByRole('heading', { name: 'Dashboard' })
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('link', { name: /Neuer Eintrag/i })[0]
    ).toHaveAttribute('href', '/vault/entries/new');
    expect(
      screen.getByRole('heading', { name: 'Weiterarbeiten' })
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Profil noch nicht vollständig')
    ).not.toBeInTheDocument();
    expect(screen.getAllByText('Coding Vault')).toHaveLength(2);
    expect(screen.getAllByText('Veröffentlicht').length).toBeGreaterThan(1);
  });
});
