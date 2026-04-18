import { buildDashboardHomeModel } from '@/lib/dashboard/home';

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DashboardHome } from '@/components/home/dashboard-home';

describe('DashboardHome', () => {
  it('renders quick actions, recent drafts, and app summaries for the shared home view', () => {
    const model = buildDashboardHomeModel({
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
    });

    render(<DashboardHome model={model} />);

    expect(
      screen.getByRole('heading', { name: 'Heute weiterschreiben' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Neuer Vault-Eintrag' })
    ).toHaveAttribute('href', '/vault/entries/new');
    expect(screen.getAllByText('Async rendering notes')).toHaveLength(2);
    expect(screen.getByText('Coding Vault')).toBeInTheDocument();
    expect(screen.getByText('4 veröffentlicht')).toBeInTheDocument();
  });
});
