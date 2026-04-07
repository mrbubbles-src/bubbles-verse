import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SessionStartMessage } from '@/components/dashboard/session-start-message'
import { useUiStore } from '@/hooks/use-ui-store'

vi.mock('@/lib/messages', () => ({
  getRandomMessage: vi.fn(() => 'Everything you logged before still counts today.'),
}))

function resetStore() {
  useUiStore.setState({ sessionMessageShown: false })
}

describe('SessionStartMessage', () => {
  beforeEach(() => {
    resetStore()
  })

  it('shows one session-start message on first dashboard load and marks the session flag', async () => {
    render(<SessionStartMessage />)

    await waitFor(() => {
      expect(
        screen.getByText('Everything you logged before still counts today.')
      ).toBeInTheDocument()
    })
    expect(useUiStore.getState().sessionMessageShown).toBe(true)
  })

  it('stays hidden after the session flag was already set', () => {
    useUiStore.getState().setSessionMessageShown()

    render(<SessionStartMessage />)

    expect(
      screen.queryByText('Everything you logged before still counts today.')
    ).not.toBeInTheDocument()
  })
})
