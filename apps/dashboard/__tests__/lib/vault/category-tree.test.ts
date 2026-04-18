import { describe, expect, it } from 'vitest'

import { canAppendCategoryChild } from '@/lib/vault/category-tree'

describe('canAppendCategoryChild', () => {
  it('allows a child under a top-level category but rejects a third level', () => {
    expect(canAppendCategoryChild({ parentDepth: 0 })).toBe(true)
    expect(canAppendCategoryChild({ parentDepth: 1 })).toBe(false)
  })
})
