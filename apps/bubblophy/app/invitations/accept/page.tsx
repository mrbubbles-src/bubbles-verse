import { requireAuthenticatedBubblophyUser } from '@/lib/auth/session';
import {
  BUBBLOPHY_PROJECT_INVITATION_COOKIE,
  isBubblophyProjectInvitationToken,
} from '@/lib/projects/invitation-links';

import { Suspense } from 'react';

import { cookies } from 'next/headers';
import { connection } from 'next/server';

import { acceptBubblophyProjectInvitationAction } from '@/app/actions';
import { BubblophyInvitationAcceptanceCard } from '@/app/invitations/accept/invitation-acceptance-card';

type InvitationAcceptanceSearchParams = Promise<{
  error?: string | string[];
}>;

/**
 * Renders the protected, token-free invitation acceptance route.
 *
 * @param props Request search parameters containing an optional link error.
 * @returns A neutral fallback followed by the verified acceptance surface.
 */
export default function BubblophyInvitationAcceptancePage({
  searchParams,
}: {
  searchParams: InvitationAcceptanceSearchParams;
}) {
  return (
    <Suspense fallback={<BubblophyInvitationAcceptanceFallback />}>
      <BubblophyInvitationAcceptanceGate searchParams={searchParams} />
    </Suspense>
  );
}

/** Renders while the request-scoped identity and handoff cookie are checked. */
function BubblophyInvitationAcceptanceFallback() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4 py-10 text-foreground sm:px-6">
      <div className="max-w-sm space-y-2 text-center">
        <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
          Bubblophy prüft
        </p>
        <h1 className="text-2xl font-semibold">Einladung wird geprüft.</h1>
      </div>
    </main>
  );
}

/** Resolves the authenticated identity and staged token before rendering. */
export async function BubblophyInvitationAcceptanceGate({
  searchParams,
}: {
  searchParams: InvitationAcceptanceSearchParams;
}) {
  await connection();

  const user = await requireAuthenticatedBubblophyUser();
  const [params, cookieStore] = await Promise.all([searchParams, cookies()]);
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const token = cookieStore.get(BUBBLOPHY_PROJECT_INVITATION_COOKIE)?.value;

  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4 py-10 text-foreground sm:px-6">
      <BubblophyInvitationAcceptanceCard
        acceptInvitationAction={acceptBubblophyProjectInvitationAction}
        email={user.email ?? 'E-Mail-Adresse nicht verfügbar'}
        hasToken={isBubblophyProjectInvitationToken(token ?? '')}
        invalidLink={error === 'invalid_link'}
      />
    </main>
  );
}
