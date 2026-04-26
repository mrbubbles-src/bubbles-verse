import type { DashboardHomeModel } from '@/lib/dashboard/home';

import { HugeiconsIcon, SparklesIcon } from '@bubbles/ui/lib/hugeicons';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@bubbles/ui/shadcn/input-group';

import { HomeWorkArea } from '@/components/home/home-work-area';
import { ModuleStatusLine } from '@/components/home/module-status-line';
import { ProfileStatus } from '@/components/home/profile-status';
import { QuickActions } from '@/components/home/quick-actions';
import { WorkspaceStats } from '@/components/home/workspace-stats';

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
        <div className="space-y-3">
          <p className="dashboard-kicker">Content-Studio</p>
          <h1 className="dashboard-title">Hallo, {model.greetingName}</h1>
          <p className="dashboard-body max-w-4xl">
            Inhalte weiterführen, neue Arbeiten starten und die wichtigsten
            App-Bereiche im Blick behalten.
          </p>
        </div>

        <InputGroup className="dashboard-command-bar">
          <InputGroupAddon>
            <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} />
          </InputGroupAddon>
          <InputGroupInput
            readOnly
            aria-label="Dashboard suchen oder erstellen"
            value="Suchen oder erstellen"
            className="cursor-default text-base"
          />
        </InputGroup>
      </header>

      <div className="dashboard-console-grid">
        <div className="flex min-w-0 flex-col gap-6">
          <QuickActions actions={model.quickActions} variant="strip" />

          <HomeWorkArea
            recentDrafts={model.recentDrafts}
            recentUpdates={model.recentUpdates}
          />

          <div className="grid gap-4 xl:hidden">
            <ProfileStatus profileStatus={model.profileStatus} />
            <WorkspaceStats stats={model.workspaceStats} />
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
            <ModuleStatusLine summaries={model.appSummaries} />
            <div className="hidden lg:block xl:hidden">
              <WorkspaceStats stats={model.workspaceStats} />
            </div>
          </div>
        </div>

        <aside className="hidden xl:sticky xl:top-24 xl:flex xl:flex-col xl:gap-5">
          <ProfileStatus profileStatus={model.profileStatus} />
          <WorkspaceStats stats={model.workspaceStats} />
        </aside>
      </div>
    </div>
  );
}
