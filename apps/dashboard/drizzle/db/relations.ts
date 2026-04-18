import { relations } from 'drizzle-orm'

import {
  appModules,
  contentItemTags,
  contentItems,
  profileSocialLinks,
  profiles,
  vaultCategories,
  vaultEntries,
} from './schema'

export const appModuleRelations = relations(appModules, ({ many }) => ({
  contentItems: many(contentItems),
}))

export const profileRelations = relations(profiles, ({ many }) => ({
  socialLinks: many(profileSocialLinks),
  authoredContent: many(contentItems, { relationName: 'author_profile' }),
}))

export const profileSocialLinkRelations = relations(
  profileSocialLinks,
  ({ one }) => ({
    profile: one(profiles, {
      fields: [profileSocialLinks.profileId],
      references: [profiles.id],
    }),
  }),
)

export const contentItemRelations = relations(contentItems, ({ one, many }) => ({
  appModule: one(appModules, {
    fields: [contentItems.appModuleId],
    references: [appModules.id],
  }),
  authorProfile: one(profiles, {
    fields: [contentItems.authorProfileId],
    references: [profiles.id],
    relationName: 'author_profile',
  }),
  tags: many(contentItemTags),
  vaultEntry: one(vaultEntries, {
    fields: [contentItems.id],
    references: [vaultEntries.contentItemId],
  }),
}))

export const contentItemTagRelations = relations(
  contentItemTags,
  ({ one }) => ({
    contentItem: one(contentItems, {
      fields: [contentItemTags.contentItemId],
      references: [contentItems.id],
    }),
  }),
)

export const vaultCategoryRelations = relations(
  vaultCategories,
  ({ one, many }) => ({
    parent: one(vaultCategories, {
      fields: [vaultCategories.parentId],
      references: [vaultCategories.id],
      relationName: 'vault_category_parent',
    }),
    children: many(vaultCategories, {
      relationName: 'vault_category_parent',
    }),
    entries: many(vaultEntries),
  }),
)

export const vaultEntryRelations = relations(vaultEntries, ({ one }) => ({
  contentItem: one(contentItems, {
    fields: [vaultEntries.contentItemId],
    references: [contentItems.id],
  }),
  primaryCategory: one(vaultCategories, {
    fields: [vaultEntries.primaryCategoryId],
    references: [vaultCategories.id],
  }),
}))
