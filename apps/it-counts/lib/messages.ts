export type MessageContext =
  | 'log-confirm'
  | 'weekly-reset'
  | 'goal-reached'
  | 'session-start'

/**
 * Stores the MVP message library by context so later UI stories can keep copy
 * selection centralized and reuse the same tone across surfaces.
 */
export const MESSAGE_LIBRARY: Record<MessageContext, readonly string[]> = {
  'log-confirm': [
    'That counted.',
    'Logged. It all stays part of the day.',
    'Counted and kept.',
    'Nice. That is in the record now.',
    'You went out. It counts.',
  ],
  'weekly-reset': [
    'A new week is here. Start wherever today lets you.',
    'Fresh week, same rule: if you go out and move, it counts.',
    'New week, no pressure. Begin when you are ready.',
    'This week is open again. Small still counts.',
    'Another week to build from, one outing at a time.',
  ],
  'goal-reached': [
    'Weekly goal reached. Quietly solid.',
    'You hit 10 XP for the week. Nicely done.',
    'That weekly mark is yours now.',
    '10 XP reached. Keep it calm and keep going.',
    'The week has enough in it already. Good.',
  ],
  'session-start': [
    'Everything you logged before still counts today.',
    'Pick up from where you are, not from where you think you should be.',
    'No catching up required. Just today.',
    'Your history is here whenever you need the proof.',
    'You can start small and still be fully on track.',
  ],
}

/**
 * Returns one message for the requested context.
 * Random selection keeps repeated visits from feeling mechanically scripted.
 */
export function getRandomMessage(context: MessageContext): string {
  const messages = MESSAGE_LIBRARY[context]
  const index = Math.min(
    messages.length - 1,
    Math.floor(Math.random() * messages.length),
  )

  return messages[index] ?? messages[0] ?? ''
}
