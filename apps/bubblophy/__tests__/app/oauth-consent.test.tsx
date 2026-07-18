import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BubblophyOAuthConsentGate } from '@/app/oauth/consent/page';

const requireBubblophySessionMock = vi.fn();
const getAuthorizationDetailsMock = vi.fn();
const redirectMock = vi.fn((location: string) => {
  throw new Error(`NEXT_REDIRECT:${location}`);
});

vi.mock('next/navigation', () => ({
  redirect: (location: string) => redirectMock(location),
}));

vi.mock('next/server', () => ({
  connection: vi.fn(async () => undefined),
}));

vi.mock('@/lib/auth/session', () => ({
  requireBubblophySession: (options: { nextPath?: string }) =>
    requireBubblophySessionMock(options),
}));

vi.mock('@/lib/supabase/server', () => ({
  createBubblophyServerSupabaseClient: async () => ({
    auth: {
      oauth: {
        getAuthorizationDetails: getAuthorizationDetailsMock,
      },
    },
  }),
}));

const authorizationDetails = {
  authorization_id: 'authorization-request-1',
  redirect_uri: 'https://client.example/callback',
  client: {
    id: 'client-1',
    name: 'Claude Desktop',
    uri: 'https://client.example',
    logo_uri: 'https://client.example/logo.svg',
  },
  user: {
    id: 'user-1',
    email: 'owner@example.test',
  },
  scope: 'openid email profile',
};

describe('/oauth/consent', () => {
  beforeEach(() => {
    requireBubblophySessionMock.mockReset();
    getAuthorizationDetailsMock.mockReset();
    redirectMock.mockClear();
    requireBubblophySessionMock.mockResolvedValue({
      authUserId: 'user-1',
      email: 'owner@example.test',
      user: { id: 'user-1', email: 'owner@example.test' },
    });
    getAuthorizationDetailsMock.mockResolvedValue({
      data: authorizationDetails,
      error: null,
    });
  });

  it('rejects a missing authorization ID without calling Supabase', async () => {
    const page = await BubblophyOAuthConsentGate({
      searchParams: Promise.resolve({}),
    });

    render(page);

    expect(
      screen.getByRole('heading', { name: 'Ungültige OAuth-Anfrage' })
    ).toBeInTheDocument();
    expect(requireBubblophySessionMock).not.toHaveBeenCalled();
    expect(getAuthorizationDetailsMock).not.toHaveBeenCalled();
  });

  it('renders a safe recovery state after a failed native decision', async () => {
    const page = await BubblophyOAuthConsentGate({
      searchParams: Promise.resolve({ error: 'decision_failed' }),
    });

    render(page);

    expect(
      screen.getByRole('heading', {
        name: 'OAuth-Entscheidung nicht möglich',
      })
    ).toBeInTheDocument();
    expect(screen.getByText(/agent-client/i)).toBeInTheDocument();
    expect(requireBubblophySessionMock).not.toHaveBeenCalled();
    expect(getAuthorizationDetailsMock).not.toHaveBeenCalled();
  });

  it('preserves the authorization ID through the human login gate', async () => {
    requireBubblophySessionMock.mockRejectedValue(
      new Error('NEXT_REDIRECT:/login')
    );

    await expect(
      BubblophyOAuthConsentGate({
        searchParams: Promise.resolve({
          authorization_id: 'authorization-request-1',
        }),
      })
    ).rejects.toThrow('NEXT_REDIRECT:/login');
    expect(requireBubblophySessionMock).toHaveBeenCalledWith({
      nextPath: '/oauth/consent?authorization_id=authorization-request-1',
    });
  });

  it('shows the verified client and requested scopes', async () => {
    const page = await BubblophyOAuthConsentGate({
      searchParams: Promise.resolve({
        authorization_id: 'authorization-request-1',
      }),
    });

    render(page);

    expect(
      screen.getByRole('heading', { name: 'Claude Desktop verbinden?' })
    ).toBeInTheDocument();
    expect(screen.getByText('openid')).toBeInTheDocument();
    expect(screen.getByText('email')).toBeInTheDocument();
    expect(screen.getByText('profile')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Zugriff erlauben' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Ablehnen' })
    ).toBeInTheDocument();
    expect(getAuthorizationDetailsMock).toHaveBeenCalledWith(
      'authorization-request-1'
    );
  });

  it('renders Supabase client data only as escaped text', async () => {
    getAuthorizationDetailsMock.mockResolvedValue({
      data: {
        ...authorizationDetails,
        client: {
          ...authorizationDetails.client,
          name: '<img src=x onerror=alert(1)>',
        },
        scope: 'openid <script>alert(1)</script>',
      },
      error: null,
    });

    const page = await BubblophyOAuthConsentGate({
      searchParams: Promise.resolve({
        authorization_id: 'authorization-request-1',
      }),
    });
    const { container } = render(page);

    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('script')).toBeNull();
    expect(
      screen.getByText('<img src=x onerror=alert(1)>', { exact: false })
    ).toBeInTheDocument();
  });

  it('redirects immediately when Supabase reports existing consent', async () => {
    getAuthorizationDetailsMock.mockResolvedValue({
      data: {
        redirect_url:
          'https://client.example/callback?code=server-code&state=client-state',
      },
      error: null,
    });

    await expect(
      BubblophyOAuthConsentGate({
        searchParams: Promise.resolve({
          authorization_id: 'authorization-request-1',
        }),
      })
    ).rejects.toThrow('NEXT_REDIRECT:https://client.example/callback');
    expect(redirectMock).toHaveBeenCalledWith(
      'https://client.example/callback?code=server-code&state=client-state'
    );
  });

  it('fails closed for invalid requests and mismatched users', async () => {
    getAuthorizationDetailsMock.mockResolvedValueOnce({
      data: null,
      error: new Error('private Supabase detail'),
    });

    const invalidPage = await BubblophyOAuthConsentGate({
      searchParams: Promise.resolve({
        authorization_id: 'authorization-request-1',
      }),
    });
    const invalidRender = render(invalidPage);

    expect(
      screen.getByRole('heading', { name: 'OAuth-Anfrage nicht verfügbar' })
    ).toBeInTheDocument();
    expect(invalidRender.container).not.toHaveTextContent(
      'private Supabase detail'
    );

    invalidRender.unmount();
    getAuthorizationDetailsMock.mockResolvedValueOnce({
      data: {
        ...authorizationDetails,
        user: { id: 'other-user', email: 'other@example.test' },
      },
      error: null,
    });

    const mismatchedPage = await BubblophyOAuthConsentGate({
      searchParams: Promise.resolve({
        authorization_id: 'authorization-request-1',
      }),
    });
    render(mismatchedPage);

    expect(
      screen.getByRole('heading', { name: 'OAuth-Anfrage nicht verfügbar' })
    ).toBeInTheDocument();
  });
});
