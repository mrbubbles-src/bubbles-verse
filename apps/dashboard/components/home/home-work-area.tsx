import type { DashboardHomeRecentItem } from '@/lib/dashboard/home';

import { RecentContentList } from '@/components/home/recent-content-list';

type HomeWorkAreaProps = {
  recentDrafts: DashboardHomeRecentItem[];
  recentUpdates: DashboardHomeRecentItem[];
};

/**
 * Renders the central dashboard work area with mockup-style content queues.
 *
 * Use this on the dashboard landing page to show active drafts first and a
 * separate recent-content table below, matching the command-center mockup.
 *
 * @param props Current draft and update items for the home work queues.
 * @returns Tabbed work area for the dashboard landing page.
 */
export function HomeWorkArea({
  recentDrafts,
  recentUpdates,
}: HomeWorkAreaProps) {
  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="dashboard-section-title">Weiterarbeiten</h2>
          <span className="dashboard-meta">Alle ansehen</span>
        </div>
        <div className="dashboard-studio-panel px-3 py-2 sm:px-4">
          <RecentContentList
            items={recentDrafts}
            emptyState="Gerade liegen keine offenen Entwürfe an."
            variant="compact"
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="dashboard-section-title">Letzte Inhalte</h2>
          <span className="dashboard-meta">Alle ansehen</span>
        </div>
        <div className="dashboard-studio-panel px-3 py-2 sm:px-4">
          <RecentContentList
            items={recentUpdates}
            emptyState="Sobald du Inhalte bearbeitest, tauchen sie hier auf."
            showStatus
            variant="table"
          />
        </div>
      </section>
    </div>
  );
}
