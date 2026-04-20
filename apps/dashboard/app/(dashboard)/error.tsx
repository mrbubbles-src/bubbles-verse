'use client';

import { useEffect } from 'react';

import Link from 'next/link';

import {
  AlertCircleIcon,
  ArrowLeft01Icon,
  HugeiconsIcon,
  Rotate01Icon,
} from '@bubbles/ui/lib/hugeicons';
import { Button } from '@bubbles/ui/shadcn/button';

import { DashboardRouteState } from '@/components/dashboard-route-state';

type DashboardErrorPageProps = {
  error: Error & {
    digest?: string;
  };
  unstable_retry(): void;
};

/**
 * Renders the dashboard route-group error boundary fallback.
 *
 * It logs the received route error in development and gives users a direct
 * retry path plus clear navigation back into the stable dashboard areas.
 *
 * @param props - Route error payload plus Next.js retry callback.
 * @returns Full-page dashboard error surface.
 */
export default function DashboardErrorPage({
  error,
  unstable_retry,
}: DashboardErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <DashboardRouteState
      eyebrow="Etwas ist schiefgelaufen"
      title="Dieser Dashboard-Bereich konnte gerade nicht sauber gerendert werden."
      description="Der Rest der Oberfläche ist noch da. Du kannst den Abschnitt neu anfordern oder direkt zurück zu einer stabilen Übersicht springen."
      tone="danger"
      visual={
        <HugeiconsIcon
          icon={AlertCircleIcon}
          strokeWidth={2}
          className="size-8 sm:size-10"
        />
      }
      actions={
        <>
          <Button type="button" onClick={() => unstable_retry()}>
            <HugeiconsIcon icon={Rotate01Icon} strokeWidth={2} />
            <span>Erneut versuchen</span>
          </Button>
          <Button
            render={<Link href="/" />}
            nativeButton={false}
            variant="outline">
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
            <span>Zur Startseite</span>
          </Button>
        </>
      }
      details={
        <>
          <p className="text-sm font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Diagnose
          </p>
          <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            <p>
              Wenn der Fehler nach dem Retry bleibt, hilft meistens ein harter
              Neuladevorgang oder ein kurzer Dev-Server-Neustart.
            </p>
            {error.digest ? <p>Referenz: {error.digest}</p> : null}
          </div>
        </>
      }
    />
  );
}
