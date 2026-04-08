'use client'

import { useEffect, useState } from 'react'

import { MotivationalMessage } from '@/components/shared/motivational-message'
import { useSettingsStore } from '@/hooks/use-settings-store'
import { useUiStore } from '@/hooks/use-ui-store'
import { getTodayString, getWeekStart } from '@/lib/dates'
import { getRandomMessage } from '@/lib/messages'

/**
 * Shows one contextual message per in-memory session:
 * - `weekly-reset` on the first open of a new week (storage-backed, once/week)
 * - `session-start` on every other session load
 *
 * The session flag (`sessionMessageShown`) prevents re-triggering on same-session
 * navigations even after the weekly-reset message has been shown.
 */
export function SessionStartMessage() {
  const sessionMessageShown = useUiStore((s) => s.sessionMessageShown)
  const setSessionMessageShown = useUiStore((s) => s.setSessionMessageShown)
  const getSetting = useSettingsStore((s) => s.getSetting)
  const setSetting = useSettingsStore((s) => s.setSetting)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (sessionMessageShown) {
      return
    }

    // Defer setState so it is not synchronous in the effect body (react-hooks/set-state-in-effect).
    queueMicrotask(() => {
      const currentWeekStart = getWeekStart(getTodayString())
      const weeklyResetShownForWeek = getSetting('weeklyResetShownForWeek')

      if (weeklyResetShownForWeek !== currentWeekStart) {
        setMessage(getRandomMessage('weekly-reset'))
        setSetting('weeklyResetShownForWeek', currentWeekStart)
      } else {
        setMessage(getRandomMessage('session-start'))
      }

      setSessionMessageShown()
    })
  }, [sessionMessageShown, setSessionMessageShown, getSetting, setSetting])

  if (!message) {
    return null
  }

  return <MotivationalMessage message={message} className="mb-8" />
}
