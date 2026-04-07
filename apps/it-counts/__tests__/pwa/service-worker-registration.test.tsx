import { render } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import { ServiceWorkerRegistration } from '@/components/shared/service-worker-registration'

describe('ServiceWorkerRegistration', () => {
  let registerMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    registerMock = vi.fn().mockResolvedValue({})
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { register: registerMock },
      configurable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('registers /sw.js with scope "/" and updateViaCache "none"', () => {
    render(<ServiceWorkerRegistration />)
    expect(registerMock).toHaveBeenCalledWith('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    })
  })

  it('renders nothing visible', () => {
    const { container } = render(<ServiceWorkerRegistration />)
    expect(container.firstChild).toBeNull()
  })

  it('does not throw when serviceWorker is unavailable', () => {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: undefined,
      configurable: true,
    })
    expect(() => render(<ServiceWorkerRegistration />)).not.toThrow()
  })
})
