'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '@bubbles/ui/shadcn/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@bubbles/ui/shadcn/sheet'

import { LogActivityButton } from '@/components/dashboard/log-activity-button'
import { DurationInput } from '@/components/logging/duration-input'
import { MotivationalMessage } from '@/components/shared/motivational-message'
import { useActivityStore } from '@/hooks/use-activity-store'
import { useLevelStore } from '@/hooks/use-level-store'
import { getTodayString } from '@/lib/dates'
import { getRandomMessage } from '@/lib/messages'

const AUTO_CLOSE_DELAY_MS = 900

type ConfirmationState = {
  xpEarned: number
  message: string
}

/**
 * Owns the duration-based logging flow: opening the bottom sheet, collecting
 * minutes, writing the entry, and showing the inline confirmation before close.
 */
export function LogEntrySheet() {
  const addDurationEntry = useActivityStore((s) => s.addDurationEntry)
  const entries = useActivityStore((s) => s.entries)
  const previousDailyMinutes = useMemo(() => {
    const today = getTodayString()
    return entries
      .filter((e) => e.date === today)
      .reduce((sum, e) => sum + e.durationMin, 0)
  }, [entries])
  const addXp = useLevelStore((s) => s.addXp)
  const [open, setOpen] = useState(false)
  const [durationValue, setDurationValue] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const closeTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus()
    })

    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [open])

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current)
      }
    }
  }, [])

  /**
   * Resets transient form state whenever the sheet is dismissed or reopened.
   */
  function resetSheetState() {
    setDurationValue('')
    setErrorMessage('')
    setConfirmation(null)
  }

  /**
   * Keeps the sheet state and its delayed auto-close timer in sync with the
   * controlled open state exposed by the shadcn sheet primitive.
   */
  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }

    if (!nextOpen) {
      resetSheetState()
    }

    setOpen(nextOpen)
  }

  /**
   * Validates the minute input at the UI boundary, creates the entry through
   * the store, then mirrors the earned XP into level progress immediately.
   */
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const durationMin = Number(durationValue)

    if (Number.isInteger(durationMin) === false || durationMin <= 0) {
      setErrorMessage('Enter whole minutes greater than 0.')
      return
    }

    const { xpEarned } = addDurationEntry(durationMin)
    addXp(xpEarned)
    setErrorMessage('')
    setConfirmation({
      xpEarned,
      message: getRandomMessage('log-confirm'),
    })

    closeTimeoutRef.current = window.setTimeout(() => {
      setOpen(false)
      resetSheetState()
      closeTimeoutRef.current = null
    }, AUTO_CLOSE_DELAY_MS)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger render={<LogActivityButton aria-label="Log Activity" />} />
      <SheetContent
        side="bottom"
        className="mx-auto w-full max-w-md rounded-t-[1.75rem] border-x-0 border-b-0 px-0">
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-border" aria-hidden="true" />
        <SheetHeader className="gap-2 pr-12">
          <SheetTitle className="text-lg/relaxed font-semibold">Log Activity</SheetTitle>
          <SheetDescription className="text-sm/relaxed">
            Minutes moved today. Fast in, fast out.
          </SheetDescription>
        </SheetHeader>

        <form className="flex flex-col gap-5 px-6 pb-6" onSubmit={handleSubmit}>
          <DurationInput
            value={durationValue}
            inputRef={inputRef}
            previousDailyMinutes={previousDailyMinutes}
            disabled={confirmation !== null}
            onValueChange={(nextValue) => {
              setDurationValue(nextValue)
              if (errorMessage) {
                setErrorMessage('')
              }
            }}
          />

          {errorMessage ? (
            <p role="alert" className="-mt-2 text-sm/6 text-destructive">
              {errorMessage}
            </p>
          ) : null}

          {confirmation ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm/6 font-semibold tabular-nums text-foreground">
                +{confirmation.xpEarned} XP · That counted.
              </p>
              <MotivationalMessage message={confirmation.message} className="text-left" />
            </div>
          ) : null}

          <Button
            type="submit"
            size="lg"
            disabled={confirmation !== null}
            className="h-12 text-sm font-semibold">
            Log it
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
