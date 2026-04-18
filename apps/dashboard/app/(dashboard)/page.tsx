import { buildDashboardHomeModel } from '@/lib/dashboard/home';

import { DashboardHome } from '@/components/home/dashboard-home';

const dashboardHomeModel = buildDashboardHomeModel({
  recentItems: [
    {
      id: 'vault-entry-1',
      title: 'Async rendering notes',
      appSlug: 'vault',
      status: 'draft',
      updatedAt: '2026-04-18T08:00:00.000Z',
    },
    {
      id: 'vault-entry-2',
      title: 'Released design review',
      appSlug: 'vault',
      status: 'published',
      updatedAt: '2026-04-17T15:30:00.000Z',
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

/**
 * Renders the first authenticated dashboard landing page.
 *
 * V1 keeps the home content intentionally small and editorial: quick actions,
 * recent work, and app-level status while the richer content flows are built.
 */
export default function DashboardPage() {
  return <DashboardHome model={dashboardHomeModel} />;
}
