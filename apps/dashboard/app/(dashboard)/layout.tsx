import { requireDashboardSession } from '@/lib/auth/session';

import { Suspense } from 'react';

import { connection } from 'next/server';

import AppShell from '@/components/app-shell';
import { LoginSuccessToast } from '@/components/auth/login-success-toast';
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
      <Suspense fallback={null}>
        <AuthenticatedDashboardShell>{children}</AuthenticatedDashboardShell>
      </Suspense>
    </>
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

  return <AppShell user={metadata}>{children}</AppShell>;
}
