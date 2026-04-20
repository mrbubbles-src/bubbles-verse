import { Skeleton } from '@bubbles/ui/shadcn/skeleton';

/**
 * Renders the shared skeleton block for dashboard route loading states.
 *
 * Keep route-level loading placeholders in one place so the protected
 * dashboard area uses a consistent rhythm while content streams in.
 *
 * @returns Small skeleton stack for the route-state side panel.
 */
export function DashboardRouteLoadingDetails() {
  return (
    <>
      <p className="text-sm font-semibold tracking-[0.18em] text-muted-foreground uppercase">
        Was gerade passiert
      </p>
      <div className="space-y-3">
        <Skeleton className="h-5 w-28 rounded-full" />
        <Skeleton className="h-10 w-full rounded-2xl" />
        <Skeleton className="h-10 w-5/6 rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-[1.5rem]" />
      </div>
    </>
  );
}
