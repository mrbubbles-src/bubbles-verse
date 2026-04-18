import { describe, expect, it } from 'vitest'

import { isAllowedGithubIdentity } from '@/lib/auth/allowed-identities'

describe('isAllowedGithubIdentity', () => {
  it('accepts allowlisted GitHub usernames and rejects everyone else', () => {
    const allowlist = ['mrbubbles', 'another-owner']

    expect(isAllowedGithubIdentity('mrbubbles', allowlist)).toBe(true)
    expect(isAllowedGithubIdentity('stranger', allowlist)).toBe(false)
  })
})
