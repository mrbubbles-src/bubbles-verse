import type { DashboardHomeStat } from '@/lib/dashboard/home';

type WorkspaceStatsProps = {
  stats: DashboardHomeStat[];
};

/**
 * Renders the three compact editorial stats for the dashboard home rail.
 *
 * Keep these intentionally light so the page reads like a workspace and not a
 * metrics dashboard.
 */
export function WorkspaceStats({ stats }: WorkspaceStatsProps) {
  return (
    <section className="grid gap-0 sm:grid-cols-3">
      {stats.map((stat) => (
        <article
          key={stat.label}
          className="border-t border-border/60 py-3 first:border-t-0 sm:border-t-0 sm:border-l sm:pl-4 sm:first:border-l-0 sm:first:pl-0">
          <p className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {stat.value}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
        </article>
      ))}
    </section>
  );
}
