import { buildDashboardHomeModel } from '@/lib/dashboard/home';

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DashboardHome } from '@/components/home/dashboard-home';

describe('DashboardHome', () => {
  it('renders live-looking identity, actions, stats, and profile status', () => {
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
      screen.getByRole('heading', {
        name: 'Manuel Fahrenholz, hier ist dein Redaktionsstand für heute.',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Neuer Vault-Eintrag/i })
    ).toHaveAttribute('href', '/vault/entries/new');
    expect(screen.getAllByText('Profilstatus')).toHaveLength(2);
    expect(screen.getByText('Coding Vault')).toBeInTheDocument();
    expect(screen.getByText('4 veröffentlicht')).toBeInTheDocument();
  });
});
