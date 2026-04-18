import { requireDashboardSession } from '@/lib/auth/session';
import { getDashboardHomeModel } from '@/lib/dashboard/home';

import { DashboardHome } from '@/components/home/dashboard-home';

/**
 * Renders the authenticated dashboard landing page with live editorial data.
 *
 * The home view stays intentionally compact: current identity, next actions,
 * real Vault activity, and profile readiness.
 */
export default async function DashboardPage() {
  const session = await requireDashboardSession();
  const dashboardHomeModel = await getDashboardHomeModel(session);

  return <DashboardHome model={dashboardHomeModel} />;
}
