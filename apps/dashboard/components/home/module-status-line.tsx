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
      <p className="dashboard-kicker mb-3">Apps</p>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-base text-muted-foreground">
        {summaries.map((summary, index) => (
          <span
            key={summary.appSlug}
            className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {index > 0 ? <span aria-hidden="true">•</span> : null}
            <span className="font-medium text-foreground">
              {summary.appName}
            </span>
            <span>{summary.draftCount} Entwürfe</span>
            <span aria-hidden="true">•</span>
            <span>{summary.publishedCount} veröffentlicht</span>
          </span>
        ))}
      </div>
    </section>
  );
}
