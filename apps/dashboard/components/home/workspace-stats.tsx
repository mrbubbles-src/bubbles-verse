import type { DashboardHomeStat } from '@/lib/dashboard/home';

type WorkspaceStatsProps = {
  stats: DashboardHomeStat[];
};

/**
 * Renders compact dashboard stats without turning the home into a BI screen.
 *
 * Use this for a handful of stable numbers that help the next editorial
 * decision, not for exhaustive analytics.
 */
export function WorkspaceStats({ stats }: WorkspaceStatsProps) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <article
          key={stat.label}
          className="flex flex-col gap-3 rounded-[1.75rem] border border-border/50 bg-background/80 px-5 py-5 shadow-sm shadow-black/5">
          <div className="space-y-1">
            <p className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
              {stat.label}
            </p>
            <p className="text-3xl font-semibold tracking-tight">{stat.value}</p>
          </div>
          <p className="text-sm text-pretty text-muted-foreground">
            {stat.detail}
          </p>
        </article>
      ))}
    </section>
  );
}
