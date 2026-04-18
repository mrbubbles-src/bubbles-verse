import { requireDashboardSession } from '@/lib/auth/session';

import AppShell from '@/components/app-shell';
import { LoginSuccessToast } from '@/components/auth/login-success-toast';

/**
 * Protects dashboard routes behind the owner-only Supabase session gate.
 *
 * Any route placed inside the `(dashboard)` group must have an authenticated
 * GitHub identity with `dashboard_access` enabled before its UI is rendered.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
    settingsHref: '/account',
    logoutHref: '/auth/logout',
  };

  return (
    <>
      <LoginSuccessToast />
      <AppShell user={metadata}>{children}</AppShell>
    </>
  );
}
