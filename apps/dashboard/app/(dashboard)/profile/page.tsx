import { requireDashboardSession } from '@/lib/auth/session';
import { getDashboardProfilePageModel } from '@/lib/profile/profile';

import { ProfileEditor } from '@/components/profile/profile-editor';

/**
 * Renders the current dashboard user's editable author profile.
 *
 * This page is available to every authenticated dashboard user and keeps
 * profile data separate from owner-only access management.
 */
export default async function ProfilePage() {
  const session = await requireDashboardSession();
  const profileModel = await getDashboardProfilePageModel({
    user: session.user,
    accessEntry: session.accessEntry,
    githubUsername: session.githubUsername,
  });

  return (
    <>
      <ProfileEditor model={profileModel} />
    </>
  );
}
