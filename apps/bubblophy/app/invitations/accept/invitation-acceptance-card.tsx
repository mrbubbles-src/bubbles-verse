'use client';

import type { AcceptBubblophyProjectInvitationActionResult } from '@/app/actions';

import { useState, useTransition } from 'react';

import Link from 'next/link';

import { Button, buttonVariants } from '@bubbles/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@bubbles/ui/shadcn/card';

export interface BubblophyInvitationAcceptanceCardProps {
  email: string;
  hasToken: boolean;
  invalidLink: boolean;
  acceptInvitationAction: () => Promise<AcceptBubblophyProjectInvitationActionResult>;
}

/**
 * Renders the single-decision project invitation acceptance surface.
 *
 * @param props Verified account email, token state, and server-only action.
 * @returns A mobile-first acceptance card with explicit lifecycle outcomes.
 */
export function BubblophyInvitationAcceptanceCard({
  email,
  hasToken,
  invalidLink,
  acceptInvitationAction,
}: BubblophyInvitationAcceptanceCardProps) {
  const [result, setResult] =
    useState<AcceptBubblophyProjectInvitationActionResult | null>(null);
  const [requestFailed, setRequestFailed] = useState(false);
  const [isPending, startTransition] = useTransition();

  const succeeded =
    result?.status === 'accepted' || result?.status === 'already_accepted';
  const emailMismatch = result?.status === 'email_mismatch';
  const missingEmail =
    result?.status === 'invalid' && result.reason === 'missing_email';
  const requiresAccountSwitch = emailMismatch || missingEmail;
  const canRetry =
    requestFailed ||
    result?.status === 'conflict' ||
    result?.status === 'database_unavailable';

  /** Invokes the zero-input action without exposing identity or token fields. */
  function acceptInvitation() {
    setRequestFailed(false);
    startTransition(() => {
      void acceptInvitationAction()
        .then(setResult)
        .catch(() => setRequestFailed(true));
    });
  }

  if (succeeded) {
    return (
      <Card aria-live="polite" className="w-full max-w-md" role="status">
        <CardHeader>
          <CardTitle>
            <h1>Einladung angenommen</h1>
          </CardTitle>
          <CardDescription>
            Du hast jetzt Zugriff auf das Projekt {result.projectKey}.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link
            className={buttonVariants({ size: 'lg', className: 'w-full' })}
            href="/">
            Zum Dashboard
          </Link>
        </CardFooter>
      </Card>
    );
  }

  if (
    !hasToken ||
    invalidLink ||
    (result && !requiresAccountSwitch && !canRetry)
  ) {
    const description = getUnavailableInvitationDescription(result);

    return (
      <Card aria-live="polite" className="w-full max-w-md" role="status">
        <CardHeader>
          <CardTitle>
            <h1>Einladung nicht verfügbar</h1>
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardFooter>
          <a
            className={buttonVariants({
              variant: 'outline',
              size: 'lg',
              className: 'w-full',
            })}
            href="/auth/logout?next=%2Finvitations%2Faccept">
            Anderes Konto verwenden
          </a>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>
          <h1>
            {requiresAccountSwitch
              ? 'Anderes Konto erforderlich'
              : 'Projekt beitreten'}
          </h1>
        </CardTitle>
        <CardDescription aria-live="polite">
          {missingEmail
            ? 'Dieses Konto besitzt keine bestätigte E-Mail-Adresse.'
            : emailMismatch
              ? 'Diese Einladung gehört zu einer anderen E-Mail-Adresse.'
              : 'Bestätige die Einladung, um das Projekt in Bubblophy zu öffnen.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Angemeldet als
        </p>
        <p className="font-medium break-all">{email}</p>
        {canRetry ? (
          <p className="pt-3 text-sm text-destructive" role="status">
            Die Einladung konnte gerade nicht gespeichert werden. Bitte versuche
            es erneut.
          </p>
        ) : null}
      </CardContent>
      <CardFooter className="flex-col gap-2 sm:flex-row">
        {requiresAccountSwitch ? (
          <a
            className={buttonVariants({ size: 'lg', className: 'w-full' })}
            href="/auth/logout?next=%2Finvitations%2Faccept">
            Anderes Konto verwenden
          </a>
        ) : (
          <Button
            className="w-full"
            disabled={isPending}
            onClick={acceptInvitation}
            size="lg">
            {isPending ? 'Einladung wird angenommen …' : 'Einladung annehmen'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

/** Returns a non-secret explanation for a terminal invitation outcome. */
function getUnavailableInvitationDescription(
  result: AcceptBubblophyProjectInvitationActionResult | null
) {
  if (result?.status === 'archived_project') {
    return 'Das zugehörige Projekt ist archiviert und nimmt keine neuen Mitglieder auf.';
  }

  if (result?.status === 'expired') {
    return 'Diese Einladung ist abgelaufen. Bitte fordere eine neue Einladung an.';
  }

  return 'Der Link ist ungültig, wurde bereits verwendet oder ist nicht mehr aktiv. Bitte fordere bei der Projektverwaltung eine neue Einladung an.';
}
