import {
  getGithubIdentityUsername,
  isAllowedGithubIdentity,
} from '@/lib/auth/allowed-identities';

import { describe, expect, it } from 'vitest';

describe('isAllowedGithubIdentity', () => {
  it('accepts allowlisted GitHub usernames and rejects everyone else', () => {
    const allowlist = ['mrbubbles', 'another-owner'];

    expect(isAllowedGithubIdentity('mrbubbles', allowlist)).toBe(true);
    expect(isAllowedGithubIdentity('stranger', allowlist)).toBe(false);
  });
});

describe('getGithubIdentityUsername', () => {
  it('prefers immutable identity data when it is available', () => {
    expect(
      getGithubIdentityUsername({
        identities: [
          {
            provider: 'github',
            identity_data: {
              user_name: 'mrbubbles-src',
            },
          },
        ],
        userMetadata: {
          user_name: 'other-name',
        },
      })
    ).toBe('mrbubbles-src');
  });

  it('falls back to GitHub user metadata when identities are empty', () => {
    expect(
      getGithubIdentityUsername({
        identities: [],
        userMetadata: {
          user_name: 'mrbubbles-src',
        },
      })
    ).toBe('mrbubbles-src');
  });
});
