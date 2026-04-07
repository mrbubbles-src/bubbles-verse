'use client'

import { useEffect, useState } from 'react'

import { MotivationalMessage } from '@/components/shared/motivational-message'
import { useUiStore } from '@/hooks/use-ui-store'
import { getRandomMessage } from '@/lib/messages'

/**
 * Shows one encouraging session-start message on the dashboard per in-memory
 * app session, then stays silent until the session is refreshed.
 */
export function SessionStartMessage() {
  const sessionMessageShown = useUiStore((s) => s.sessionMessageShown)
  const setSessionMessageShown = useUiStore((s) => s.setSessionMessageShown)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (sessionMessageShown) {
      return
    }

    setMessage(getRandomMessage('session-start'))
    setSessionMessageShown()
  }, [sessionMessageShown, setSessionMessageShown])

  if (!message) {
    return null
  }

  return <MotivationalMessage message={message} className="mb-8" />
}
