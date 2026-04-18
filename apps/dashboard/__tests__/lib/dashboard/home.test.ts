import {
  buildDashboardHomeModel,
  getDashboardRoleLabel,
} from '@/lib/dashboard/home';

import { describe, expect, it } from 'vitest';

describe('dashboard home model', () => {
  it('builds role-aware quick actions and profile completion stats', () => {
    const model = buildDashboardHomeModel({
      identity: {
        displayName: 'Manuel Fahrenholz',
        githubUsername: 'mrbubbles-src',
        email: 'manuel.fahrenholz@mrbubbles-src.dev',
        role: 'owner',
        roleLabel: getDashboardRoleLabel('owner'),
      },
      recentItems: [
        {
          id: 'entry-1',
          title: 'One',
          appSlug: 'vault',
          status: 'draft',
          updatedAt: '2026-04-18T08:00:00.000Z',
        },
        {
          id: 'entry-2',
          title: 'Two',
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
          publishedCount: 7,
        },
      ],
      draftCount: 1,
      publishedCount: 7,
      categoryCount: 5,
      profileStatus: {
        slug: 'manuel-fahrenholz',
        bioComplete: true,
        avatarComplete: false,
        socialLinkCount: 1,
      },
    });

    expect(model.quickActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ href: '/profile' }),
        expect.objectContaining({ href: '/vault/entries/new' }),
        expect.objectContaining({ href: '/vault/categories' }),
        expect.objectContaining({ href: '/account' }),
      ])
    );
    expect(model.workspaceStats).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Offene Entwürfe', value: '1' }),
        expect.objectContaining({ label: 'Veröffentlicht', value: '7' }),
        expect.objectContaining({ label: 'Kategorien', value: '5' }),
        expect.objectContaining({ label: 'Profilstatus', value: '3/4' }),
      ])
    );
    expect(model.profileStatus.summary).toContain('Noch 1 Bereich');
    expect(model.recentDrafts).toHaveLength(1);
    expect(model.recentUpdates).toHaveLength(2);
  });
});
