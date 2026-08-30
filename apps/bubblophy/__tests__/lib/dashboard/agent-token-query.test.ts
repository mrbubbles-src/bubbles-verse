import {
  isDashboardAgentTokenPageRequestCurrent,
  parseDashboardAgentTokenCursor,
  setDashboardAgentTokenPageParams,
} from '@/lib/dashboard/agent-token-query';

import { describe, expect, it } from 'vitest';

describe('dashboard agent-token page query', () => {
  const cursor = {
    projectKey: 'BV',
    normalizedLabel: 'codex local',
    tokenId: 'token-20',
  };

  it('parses and normalizes only complete cursors', () => {
    expect(
      parseDashboardAgentTokenCursor(' bv ', ' Codex Local ', ' token-20 ')
    ).toEqual(cursor);
    expect(parseDashboardAgentTokenCursor('BV', null, 'token-20')).toBeNull();
    expect(parseDashboardAgentTokenCursor('!', 'codex', 'token-20')).toBeNull();
    expect(
      parseDashboardAgentTokenCursor('BV', 'x'.repeat(81), 'token-20')
    ).toBeNull();
    expect(
      parseDashboardAgentTokenCursor('BV', 'codex', 'x'.repeat(129))
    ).toBeNull();
  });

  it('matches the complete project and cursor request fingerprint', () => {
    expect(
      isDashboardAgentTokenPageRequestCurrent(
        { projectKey: 'BV', after: cursor },
        'BV',
        cursor
      )
    ).toBe(true);
    expect(
      isDashboardAgentTokenPageRequestCurrent(
        { projectKey: null, after: cursor },
        'BV',
        cursor
      )
    ).toBe(false);
    expect(
      isDashboardAgentTokenPageRequestCurrent(
        { projectKey: 'BV', after: cursor },
        'BV',
        { ...cursor, tokenId: 'other-token' }
      )
    ).toBe(false);
  });

  it('writes and clears only the token cursor fields', () => {
    const params = new URLSearchParams('project=BV&q=oauth');
    const next = setDashboardAgentTokenPageParams(params, cursor);

    expect(next.get('tokenAfterProject')).toBe('BV');
    expect(next.get('tokenAfterLabel')).toBe('codex local');
    expect(next.get('tokenAfterId')).toBe('token-20');
    expect(next.get('project')).toBe('BV');
    expect(next.get('q')).toBe('oauth');

    const first = setDashboardAgentTokenPageParams(next, null);
    expect(first.has('tokenAfterProject')).toBe(false);
    expect(first.has('tokenAfterLabel')).toBe(false);
    expect(first.has('tokenAfterId')).toBe(false);
  });
});
