import type { DashboardHomeModel } from '@/lib/dashboard/home';

import { Badge } from '@bubbles/ui/shadcn/badge';
import { Separator } from '@bubbles/ui/shadcn/separator';

import { ProfileStatus } from '@/components/home/profile-status';
import { QuickActions } from '@/components/home/quick-actions';
import { RecentContentList } from '@/components/home/recent-content-list';
import { WorkspaceStats } from '@/components/home/workspace-stats';

/**
 * Renders the global dashboard landing view with live editorial context.
 *
 * The layout stays mobile-first and intentionally editorial: one identity
 * anchor, a few meaningful numbers, profile readiness, and the latest Vault
 * activity.
 */
export function DashboardHome({ model }: { model: DashboardHomeModel }) {
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-5 rounded-[2rem] border border-border/50 bg-linear-to-br from-background via-background to-muted/35 px-5 py-6 shadow-sm shadow-black/5 sm:px-6 sm:py-7">
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold tracking-[0.3em] text-muted-foreground uppercase">
            Bubbles Verse Admin
          </p>
          <div className="space-y-3">
            <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {model.identity.displayName}, hier ist dein Redaktionsstand für
              heute.
            </h1>
            <p className="max-w-2xl text-sm text-pretty text-muted-foreground sm:text-base">
              Ein zentraler Blick auf Profilpflege, offene Vault-Arbeit und die
              nächsten sinnvollen Schritte, ohne erst durch mehrere Screens zu
              springen.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{model.identity.roleLabel}</Badge>
            <Badge variant="secondary">@{model.identity.githubUsername}</Badge>
            <Badge variant="outline">{model.identity.email}</Badge>
          </div>
        </div>

        <Separator />

        <QuickActions actions={model.quickActions} />
      </section>

      <WorkspaceStats stats={model.workspaceStats} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,0.95fr)]">
        <RecentContentList
          title="Offene Entwürfe"
          emptyState="Gerade liegen keine offenen Entwürfe an."
          items={model.recentDrafts}
        />
        <RecentContentList
          title="Zuletzt bearbeitet"
          emptyState="Sobald du Inhalte anlegst, tauchen sie hier auf."
          items={model.recentUpdates}
        />
        <ProfileStatus profileStatus={model.profileStatus} />
      </div>

      <section className="flex flex-col gap-4 rounded-[2rem] border border-border/50 bg-muted/25 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold tracking-[0.28em] text-muted-foreground uppercase">
            Module
          </p>
          <h2 className="text-xl font-semibold tracking-tight">
            Status pro App-Bereich
          </h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {model.appSummaries.map((summary) => (
            <article
              key={summary.appSlug}
              className="flex flex-col gap-3 rounded-[1.5rem] border border-border/50 bg-background/80 px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <p className="text-base font-semibold">{summary.appName}</p>
                  <p className="text-xs font-medium tracking-[0.24em] text-muted-foreground uppercase">
                    {summary.appSlug}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <span>{summary.draftCount} Entwürfe</span>
                <span>•</span>
                <span>{summary.publishedCount} veröffentlicht</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
