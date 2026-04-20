import Link from 'next/link';

import {
  ArrowLeft01Icon,
  BookOpen02Icon,
  Home01Icon,
  HugeiconsIcon,
} from '@bubbles/ui/lib/hugeicons';
import { Button } from '@bubbles/ui/shadcn/button';

import { DashboardRouteState } from '@/components/dashboard-route-state';

/**
 * Renders the dashboard-local not-found surface for missing protected routes.
 *
 * Use this for unknown dashboard paths and route-level `notFound()` cases so
 * users can quickly return to the main home or editorial list views.
 *
 * @returns Full-page dashboard 404 surface inside the shared shell.
 */
export default function DashboardNotFoundPage() {
  return (
    <DashboardRouteState
      eyebrow="404 im Dashboard"
      title="Diesen Bereich gibt es hier nicht oder nicht mehr."
      description="Die angeforderte Seite wurde verschoben, gelöscht oder der Link war unvollständig. Über die Hauptnavigation kommst du schnell zurück in einen gültigen Bereich."
      visual={
        <HugeiconsIcon
          icon={BookOpen02Icon}
          strokeWidth={2}
          className="size-8 sm:size-10"
        />
      }
      actions={
        <>
          <Button render={<Link href="/" />} nativeButton={false}>
            <HugeiconsIcon icon={Home01Icon} strokeWidth={2} />
            <span>Zum Dashboard</span>
          </Button>
          <Button
            render={<Link href="/vault/entries" />}
            nativeButton={false}
            variant="outline">
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
            <span>Zu den Einträgen</span>
          </Button>
        </>
      }
      details={
        <>
          <p className="text-sm font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Häufig sinnvoll
          </p>
          <ul className="flex list-disc flex-col gap-2 pl-4 text-sm leading-relaxed text-muted-foreground">
            <li>Sidebar nutzen und den Bereich neu öffnen</li>
            <li>Gespeicherte alte Links kurz prüfen</li>
            <li>Bei gelöschten Einträgen auf die Listenansicht zurückgehen</li>
          </ul>
        </>
      }
    />
  );
}
