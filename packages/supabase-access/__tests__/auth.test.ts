import { NextRequest } from 'next/server';

import { describe, expect, it } from 'vitest';

import {
  getOptimisticSupabaseSession,
  getSharedAuthCookieDomain,
  getSupabaseAuthCookieOptions,
  hasSupabaseAuthSessionCookie,
} from '../src';

describe('supabase access auth helpers', () => {
  it('derives shared cookie domains for local app subdomains', () => {
    expect(getSharedAuthCookieDomain('bubblophy.mrbubbles.test')).toBe(
      '.mrbubbles.test'
    );
  });

  it('keeps localhost cookies host-scoped', () => {
    expect(getSharedAuthCookieDomain('localhost')).toBeUndefined();
  });

  it('builds Supabase SSR auth cookie options', () => {
    expect(
      getSupabaseAuthCookieOptions({
        appUrl: 'https://dashboard.mrbubbles-src.dev',
      })
    ).toEqual({
      domain: '.mrbubbles-src.dev',
      path: '/',
      sameSite: 'lax',
      secure: true,
    });
  });

  it('detects Supabase auth-token cookies without validating authorization', () => {
    expect(
      hasSupabaseAuthSessionCookie([{ name: 'sb-local-auth-token' }])
    ).toBe(true);
    expect(
      hasSupabaseAuthSessionCookie([{ name: 'sb-local-code-verifier' }])
    ).toBe(false);
  });

  it('returns an optimistic Next proxy response with the session-cookie flag', () => {
    const request = new NextRequest('http://bubblophy.mrbubbles.test:3005/', {
      headers: {
        cookie: 'sb-test-auth-token=value',
      },
    });

    const result = getOptimisticSupabaseSession(request);

    expect(result.hasSession).toBe(true);
    expect(result.response.status).toBe(200);
  });
});
