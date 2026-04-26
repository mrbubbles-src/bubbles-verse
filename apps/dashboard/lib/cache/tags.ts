export const DASHBOARD_CACHE_PROFILE = 'dashboard';

export const DASHBOARD_CACHE_TAGS = {
  access: 'dashboard:access',
  home: 'dashboard:home',
  profile: (userId: string) => `dashboard:profile:${userId}`,
  vaultCategories: 'dashboard:vault:categories',
  vaultEntries: 'dashboard:vault:entries',
  vaultEntry: (entryId: string) => `dashboard:vault:entry:${entryId}`,
  vaultOverview: 'dashboard:vault:overview',
} as const;
