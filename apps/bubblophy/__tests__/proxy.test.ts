import { NextRequest } from 'next/server';

import { describe, expect, it } from 'vitest';

import { config, proxy } from '@/proxy';

function createRequest(pathname: string, authCookie?: string) {
  return new NextRequest(`http://bubblophy.mrbubbles.test:3005${pathname}`, {
    headers: authCookie
      ? {
          cookie: `sb-test-auth-token=${authCookie}`,
        }
      : {},
  });
}

describe('proxy', () => {
  it('redirects anonymous home requests to login with next', () => {
    const response = proxy(createRequest('/'));

    expect(response.headers.get('location')).toBe(
      'http://bubblophy.mrbubbles.test:3005/login?next=%2F'
    );
  });

  it('redirects optimistic session login requests to home by default', () => {
    const response = proxy(createRequest('/login', 'token'));

    expect(response.headers.get('location')).toBe(
      'http://bubblophy.mrbubbles.test:3005/'
    );
  });

  it('redirects optimistic session login requests to a safe next path', () => {
    const response = proxy(
      createRequest('/login?next=%2Fissues%3Fstatus%3Dready', 'token')
    );

    expect(response.headers.get('location')).toBe(
      'http://bubblophy.mrbubbles.test:3005/issues?status=ready'
    );
  });

  it('falls back to home for unsafe login next paths', () => {
    const response = proxy(
      createRequest('/login?next=https%3A%2F%2Fevil.test%2Fdashboard', 'token')
    );

    expect(response.headers.get('location')).toBe(
      'http://bubblophy.mrbubbles.test:3005/'
    );
  });

  it('falls back to home when optimistic login next points back to login', () => {
    const response = proxy(createRequest('/login?next=%2Flogin', 'token'));

    expect(response.headers.get('location')).toBe(
      'http://bubblophy.mrbubbles.test:3005/'
    );
  });

  it('falls back to home when optimistic login next points to login with query', () => {
    const response = proxy(
      createRequest('/login?next=%2Flogin%3Ferror%3Daccess_denied', 'token')
    );

    expect(response.headers.get('location')).toBe(
      'http://bubblophy.mrbubbles.test:3005/'
    );
  });

  it('falls back to home when optimistic login next points to login with arbitrary query', () => {
    const response = proxy(
      createRequest('/login?next=%2Flogin%3Ffoo%3Dbar', 'token')
    );

    expect(response.headers.get('location')).toBe(
      'http://bubblophy.mrbubbles.test:3005/'
    );
  });

  it('allows anonymous login requests', () => {
    const response = proxy(createRequest('/login'));

    expect(response.status).toBe(200);
  });

  it('matches only current Bubblophy page routes', () => {
    expect(config.matcher).toEqual(['/', '/login']);
  });
});
