import { NextRequest } from 'next/server';

import { describe, expect, it } from 'vitest';

import { config, proxy } from '@/proxy';

function createRequest(pathname: string, authCookie?: string) {
  return new NextRequest(`http://dashboard.mrbubbles.test:3004${pathname}`, {
    headers: authCookie
      ? {
          cookie: `sb-test-auth-token=${authCookie}`,
        }
      : {},
  });
}

describe('proxy', () => {
  it('redirects anonymous protected requests to login', () => {
    const response = proxy(createRequest('/'));

    expect(response.headers.get('location')).toBe(
      'http://dashboard.mrbubbles.test:3004/login'
    );
  });

  it('redirects authenticated login requests to the dashboard home', () => {
    const response = proxy(createRequest('/login', 'token'));

    expect(response.headers.get('location')).toBe(
      'http://dashboard.mrbubbles.test:3004/'
    );
  });

  it('allows public login requests without a session cookie', () => {
    const response = proxy(createRequest('/login'));

    expect(response.status).toBe(200);
  });

  it('matches only dashboard page routes', () => {
    expect(config.matcher).toEqual([
      '/',
      '/login',
      '/account',
      '/profile',
      '/vault',
      '/vault/categories',
      '/vault/entries',
      '/vault/entries/new',
      '/vault/entries/:id',
      '/vault/preview/new',
      '/vault/preview/:id',
    ]);
  });
});
