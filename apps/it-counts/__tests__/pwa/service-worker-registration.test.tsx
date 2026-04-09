import { render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import { ServiceWorkerRegistration } from '@/components/shared/service-worker-registration'

type RegistrationLike = {
  active?: { scriptURL?: string }
  installing?: { scriptURL?: string }
  unregister: ReturnType<typeof vi.fn>
  waiting?: { scriptURL?: string }
}

describe('ServiceWorkerRegistration', () => {
  let cacheDeleteMock: ReturnType<typeof vi.fn<(cacheName: string) => Promise<boolean>>>
  let cacheKeysMock: ReturnType<typeof vi.fn<() => Promise<string[]>>>
  let getRegistrationsMock: ReturnType<typeof vi.fn>
  let registerMock: ReturnType<typeof vi.fn>
  let matchingRegistration: RegistrationLike
  let unrelatedRegistration: RegistrationLike

  beforeEach(() => {
    registerMock = vi.fn().mockResolvedValue({})
    getRegistrationsMock = vi.fn().mockResolvedValue([])
    cacheDeleteMock = vi.fn<(cacheName: string) => Promise<boolean>>().mockResolvedValue(true)
    cacheKeysMock = vi.fn<() => Promise<string[]>>().mockResolvedValue([])

    matchingRegistration = {
      active: { scriptURL: 'https://itcounts.mrbubbles.test/sw.js' },
      unregister: vi.fn().mockResolvedValue(true),
    }

    unrelatedRegistration = {
      active: { scriptURL: 'https://itcounts.mrbubbles.test/other-sw.js' },
      unregister: vi.fn().mockResolvedValue(true),
    }

    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        register: registerMock,
        getRegistrations: getRegistrationsMock,
      },
      configurable: true,
    })

    Object.defineProperty(globalThis, 'caches', {
      value: {
        delete: cacheDeleteMock,
        keys: cacheKeysMock,
      } satisfies Pick<CacheStorage, 'delete' | 'keys'>,
      configurable: true,
    })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('registers /sw.js with scope "/" and updateViaCache "none" in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')

    render(<ServiceWorkerRegistration />)

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      })
    })
    expect(getRegistrationsMock).not.toHaveBeenCalled()
    expect(cacheKeysMock).not.toHaveBeenCalled()
  })

  it('unregisters stale dev workers and clears it-counts caches outside production', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    getRegistrationsMock.mockResolvedValue([
      matchingRegistration,
      unrelatedRegistration,
    ])
    cacheKeysMock.mockResolvedValue([
      'it-counts-static-v1',
      'it-counts-pages-v0',
      'other-cache',
    ])

    render(<ServiceWorkerRegistration />)

    await waitFor(() => {
      expect(getRegistrationsMock).toHaveBeenCalledTimes(1)
      expect(matchingRegistration.unregister).toHaveBeenCalledTimes(1)
      expect(cacheDeleteMock).toHaveBeenCalledWith('it-counts-static-v1')
      expect(cacheDeleteMock).toHaveBeenCalledWith('it-counts-pages-v0')
    })
    expect(unrelatedRegistration.unregister).not.toHaveBeenCalled()
    expect(cacheDeleteMock).not.toHaveBeenCalledWith('other-cache')
    expect(registerMock).not.toHaveBeenCalled()
  })

  it('renders nothing visible', () => {
    vi.stubEnv('NODE_ENV', 'production')

    const { container } = render(<ServiceWorkerRegistration />)
    expect(container.firstChild).toBeNull()
  })

  it('does not throw when serviceWorker is unavailable', () => {
    vi.stubEnv('NODE_ENV', 'production')

    Object.defineProperty(navigator, 'serviceWorker', {
      value: undefined,
      configurable: true,
    })
    expect(() => render(<ServiceWorkerRegistration />)).not.toThrow()
  })
})
