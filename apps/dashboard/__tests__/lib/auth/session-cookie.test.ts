import {
  getDashboardAuthCookieName,
  hasDashboardAuthSessionCookie,
} from '@/lib/auth/session-cookie';

import { describe, expect, it } from 'vitest';

describe('getDashboardAuthCookieName', () => {
  it('derives the Supabase auth cookie name from the project ref', () => {
    expect(
      getDashboardAuthCookieName('https://example-project.supabase.co')
    ).toBe('sb-example-project-auth-token');
  });
});

describe('hasDashboardAuthSessionCookie', () => {
  const supabaseUrl = 'https://example-project.supabase.co';

  it('matches the base auth cookie name', () => {
    expect(
      hasDashboardAuthSessionCookie(
        ['sb-example-project-auth-token'],
        supabaseUrl
      )
    ).toBe(true);
  });

  it('matches chunked auth cookie names', () => {
    expect(
      hasDashboardAuthSessionCookie(
        ['sb-example-project-auth-token.0'],
        supabaseUrl
      )
    ).toBe(true);
  });

  it('ignores non-session Supabase cookies', () => {
    expect(
      hasDashboardAuthSessionCookie(
        ['sb-example-project-auth-token-code-verifier'],
        supabaseUrl
      )
    ).toBe(false);
  });
});
