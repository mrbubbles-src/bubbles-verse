import type { DashboardHomeStat } from '@/lib/dashboard/home';

type WorkspaceStatsProps = {
  stats: DashboardHomeStat[];
};

/**
 * Renders the compact editorial stats for the dashboard home rail.
 *
 * Keep these intentionally light so the page reads like a workspace and not a
 * metrics dashboard.
 */
export function WorkspaceStats({ stats }: WorkspaceStatsProps) {
  return (
    <section className="dashboard-studio-panel-flat grid gap-0 px-4 py-2 sm:grid-cols-3 sm:px-5 xl:grid-cols-1">
      {stats.map((stat) => (
        <article
          key={stat.label}
          className="border-t border-border/50 py-4 first:border-t-0 sm:border-t-0 sm:border-l sm:pl-5 sm:first:border-l-0 sm:first:pl-0 xl:border-t xl:border-l-0 xl:pl-0 xl:first:border-t-0">
          <p className="font-heading text-3xl leading-none font-semibold tracking-normal sm:text-4xl">
            {stat.value}
          </p>
          <p className="mt-1.5 text-base text-muted-foreground">{stat.label}</p>
        </article>
      ))}
    </section>
  );
}
