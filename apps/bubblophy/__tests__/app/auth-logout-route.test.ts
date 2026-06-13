import { NextRequest } from 'next/server';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from '@/app/auth/logout/route';

const signOutMock = vi.fn();
const getPublicBubblophyEnvMock = vi.fn();

vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>();

  return {
    ...actual,
    connection: vi.fn(async () => undefined),
  };
});

vi.mock('@/lib/env', () => ({
  getPublicBubblophyEnv: () => getPublicBubblophyEnvMock(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createBubblophyServerSupabaseClient: async () => ({
    auth: {
      signOut: signOutMock,
    },
  }),
}));

describe('GET /auth/logout', () => {
  beforeEach(() => {
    signOutMock.mockReset();
    getPublicBubblophyEnvMock.mockReset();
    getPublicBubblophyEnvMock.mockReturnValue({
      NEXT_PUBLIC_APP_URL: 'http://bubblophy.mrbubbles.test:3005',
    });
  });

  it('signs out and redirects to login by default', async () => {
    const response = await GET(
      new NextRequest('http://bubblophy.mrbubbles.test:3005/auth/logout')
    );

    expect(signOutMock).toHaveBeenCalled();
    expect(response.headers.get('location')).toBe(
      'http://bubblophy.mrbubbles.test:3005/login'
    );
  });

  it('allows safe relative next redirects', async () => {
    const response = await GET(
      new NextRequest(
        'http://bubblophy.mrbubbles.test:3005/auth/logout?next=/login?done=1'
      )
    );

    expect(response.headers.get('location')).toBe(
      'http://bubblophy.mrbubbles.test:3005/login?done=1'
    );
  });

  it('rejects protocol-relative next redirects', async () => {
    const response = await GET(
      new NextRequest(
        'http://bubblophy.mrbubbles.test:3005/auth/logout?next=//evil.test'
      )
    );

    expect(response.headers.get('location')).toBe(
      'http://bubblophy.mrbubbles.test:3005/login'
    );
  });
});
