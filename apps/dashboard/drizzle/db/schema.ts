import type { AnyPgColumn } from 'drizzle-orm/pg-core';

import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgSchema,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonValue[];

export interface JsonObject {
  [key: string]: JsonValue;
}

export const contentStatus = pgEnum('content_status', ['draft', 'published']);

export const profileRole = pgEnum('profile_role', [
  'owner',
  'editor',
  'guest_author',
]);

export const socialPlatform = pgEnum('social_platform', [
  'website',
  'github',
  'linkedin',
  'twitter',
]);

const privateSchema = pgSchema('private');

export const appModules = pgTable(
  'app_modules',
  {
    id: text()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    slug: text().notNull(),
    name: text().notNull(),
    description: text().notNull().default(''),
    isActive: boolean().notNull().default(true),
    createdAt: timestamp({ mode: 'string', precision: 3 })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp({ mode: 'string', precision: 3 })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex('app_modules_slug_idx').on(table.slug),
  })
);

export const profiles = pgTable(
  'profiles',
  {
    id: text()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    authUserId: text().notNull(),
    displayName: text().notNull(),
    slug: text().notNull(),
    email: text().notNull(),
    avatarUrl: text(),
    bio: text().notNull().default(''),
    role: profileRole().notNull().default('owner'),
    createdAt: timestamp({ mode: 'string', precision: 3 })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp({ mode: 'string', precision: 3 })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    authUserIdIdx: uniqueIndex('profiles_auth_user_id_idx').on(
      table.authUserId
    ),
    slugIdx: uniqueIndex('profiles_slug_idx').on(table.slug),
  })
);

export const profileSocialLinks = pgTable(
  'profile_social_links',
  {
    id: text()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    profileId: text()
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    platform: socialPlatform().notNull(),
    url: text().notNull(),
    label: text().notNull().default(''),
    sortOrder: integer().notNull().default(0),
    createdAt: timestamp({ mode: 'string', precision: 3 })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    profilePlatformIdx: uniqueIndex(
      'profile_social_links_profile_platform_idx'
    ).on(table.profileId, table.platform),
  })
);

export const contentItems = pgTable(
  'content_items',
  {
    id: text()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    appModuleId: text()
      .notNull()
      .references(() => appModules.id, { onDelete: 'restrict' }),
    contentType: text().notNull(),
    title: text().notNull(),
    slug: text().notNull(),
    description: text().notNull().default(''),
    status: contentStatus().notNull().default('draft'),
    editorContent: jsonb().$type<JsonValue>().notNull(),
    serializedContent: text().notNull().default(''),
    authorProfileId: text()
      .notNull()
      .references(() => profiles.id, { onDelete: 'restrict' }),
    createdByProfileId: text()
      .notNull()
      .references(() => profiles.id, { onDelete: 'restrict' }),
    updatedByProfileId: text()
      .notNull()
      .references(() => profiles.id, { onDelete: 'restrict' }),
    publishedAt: timestamp({ mode: 'string', precision: 3 }),
    createdAt: timestamp({ mode: 'string', precision: 3 })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp({ mode: 'string', precision: 3 })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    appTypeSlugIdx: uniqueIndex('content_items_app_type_slug_idx').on(
      table.appModuleId,
      table.contentType,
      table.slug
    ),
    updatedAtIdx: index('content_items_updated_at_idx').on(table.updatedAt),
    statusUpdatedAtIdx: index('content_items_status_updated_at_idx').on(
      table.status,
      table.updatedAt
    ),
  })
);

export const contentItemTags = pgTable(
  'content_item_tags',
  {
    id: text()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    contentItemId: text()
      .notNull()
      .references(() => contentItems.id, { onDelete: 'cascade' }),
    tag: text().notNull(),
    createdAt: timestamp({ mode: 'string', precision: 3 })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    contentItemTagIdx: uniqueIndex('content_item_tags_content_item_tag_idx').on(
      table.contentItemId,
      table.tag
    ),
  })
);

export const vaultCategories = pgTable(
  'vault_categories',
  {
    id: text()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: text().notNull(),
    slug: text().notNull(),
    description: text().notNull().default(''),
    parentId: text().references((): AnyPgColumn => vaultCategories.id, {
      onDelete: 'restrict',
    }),
    sortOrder: integer().notNull().default(0),
    createdAt: timestamp({ mode: 'string', precision: 3 })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp({ mode: 'string', precision: 3 })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex('vault_categories_slug_idx').on(table.slug),
  })
);

export const vaultEntries = pgTable('vault_entries', {
  contentItemId: text()
    .primaryKey()
    .references(() => contentItems.id, { onDelete: 'cascade' }),
  primaryCategoryId: text()
    .notNull()
    .references(() => vaultCategories.id, { onDelete: 'restrict' }),
  createdAt: timestamp({ mode: 'string', precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: 'string', precision: 3 }).defaultNow().notNull(),
});

export const dashboardGithubAllowlist = privateSchema.table(
  'dashboard_github_allowlist',
  {
    githubUsername: text('github_username').notNull(),
    email: text().notNull(),
    note: text(),
    userRole: text('user_role').notNull().default('owner'),
    dashboardAccess: boolean('dashboard_access').notNull().default(true),
    createdAt: timestamp('created_at', { mode: 'string', precision: 3 })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    pk: primaryKey({
      name: 'dashboard_github_allowlist_pkey',
      columns: [table.githubUsername, table.email],
    }),
  })
);
