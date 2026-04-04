import { sql } from 'drizzle-orm';
import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  boolean,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core';

export const iconKey = pgEnum('IconKey', [
  'github',
  'node',
  'html',
  'css',
  'js',
  'react',
  'backend',
  'database',
  'default',
  'git',
]);
export const role = pgEnum('Role', ['SUPERADMIN', 'MODERATOR', 'GUEST']);

export const users = pgTable('users', {
  id: text()
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  numericId: serial().notNull().unique(),
  username: text().notNull().unique(),
  password: text().notNull(),
  email: text().notNull().unique(),
  role: role().default('GUEST').notNull(),
  authorInfo: jsonb()
    .$type<{
      name?: string;
      email?: string;
      avatar?: string;
      authorSocials?: {
        website?: string;
        github?: string;
        linkedin?: string;
        codepen?: string;
        stackoverflow?: string;
        youtube?: string;
        twitter?: string;
        twitch?: string;
        discord?: string;
        instagram?: string;
        tiktok?: string;
        facebook?: string;
      };
    }>()
    .default(sql`'{}'::jsonb`),
  createdAt: timestamp({ precision: 3, mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp({ precision: 3, mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const categories = pgTable('categories', {
  id: text()
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  name: text().notNull().unique(),
  slug: text().notNull().unique(),
  order: integer().notNull(),
  iconKey: iconKey().default('default').notNull(),
  createdAt: timestamp({ precision: 3, mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp({ precision: 3, mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const vaultEntries = pgTable('vaultEntries', {
  id: text()
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  numericId: serial().notNull().unique(),
  title: text().notNull(),
  slug: text().notNull().unique(),
  content: jsonb().notNull(),
  description: text().notNull().default(''),
  authorId: text()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  published: boolean().default(false).notNull(),
  categoryId: text()
    .notNull()
    .references(() => categories.id, { onDelete: 'cascade' }),
  order: integer().default(0).notNull(),
  isFeatured: boolean().default(false).notNull(),
  createdAt: timestamp({ precision: 3, mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp({ precision: 3, mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});
