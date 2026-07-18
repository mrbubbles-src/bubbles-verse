import { BUBBLOPHY_PROJECT_INVITATION_COOKIE } from '@/lib/projects/invitation-links';

import { NextRequest } from 'next/server';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from '@/app/invite/[token]/route';

const getPublicBubblophyEnvMock = vi.fn();
const token = `bubblophy_invite_${'a'.repeat(43)}`;

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

beforeEach(() => {
  getPublicBubblophyEnvMock.mockReset();
  getPublicBubblophyEnvMock.mockReturnValue({
    NEXT_PUBLIC_APP_URL: 'https://bubblophy.example.test',
  });
});

describe('GET /invite/[token]', () => {
  it('stages a valid token in HttpOnly storage before a token-free redirect', async () => {
    const response = await GET(
      new NextRequest(`https://bubblophy.example.test/invite/${token}`),
      { params: Promise.resolve({ token }) }
    );

    expect(response.headers.get('location')).toBe(
      'https://bubblophy.example.test/invitations/accept'
    );
    const cookie = response.cookies.get(BUBBLOPHY_PROJECT_INVITATION_COOKIE);
    expect(cookie?.value).toBe(token);
    expect(response.headers.get('set-cookie')).toContain('HttpOnly');
    expect(response.headers.get('set-cookie')).toContain('SameSite=lax');
    expect(response.headers.get('set-cookie')).toContain('Secure');
    expect(response.headers.get('set-cookie')).toContain('Max-Age=1800');
    expect(response.headers.get('set-cookie')).toContain(
      'Path=/invitations/accept'
    );
    expect(response.headers.get('location')).not.toContain(token);
  });

  it('clears staged secrets and reports malformed links without echoing them', async () => {
    const response = await GET(
      new NextRequest('https://bubblophy.example.test/invite/not-a-token'),
      { params: Promise.resolve({ token: 'not-a-token' }) }
    );

    expect(response.headers.get('location')).toBe(
      'https://bubblophy.example.test/invitations/accept?error=invalid_link'
    );
    expect(response.headers.get('set-cookie')).toContain(
      `${BUBBLOPHY_PROJECT_INVITATION_COOKIE}=;`
    );
    expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
    expect(response.headers.get('set-cookie')).toContain(
      'Path=/invitations/accept'
    );
    expect(response.headers.get('location')).not.toContain('not-a-token');
  });

  it('keeps known local requests on the local Bubblophy origin', async () => {
    const response = await GET(
      new NextRequest(`http://bubblophy.mrbubbles.test:3005/invite/${token}`),
      { params: Promise.resolve({ token }) }
    );

    expect(response.headers.get('location')).toBe(
      'http://bubblophy.mrbubbles.test:3005/invitations/accept'
    );
    expect(response.headers.get('set-cookie')).not.toContain('Secure');
  });
});
