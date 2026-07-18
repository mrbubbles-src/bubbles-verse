import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/oauth/decision/route';

const getOptionalBubblophySessionMock = vi.fn();
const getPublicBubblophyEnvMock = vi.fn();
const getAuthorizationDetailsMock = vi.fn();
const approveAuthorizationMock = vi.fn();
const denyAuthorizationMock = vi.fn();

vi.mock('@/lib/auth/session', () => ({
  getOptionalBubblophySession: () => getOptionalBubblophySessionMock(),
}));

vi.mock('@/lib/env', () => ({
  getPublicBubblophyEnv: () => getPublicBubblophyEnvMock(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createBubblophyServerSupabaseClient: async () => ({
    auth: {
      oauth: {
        getAuthorizationDetails: getAuthorizationDetailsMock,
        approveAuthorization: approveAuthorizationMock,
        denyAuthorization: denyAuthorizationMock,
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

function createDecisionRequest(
  entries: [string, string][],
  options: { origin?: string; contentType?: string } = {}
) {
  const body = new URLSearchParams();

  for (const [key, value] of entries) {
    body.append(key, value);
  }

  return new Request('https://bubblophy.example.com/api/oauth/decision', {
    method: 'POST',
    headers: {
      origin: options.origin ?? 'https://bubblophy.example.com',
      'content-type':
        options.contentType ??
        'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body: body.toString(),
  });
}

describe('POST /api/oauth/decision', () => {
  beforeEach(() => {
    getOptionalBubblophySessionMock.mockReset();
    getPublicBubblophyEnvMock.mockReset();
    getAuthorizationDetailsMock.mockReset();
    approveAuthorizationMock.mockReset();
    denyAuthorizationMock.mockReset();

    getPublicBubblophyEnvMock.mockReturnValue({
      NEXT_PUBLIC_APP_URL: 'https://bubblophy.example.com',
    });
    getOptionalBubblophySessionMock.mockResolvedValue({
      status: 'allowed',
      session: {
        authUserId: 'user-1',
        email: 'owner@example.test',
        user: { id: 'user-1', email: 'owner@example.test' },
      },
    });
    getAuthorizationDetailsMock.mockResolvedValue({
      data: authorizationDetails,
      error: null,
    });
    approveAuthorizationMock.mockResolvedValue({
      data: {
        redirect_url:
          'https://client.example/callback?code=server-code&state=client-state',
      },
      error: null,
    });
    denyAuthorizationMock.mockResolvedValue({
      data: {
        redirect_url:
          'https://client.example/callback?error=access_denied&state=client-state',
      },
      error: null,
    });
  });

  it('rejects cross-origin, missing-origin, and non-form requests', async () => {
    const entries: [string, string][] = [
      ['authorization_id', 'authorization-request-1'],
      ['decision', 'approve'],
    ];

    const crossOrigin = await POST(
      createDecisionRequest(entries, { origin: 'https://evil.example' })
    );
    const missingOriginRequest = createDecisionRequest(entries);
    missingOriginRequest.headers.delete('origin');
    const missingOrigin = await POST(missingOriginRequest);
    const jsonRequest = await POST(
      createDecisionRequest(entries, { contentType: 'application/json' })
    );

    expect(crossOrigin.status).toBe(403);
    expect(missingOrigin.status).toBe(403);
    expect(jsonRequest.status).toBe(415);
    expect(getOptionalBubblophySessionMock).not.toHaveBeenCalled();
    expect(getAuthorizationDetailsMock).not.toHaveBeenCalled();
  });

  it('rejects missing, duplicated, oversized, and invalid decision values', async () => {
    const missingId = await POST(
      createDecisionRequest([['decision', 'approve']])
    );
    const duplicateId = await POST(
      createDecisionRequest([
        ['authorization_id', 'authorization-request-1'],
        ['authorization_id', 'authorization-request-2'],
        ['decision', 'approve'],
      ])
    );
    const oversizedId = await POST(
      createDecisionRequest([
        ['authorization_id', 'a'.repeat(300)],
        ['decision', 'approve'],
      ])
    );
    const invalidDecision = await POST(
      createDecisionRequest([
        ['authorization_id', 'authorization-request-1'],
        ['decision', 'redirect'],
      ])
    );

    for (const response of [
      missingId,
      duplicateId,
      oversizedId,
      invalidDecision,
    ]) {
      expect(response.status).toBe(303);
      expect(response.headers.get('location')).toBe(
        'https://bubblophy.example.com/oauth/consent?error=decision_failed'
      );
    }
    expect(getAuthorizationDetailsMock).not.toHaveBeenCalled();
  });

  it('requires a currently allowed human session', async () => {
    getOptionalBubblophySessionMock.mockResolvedValue({
      status: 'anonymous',
    });

    const response = await POST(
      createDecisionRequest([
        ['authorization_id', 'authorization-request-1'],
        ['decision', 'approve'],
      ])
    );

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe(
      'https://bubblophy.example.com/oauth/consent?error=decision_failed'
    );
    expect(getAuthorizationDetailsMock).not.toHaveBeenCalled();
    expect(approveAuthorizationMock).not.toHaveBeenCalled();

    getOptionalBubblophySessionMock.mockResolvedValue({ status: 'denied' });
    const deniedResponse = await POST(
      createDecisionRequest([
        ['authorization_id', 'authorization-request-1'],
        ['decision', 'approve'],
      ])
    );

    expect(deniedResponse.status).toBe(303);
    expect(getAuthorizationDetailsMock).not.toHaveBeenCalled();
  });

  it('approves once and redirects with 303 only to Supabase output', async () => {
    const response = await POST(
      createDecisionRequest([
        ['authorization_id', 'authorization-request-1'],
        ['decision', 'approve'],
        ['redirect_uri', 'https://evil.example/callback'],
      ])
    );

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe(
      'https://client.example/callback?code=server-code&state=client-state'
    );
    expect(getAuthorizationDetailsMock).toHaveBeenCalledWith(
      'authorization-request-1'
    );
    expect(approveAuthorizationMock).toHaveBeenCalledWith(
      'authorization-request-1',
      { skipBrowserRedirect: true }
    );
    expect(denyAuthorizationMock).not.toHaveBeenCalled();
  });

  it('denies once and redirects with 303 to the Supabase denial URL', async () => {
    const response = await POST(
      createDecisionRequest([
        ['authorization_id', 'authorization-request-1'],
        ['decision', 'deny'],
      ])
    );

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe(
      'https://client.example/callback?error=access_denied&state=client-state'
    );
    expect(denyAuthorizationMock).toHaveBeenCalledWith(
      'authorization-request-1',
      { skipBrowserRedirect: true }
    );
    expect(approveAuthorizationMock).not.toHaveBeenCalled();
  });

  it('fails closed for mismatched users, replayed IDs, and Supabase errors', async () => {
    getAuthorizationDetailsMock
      .mockResolvedValueOnce({
        data: {
          ...authorizationDetails,
          user: { id: 'other-user', email: 'other@example.test' },
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          redirect_url: 'https://client.example/callback?code=replayed-code',
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: null,
        error: new Error('private Supabase detail'),
      });
    const requestEntries: [string, string][] = [
      ['authorization_id', 'authorization-request-1'],
      ['decision', 'approve'],
    ];

    const mismatch = await POST(createDecisionRequest(requestEntries));
    const replay = await POST(createDecisionRequest(requestEntries));
    const error = await POST(createDecisionRequest(requestEntries));

    for (const response of [mismatch, replay, error]) {
      expect(response.status).toBe(303);
      expect(response.headers.get('location')).toBe(
        'https://bubblophy.example.com/oauth/consent?error=decision_failed'
      );
    }
    expect(await error.text()).not.toContain('private Supabase detail');
    expect(approveAuthorizationMock).not.toHaveBeenCalled();
    expect(denyAuthorizationMock).not.toHaveBeenCalled();
  });
});
