import Link from 'next/link';

import {
  ArrowLeft01Icon,
  Home01Icon,
  HugeiconsIcon,
  Login01Icon,
} from '@bubbles/ui/lib/hugeicons';
import { Button } from '@bubbles/ui/shadcn/button';

import { DashboardRouteState } from '@/components/dashboard-route-state';

/**
 * Renders the app-wide 404 surface for unmatched dashboard URLs.
 *
 * This catches paths that never resolved into a dashboard route at all, while
 * route-local `notFound()` cases can still render the closer `(dashboard)`
 * fallback with the authenticated shell around it.
 *
 * @returns Global app 404 page inside the root dashboard layout.
 */
export default function RootNotFoundPage() {
  return (
    <main className="flex min-h-dvh px-6 py-10 sm:px-8">
      <DashboardRouteState
        eyebrow="404"
        title="Diese Dashboard-Adresse hat ins Leere geführt."
        description="Unter dieser URL gibt es im Dashboard nichts. Wenn du von außen gekommen bist, starte am besten wieder am Login oder direkt auf der Hauptübersicht."
        visual={
          <HugeiconsIcon
            icon={Home01Icon}
            strokeWidth={2}
            className="size-8 sm:size-10"
          />
        }
        actions={
          <>
            <Button render={<Link href="/login" />} nativeButton={false}>
              <HugeiconsIcon icon={Login01Icon} strokeWidth={2} />
              <span>Zum Login</span>
            </Button>
            <Button
              render={<Link href="/" />}
              nativeButton={false}
              variant="outline">
              <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
              <span>Zum Dashboard</span>
            </Button>
          </>
        }
        details={
          <>
            <p className="text-sm font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Tipp
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Wenn du diese URL gespeichert hast, lohnt sich ein kurzer Abgleich
              mit der aktuellen Sidebar-Struktur.
            </p>
          </>
        }
      />
    </main>
  );
}
