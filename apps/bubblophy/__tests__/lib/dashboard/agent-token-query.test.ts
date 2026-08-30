import {
  isDashboardAgentTokenPageRequestCurrent,
  normalizeDashboardAgentTokenQuery,
  parseDashboardAgentTokenCursor,
  setDashboardAgentTokenPageParams,
  setDashboardAgentTokenSearchParams,
  writeDashboardAgentTokenQueryParams,
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
        { projectKey: 'BV', query: 'Codex', after: cursor },
        'BV',
        'Codex',
        cursor
      )
    ).toBe(true);
    expect(
      isDashboardAgentTokenPageRequestCurrent(
        { projectKey: null, query: 'Codex', after: cursor },
        'BV',
        'Codex',
        cursor
      )
    ).toBe(false);
    expect(
      isDashboardAgentTokenPageRequestCurrent(
        { projectKey: 'BV', query: 'Other', after: cursor },
        'BV',
        'Codex',
        cursor
      )
    ).toBe(false);
    expect(
      isDashboardAgentTokenPageRequestCurrent(
        { projectKey: 'BV', query: 'Codex', after: cursor },
        'BV',
        'Codex',
        { ...cursor, tokenId: 'other-token' }
      )
    ).toBe(false);
  });

  it('normalizes search text and clears only the incompatible cursor', () => {
    expect(normalizeDashboardAgentTokenQuery('  Codex Local  ')).toBe(
      'Codex Local'
    );
    expect(normalizeDashboardAgentTokenQuery('   ')).toBeNull();

    const params = setDashboardAgentTokenPageParams(
      new URLSearchParams('project=BV&tokenQ=old'),
      cursor
    );
    const searched = setDashboardAgentTokenSearchParams(params, 'Codex');

    expect(searched.get('tokenQ')).toBe('Codex');
    expect(searched.has('tokenAfterProject')).toBe(false);
    expect(searched.has('tokenAfterLabel')).toBe(false);
    expect(searched.has('tokenAfterId')).toBe(false);
    expect(searched.get('project')).toBe('BV');
  });

  it('canonicalizes query and cursor together for paginated search', () => {
    const params = writeDashboardAgentTokenQueryParams(
      new URLSearchParams('project=BV&tokenQ=stale'),
      'Codex',
      cursor
    );

    expect(params.get('tokenQ')).toBe('Codex');
    expect(params.get('tokenAfterProject')).toBe('BV');
    expect(params.get('tokenAfterId')).toBe('token-20');
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
