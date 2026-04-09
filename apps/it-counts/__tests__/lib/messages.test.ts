import { MESSAGE_LIBRARY, getRandomMessage } from '@/lib/messages'

import { afterEach, describe, expect, it, vi } from 'vitest'

const DISALLOWED_MESSAGE_PATTERNS = [
  /\byou should have\b/i,
  /\bcould have\b/i,
  /\bnot enough\b/i,
  /\bbehind\b/i,
  /\bfailed\b/i,
  /\binsufficient\b/i,
  /\bbetter than\b/i,
  /\bmore than you did\b/i,
]

describe('messages', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('covers all required contexts with at least five calm messages each', () => {
    expect(Object.keys(MESSAGE_LIBRARY).sort()).toEqual([
      'goal-reached',
      'log-confirm',
      'session-start',
      'weekly-reset',
    ])

    for (const messages of Object.values(MESSAGE_LIBRARY)) {
      expect(messages.length).toBeGreaterThanOrEqual(5)

      for (const message of messages) {
        expect(message.trim()).not.toHaveLength(0)
      }
    }
  })

  it('keeps every message non-judgmental and non-comparative', () => {
    for (const messages of Object.values(MESSAGE_LIBRARY)) {
      for (const message of messages) {
        for (const pattern of DISALLOWED_MESSAGE_PATTERNS) {
          expect(message).not.toMatch(pattern)
        }
      }
    }
  })

  it('picks messages from the requested context', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)

    expect(getRandomMessage('log-confirm')).toBe(
      MESSAGE_LIBRARY['log-confirm'][0],
    )
    expect(getRandomMessage('weekly-reset')).toBe(
      MESSAGE_LIBRARY['weekly-reset'][0],
    )
    expect(getRandomMessage('goal-reached')).toBe(
      MESSAGE_LIBRARY['goal-reached'][0],
    )
    expect(getRandomMessage('session-start')).toBe(
      MESSAGE_LIBRARY['session-start'][0],
    )
  })

  it('does not hardcode the same message for every random pick', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0.9999)

    const firstMessage = getRandomMessage('session-start')
    const lastMessage = getRandomMessage('session-start')

    expect(firstMessage).not.toBe(lastMessage)
  })
})
