import { describe, expect, it } from 'vitest'
import manifest from '@/app/manifest'

describe('PWA Manifest', () => {
  const m = manifest()

  it('has a name', () => {
    expect(m.name).toBeTruthy()
  })

  it('has a short_name', () => {
    expect(m.short_name).toBeTruthy()
  })

  it('has start_url set to "/"', () => {
    expect(m.start_url).toBe('/')
  })

  it('has display set to "standalone"', () => {
    expect(m.display).toBe('standalone')
  })

  it('has a valid hex theme_color', () => {
    expect(m.theme_color).toMatch(/^#[0-9a-fA-F]{3,8}$/)
  })

  it('has a valid hex background_color', () => {
    expect(m.background_color).toMatch(/^#[0-9a-fA-F]{3,8}$/)
  })

  it('has a 192px icon entry', () => {
    const icon192 = m.icons?.find((i) => i.sizes === '192x192')
    expect(icon192).toBeDefined()
    expect(icon192?.src).toBeTruthy()
  })

  it('has a 512px icon entry', () => {
    const icon512 = m.icons?.find((i) => i.sizes === '512x512')
    expect(icon512).toBeDefined()
    expect(icon512?.src).toBeTruthy()
  })
})
