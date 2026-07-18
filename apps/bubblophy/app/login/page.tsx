import { getSafeBubblophyRedirectPath } from '@/lib/auth/redirects';
import {
  getOptionalBubblophySession,
  isDeniedBubblophySessionResult,
} from '@/lib/auth/session';
import { isBubblophyProjectInvitationAcceptancePath } from '@/lib/projects/invitation-links';

import { Suspense } from 'react';

import { redirect } from 'next/navigation';
import { connection } from 'next/server';

import { BubblophyLoginClient } from '@/app/login/login-client';

type LoginPageSearchParams = Promise<{
  next?: string | string[];
  error?: string | string[];
}>;

/**
 * Renders the Bubblophy login route behind a neutral server-side session gate.
 *
 * Already-authorized users are redirected before the login UI can paint, so an
 * existing session never flashes the wrong screen.
 *
 * @param props Next.js search params containing optional `next` and `error`.
 * @returns Login UI only after the server proves no allowed session exists.
 */
export default function LoginPage({
  searchParams,
}: {
  searchParams: LoginPageSearchParams;
}) {
  return (
    <Suspense fallback={<BubblophyLoginGateFallback />}>
      <BubblophyLoginGate searchParams={searchParams} />
    </Suspense>
  );
}

/**
 * Renders a neutral loading state while the login route checks the session.
 *
 * @returns Session-checking fallback that does not resemble either outcome.
 */
function BubblophyLoginGateFallback() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-6 text-foreground">
      <div className="max-w-sm space-y-2 text-center">
        <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
          Bubblophy prüft
        </p>
        <h1 className="text-2xl font-semibold">Session wird geprüft.</h1>
      </div>
    </main>
  );
}

/**
 * Resolves the current session before deciding whether to show the login UI.
 *
 * @param props Search params used for safe post-login redirects.
 * @returns Login UI for unauthenticated users, or redirects for known sessions.
 */
export async function BubblophyLoginGate({
  searchParams,
}: {
  searchParams: LoginPageSearchParams;
}) {
  await connection();

  const params = await searchParams;
  const nextParam = Array.isArray(params.next) ? params.next[0] : params.next;
  const errorParam = Array.isArray(params.error)
    ? params.error[0]
    : params.error;
  const nextPath = getSafeBubblophyRedirectPath(nextParam);
  const sessionResult = await getOptionalBubblophySession();

  if (sessionResult.status === 'allowed') {
    redirect(nextPath);
  }

  if (
    isDeniedBubblophySessionResult(sessionResult) &&
    isBubblophyProjectInvitationAcceptancePath(nextPath)
  ) {
    redirect(nextPath);
  }

  if (
    isDeniedBubblophySessionResult(sessionResult) &&
    errorParam !== 'access_denied'
  ) {
    redirect('/auth/logout?next=/login?error=access_denied');
  }

  return <BubblophyLoginClient />;
}
