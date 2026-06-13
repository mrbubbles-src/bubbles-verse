import {
  buildBubblophyLoginPath,
  buildBubblophyLogoutPath,
  getSafeBubblophyRedirectPath,
} from '@/lib/auth/redirects';

import { describe, expect, it } from 'vitest';

describe('Bubblophy auth redirects', () => {
  it('keeps safe relative paths', () => {
    expect(getSafeBubblophyRedirectPath('/issues?status=ready')).toBe(
      '/issues?status=ready'
    );
  });

  it('rejects absolute and protocol-relative redirects', () => {
    expect(getSafeBubblophyRedirectPath('https://evil.test')).toBe('/');
    expect(getSafeBubblophyRedirectPath('//evil.test')).toBe('/');
  });

  it('builds login paths with encoded relative next params', () => {
    expect(buildBubblophyLoginPath('/issues?status=ready')).toBe(
      '/login?next=%2Fissues%3Fstatus%3Dready'
    );
  });

  it('builds logout paths with safe login fallbacks', () => {
    expect(buildBubblophyLogoutPath('//evil.test')).toBe(
      '/auth/logout?next=%2Flogin'
    );
  });
});
