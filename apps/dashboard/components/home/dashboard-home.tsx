import type { DashboardHomeModel } from '@/lib/dashboard/home';

import { HomeWorkArea } from '@/components/home/home-work-area';
import { ModuleStatusLine } from '@/components/home/module-status-line';
import { ProfileStatus } from '@/components/home/profile-status';
import { QuickActions } from '@/components/home/quick-actions';
import { WorkspaceStats } from '@/components/home/workspace-stats';

/**
 * Renders the flatter dashboard home as a real working surface.
 *
 * The page greets with the Vorname, puts work first, and keeps secondary
 * context in a light right rail instead of another grid of cards.
 */
export function DashboardHome({ model }: { model: DashboardHomeModel }) {
  return (
    <div className="flex flex-col gap-10">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Hallo, {model.greetingName}
        </h1>
      </header>

      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)] xl:items-start">
        <div className="flex min-w-0 flex-col gap-8">
          <HomeWorkArea
            recentDrafts={model.recentDrafts}
            recentUpdates={model.recentUpdates}
          />

          <div className="flex flex-col gap-8 xl:hidden">
            <QuickActions actions={model.quickActions} />
            <ProfileStatus profileStatus={model.profileStatus} />
            <WorkspaceStats stats={model.workspaceStats} />
          </div>

          <ModuleStatusLine summaries={model.appSummaries} />
        </div>

        <aside className="hidden xl:sticky xl:top-6 xl:flex xl:flex-col xl:gap-8">
          <QuickActions actions={model.quickActions} />
          <ProfileStatus profileStatus={model.profileStatus} />
          <WorkspaceStats stats={model.workspaceStats} />
        </aside>
      </div>
    </div>
  );
}
