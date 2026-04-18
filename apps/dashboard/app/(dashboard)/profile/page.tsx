import { requireDashboardSession } from '@/lib/auth/session';
import { getDashboardProfilePageModel } from '@/lib/profile/profile';

import { ProfileEditor } from '@/components/profile/profile-editor';
import { ProfileFeedbackToast } from '@/components/profile/profile-feedback-toast';

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
      <ProfileFeedbackToast />
      <section className="flex flex-col gap-4 rounded-[2rem] border border-border/50 bg-background/80 px-5 py-6 shadow-sm shadow-black/5 sm:px-6">
        <p className="text-xs font-semibold tracking-[0.28em] text-muted-foreground uppercase">
          Profil
        </p>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-balance">
            Dein Autorenprofil
          </h1>
          <p className="max-w-3xl text-sm text-pretty text-muted-foreground sm:text-base">
            Pflege hier die Daten, die später für Autorenkarten, Profilblöcke
            und andere öffentliche Redaktionsoberflächen wiederverwendet werden.
          </p>
        </div>
      </section>

      <ProfileEditor model={profileModel} />
    </>
  );
}
