import { requireDashboardSession } from '@/lib/auth/session';

import { Suspense } from 'react';

import { connection } from 'next/server';

import { ThemeProvider } from '@bubbles/theme';
import { HugeiconsIcon, Rotate01Icon } from '@bubbles/ui/lib/hugeicons';

import AppShell from '@/components/app-shell';
import { LoginSuccessToast } from '@/components/auth/login-success-toast';
import { DashboardRouteLoadingDetails } from '@/components/dashboard-route-loading-details';
import { DashboardRouteState } from '@/components/dashboard-route-state';
import { DashboardRedirectFeedbackToast } from '@/components/feedback/dashboard-redirect-feedback-toast';

/**
 * Protects dashboard routes behind the owner-only Supabase session gate.
 *
 * Any route placed inside the `(dashboard)` group must have an authenticated
 * GitHub identity with `dashboard_access` enabled before its UI is rendered.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <LoginSuccessToast />
      <Suspense fallback={null}>
        <DashboardRedirectFeedbackToast />
      </Suspense>
      <Suspense fallback={<DashboardShellFallback />}>
        <AuthenticatedDashboardShell>{children}</AuthenticatedDashboardShell>
      </Suspense>
    </>
  );
}

/**
 * Renders a visible fallback while the request-scoped dashboard shell resolves.
 *
 * @returns Loading state for session and navigation metadata checks.
 */
function DashboardShellFallback() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <main className="dashboard-page">
        <DashboardRouteState
          eyebrow="Dashboard prüft"
          title="Wir prüfen deine Sitzung."
          description="Session, Rolle und Navigation werden vorbereitet. Sobald die Prüfung abgeschlossen ist, öffnet sich dein Dashboard."
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
      </main>
    </ThemeProvider>
  );
}

/**
 * Renders the authenticated dashboard shell after the incoming request exists.
 *
 * @param props Protected dashboard route content rendered inside the app shell.
 * @returns App shell with the signed-in user's navigation metadata.
 */
async function AuthenticatedDashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();

  const { user } = await requireDashboardSession();
  const metadata = {
    name:
      typeof user.user_metadata?.full_name === 'string'
        ? user.user_metadata.full_name
        : typeof user.user_metadata?.name === 'string'
          ? user.user_metadata.name
          : (user.email?.split('@')[0] ?? 'Owner'),
    email: user.email ?? 'dashboard-owner@mrbubbles.test',
    avatarSrc:
      typeof user.user_metadata?.avatar_url === 'string'
        ? user.user_metadata.avatar_url
        : undefined,
    dashboardHref: '/',
    settingsHref: '/profile',
    logoutHref: '/auth/logout',
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <AppShell user={metadata}>{children}</AppShell>
    </ThemeProvider>
  );
}
