import {
  getDashboardAccessEntryByIdentity,
  normalizeDashboardEmail,
  normalizeGithubUsername,
} from '@/lib/account/dashboard-access';
import { getGithubIdentityUsername } from '@/lib/auth/allowed-identities';
import { DASHBOARD_CACHE_TAGS } from '@/lib/cache/tags';
import { createDashboardServerSupabaseClient } from '@/lib/supabase/server';
import { duplicateVaultEntry } from '@/lib/vault/entries';

import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

type DuplicateVaultEntryRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * Creates a draft duplicate of one existing Vault entry.
 *
 * @param _request Request object for the duplicate call.
 * @param context Dynamic route params containing the source content item ID.
 * @returns JSON response with the newly created duplicate entry.
 */
export async function POST(
  _request: Request,
  context: DuplicateVaultEntryRouteProps
) {
  const supabase = await createDashboardServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { message: 'Bitte melde dich zuerst im Dashboard an.' },
      { status: 401 }
    );
  }

  const githubUsername = normalizeGithubUsername(
    getGithubIdentityUsername({
      identities: user.identities,
      userMetadata:
        user.user_metadata && typeof user.user_metadata === 'object'
          ? user.user_metadata
          : null,
    })
  );
  const email = normalizeDashboardEmail(user.email);

  if (!githubUsername || !email) {
    return NextResponse.json(
      { message: 'Die GitHub-Identität ist unvollständig.' },
      { status: 403 }
    );
  }

  const accessEntry = await getDashboardAccessEntryByIdentity({
    githubUsername,
    email,
  });

  if (
    !accessEntry?.dashboardAccess ||
    (accessEntry.userRole !== 'owner' && accessEntry.userRole !== 'editor')
  ) {
    return NextResponse.json(
      { message: 'Dieser User darf keine Vault-Einträge duplizieren.' },
      { status: 403 }
    );
  }

  const { id } = await context.params;

  try {
    const duplicatedEntry = await duplicateVaultEntry({
      id,
      user,
      accessEntry,
    });

    if (!duplicatedEntry) {
      return NextResponse.json(
        { message: 'Dieser Vault-Eintrag wurde nicht gefunden.' },
        { status: 404 }
      );
    }

    revalidatePath('/vault');
    revalidatePath('/vault/entries');
    revalidatePath(`/vault/entries/${id}`);
    revalidatePath(`/vault/entries/${duplicatedEntry.id}`);
    revalidateTag(DASHBOARD_CACHE_TAGS.home, { expire: 0 });
    revalidateTag(DASHBOARD_CACHE_TAGS.profile(user.id), { expire: 0 });
    revalidateTag(DASHBOARD_CACHE_TAGS.vaultEntries, { expire: 0 });
    revalidateTag(DASHBOARD_CACHE_TAGS.vaultOverview, { expire: 0 });
    revalidateTag(DASHBOARD_CACHE_TAGS.vaultEntry(id), { expire: 0 });
    revalidateTag(DASHBOARD_CACHE_TAGS.vaultEntry(duplicatedEntry.id), {
      expire: 0,
    });

    return NextResponse.json(
      {
        id: duplicatedEntry.id,
        slug: duplicatedEntry.slug,
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    ) {
      return NextResponse.json(
        { message: 'Für die Kopie konnte kein freier Slug erzeugt werden.' },
        { status: 409 }
      );
    }

    const message =
      error instanceof Error
        ? error.message
        : 'Der Vault-Eintrag konnte gerade nicht dupliziert werden.';

    return NextResponse.json({ message }, { status: 500 });
  }
}
