import {
  getDashboardAccessEntryByIdentity,
  normalizeDashboardEmail,
  normalizeGithubUsername,
} from '@/lib/account/dashboard-access';
import { getGithubIdentityUsername } from '@/lib/auth/allowed-identities';
import { createDashboardServerSupabaseClient } from '@/lib/supabase/server';
import {
  parseUpdateVaultEntryRequest,
  updateVaultEntry,
} from '@/lib/vault/entries';

import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

type UpdateVaultEntryRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * Updates an existing Vault entry for the current authenticated dashboard user.
 *
 * @param request JSON request from the dashboard entry editor.
 * @param context Dynamic route params containing the content item ID.
 * @returns JSON response with the updated entry ID or an error message.
 */
export async function PATCH(
  request: Request,
  context: UpdateVaultEntryRouteProps
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
      { message: 'Dieser User darf keine Vault-Einträge bearbeiten.' },
      { status: 403 }
    );
  }

  const { id } = await context.params;
  const requestBody = (await request.json()) as Record<string, unknown>;
  const parsedBody = parseUpdateVaultEntryRequest(requestBody);

  if (!parsedBody.success) {
    return NextResponse.json(
      { message: 'Bitte prüfe die Entry-Daten und versuche es noch einmal.' },
      { status: 400 }
    );
  }

  try {
    const updatedEntry = await updateVaultEntry({
      id,
      payload: parsedBody.data,
      user,
      accessEntry,
    });

    if (!updatedEntry) {
      return NextResponse.json(
        {
          message: 'Der Vault-Eintrag konnte gerade nicht aktualisiert werden.',
        },
        { status: 500 }
      );
    }

    revalidatePath('/vault/entries');
    revalidatePath(`/vault/entries/${id}`);

    return NextResponse.json(
      {
        id: updatedEntry.id,
        slug: updatedEntry.slug,
      },
      { status: 200 }
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
        : 'Der Vault-Eintrag konnte gerade nicht aktualisiert werden.';

    return NextResponse.json({ message }, { status: 500 });
  }
}
