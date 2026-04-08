import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'

import { describe, expect, it, vi } from 'vitest'

const serviceWorkerSource = fs.readFileSync(
  path.resolve(import.meta.dirname, '../../public/sw.js'),
  'utf8',
)

type ServiceWorkerListener = (event: {
  request?: RequestLike
  respondWith?: (response: Promise<Response>) => void
  waitUntil?: (work: Promise<unknown>) => void
}) => void

type RequestLike = {
  method: string
  mode: string
  url: string
}

/**
 * Loads the raw service worker into a VM with lightweight cache and fetch mocks
 * so the public script can be asserted without bundling changes.
 *
 * @returns {{
 *   addAllMock: ReturnType<typeof vi.fn>
 *   claimMock: ReturnType<typeof vi.fn>
 *   deleteMock: ReturnType<typeof vi.fn>
 *   fetchMock: ReturnType<typeof vi.fn>
 *   keysMock: ReturnType<typeof vi.fn>
 *   listeners: Record<string, ServiceWorkerListener>
 *   matchMock: ReturnType<typeof vi.fn>
 *   putMock: ReturnType<typeof vi.fn>
 *   skipWaitingMock: ReturnType<typeof vi.fn>
 * }}
 * Service worker harness.
 */
function loadServiceWorkerHarness() {
  const listeners: Record<string, ServiceWorkerListener> = {}
  const addAllMock = vi.fn(async () => undefined)
  const claimMock = vi.fn()
  const deleteMock = vi.fn(async () => true)
  const fetchMock = vi.fn(async () => new Response('fresh', { status: 200 }))
  const keysMock = vi.fn(async () => [
    'it-counts-static-v1',
    'it-counts-pages-v0',
    'it-counts-static-v2',
    'it-counts-pages-v1',
    'other-cache',
  ])
  const matchMock = vi.fn(async () => undefined)
  const putMock = vi.fn(async () => undefined)
  const skipWaitingMock = vi.fn()

  const context = vm.createContext({
    URL,
    Response,
    caches: {
      delete: deleteMock,
      keys: keysMock,
      match: matchMock,
      open: vi.fn(async () => ({
        addAll: addAllMock,
        put: putMock,
      })),
    },
    fetch: fetchMock,
    self: {
      addEventListener: (type: string, listener: ServiceWorkerListener) => {
        listeners[type] = listener
      },
      clients: {
        claim: claimMock,
      },
      location: {
        origin: 'https://itcounts.mrbubbles.test',
      },
      skipWaiting: skipWaitingMock,
    },
  })

  vm.runInContext(serviceWorkerSource, context)

  return {
    addAllMock,
    claimMock,
    deleteMock,
    fetchMock,
    keysMock,
    listeners,
    matchMock,
    putMock,
    skipWaitingMock,
  }
}

describe('custom service worker', () => {
  it('precaches only stable public assets during install', async () => {
    const { addAllMock, listeners, skipWaitingMock } = loadServiceWorkerHarness()
    const pending: Promise<unknown>[] = []

    listeners.install!({
      waitUntil: (work) => pending.push(work),
    })
    await Promise.all(pending)

    expect(addAllMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        '/manifest.json',
        '/apple-icon.png',
        '/web-app-manifest-192x192.png',
      ]),
    )
    expect(addAllMock).toHaveBeenCalledWith(
      expect.not.arrayContaining(['/', '/history']),
    )
    expect(skipWaitingMock).toHaveBeenCalledTimes(1)
  })

  it('purges old it-counts caches during activation', async () => {
    const { claimMock, deleteMock, listeners } = loadServiceWorkerHarness()
    const pending: Promise<unknown>[] = []

    listeners.activate!({
      waitUntil: (work) => pending.push(work),
    })
    await Promise.all(pending)

    expect(deleteMock).toHaveBeenCalledWith('it-counts-static-v1')
    expect(deleteMock).toHaveBeenCalledWith('it-counts-pages-v0')
    expect(deleteMock).not.toHaveBeenCalledWith('it-counts-static-v2')
    expect(deleteMock).not.toHaveBeenCalledWith('it-counts-pages-v1')
    expect(deleteMock).not.toHaveBeenCalledWith('other-cache')
    expect(claimMock).toHaveBeenCalledTimes(1)
  })

  it('handles page navigations with network-first caching', async () => {
    const { fetchMock, listeners, matchMock, putMock } = loadServiceWorkerHarness()
    const request: RequestLike = {
      method: 'GET',
      mode: 'navigate',
      url: 'https://itcounts.mrbubbles.test/history',
    }

    let responsePromise: Promise<Response> | undefined
    listeners.fetch!({
      request,
      respondWith: (response) => {
        responsePromise = response
      },
    })

    await responsePromise

    expect(fetchMock).toHaveBeenCalledWith(request)
    expect(putMock).toHaveBeenCalledWith(request, expect.any(Response))
    expect(matchMock).not.toHaveBeenCalled()
  })

  it('does not intercept Next.js build assets', () => {
    const { fetchMock, listeners } = loadServiceWorkerHarness()
    const request: RequestLike = {
      method: 'GET',
      mode: 'cors',
      url: 'https://itcounts.mrbubbles.test/_next/static/chunks/app.js',
    }
    const respondWith = vi.fn()

    listeners.fetch!({
      request,
      respondWith,
    })

    expect(respondWith).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
