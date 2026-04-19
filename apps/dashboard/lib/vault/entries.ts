import type { JsonValue } from '@/drizzle/db/schema';
import type { DashboardAccessEntry } from '@/lib/account/dashboard-access';
import type {
  MarkdownEditorContentData,
  MarkdownEditorStatus,
} from '@bubbles/markdown-editor';
import type { User } from '@supabase/supabase-js';

import { ensureDashboardProfile } from '@/lib/profile/profile';
import { listVaultCategories } from '@/lib/vault/categories';
import { buildVaultCategoryTree } from '@/lib/vault/category-tree';

import { and, count, desc, eq, ilike } from 'drizzle-orm';
import * as z from 'zod';

import { db } from '@/drizzle/db';
import {
  appModules,
  contentItems,
  contentItemTags,
  vaultCategories,
  vaultEntries,
} from '@/drizzle/db/schema';

const VAULT_APP_MODULE_SLUG = 'vault';
const VAULT_CONTENT_TYPE = 'vault_entry';
const VAULT_ENTRY_PAGE_SIZE_OPTIONS = [20, 50, 100] as const;

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

const updateVaultEntryRequestSchema = createVaultEntryRequestSchema;

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
  description: string;
  status: 'draft' | 'published';
  categoryId: string;
  categoryLabel: string;
  updatedAt: string;
  updatedAtLabel: string;
  previewHref: string | null;
};

export type VaultEntryListFilterStatus = 'all' | 'draft' | 'published';
export type VaultEntryListPageSize =
  (typeof VAULT_ENTRY_PAGE_SIZE_OPTIONS)[number];

export type VaultEntryListFilters = {
  query: string;
  status: VaultEntryListFilterStatus;
  categoryId: string | null;
  page: number;
  pageSize: VaultEntryListPageSize;
};

export type VaultEntryListSummary = {
  totalEntries: number;
  draftEntries: number;
  publishedEntries: number;
};

export type VaultEntryListPagination = {
  page: number;
  pageSize: VaultEntryListPageSize;
  totalItems: number;
  totalPages: number;
  showPagination: boolean;
  pageSizeOptions: readonly VaultEntryListPageSize[];
};

export type VaultEntryInitialData = {
  id: string;
  title: string;
  slug: string;
  description: string;
  tags: string[];
  status: MarkdownEditorStatus;
  primaryCategoryId: string;
  editorContent: MarkdownEditorContentData;
};

export type VaultEntryPreviewData = {
  id: string;
  title: string;
  description: string;
  serializedContent: string;
};

export type CreateVaultEntryInput = z.infer<
  typeof createVaultEntryRequestSchema
>;

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
 * Checks whether a JSON value still matches the markdown-editor content shape.
 *
 * The dashboard stores EditorJS output inside a generic JSON column, so edit
 * mode narrows the loaded value back to the editor package contract.
 *
 * @param value JSON payload loaded from `content_items.editorContent`.
 * @returns `true` when the value looks like valid editor content.
 */
function isMarkdownEditorContentData(
  value: unknown
): value is MarkdownEditorContentData {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    'blocks' in value &&
    Array.isArray(value.blocks)
  );
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
 * Normalizes the page-size query parameter to one supported table size.
 *
 * @param value Raw page size query value from the current request.
 * @returns One of the supported dashboard table sizes.
 */
export function normalizeVaultEntryListPageSize(
  value: string | null | undefined
): VaultEntryListPageSize {
  const normalizedValue = Number(value);

  return VAULT_ENTRY_PAGE_SIZE_OPTIONS.includes(
    normalizedValue as VaultEntryListPageSize
  )
    ? (normalizedValue as VaultEntryListPageSize)
    : 20;
}

/**
 * Builds the public preview target for one Vault entry when the public app URL
 * is available in the dashboard environment.
 *
 * @param slug Published entry slug from the shared content row.
 * @returns Public entry URL or `null` when preview wiring is not configured.
 */
export function getVaultEntryPreviewHref(slug: string) {
  const baseUrl =
    process.env.NEXT_PUBLIC_CODING_VAULT_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_VAULT_APP_URL?.trim() ||
    '';

  if (!baseUrl) {
    return null;
  }

  return `${baseUrl.replace(/\/$/, '')}/vault/${slug}`;
}

/**
 * Collects the stable where clauses shared by Vault entry list queries.
 *
 * @param filters Normalized list filters without pagination data.
 * @returns Drizzle predicates for search, status, and category filters.
 */
function buildVaultEntryListWhereClauses(filters: {
  query: string;
  status: VaultEntryListFilterStatus;
  categoryId: string | null;
}) {
  return [
    filters.status === 'all' ? null : eq(contentItems.status, filters.status),
    filters.categoryId === null
      ? null
      : eq(vaultEntries.primaryCategoryId, filters.categoryId),
    filters.query ? ilike(contentItems.title, `%${filters.query}%`) : null,
  ].filter((clause) => clause !== null);
}

/**
 * Loads the grouped entry totals for the current list filters.
 *
 * @param filters Normalized list filters without pagination data.
 * @returns Totals for all matches plus their draft/published split.
 */
async function getVaultEntryListSummary(filters: {
  query: string;
  status: VaultEntryListFilterStatus;
  categoryId: string | null;
}): Promise<VaultEntryListSummary> {
  const whereClauses = buildVaultEntryListWhereClauses(filters);
  const summaryQuery = db
    .select({
      status: contentItems.status,
      total: count(),
    })
    .from(vaultEntries)
    .innerJoin(contentItems, eq(vaultEntries.contentItemId, contentItems.id))
    .groupBy(contentItems.status);
  const rows =
    whereClauses.length > 0
      ? await summaryQuery.where(and(...whereClauses))
      : await summaryQuery;
  const summary = rows.reduce<VaultEntryListSummary>(
    (currentSummary, row) => ({
      totalEntries: currentSummary.totalEntries + row.total,
      draftEntries:
        row.status === 'draft'
          ? currentSummary.draftEntries + row.total
          : currentSummary.draftEntries,
      publishedEntries:
        row.status === 'published'
          ? currentSummary.publishedEntries + row.total
          : currentSummary.publishedEntries,
    }),
    {
      totalEntries: 0,
      draftEntries: 0,
      publishedEntries: 0,
    }
  );

  return summary;
}

/**
 * Loads the current entry rows with an optional offset/limit window.
 *
 * @param filters Normalized list filters without pagination data.
 * @param options Optional pagination window for the list table.
 * @returns Sorted Vault rows for the requested window.
 */
async function queryVaultEntryRows(
  filters: {
    query: string;
    status: VaultEntryListFilterStatus;
    categoryId: string | null;
  },
  options?: {
    limit?: number;
    offset?: number;
  }
) {
  const whereClauses = buildVaultEntryListWhereClauses(filters);
  const baseQuery = db
    .select({
      id: contentItems.id,
      title: contentItems.title,
      slug: contentItems.slug,
      description: contentItems.description,
      status: contentItems.status,
      updatedAt: contentItems.updatedAt,
      categoryId: vaultCategories.id,
      categoryName: vaultCategories.name,
    })
    .from(vaultEntries)
    .innerJoin(contentItems, eq(vaultEntries.contentItemId, contentItems.id))
    .innerJoin(
      vaultCategories,
      eq(vaultEntries.primaryCategoryId, vaultCategories.id)
    );
  const orderedQuery =
    whereClauses.length > 0
      ? baseQuery
          .where(and(...whereClauses))
          .orderBy(desc(contentItems.updatedAt))
      : baseQuery.orderBy(desc(contentItems.updatedAt));
  const rows =
    typeof options?.limit === 'number'
      ? options.offset && options.offset > 0
        ? await orderedQuery.limit(options.limit).offset(options.offset)
        : await orderedQuery.limit(options.limit)
      : await orderedQuery;

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    status: row.status,
    categoryId: row.categoryId,
    categoryLabel: row.categoryName,
    updatedAt: row.updatedAt,
    updatedAtLabel: new Intl.DateTimeFormat('de-DE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(row.updatedAt)),
    previewHref: getVaultEntryPreviewHref(row.slug),
  }));
}

/**
 * Normalizes URL-driven list filters for the Vault entry overview.
 *
 * The page keeps filters in the query string so editorial states are shareable
 * and survive reloads without introducing client-side state.
 *
 * @param searchParams Page-level search params from the Next.js route.
 * @returns A stable filter object with defaults applied.
 */
export function parseVaultEntryListFilters(searchParams: {
  [key: string]: string | string[] | undefined;
}): VaultEntryListFilters {
  const rawQuery = searchParams.query;
  const rawStatus = searchParams.status;
  const rawCategoryId = searchParams.categoryId;
  const rawPage = searchParams.page;
  const rawPageSize = searchParams.pageSize;
  const queryValue = Array.isArray(rawQuery) ? rawQuery[0] : rawQuery;
  const statusValue = Array.isArray(rawStatus) ? rawStatus[0] : rawStatus;
  const categoryIdValue = Array.isArray(rawCategoryId)
    ? rawCategoryId[0]
    : rawCategoryId;
  const pageValue = Array.isArray(rawPage) ? rawPage[0] : rawPage;
  const pageSizeValue = Array.isArray(rawPageSize)
    ? rawPageSize[0]
    : rawPageSize;
  const normalizedStatus: VaultEntryListFilterStatus =
    statusValue === 'draft' || statusValue === 'published'
      ? statusValue
      : 'all';
  const normalizedCategoryId = categoryIdValue?.trim();
  const normalizedPage = Number(pageValue);

  return {
    query: queryValue?.trim().slice(0, 120) ?? '',
    status: normalizedStatus,
    categoryId:
      normalizedCategoryId && normalizedCategoryId !== 'all'
        ? normalizedCategoryId
        : null,
    page:
      Number.isFinite(normalizedPage) && normalizedPage >= 1
        ? Math.floor(normalizedPage)
        : 1,
    pageSize: normalizeVaultEntryListPageSize(pageSizeValue),
  };
}

/**
 * Loads the editorial list model for the Vault entry overview.
 *
 * @returns Recently updated Vault entries with category labels.
 */
export async function getVaultEntries(
  filters: VaultEntryListFilters = {
    query: '',
    status: 'all',
    categoryId: null,
    page: 1,
    pageSize: 20,
  }
): Promise<VaultEntryListItem[]> {
  return queryVaultEntryRows({
    query: filters.query,
    status: filters.status,
    categoryId: filters.categoryId,
  });
}

/**
 * Loads the full list-page model for `/vault/entries`.
 *
 * @param filters Normalized list filters from the current request.
 * @returns Entries plus available category options for the filter UI.
 */
export async function getVaultEntryListPageModel(
  filters: VaultEntryListFilters
) {
  const queryFilters = {
    query: filters.query,
    status: filters.status,
    categoryId: filters.categoryId,
  };
  const [summary, categories] = await Promise.all([
    getVaultEntryListSummary(queryFilters),
    listVaultEntryCategoryOptions(),
  ]);
  const totalPages =
    summary.totalEntries === 0
      ? 1
      : Math.ceil(summary.totalEntries / filters.pageSize);
  const currentPage = Math.min(filters.page, totalPages);
  const offset = (currentPage - 1) * filters.pageSize;
  const entries = await queryVaultEntryRows(queryFilters, {
    limit: filters.pageSize,
    offset,
  });

  return {
    entries,
    categories,
    filters: {
      ...filters,
      page: currentPage,
    },
    summary,
    pagination: {
      page: currentPage,
      pageSize: filters.pageSize,
      totalItems: summary.totalEntries,
      totalPages,
      showPagination: summary.totalEntries > filters.pageSize,
      pageSizeOptions: VAULT_ENTRY_PAGE_SIZE_OPTIONS,
    },
  };
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
 * Validates the JSON body sent by the update-entry API route.
 *
 * @param value Parsed request JSON body.
 * @returns Safe parse result for the update-entry payload.
 */
export function parseUpdateVaultEntryRequest(value: Record<string, unknown>) {
  return updateVaultEntryRequestSchema.safeParse({
    ...value,
    tags: Array.isArray(value.tags) ? normalizeVaultEntryTags(value.tags) : [],
  });
}

/**
 * Loads one Vault entry with all editor metadata needed for edit mode.
 *
 * @param id Content item identifier of the Vault entry.
 * @returns Edit model or `null` when the entry does not exist.
 */
export async function getVaultEntryInitialData(
  id: string
): Promise<VaultEntryInitialData | null> {
  const [entry] = await db
    .select({
      id: contentItems.id,
      title: contentItems.title,
      slug: contentItems.slug,
      description: contentItems.description,
      status: contentItems.status,
      editorContent: contentItems.editorContent,
      primaryCategoryId: vaultEntries.primaryCategoryId,
    })
    .from(vaultEntries)
    .innerJoin(contentItems, eq(vaultEntries.contentItemId, contentItems.id))
    .where(eq(contentItems.id, id))
    .limit(1);

  if (!entry) {
    return null;
  }

  if (!isMarkdownEditorContentData(entry.editorContent)) {
    throw new Error('Der gespeicherte Editor-Inhalt ist ungültig.');
  }

  const tagRows = await db
    .select({
      tag: contentItemTags.tag,
    })
    .from(contentItemTags)
    .where(eq(contentItemTags.contentItemId, id))
    .orderBy(contentItemTags.tag);

  return {
    id: entry.id,
    title: entry.title,
    slug: entry.slug,
    description: entry.description,
    tags: tagRows.map((tagRow) => tagRow.tag),
    status: entry.status === 'published' ? 'published' : 'unpublished',
    primaryCategoryId: entry.primaryCategoryId,
    editorContent: entry.editorContent,
  };
}

/**
 * Loads the data needed for the edit-entry page.
 *
 * @param id Content item identifier of the Vault entry.
 * @returns Category options plus the current entry state, or `null`.
 */
export async function getVaultEntryEditModel(id: string) {
  const [categories, initialData] = await Promise.all([
    listVaultEntryCategoryOptions(),
    getVaultEntryInitialData(id),
  ]);

  if (!initialData) {
    return null;
  }

  return {
    categories,
    initialData,
  };
}

/**
 * Loads the persisted fallback state for the full-page Vault preview route.
 *
 * The preview page prefers unsaved browser drafts when they exist, but still
 * needs a server-fetched baseline so opening the route directly remains useful.
 *
 * @param id Content item identifier of the Vault entry.
 * @returns Stored preview data or `null` when the entry does not exist.
 */
export async function getVaultEntryPreviewData(
  id: string
): Promise<VaultEntryPreviewData | null> {
  const [entry] = await db
    .select({
      id: contentItems.id,
      title: contentItems.title,
      description: contentItems.description,
      serializedContent: contentItems.serializedContent,
    })
    .from(vaultEntries)
    .innerJoin(contentItems, eq(vaultEntries.contentItemId, contentItems.id))
    .where(eq(contentItems.id, id))
    .limit(1);

  if (!entry) {
    return null;
  }

  return entry;
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
    githubUsername: input.accessEntry.githubUsername,
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

/**
 * Updates an existing Vault entry and its category/tag relations.
 *
 * The original author stays intact, while `updatedByProfileId`, category, tags,
 * and serialized content all follow the latest editor submission.
 *
 * @param input Entry ID plus validated update payload and current dashboard user.
 * @returns The updated content item ID and slug.
 */
export async function updateVaultEntry(input: {
  id: string;
  payload: CreateVaultEntryInput;
  user: User;
  accessEntry: DashboardAccessEntry;
}) {
  const [existingEntry] = await db
    .select({
      id: contentItems.id,
      authorProfileId: contentItems.authorProfileId,
      createdByProfileId: contentItems.createdByProfileId,
      publishedAt: contentItems.publishedAt,
    })
    .from(vaultEntries)
    .innerJoin(contentItems, eq(vaultEntries.contentItemId, contentItems.id))
    .where(eq(contentItems.id, input.id))
    .limit(1);

  if (!existingEntry) {
    throw new Error('Der Vault-Eintrag wurde nicht gefunden.');
  }

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

  const profile = await ensureDashboardProfile({
    user: input.user,
    accessEntry: input.accessEntry,
    githubUsername: input.accessEntry.githubUsername,
  });
  const normalizedTags = normalizeVaultEntryTags(input.payload.tags);

  return db.transaction(async (tx) => {
    const [updatedContentItem] = await tx
      .update(contentItems)
      .set({
        title: input.payload.title,
        slug: input.payload.slug,
        description: input.payload.description,
        status: toContentStatus(input.payload.status),
        editorContent: toJsonValue(input.payload.editorContent),
        serializedContent: input.payload.serializedContent,
        authorProfileId: existingEntry.authorProfileId,
        createdByProfileId: existingEntry.createdByProfileId,
        updatedByProfileId: profile.id,
        publishedAt:
          input.payload.status === 'published'
            ? (existingEntry.publishedAt ?? new Date().toISOString())
            : null,
      })
      .where(eq(contentItems.id, input.id))
      .returning({
        id: contentItems.id,
        slug: contentItems.slug,
      });

    if (!updatedContentItem) {
      throw new Error('Der Vault-Eintrag konnte nicht aktualisiert werden.');
    }

    await tx
      .update(vaultEntries)
      .set({
        primaryCategoryId: input.payload.primaryCategoryId,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(vaultEntries.contentItemId, input.id));

    await tx
      .delete(contentItemTags)
      .where(eq(contentItemTags.contentItemId, input.id));

    if (normalizedTags.length > 0) {
      await tx.insert(contentItemTags).values(
        normalizedTags.map((tag) => ({
          contentItemId: input.id,
          tag,
        }))
      );
    }

    return updatedContentItem;
  });
}

/**
 * Resolves the next free duplicate slug for an existing Vault entry.
 *
 * Duplicates stay in the same app-module/type scope, so we probe exact slug
 * candidates until one is free instead of relying on fragile pattern matches.
 *
 * @param sourceSlug Existing Vault slug of the original entry.
 * @returns The first available duplicate slug candidate.
 */
async function resolveDuplicateVaultEntrySlug(sourceSlug: string) {
  for (let copyIndex = 1; copyIndex < 100; copyIndex += 1) {
    const candidateSlug =
      copyIndex === 1
        ? `${sourceSlug}-kopie`
        : `${sourceSlug}-kopie-${copyIndex}`;
    const [existingSlug] = await db
      .select({
        id: contentItems.id,
      })
      .from(contentItems)
      .innerJoin(appModules, eq(contentItems.appModuleId, appModules.id))
      .where(
        and(
          eq(appModules.slug, VAULT_APP_MODULE_SLUG),
          eq(contentItems.contentType, VAULT_CONTENT_TYPE),
          eq(contentItems.slug, candidateSlug)
        )
      )
      .limit(1);

    if (!existingSlug) {
      return {
        slug: candidateSlug,
        copyIndex,
      };
    }
  }

  throw new Error(
    'Für diese Kopie konnte gerade kein freier Slug erzeugt werden.'
  );
}

/**
 * Creates a new draft copy of an existing Vault entry.
 *
 * The duplicate inherits content, tags, and category context from the source
 * entry, but is always persisted as a fresh draft owned by the current editor.
 *
 * @param input Source entry identifier plus current dashboard identity.
 * @returns The new content item row or `null` when the source does not exist.
 */
export async function duplicateVaultEntry(input: {
  id: string;
  user: User;
  accessEntry: DashboardAccessEntry;
}) {
  const [sourceEntry] = await db
    .select({
      id: contentItems.id,
      title: contentItems.title,
      slug: contentItems.slug,
      description: contentItems.description,
      editorContent: contentItems.editorContent,
      serializedContent: contentItems.serializedContent,
      primaryCategoryId: vaultEntries.primaryCategoryId,
    })
    .from(vaultEntries)
    .innerJoin(contentItems, eq(vaultEntries.contentItemId, contentItems.id))
    .where(eq(contentItems.id, input.id))
    .limit(1);

  if (!sourceEntry) {
    return null;
  }

  if (!isMarkdownEditorContentData(sourceEntry.editorContent)) {
    throw new Error('Der gespeicherte Editor-Inhalt ist ungültig.');
  }

  const tagRows = await db
    .select({
      tag: contentItemTags.tag,
    })
    .from(contentItemTags)
    .where(eq(contentItemTags.contentItemId, input.id))
    .orderBy(contentItemTags.tag);
  const duplicateSlug = await resolveDuplicateVaultEntrySlug(sourceEntry.slug);
  const duplicateTitle =
    duplicateSlug.copyIndex === 1
      ? `${sourceEntry.title} (Kopie)`
      : `${sourceEntry.title} (Kopie ${duplicateSlug.copyIndex})`;
  const duplicateEditorContent =
    sourceEntry.editorContent as unknown as CreateVaultEntryInput['editorContent'];

  return createVaultEntry({
    payload: {
      title: duplicateTitle,
      slug: duplicateSlug.slug,
      description: sourceEntry.description,
      tags: tagRows.map((tagRow) => tagRow.tag),
      status: 'unpublished',
      editorContent: duplicateEditorContent,
      serializedContent: sourceEntry.serializedContent,
      primaryCategoryId: sourceEntry.primaryCategoryId,
    },
    user: input.user,
    accessEntry: input.accessEntry,
  });
}

/**
 * Deletes one Vault entry and its linked category/tag rows.
 *
 * The shared schema already cascades from `content_items` into `vault_entries`
 * and `content_item_tags`, so the helper only needs to remove the content row
 * after confirming that the requested ID is actually a Vault entry.
 *
 * @param id Content item identifier of the Vault entry.
 * @returns `true` when a Vault entry was removed, otherwise `false`.
 */
export async function deleteVaultEntry(id: string) {
  const [existingEntry] = await db
    .select({
      id: contentItems.id,
    })
    .from(vaultEntries)
    .innerJoin(contentItems, eq(vaultEntries.contentItemId, contentItems.id))
    .where(eq(contentItems.id, id))
    .limit(1);

  if (!existingEntry) {
    return false;
  }

  const deletedRows = await db
    .delete(contentItems)
    .where(eq(contentItems.id, id))
    .returning({
      id: contentItems.id,
    });

  return deletedRows.length > 0;
}
