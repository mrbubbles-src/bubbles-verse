'use client'

import { cn } from '@bubbles/ui/lib/utils'

type MotivationalMessageProps = {
  message: string
  className?: string
}

/**
 * Renders the calm text-only encouragement used on the dashboard and
 * inside the logging flow without introducing card-like chrome.
 */
export function MotivationalMessage({
  message,
  className,
}: MotivationalMessageProps) {
  return (
    <p
      className={cn(
        'max-w-sm text-balance text-center text-sm/6 text-muted-foreground',
        className,
      )}>
      {message}
    </p>
  )
}
