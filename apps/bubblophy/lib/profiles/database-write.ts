import 'server-only';

import type { User } from '@supabase/supabase-js';

import { resolveBubblophyProfileDisplayName } from '@/lib/profiles/profile';

import { sql } from 'drizzle-orm';

import { db } from '@/drizzle/db';
import { bubblophyUserProfiles } from '@/drizzle/db/schema';

/**
 * Synchronizes the current user's display-only Bubblophy profile.
 *
 * The auth user ID and normalized e-mail come from the verified server session;
 * browser input is never accepted. Project memberships remain the sole access
 * source. The conditional upsert avoids a write when identity data is unchanged.
 *
 * @param input Verified Supabase user and normalized session e-mail.
 * @returns The synchronized display-only profile fields.
 */
export async function syncBubblophyUserProfile(input: {
  user: User;
  normalizedEmail: string;
}) {
  const profile = {
    authUserId: input.user.id,
    normalizedEmail: input.normalizedEmail,
    displayName: resolveBubblophyProfileDisplayName(input.user),
  };

  await db
    .insert(bubblophyUserProfiles)
    .values(profile)
    .onConflictDoUpdate({
      target: bubblophyUserProfiles.authUserId,
      set: {
        normalizedEmail: profile.normalizedEmail,
        displayName: profile.displayName,
        updatedAt: sql`now()`,
      },
      setWhere: sql`${bubblophyUserProfiles.normalizedEmail} is distinct from ${profile.normalizedEmail} or ${bubblophyUserProfiles.displayName} is distinct from ${profile.displayName}`,
    });

  return profile;
}
