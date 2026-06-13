import { requireBubblophySession } from '@/lib/auth/session';
import { getBubblophyDashboardSnapshot } from '@/lib/dashboard/data';

import { Suspense } from 'react';

import { connection } from 'next/server';

import {
  createBubblophyIssueAction,
  createBubblophyIssuePlanAction,
  createBubblophyProjectAction,
} from '@/app/actions';
import { BubblophyDashboard } from '@/components/dashboard/bubblophy-dashboard';

/**
 * Renders the Bubblophy MVP command center.
 *
 * The page requires an authorized human Supabase session, then renders the
 * current dashboard DTO behind the server-only data boundary.
 *
 * @returns The first human-controlled issue and agent orchestration dashboard.
 */
export default function Home() {
  return (
    <Suspense fallback={<BubblophyDashboardGateFallback />}>
      <ProtectedBubblophyDashboard />
    </Suspense>
  );
}

/**
 * Renders a minimal loading surface while the human session gate resolves.
 *
 * @returns Full-page authentication loading state.
 */
function BubblophyDashboardGateFallback() {
  return (
    <main className="grid min-h-svh place-items-center bg-background px-6 text-foreground">
      <div className="max-w-sm space-y-2 text-center">
        <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
          Bubblophy prüft
        </p>
        <h1 className="text-2xl font-semibold">Session wird geprüft.</h1>
        <p className="text-sm text-muted-foreground">
          Sobald Login und Zugriff bestätigt sind, öffnet sich das
          Kontrollzentrum.
        </p>
      </div>
    </main>
  );
}

/**
 * Resolves the protected Bubblophy dashboard after the incoming request exists.
 *
 * @returns Authorized issue and agent orchestration dashboard.
 */
export async function ProtectedBubblophyDashboard() {
  await connection();
  const session = await requireBubblophySession({ nextPath: '/' });

  const dashboardSnapshot = await getBubblophyDashboardSnapshot({ session });

  return (
    <BubblophyDashboard
      snapshot={dashboardSnapshot}
      createIssueAction={createBubblophyIssueAction}
      createIssuePlanAction={createBubblophyIssuePlanAction}
      createProjectAction={createBubblophyProjectAction}
    />
  );
}
