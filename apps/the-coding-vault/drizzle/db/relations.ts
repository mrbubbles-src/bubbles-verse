import { relations } from 'drizzle-orm/relations';
import { users, vaultEntries, categories } from './schema';

export const vaultEntryRelations = relations(vaultEntries, ({ one }) => ({
  user: one(users, {
    fields: [vaultEntries.authorId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [vaultEntries.categoryId],
    references: [categories.id],
  }),
}));

export const userRelations = relations(users, ({ many }) => ({
  vaultEntries: many(vaultEntries),
}));

export const categoryRelations = relations(categories, ({ many }) => ({
  vaultEntries: many(vaultEntries),
}));
