import {
  getDashboardAccessEntryByIdentity,
  normalizeDashboardEmail,
  normalizeGithubUsername,
} from '@/lib/account/dashboard-access';
import { getGithubIdentityUsername } from '@/lib/auth/allowed-identities';
import { DASHBOARD_CACHE_TAGS } from '@/lib/cache/tags';
import { createDashboardServerSupabaseClient } from '@/lib/supabase/server';
import {
  createVaultEntry,
  parseCreateVaultEntryRequest,
} from '@/lib/vault/entries';

import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

/**
 * Persists a new Vault entry for the current authenticated dashboard editor.
 *
 * The route validates the current Supabase session, checks the DB-backed
 * dashboard access row, and bootstraps the shared profile/app-module data on
 * the first successful save.
 *
 * @param request JSON request from the dashboard entry editor.
 * @returns JSON response with the newly created entry ID or an error message.
 */
export async function POST(request: Request) {
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
      { message: 'Dieser User darf keine Vault-Einträge speichern.' },
      { status: 403 }
    );
  }

  const requestBody = (await request.json()) as Record<string, unknown>;
  const parsedBody = parseCreateVaultEntryRequest(requestBody);

  if (!parsedBody.success) {
    return NextResponse.json(
      { message: 'Bitte prüfe die Entry-Daten und versuche es noch einmal.' },
      { status: 400 }
    );
  }

  try {
    const createdEntry = await createVaultEntry({
      payload: parsedBody.data,
      user,
      accessEntry,
    });

    if (!createdEntry) {
      return NextResponse.json(
        {
          message: 'Der Vault-Eintrag konnte gerade nicht gespeichert werden.',
        },
        { status: 500 }
      );
    }

    revalidatePath('/vault/entries');
    revalidatePath('/vault/entries/new');
    revalidateTag(DASHBOARD_CACHE_TAGS.home, { expire: 0 });
    revalidateTag(DASHBOARD_CACHE_TAGS.profile(user.id), { expire: 0 });
    revalidateTag(DASHBOARD_CACHE_TAGS.vaultEntries, { expire: 0 });
    revalidateTag(DASHBOARD_CACHE_TAGS.vaultOverview, { expire: 0 });
    revalidateTag(DASHBOARD_CACHE_TAGS.vaultEntry(createdEntry.id), {
      expire: 0,
    });

    return NextResponse.json(
      {
        id: createdEntry.id,
        slug: createdEntry.slug,
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
        { message: 'Dieser Slug ist bereits im Vault belegt.' },
        { status: 409 }
      );
    }

    const message =
      error instanceof Error
        ? error.message
        : 'Der Vault-Eintrag konnte gerade nicht gespeichert werden.';

    return NextResponse.json({ message }, { status: 500 });
  }
}
