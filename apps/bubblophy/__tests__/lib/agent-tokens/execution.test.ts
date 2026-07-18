import { isExecutableBubblophyAgentToken } from '@/lib/agent-tokens/execution';

import { describe, expect, it } from 'vitest';

const now = '2026-07-18T12:00:00.000Z';

describe('isExecutableBubblophyAgentToken', () => {
  it('requires an active, unexpired token with read and update scopes', () => {
    expect(
      isExecutableBubblophyAgentToken(
        {
          state: 'active',
          expiresAt: '2026-07-19T12:00:00.000Z',
          scopes: ['issues:read', 'runs:update'],
        },
        now
      )
    ).toBe(true);
    expect(
      isExecutableBubblophyAgentToken(
        {
          state: 'paused',
          expiresAt: null,
          scopes: ['issues:read', 'runs:update'],
        },
        now
      )
    ).toBe(false);
    expect(
      isExecutableBubblophyAgentToken(
        {
          state: 'active',
          expiresAt: now,
          scopes: ['issues:read', 'runs:update'],
        },
        now
      )
    ).toBe(false);
    expect(
      isExecutableBubblophyAgentToken(
        {
          state: 'active',
          expiresAt: null,
          scopes: ['issues:read'],
        },
        now
      )
    ).toBe(false);
    expect(
      isExecutableBubblophyAgentToken(
        {
          state: 'active',
          expiresAt: null,
          scopes: ['runs:update'],
        },
        now
      )
    ).toBe(false);
  });
});
