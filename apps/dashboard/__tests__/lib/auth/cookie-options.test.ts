import {
  getDashboardAuthCookieOptions,
  getSharedAuthCookieDomain,
} from '@/lib/auth/cookie-options';

import { describe, expect, it } from 'vitest';

describe('getSharedAuthCookieDomain', () => {
  it('derives the parent domain for local dashboard subdomains', () => {
    expect(getSharedAuthCookieDomain('dashboard.mrbubbles.test')).toBe(
      '.mrbubbles.test'
    );
  });

  it('returns undefined for hosts without a shareable subdomain', () => {
    expect(getSharedAuthCookieDomain('localhost')).toBeUndefined();
  });
});

describe('getDashboardAuthCookieOptions', () => {
  it('builds root-domain cookies for the local dashboard host', () => {
    expect(
      getDashboardAuthCookieOptions({
        appUrl: 'http://dashboard.mrbubbles.test:3004',
      })
    ).toEqual({
      domain: '.mrbubbles.test',
      path: '/',
      sameSite: 'lax',
      secure: false,
    });
  });

  it('prefers an explicit production cookie domain override', () => {
    expect(
      getDashboardAuthCookieOptions({
        appUrl: 'https://dashboard.mrbubbles-src.dev',
        cookieDomain: '.mrbubbles-src.dev',
      })
    ).toEqual({
      domain: '.mrbubbles-src.dev',
      path: '/',
      sameSite: 'lax',
      secure: true,
    });
  });
});
