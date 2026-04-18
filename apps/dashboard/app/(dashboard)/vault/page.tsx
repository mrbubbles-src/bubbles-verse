import { VaultOverview } from '@/components/vault/vault-overview';
import { requireDashboardManagerSession } from '@/lib/auth/session';
import { getVaultOverviewModel } from '@/lib/vault/overview';

/**
 * Renders the first real Vault landing page for owners and editors.
 *
 * The overview prioritizes quick authoring routes, compact editorial metrics,
 * and recent activity instead of sending people straight into a dense list.
 */
export default async function VaultPage() {
  await requireDashboardManagerSession();
  const model = await getVaultOverviewModel();

  return <VaultOverview model={model} />;
}
