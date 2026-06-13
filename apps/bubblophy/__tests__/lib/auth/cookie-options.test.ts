import {
  getBubblophyAuthCookieOptions,
  getSharedAuthCookieDomain,
} from '@/lib/auth/cookie-options';

import { describe, expect, it } from 'vitest';

describe('bubblophy auth cookie options', () => {
  it('derives a shared cookie domain for the local Bubblophy subdomain', () => {
    expect(getSharedAuthCookieDomain('bubblophy.mrbubbles.test')).toBe(
      '.mrbubbles.test'
    );
  });

  it('keeps localhost cookies host-scoped', () => {
    expect(getSharedAuthCookieDomain('localhost')).toBeUndefined();
  });

  it('uses the explicit cookie domain when provided', () => {
    expect(
      getBubblophyAuthCookieOptions({
        appUrl: 'http://bubblophy.mrbubbles.test:3005',
        cookieDomain: '.mrbubbles.test',
      })
    ).toEqual({
      domain: '.mrbubbles.test',
      path: '/',
      sameSite: 'lax',
      secure: false,
    });
  });

  it('marks cookies secure for HTTPS app URLs', () => {
    expect(
      getBubblophyAuthCookieOptions({
        appUrl: 'https://bubblophy.mrbubbles-src.dev',
      })
    ).toEqual({
      domain: '.mrbubbles-src.dev',
      path: '/',
      sameSite: 'lax',
      secure: true,
    });
  });
});
