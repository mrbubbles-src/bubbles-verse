'use client';

import type { DashboardProfilePageModel } from '@/lib/profile/profile';

import { Avatar, AvatarFallback, AvatarImage } from '@bubbles/ui/shadcn/avatar';
import { Button } from '@bubbles/ui/shadcn/button';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@bubbles/ui/shadcn/field';
import { Input } from '@bubbles/ui/shadcn/input';
import { Textarea } from '@bubbles/ui/shadcn/textarea';
import { useFormStatus } from 'react-dom';

import { updateDashboardProfileAction } from '@/app/(dashboard)/profile/actions';

type ProfileEditFormProps = {
  model: DashboardProfilePageModel;
  onCancel: () => void;
};

/**
 * Derives a compact two-letter fallback for missing profile avatars.
 *
 * @param displayName Current profile display name.
 * @returns Up to two initials for the avatar fallback.
 */
function getProfileInitials(displayName: string) {
  const segments = displayName.trim().split(/\s+/).filter(Boolean).slice(0, 2);

  if (!segments.length) {
    return 'AU';
  }

  return segments.map((segment) => segment[0]?.toUpperCase() ?? '').join('');
}

/**
 * Renders the pending-aware submit button for the profile edit form.
 *
 * @returns A disabled save button while the Server Action is running.
 */
function ProfileSaveButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Speichern …' : 'Speichern'}
    </Button>
  );
}

/**
 * Renders the full profile edit mode on the same route as the read-only view.
 *
 * @param props Profile defaults plus cancel callback from the parent view shell.
 * @returns A server-action form for the editable profile fields.
 */
export function ProfileEditForm({ model, onCancel }: ProfileEditFormProps) {
  return (
    <form action={updateDashboardProfileAction} className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            Autorenprofil bearbeiten
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Abbrechen
          </Button>
          <ProfileSaveButton />
        </div>
      </header>

      <div className="border-t border-border/50 pt-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
          <div className="flex flex-col gap-4">
            <Avatar className="size-20 sm:size-24" size="lg">
              <AvatarImage
                src={model.profile.avatarUrl ?? undefined}
                alt={model.profile.displayName}
              />
              <AvatarFallback>
                {getProfileInitials(model.profile.displayName)}
              </AvatarFallback>
            </Avatar>

            <Field>
              <FieldLabel htmlFor="profile-avatar-url">Avatar-URL</FieldLabel>
              <FieldContent>
                <Input
                  id="profile-avatar-url"
                  name="avatarUrl"
                  defaultValue={model.profile.avatarUrl ?? ''}
                  placeholder="https://…"
                />
                <FieldDescription>
                  Die Vorschau nutzt weiter die hinterlegte Bild-URL.
                </FieldDescription>
              </FieldContent>
            </Field>
          </div>

          <div className="flex flex-col gap-6">
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="profile-display-name">
                  Anzeigename
                </FieldLabel>
                <FieldContent>
                  <Input
                    id="profile-display-name"
                    name="displayName"
                    defaultValue={model.profile.displayName}
                  />
                </FieldContent>
              </Field>

              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="profile-bio">Bio</FieldLabel>
                <FieldContent>
                  <Textarea
                    id="profile-bio"
                    name="bio"
                    defaultValue={model.profile.bio}
                    rows={6}
                    className="min-h-36"
                    placeholder="Kurzer Kontext zu dir, deiner Arbeit und deinem Fokus."
                  />
                </FieldContent>
              </Field>
            </FieldGroup>

            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="profile-website-url">Website</FieldLabel>
                <FieldContent>
                  <Input
                    id="profile-website-url"
                    name="websiteUrl"
                    defaultValue={model.socialLinks.website}
                    placeholder="https://…"
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="profile-github-url">GitHub</FieldLabel>
                <FieldContent>
                  <Input
                    id="profile-github-url"
                    name="githubUrl"
                    defaultValue={model.socialLinks.github}
                    placeholder="https://github.com/…"
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="profile-linkedin-url">LinkedIn</FieldLabel>
                <FieldContent>
                  <Input
                    id="profile-linkedin-url"
                    name="linkedinUrl"
                    defaultValue={model.socialLinks.linkedin}
                    placeholder="https://linkedin.com/in/…"
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="profile-twitter-url">X</FieldLabel>
                <FieldContent>
                  <Input
                    id="profile-twitter-url"
                    name="twitterUrl"
                    defaultValue={model.socialLinks.twitter}
                    placeholder="https://x.com/…"
                  />
                </FieldContent>
              </Field>
            </FieldGroup>
          </div>
        </div>
      </div>
    </form>
  );
}
