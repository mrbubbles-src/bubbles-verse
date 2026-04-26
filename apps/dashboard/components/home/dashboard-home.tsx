import type { DashboardHomeModel } from '@/lib/dashboard/home';

import { HomeWorkArea } from '@/components/home/home-work-area';
import { ModuleStatusLine } from '@/components/home/module-status-line';
import { QuickActions } from '@/components/home/quick-actions';

/**
 * Renders the dashboard home as a calm creative command center.
 *
 * Use this as the global content workspace: fast orientation first, then direct
 * entry into draft queues, creation actions, and lightweight module status.
 */
export function DashboardHome({ model }: { model: DashboardHomeModel }) {
  return (
    <div className="dashboard-console">
      <header className="dashboard-console-header">
        <h1 className="dashboard-title">Dashboard</h1>
      </header>

      <div className="dashboard-console-grid">
        <div className="flex min-w-0 flex-col gap-6">
          <QuickActions actions={model.quickActions} variant="strip" />

          <HomeWorkArea
            recentDrafts={model.recentDrafts}
            recentUpdates={model.recentUpdates}
          />
        </div>

        <ModuleStatusLine summaries={model.appSummaries} />
      </div>
    </div>
  );
}
