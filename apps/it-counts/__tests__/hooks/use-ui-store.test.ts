import { beforeEach, describe, expect, it } from 'vitest'

import { useUiStore } from '@/hooks/use-ui-store'

function resetStore() {
  useUiStore.setState({ sessionMessageShown: false, logSheetOpen: false })
}

describe('use-ui-store', () => {
  beforeEach(() => {
    resetStore()
  })

  it('starts with sessionMessageShown = false', () => {
    expect(useUiStore.getState().sessionMessageShown).toBe(false)
  })

  it('setSessionMessageShown sets flag to true', () => {
    useUiStore.getState().setSessionMessageShown()
    expect(useUiStore.getState().sessionMessageShown).toBe(true)
  })

  it('calling setSessionMessageShown twice is idempotent', () => {
    useUiStore.getState().setSessionMessageShown()
    useUiStore.getState().setSessionMessageShown()
    expect(useUiStore.getState().sessionMessageShown).toBe(true)
  })

  it('starts with logSheetOpen = false', () => {
    expect(useUiStore.getState().logSheetOpen).toBe(false)
  })

  it('setLogSheetOpen toggles the sheet state', () => {
    useUiStore.getState().setLogSheetOpen(true)
    expect(useUiStore.getState().logSheetOpen).toBe(true)

    useUiStore.getState().setLogSheetOpen(false)
    expect(useUiStore.getState().logSheetOpen).toBe(false)
  })
})
