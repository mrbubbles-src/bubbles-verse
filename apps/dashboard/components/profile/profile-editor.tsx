'use client';

import type { DashboardProfilePageModel } from '@/lib/profile/profile';

import { useState } from 'react';

import { Button } from '@bubbles/ui/shadcn/button';

import { ProfileEditForm } from '@/components/profile/profile-edit-form';
import { ProfileView } from '@/components/profile/profile-view';

type ProfileEditorProps = {
  model: DashboardProfilePageModel;
};

/**
 * Coordinates the view-first and edit-second profile experience on `/profile`.
 *
 * @param props Profile data resolved on the server for the signed-in user.
 * @returns The read-only profile view or the explicit edit mode.
 */
export function ProfileEditor({ model }: ProfileEditorProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <ProfileEditForm model={model} onCancel={() => setIsEditing(false)} />
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col">
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            Autorenprofil
          </h1>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => setIsEditing(true)}>
          Bearbeiten
        </Button>
      </header>

      <ProfileView model={model} />
    </section>
  );
}
