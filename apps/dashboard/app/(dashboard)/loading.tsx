import { HugeiconsIcon, Rotate01Icon } from '@bubbles/ui/lib/hugeicons';

import { DashboardRouteLoadingDetails } from '@/components/dashboard-route-loading-details';
import { DashboardRouteState } from '@/components/dashboard-route-state';

/**
 * Renders the dashboard route-group loading fallback.
 *
 * The fallback keeps the shell visible while route content streams in and uses
 * lightweight skeletons so category, entry, and profile pages all share one
 * coherent loading surface.
 *
 * @returns Full-page loading surface inside the dashboard shell.
 */
export default function DashboardLoading() {
  return (
    <DashboardRouteState
      eyebrow="Dashboard lädt"
      title="Wir ziehen den nächsten Bereich für dich in Position."
      description="Inhalte, Filter und Editorzustand werden gerade vorbereitet. Du kannst im Dashboard bleiben, während der Zielbereich nachlädt."
      tone="loading"
      visual={
        <HugeiconsIcon
          icon={Rotate01Icon}
          strokeWidth={2}
          className="size-8 animate-spin sm:size-10"
        />
      }
      details={<DashboardRouteLoadingDetails />}
    />
  );
}
