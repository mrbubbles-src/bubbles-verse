import type { DashboardAccessEntry } from '@/lib/account/dashboard-access';
import type { User } from '@supabase/supabase-js';

import { getGithubIdentityUsername } from '@/lib/auth/allowed-identities';

import { asc, eq } from 'drizzle-orm';
import * as z from 'zod';

import { db } from '@/drizzle/db';
import { profileSocialLinks, profiles } from '@/drizzle/db/schema';

export const DASHBOARD_PROFILE_SOCIAL_PLATFORMS = [
  'website',
  'github',
  'linkedin',
  'twitter',
] as const;

export type DashboardProfileSocialPlatform =
  (typeof DASHBOARD_PROFILE_SOCIAL_PLATFORMS)[number];

export type DashboardProfileRecord = typeof profiles.$inferSelect;

export type DashboardProfilePageModel = {
  profile: DashboardProfileRecord;
  role: DashboardAccessEntry['userRole'];
  githubUsername: string;
  socialLinks: Record<DashboardProfileSocialPlatform, string>;
};

const dashboardProfileUrlSchema = z
  .string()
  .trim()
  .max(500, 'URLs dürfen höchstens 500 Zeichen lang sein.')
  .transform((value) => (value.length > 0 ? value : null))
  .refine(
    (value) => value === null || z.url().safeParse(value).success,
    'Bitte gib eine gültige URL ein.'
  );

const updateDashboardProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, 'Bitte gib einen Anzeigenamen ein.')
    .max(80, 'Anzeigenamen dürfen höchstens 80 Zeichen lang sein.'),
  slug: z.string().trim().max(120),
  avatarUrl: dashboardProfileUrlSchema,
  bio: z
    .string()
    .trim()
    .max(500, 'Die Bio darf höchstens 500 Zeichen lang sein.'),
  websiteUrl: dashboardProfileUrlSchema,
  githubUrl: dashboardProfileUrlSchema,
  linkedinUrl: dashboardProfileUrlSchema,
  twitterUrl: dashboardProfileUrlSchema,
});

/**
 * Narrows dashboard access roles to the shared `profiles` enum.
 *
 * @param role Role string from the dashboard allowlist.
 * @returns A profile-role-compatible value.
 */
function toProfileRole(role: string): 'owner' | 'editor' | 'guest_author' {
  if (role === 'owner' || role === 'editor' || role === 'guest_author') {
    return role;
  }

  return 'guest_author';
}

/**
 * Turns a profile label into a stable slug candidate.
 *
 * @param value Raw display label or manual slug input.
 * @returns A normalized ASCII-only slug.
 */
export function slugifyDashboardProfile(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

/**
 * Creates a readable profile display name from the current dashboard user.
 *
 * @param user Current Supabase user.
 * @param githubUsername Normalized GitHub username for the same user.
 * @returns Human-facing profile name for the shared content model.
 */
function resolveDashboardProfileDisplayName(user: User, githubUsername: string) {
  const userMetadata =
    user.user_metadata && typeof user.user_metadata === 'object'
      ? user.user_metadata
      : null;
  const fullName = userMetadata?.full_name;
  const name = userMetadata?.name;

  if (typeof fullName === 'string' && fullName.trim()) {
    return fullName.trim();
  }

  if (typeof name === 'string' && name.trim()) {
    return name.trim();
  }

  return githubUsername;
}

/**
 * Creates a stable default profile slug from the current GitHub identity.
 *
 * @param githubUsername Normalized GitHub username.
 * @param user Authenticated Supabase user.
 * @returns Slug-safe profile identifier.
 */
function resolveDashboardProfileSlug(githubUsername: string, user: User) {
  const fallbackValue = user.email?.split('@')[0] ?? user.id;

  return slugifyDashboardProfile(githubUsername || fallbackValue);
}

/**
 * Loads one profile row by its auth-user mapping.
 *
 * @param authUserId Supabase auth user identifier.
 * @returns Matching profile or `null`.
 */
export async function getDashboardProfileByAuthUserId(authUserId: string) {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.authUserId, authUserId))
    .limit(1);

  return profile ?? null;
}

/**
 * Finds or creates the shared profile row for the authenticated dashboard user.
 *
 * @param input Current dashboard identity context.
 * @returns Shared profile row referenced by content and profile editing.
 */
export async function ensureDashboardProfile(input: {
  user: User;
  accessEntry: DashboardAccessEntry;
  githubUsername: string;
}) {
  const existingProfile = await getDashboardProfileByAuthUserId(input.user.id);

  if (existingProfile) {
    return existingProfile;
  }

  const fallbackGithubUsername =
    getGithubIdentityUsername({
      identities: input.user.identities,
      userMetadata:
        input.user.user_metadata && typeof input.user.user_metadata === 'object'
          ? input.user.user_metadata
          : null,
    }) ?? input.accessEntry.githubUsername;
  const avatarUrl =
    typeof input.user.user_metadata?.avatar_url === 'string'
      ? input.user.user_metadata.avatar_url
      : null;
  const [createdProfile] = await db
    .insert(profiles)
    .values({
      authUserId: input.user.id,
      displayName: resolveDashboardProfileDisplayName(
        input.user,
        fallbackGithubUsername
      ),
      slug: resolveDashboardProfileSlug(fallbackGithubUsername, input.user),
      email: input.user.email ?? input.accessEntry.email,
      avatarUrl,
      role: toProfileRole(input.accessEntry.userRole),
    })
    .returning();

  if (!createdProfile) {
    throw new Error('Das Profil konnte nicht angelegt werden.');
  }

  return createdProfile;
}

/**
 * Parses and normalizes the profile form payload from `/profile`.
 *
 * Empty slug input falls back to the slugified display name.
 *
 * @param formData Submitted profile form.
 * @returns Safe parse result with normalized values.
 */
export function parseUpdateDashboardProfile(formData: FormData) {
  return updateDashboardProfileSchema
    .transform((values) => ({
      ...values,
      slug: slugifyDashboardProfile(values.slug || values.displayName),
    }))
    .safeParse({
      displayName: formData.get('displayName'),
      slug: formData.get('slug') ?? '',
      avatarUrl: formData.get('avatarUrl') ?? '',
      bio: formData.get('bio') ?? '',
      websiteUrl: formData.get('websiteUrl') ?? '',
      githubUrl: formData.get('githubUrl') ?? '',
      linkedinUrl: formData.get('linkedinUrl') ?? '',
      twitterUrl: formData.get('twitterUrl') ?? '',
    });
}

/**
 * Loads the full page model for the current dashboard user's profile page.
 *
 * @param input Current dashboard identity context.
 * @returns Profile row plus fixed social-link fields for the form UI.
 */
export async function getDashboardProfilePageModel(input: {
  user: User;
  accessEntry: DashboardAccessEntry;
  githubUsername: string;
}): Promise<DashboardProfilePageModel> {
  const profile = await ensureDashboardProfile(input);
  const socialLinks = await db
    .select({
      platform: profileSocialLinks.platform,
      url: profileSocialLinks.url,
    })
    .from(profileSocialLinks)
    .where(eq(profileSocialLinks.profileId, profile.id))
    .orderBy(asc(profileSocialLinks.sortOrder), asc(profileSocialLinks.platform));
  const socialLinkMap: Record<DashboardProfileSocialPlatform, string> = {
    website: '',
    github: '',
    linkedin: '',
    twitter: '',
  };

  for (const socialLink of socialLinks) {
    if (socialLink.platform in socialLinkMap) {
      socialLinkMap[socialLink.platform as DashboardProfileSocialPlatform] =
        socialLink.url;
    }
  }

  return {
    profile,
    role: input.accessEntry.userRole,
    githubUsername: input.githubUsername,
    socialLinks: socialLinkMap,
  };
}

/**
 * Updates the current dashboard profile and rewrites its fixed social links.
 *
 * @param input Current dashboard identity plus validated form payload.
 */
export async function updateDashboardProfile(input: {
  user: User;
  accessEntry: DashboardAccessEntry;
  githubUsername: string;
  payload: z.infer<typeof updateDashboardProfileSchema>;
}) {
  const profile = await ensureDashboardProfile({
    user: input.user,
    accessEntry: input.accessEntry,
    githubUsername: input.githubUsername,
  });
  const socialLinkValues = [
    {
      platform: 'website' as const,
      url: input.payload.websiteUrl,
      label: 'Website',
      sortOrder: 0,
    },
    {
      platform: 'github' as const,
      url: input.payload.githubUrl,
      label: 'GitHub',
      sortOrder: 1,
    },
    {
      platform: 'linkedin' as const,
      url: input.payload.linkedinUrl,
      label: 'LinkedIn',
      sortOrder: 2,
    },
    {
      platform: 'twitter' as const,
      url: input.payload.twitterUrl,
      label: 'Twitter',
      sortOrder: 3,
    },
  ].filter((socialLink) => socialLink.url !== null);

  await db.transaction(async (tx) => {
    await tx
      .update(profiles)
      .set({
        displayName: input.payload.displayName,
        slug: input.payload.slug,
        avatarUrl: input.payload.avatarUrl,
        bio: input.payload.bio,
        role: toProfileRole(input.accessEntry.userRole),
      })
      .where(eq(profiles.id, profile.id));

    await tx
      .delete(profileSocialLinks)
      .where(eq(profileSocialLinks.profileId, profile.id));

    if (socialLinkValues.length > 0) {
      await tx.insert(profileSocialLinks).values(
        socialLinkValues.map((socialLink) => ({
          profileId: profile.id,
          platform: socialLink.platform,
          url: socialLink.url!,
          label: socialLink.label,
          sortOrder: socialLink.sortOrder,
        }))
      );
    }
  });
}
