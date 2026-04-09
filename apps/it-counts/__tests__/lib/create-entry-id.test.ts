import { afterEach, describe, expect, it, vi } from 'vitest'

import { createEntryId } from '@/lib/create-entry-id'

describe('createEntryId', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('uses crypto.randomUUID when available', () => {
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('generated-id')

    expect(createEntryId()).toBe('generated-id')
  })

  it('falls back to crypto.getRandomValues when randomUUID is unavailable', () => {
    const getRandomValues = vi.fn((array: BufferSource) => {
      if (array instanceof Uint8Array) {
        array.set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])
      }

      return array
    })

    const fallbackCrypto = Object.create(globalThis.crypto) as Crypto

    Object.defineProperty(fallbackCrypto, 'randomUUID', {
      configurable: true,
      value: undefined,
    })
    Object.defineProperty(fallbackCrypto, 'getRandomValues', {
      configurable: true,
      value: getRandomValues,
    })

    vi.stubGlobal('crypto', fallbackCrypto)

    expect(createEntryId()).toBe('00010203-0405-4607-8809-0a0b0c0d0e0f')
    expect(getRandomValues).toHaveBeenCalledOnce()
  })
})
