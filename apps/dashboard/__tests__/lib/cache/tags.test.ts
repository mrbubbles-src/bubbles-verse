import {
  DASHBOARD_CACHE_PROFILE,
  DASHBOARD_CACHE_TAGS,
} from '@/lib/cache/tags';

import { describe, expect, it } from 'vitest';

describe('dashboard cache tags', () => {
  it('keeps the shared dashboard cache profile stable', () => {
    expect(DASHBOARD_CACHE_PROFILE).toBe('dashboard');
  });

  it('builds scoped profile and vault entry tags', () => {
    expect(DASHBOARD_CACHE_TAGS.profile('user-123')).toBe(
      'dashboard:profile:user-123'
    );
    expect(DASHBOARD_CACHE_TAGS.vaultEntry('entry-456')).toBe(
      'dashboard:vault:entry:entry-456'
    );
  });
});
