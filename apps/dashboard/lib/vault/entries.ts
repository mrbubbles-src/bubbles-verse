import type { JsonValue } from '@/drizzle/db/schema';
import type { DashboardAccessEntry } from '@/lib/account/dashboard-access';
import type { MarkdownEditorStatus } from '@bubbles/markdown-editor';
import type { User } from '@supabase/supabase-js';

import { getGithubIdentityUsername } from '@/lib/auth/allowed-identities';
import { listVaultCategories } from '@/lib/vault/categories';
import { buildVaultCategoryTree } from '@/lib/vault/category-tree';

import { desc, eq } from 'drizzle-orm';
import * as z from 'zod';

import { db } from '@/drizzle/db';
import {
  appModules,
  contentItems,
  contentItemTags,
  profiles,
  vaultCategories,
  vaultEntries,
} from '@/drizzle/db/schema';

const VAULT_APP_MODULE_SLUG = 'vault';
const VAULT_CONTENT_TYPE = 'vault_entry';

const vaultEntryEditorContentSchema = z
  .object({
    blocks: z.array(z.record(z.string(), z.json())),
    time: z.union([z.number(), z.string()]).optional(),
    version: z.string().optional(),
  })
  .passthrough();

const createVaultEntryRequestSchema = z.object({
  title: z.string().trim().min(1).max(160),
  slug: z.string().trim().min(1).max(240),
  description: z.string().trim().max(240),
  tags: z.array(z.string().trim().min(1).max(60)).max(20),
  status: z.enum(['published', 'unpublished']),
  editorContent: vaultEntryEditorContentSchema,
  serializedContent: z.string().trim().min(1),
  primaryCategoryId: z.string().trim().min(1),
});

export type VaultEntryCategoryOption = {
  id: string;
  label: string;
  name: string;
  topLevelSlug: string;
  childSlug: string | null;
};

export type VaultEntryListItem = {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  categoryLabel: string;
  updatedAtLabel: string;
};

export type CreateVaultEntryInput = z.infer<
  typeof createVaultEntryRequestSchema
>;

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
 * Bridges validated editor output into the shared JSON column type.
 *
 * The request schema already constrains the payload to a JSON-compatible
 * object graph, so this cast only aligns the editor package type with the DB.
 *
 * @param editorContent Validated editor payload from the create-entry route.
 * @returns JSON value for `content_items.editorContent`.
 */
function toJsonValue(
  editorContent: CreateVaultEntryInput['editorContent']
): JsonValue {
  return editorContent as JsonValue;
}

/**
 * Normalizes free-form tag arrays into a small stable payload.
 *
 * @param tags Raw tag list from the editor form payload.
 * @returns Trimmed, case-insensitively deduplicated tags.
 */
function normalizeVaultEntryTags(tags: string[]) {
  const normalizedTags = new Set<string>();

  for (const tag of tags) {
    const normalizedTag = tag.trim();

    if (!normalizedTag) {
      continue;
    }

    normalizedTags.add(normalizedTag);
  }

  return [...normalizedTags];
}

/**
 * Converts the editor package status into the shared content status enum.
 *
 * @param status Markdown editor status from the package form.
 * @returns Shared content status used in `content_items`.
 */
function toContentStatus(status: MarkdownEditorStatus) {
  return status === 'published' ? 'published' : 'draft';
}

/**
 * Builds the category-select model used by the Vault entry editor.
 *
 * Top-level categories and child categories are flattened into one list while
 * still preserving the slug path context needed by the shared editor form.
 *
 * @returns Ordered category options for the create-entry page.
 */
export async function listVaultEntryCategoryOptions(): Promise<
  VaultEntryCategoryOption[]
> {
  const categories = await listVaultCategories();
  const tree = buildVaultCategoryTree(
    categories.map((category) => ({
      ...category,
      entryCount: 0,
    }))
  );
  const options: VaultEntryCategoryOption[] = [];

  for (const category of tree) {
    options.push({
      id: category.id,
      label: category.name,
      name: category.name,
      topLevelSlug: category.slug,
      childSlug: null,
    });

    for (const child of category.children) {
      options.push({
        id: child.id,
        label: `${category.name} / ${child.name}`,
        name: child.name,
        topLevelSlug: category.slug,
        childSlug: child.slug,
      });
    }
  }

  return options;
}

/**
 * Loads the data needed for the create-entry page.
 *
 * @returns Category options plus slug context for the editor wrapper.
 */
export async function getVaultEntryCreationModel() {
  return {
    categories: await listVaultEntryCategoryOptions(),
  };
}

/**
 * Loads the editorial list model for the Vault entry overview.
 *
 * @returns Recently updated Vault entries with category labels.
 */
export async function getVaultEntries(): Promise<VaultEntryListItem[]> {
  const rows = await db
    .select({
      id: contentItems.id,
      title: contentItems.title,
      slug: contentItems.slug,
      status: contentItems.status,
      updatedAt: contentItems.updatedAt,
      categoryName: vaultCategories.name,
    })
    .from(vaultEntries)
    .innerJoin(contentItems, eq(vaultEntries.contentItemId, contentItems.id))
    .innerJoin(
      vaultCategories,
      eq(vaultEntries.primaryCategoryId, vaultCategories.id)
    )
    .orderBy(desc(contentItems.updatedAt));

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    status: row.status,
    categoryLabel: row.categoryName,
    updatedAtLabel: new Intl.DateTimeFormat('de-DE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(row.updatedAt)),
  }));
}

/**
 * Validates the JSON body sent by the create-entry API route.
 *
 * @param value Parsed request JSON body.
 * @returns Safe parse result for the create-entry payload.
 */
export function parseCreateVaultEntryRequest(value: Record<string, unknown>) {
  return createVaultEntryRequestSchema.safeParse({
    ...value,
    tags: Array.isArray(value.tags) ? normalizeVaultEntryTags(value.tags) : [],
  });
}

/**
 * Creates a readable profile display name from the current dashboard user.
 *
 * @param user Current Supabase user.
 * @param githubUsername Normalized GitHub username for the same user.
 * @returns Human-facing profile name for the shared content model.
 */
function resolveDashboardProfileDisplayName(
  user: User,
  githubUsername: string
) {
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
 * Creates a stable profile slug from the current GitHub identity.
 *
 * @param githubUsername Normalized GitHub username.
 * @param user Authenticated Supabase user.
 * @returns Slug-safe profile identifier.
 */
function resolveDashboardProfileSlug(githubUsername: string, user: User) {
  const fallbackValue = user.email?.split('@')[0] ?? user.id;

  return (githubUsername || fallbackValue)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

/**
 * Finds or creates the shared `vault` app module row.
 *
 * @returns Shared app module used by Vault entries.
 */
async function ensureVaultAppModule() {
  const [existingModule] = await db
    .select()
    .from(appModules)
    .where(eq(appModules.slug, VAULT_APP_MODULE_SLUG))
    .limit(1);

  if (existingModule) {
    return existingModule;
  }

  const [createdModule] = await db
    .insert(appModules)
    .values({
      slug: VAULT_APP_MODULE_SLUG,
      name: 'Coding Vault',
      description: 'Shared content module for Coding Vault entries.',
    })
    .returning();

  if (!createdModule) {
    throw new Error('Das Vault-App-Modul konnte nicht angelegt werden.');
  }

  return createdModule;
}

/**
 * Finds or creates the shared profile row for the authenticated dashboard user.
 *
 * @param user Current Supabase user.
 * @param accessEntry Dashboard access row for the same user.
 * @returns Shared profile row referenced by new content items.
 */
async function ensureDashboardProfile(input: {
  user: User;
  accessEntry: DashboardAccessEntry;
}) {
  const [existingProfile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.authUserId, input.user.id))
    .limit(1);

  if (existingProfile) {
    return existingProfile;
  }

  const githubUsername =
    getGithubIdentityUsername({
      identities: input.user.identities,
      userMetadata:
        input.user.user_metadata && typeof input.user.user_metadata === 'object'
          ? input.user.user_metadata
          : null,
    }) ?? input.accessEntry.githubUsername;
  const [createdProfile] = await db
    .insert(profiles)
    .values({
      authUserId: input.user.id,
      displayName: resolveDashboardProfileDisplayName(
        input.user,
        githubUsername
      ),
      slug: resolveDashboardProfileSlug(githubUsername, input.user),
      email: input.user.email ?? input.accessEntry.email,
      role: toProfileRole(input.accessEntry.userRole),
    })
    .returning();

  if (!createdProfile) {
    throw new Error('Das Autorenprofil konnte nicht angelegt werden.');
  }

  return createdProfile;
}

/**
 * Persists a brand-new Vault entry and its shared content rows.
 *
 * Missing bootstrap data such as the shared `vault` app module or the current
 * author's profile is created on demand during the first successful save.
 *
 * @param input Validated create-entry payload plus current dashboard user.
 * @returns The newly created content item ID and slug.
 */
export async function createVaultEntry(input: {
  payload: CreateVaultEntryInput;
  user: User;
  accessEntry: DashboardAccessEntry;
}) {
  const [category] = await db
    .select({
      id: vaultCategories.id,
    })
    .from(vaultCategories)
    .where(eq(vaultCategories.id, input.payload.primaryCategoryId))
    .limit(1);

  if (!category) {
    throw new Error('Bitte wähle eine gültige Vault-Kategorie.');
  }

  const appModule = await ensureVaultAppModule();
  const profile = await ensureDashboardProfile({
    user: input.user,
    accessEntry: input.accessEntry,
  });
  const normalizedTags = normalizeVaultEntryTags(input.payload.tags);

  return db.transaction(async (tx) => {
    const [createdContentItem] = await tx
      .insert(contentItems)
      .values({
        appModuleId: appModule.id,
        contentType: VAULT_CONTENT_TYPE,
        title: input.payload.title,
        slug: input.payload.slug,
        description: input.payload.description,
        status: toContentStatus(input.payload.status),
        editorContent: toJsonValue(input.payload.editorContent),
        serializedContent: input.payload.serializedContent,
        authorProfileId: profile.id,
        createdByProfileId: profile.id,
        updatedByProfileId: profile.id,
        publishedAt:
          input.payload.status === 'published'
            ? new Date().toISOString()
            : null,
      })
      .returning({
        id: contentItems.id,
        slug: contentItems.slug,
      });

    if (!createdContentItem) {
      throw new Error('Der Content-Eintrag konnte nicht angelegt werden.');
    }

    await tx.insert(vaultEntries).values({
      contentItemId: createdContentItem.id,
      primaryCategoryId: input.payload.primaryCategoryId,
    });

    if (normalizedTags.length > 0) {
      await tx.insert(contentItemTags).values(
        normalizedTags.map((tag) => ({
          contentItemId: createdContentItem.id,
          tag,
        }))
      );
    }

    return createdContentItem;
  });
}
