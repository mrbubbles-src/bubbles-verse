import type { DashboardHomeSummary } from '@/lib/dashboard/home';

type ModuleStatusLineProps = {
  summaries: DashboardHomeSummary[];
};

/**
 * Renders the compact app summary line for the dashboard home footer area.
 *
 * Use this instead of a grid of app cards so module status stays scannable
 * without turning the page back into a dashboard wall.
 *
 * @param props App summaries with compact draft and published counts.
 * @returns Inline module status row for the home page.
 */
export function ModuleStatusLine({ summaries }: ModuleStatusLineProps) {
  if (summaries.length === 0) {
    return null;
  }

  return (
    <section className="dashboard-studio-panel-flat px-4 py-4 sm:px-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="dashboard-kicker">Apps</p>
        <span className="dashboard-meta">{summaries.length} aktiv</span>
      </div>
      <div className="dashboard-preview-strip">
        {summaries.map((summary) => (
          <article
            key={summary.appSlug}
            className="dashboard-preview-tile flex flex-col gap-2">
            <span className="font-medium text-foreground">
              {summary.appName}
            </span>
            <span className="dashboard-meta">
              {summary.draftCount} Entwürfe · {summary.publishedCount}{' '}
              veröffentlicht
            </span>
            <span
              aria-hidden="true"
              className="mt-1 h-1.5 w-full rounded-full bg-primary/50"
            />
          </article>
        ))}
      </div>
    </section>
  );
}
