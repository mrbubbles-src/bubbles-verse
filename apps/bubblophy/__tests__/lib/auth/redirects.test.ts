import {
  buildBubblophyLoginPath,
  buildBubblophyLogoutPath,
  getBubblophyAuthRedirectOrigin,
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
    expect(getSafeBubblophyRedirectPath('/\\evil.test')).toBe('/');
    expect(getSafeBubblophyRedirectPath('/%5cevil.test')).toBe('/');
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

  it('uses the Bubblophy request origin when the configured app URL points elsewhere', () => {
    expect(
      getBubblophyAuthRedirectOrigin({
        requestUrl: 'http://bubblophy.mrbubbles.test:3005/auth/callback',
        configuredAppUrl: 'http://dashboard.mrbubbles.test:3004',
      })
    ).toBe('http://bubblophy.mrbubbles.test:3005');
  });

  it('does not trust arbitrary request hosts for auth redirect origins', () => {
    expect(
      getBubblophyAuthRedirectOrigin({
        requestUrl: 'http://evil.test/auth/callback',
        configuredAppUrl: 'http://bubblophy.mrbubbles.test:3005',
      })
    ).toBe('http://bubblophy.mrbubbles.test:3005');
    expect(
      getBubblophyAuthRedirectOrigin({
        requestUrl: 'http://bubblophy.evil.test/auth/callback',
        configuredAppUrl: 'http://bubblophy.mrbubbles.test:3005',
      })
    ).toBe('http://bubblophy.mrbubbles.test:3005');
  });
});
