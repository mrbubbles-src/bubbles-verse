import { listDashboardAccessEntries } from '@/lib/account/dashboard-access';
import { requireOwnerSession } from '@/lib/auth/session';

import { DashboardAccessManagement } from '@/components/account/dashboard-access-management';

/**
 * Renders the owner-only account page for dashboard access management.
 *
 * The first V1 account slice keeps profile editing out of scope and focuses on
 * the operational job that matters right now: deciding who may enter the
 * private dashboard and with which role.
 */
export default async function AccountPage() {
  const { accessEntry } = await requireOwnerSession();
  const accessEntries = await listDashboardAccessEntries();

  return (
    <>
      <DashboardAccessManagement
        accessEntries={accessEntries}
        currentIdentity={{
          githubUsername: accessEntry.githubUsername,
          email: accessEntry.email,
        }}
      />
    </>
  );
}
