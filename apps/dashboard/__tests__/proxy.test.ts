import { NextRequest } from 'next/server';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { proxy } from '@/proxy';

const refreshDashboardSessionMock = vi.fn();

vi.mock('@/lib/supabase/proxy', () => ({
  refreshDashboardSession: (request: NextRequest) =>
    refreshDashboardSessionMock(request),
}));

describe('proxy', () => {
  beforeEach(() => {
    refreshDashboardSessionMock.mockReset();
    refreshDashboardSessionMock.mockResolvedValue({
      hasSession: false,
      response: new Response(null, {
        status: 200,
      }),
    });
  });

  it('redirects anonymous protected requests to login', async () => {
    const request = new NextRequest('http://dashboard.mrbubbles.test:3004/');
    const response = await proxy(request);

    expect(response.headers.get('location')).toBe(
      'http://dashboard.mrbubbles.test:3004/login'
    );
  });

  it('redirects authenticated login requests to the dashboard home', async () => {
    refreshDashboardSessionMock.mockResolvedValue({
      hasSession: true,
      response: new Response(null, {
        status: 200,
      }),
    });

    const request = new NextRequest(
      'http://dashboard.mrbubbles.test:3004/login',
      {
        headers: {},
      }
    );
    const response = await proxy(request);

    expect(response.headers.get('location')).toBe(
      'http://dashboard.mrbubbles.test:3004/'
    );
  });

  it('allows public login requests without a session cookie', async () => {
    const request = new NextRequest(
      'http://dashboard.mrbubbles.test:3004/login'
    );
    const response = await proxy(request);

    expect(response.status).toBe(200);
  });

  it('allows the OAuth callback route without a session cookie', async () => {
    const request = new NextRequest(
      'http://dashboard.mrbubbles.test:3004/auth/callback?code=test-code'
    );
    const response = await proxy(request);

    expect(response.status).toBe(200);
  });

  it('allows manifest requests without a session cookie', async () => {
    const request = new NextRequest(
      'http://dashboard.mrbubbles.test:3004/manifest.json'
    );
    const response = await proxy(request);

    expect(response.status).toBe(200);
  });
});
