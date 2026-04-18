import type { DashboardProfilePageModel } from '@/lib/profile/profile';

import { updateDashboardProfileAction } from '@/app/(dashboard)/profile/actions';

import { Button } from '@bubbles/ui/shadcn/button';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@bubbles/ui/shadcn/field';
import { Input } from '@bubbles/ui/shadcn/input';
import { Separator } from '@bubbles/ui/shadcn/separator';
import { Textarea } from '@bubbles/ui/shadcn/textarea';

type ProfileEditorProps = {
  model: DashboardProfilePageModel;
};

/**
 * Renders the current dashboard user's editable author profile.
 *
 * The first slice stays intentionally fixed-field: one core profile row plus
 * the four supported social platforms from the existing schema.
 */
export function ProfileEditor({ model }: ProfileEditorProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <section className="flex flex-col gap-4 rounded-[2rem] border border-border/50 bg-background/80 px-5 py-6 shadow-sm shadow-black/5 sm:px-6">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
            Autorenprofil
          </p>
          <p className="text-sm text-pretty text-muted-foreground">
            Diese Angaben bilden die Grundlage für spätere Autorenansichten und
            wiederverwendbare Profilblöcke in deinen Apps.
          </p>
        </div>

        <Separator />

        <form action={updateDashboardProfileAction} className="flex flex-col gap-5">
          <FieldGroup className="grid gap-4 lg:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="profile-display-name">Anzeigename</FieldLabel>
              <FieldContent>
                <Input
                  id="profile-display-name"
                  name="displayName"
                  defaultValue={model.profile.displayName}
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="profile-slug">Slug</FieldLabel>
              <FieldContent>
                <Input
                  id="profile-slug"
                  name="slug"
                  defaultValue={model.profile.slug}
                />
                <FieldDescription>
                  Leer lassen geht auch, dann wird der Slug aus dem Anzeigenamen gebaut.
                </FieldDescription>
              </FieldContent>
            </Field>

            <Field className="lg:col-span-2">
              <FieldLabel htmlFor="profile-avatar-url">Avatar-URL</FieldLabel>
              <FieldContent>
                <Input
                  id="profile-avatar-url"
                  name="avatarUrl"
                  defaultValue={model.profile.avatarUrl ?? ''}
                  placeholder="https://..."
                />
                <FieldDescription>
                  Du kannst hier später auch eine Cloudinary-URL hinterlegen.
                </FieldDescription>
              </FieldContent>
            </Field>

            <Field className="lg:col-span-2">
              <FieldLabel htmlFor="profile-bio">Bio</FieldLabel>
              <FieldContent>
                <Textarea
                  id="profile-bio"
                  name="bio"
                  defaultValue={model.profile.bio}
                  rows={5}
                  className="min-h-32"
                  placeholder="Kurzer Kontext zu dir, deiner Arbeit und deinem Fokus."
                />
              </FieldContent>
            </Field>
          </FieldGroup>

          <Separator />

          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold tracking-tight">Social Links</p>
              <p className="text-sm text-muted-foreground">
                Die festen Plattform-Felder reichen für V1 und passen direkt auf
                das vorhandene Schema.
              </p>
            </div>

            <FieldGroup className="grid gap-4 lg:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="profile-website-url">Website</FieldLabel>
                <FieldContent>
                  <Input
                    id="profile-website-url"
                    name="websiteUrl"
                    defaultValue={model.socialLinks.website}
                    placeholder="https://..."
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
                    placeholder="https://github.com/..."
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
                    placeholder="https://linkedin.com/in/..."
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="profile-twitter-url">Twitter / X</FieldLabel>
                <FieldContent>
                  <Input
                    id="profile-twitter-url"
                    name="twitterUrl"
                    defaultValue={model.socialLinks.twitter}
                    placeholder="https://x.com/..."
                  />
                </FieldContent>
              </Field>
            </FieldGroup>
          </div>

          <div className="flex justify-end">
            <Button type="submit">Profil speichern</Button>
          </div>
        </form>
      </section>

      <aside className="flex flex-col gap-4 rounded-[2rem] border border-border/50 bg-background/80 px-5 py-6 shadow-sm shadow-black/5 sm:px-6">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
            Aktuelle Identität
          </p>
          <p className="text-sm text-pretty text-muted-foreground">
            GitHub-Zugang und Dashboard-Rolle kommen weiter aus Auth und Allowlist,
            nicht aus diesem Formular.
          </p>
        </div>

        <Separator />

        <dl className="flex flex-col gap-4 text-sm">
          <div className="space-y-1">
            <dt className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
              GitHub
            </dt>
            <dd>@{model.githubUsername}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
              E-Mail
            </dt>
            <dd>{model.profile.email}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
              Rolle
            </dt>
            <dd>{model.role.replace('_', ' ')}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
              Profil-Slug
            </dt>
            <dd>/{model.profile.slug}</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
