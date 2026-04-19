import type { DashboardProfilePageModel } from '@/lib/profile/profile';

import { Avatar, AvatarFallback, AvatarImage } from '@bubbles/ui/shadcn/avatar';

type ProfileViewProps = {
  model: DashboardProfilePageModel;
};

const SOCIAL_LINK_LABELS = {
  website: 'Website',
  github: 'GitHub',
  linkedin: 'LinkedIn',
  twitter: 'X',
} as const;

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
 * Renders the read-only author profile with avatar, bio, and public links.
 *
 * @param props Profile data loaded on the server for the current dashboard user.
 * @returns The flat profile view used before switching into edit mode.
 */
export function ProfileView({ model }: ProfileViewProps) {
  const socialLinks = Object.entries(model.socialLinks).filter((entry) => {
    const [, href] = entry;
    return href.length > 0;
  }) as Array<[keyof typeof SOCIAL_LINK_LABELS, string]>;

  return (
    <div className="border-t border-border/50 pt-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <Avatar className="size-20 sm:size-24" size="lg">
          <AvatarImage
            src={model.profile.avatarUrl ?? undefined}
            alt={model.profile.displayName}
          />
          <AvatarFallback>
            {getProfileInitials(model.profile.displayName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              {model.profile.displayName}
            </h2>

            <p className="max-w-3xl text-base leading-7 text-pretty text-foreground/80">
              {model.profile.bio?.length
                ? model.profile.bio
                : 'Noch keine Bio hinterlegt.'}
            </p>
          </div>

          {socialLinks.length > 0 ? (
            <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              {socialLinks.map(([platform, href]) => (
                <li key={platform}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-primary">
                    {SOCIAL_LINK_LABELS[platform]}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Noch keine öffentlichen Links hinterlegt.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
