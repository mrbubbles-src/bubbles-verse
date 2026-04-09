'use client'

import { useEffect, useRef, useState } from 'react'

import { Button } from '@bubbles/ui/shadcn/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@bubbles/ui/shadcn/sheet'

import { DurationInput } from '@/components/logging/duration-input'
import { TimeRangeInput } from '@/components/logging/time-range-input'
import { MotivationalMessage } from '@/components/shared/motivational-message'
import { useActivityStore } from '@/hooks/use-activity-store'
import { useLevelStore } from '@/hooks/use-level-store'
import { useSettingsStore } from '@/hooks/use-settings-store'
import { useUiStore } from '@/hooks/use-ui-store'
import { getTodayString, getWeekStart } from '@/lib/dates'
import { getRandomMessage } from '@/lib/messages'

/** Weekly XP threshold for the goal-reached message (matches WeeklySummary). */
const WEEKLY_XP_GOAL = 10

const AUTO_CLOSE_DELAY_MS = 900

type InputMode = 'duration' | 'time-range'

type ConfirmationState = {
  /** Today's total daily XP after this log (`calculateDailyXp` on aggregated minutes). */
  dailyXpToday: number
  message: string
}

/**
 * Parses a HH:MM clock time into total minutes from midnight.
 * Returns null if empty, malformed, non-integer parts, or out of 0–23 / 0–59.
 */
function parseTimeToMinutes(t: string): number | null {
  if (!t) return null
  const parts = t.split(':')
  if (parts.length !== 2) return null
  const h = Number(parts[0])
  const m = Number(parts[1])
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null
  if (!Number.isInteger(h) || !Number.isInteger(m)) return null
  if (h < 0 || h > 23 || m < 0 || m > 59) return null
  return h * 60 + m
}

/**
 * Validates start/end time and non-walking minutes, returning errors and the
 * calculated walking duration. `walkingMinutes` is null when inputs are
 * incomplete or invalid.
 */
function computeTimeRange(
  startTime: string,
  endTime: string,
  nonWalking: string,
): {
  endTimeError: string | null
  nonWalkingError: string | null
  walkingMinutes: number | null
} {
  const startMin = parseTimeToMinutes(startTime)
  const endMin = parseTimeToMinutes(endTime)

  if (startMin === null || endMin === null) {
    return { endTimeError: null, nonWalkingError: null, walkingMinutes: null }
  }

  if (endMin <= startMin) {
    return {
      endTimeError: 'End time must be after start time.',
      nonWalkingError: null,
      walkingMinutes: null,
    }
  }

  const totalMin = endMin - startMin
  const nonWalkingMin = nonWalking ? Number(nonWalking) : 0

  if (nonWalkingMin > totalMin) {
    return {
      endTimeError: null,
      nonWalkingError: 'Non-walking time exceeds trip duration.',
      walkingMinutes: null,
    }
  }

  return {
    endTimeError: null,
    nonWalkingError: null,
    walkingMinutes: Math.max(0, totalMin - nonWalkingMin),
  }
}

/**
 * Owns the activity logging flow: opening the bottom sheet, collecting either
 * a raw duration or a start/end time pair, writing the entry, and showing the
 * inline confirmation before close.
 */
export function LogEntrySheet() {
  const today = getTodayString()
  const addDurationEntry = useActivityStore((s) => s.addDurationEntry)
  const syncXpFromEntries = useLevelStore((s) => s.syncXpFromEntries)

  const open = useUiStore((s) => s.logSheetOpen)
  const setOpen = useUiStore((s) => s.setLogSheetOpen)
  const [inputMode, setInputMode] = useState<InputMode>('duration')
  const [selectedDate, setSelectedDate] = useState(today)
  const previousDailyMinutes = useActivityStore((s) => s.getDailyTotalMinutes(selectedDate))

  // Duration mode state
  const [durationValue, setDurationValue] = useState('')
  const [durationError, setDurationError] = useState('')

  // Time-range mode state
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [nonWalking, setNonWalking] = useState('')

  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const closeTimeoutRef = useRef<number | null>(null)

  const { endTimeError, nonWalkingError, walkingMinutes } = computeTimeRange(
    startTime,
    endTime,
    nonWalking,
  )

  const isTimeRangeValid = walkingMinutes !== null

  useEffect(() => {
    if (!open || inputMode !== 'duration') {
      return
    }

    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus()
    })

    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [open, inputMode])

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current)
      }
    }
  }, [])

  /**
   * Resets all transient form state whenever the sheet is dismissed or reopened.
   */
  function resetSheetState() {
    setInputMode('duration')
    setSelectedDate(getTodayString())
    setDurationValue('')
    setDurationError('')
    setStartTime('')
    setEndTime('')
    setNonWalking('')
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
   * Validates the active input mode, creates the entry via the store, then
   * mirrors earned XP into level progress and shows the inline confirmation.
   */
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    let durationMin: number

    if (inputMode === 'duration') {
      const parsed = Number(durationValue)
      if (!Number.isInteger(parsed) || parsed <= 0) {
        setDurationError('Enter whole minutes greater than 0.')
        return
      }
      durationMin = parsed
    } else {
      if (walkingMinutes === null) return
      durationMin = walkingMinutes
    }

    const { dailyXpToday } = addDurationEntry(durationMin, selectedDate)
    syncXpFromEntries(useActivityStore.getState().entries)
    setDurationError('')

    const weekStart = getWeekStart(selectedDate)
    const weeklyXp = useActivityStore.getState().getWeeklyXp(weekStart)
    const goalReachedShownForWeek = useSettingsStore.getState().getSetting('goalReachedShownForWeek')
    const isGoalJustReached = weeklyXp >= WEEKLY_XP_GOAL && goalReachedShownForWeek !== weekStart

    if (isGoalJustReached) {
      useSettingsStore.getState().setSetting('goalReachedShownForWeek', weekStart)
    }

    setConfirmation({
      dailyXpToday,
      message: isGoalJustReached
        ? getRandomMessage('goal-reached')
        : getRandomMessage('log-confirm'),
    })

    closeTimeoutRef.current = window.setTimeout(() => {
      setOpen(false)
      resetSheetState()
      closeTimeoutRef.current = null
    }, AUTO_CLOSE_DELAY_MS)
  }

  const submitDisabled =
    confirmation !== null ||
    (inputMode === 'time-range' && !isTimeRangeValid)

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
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
          <div className="flex flex-col gap-1.5">
            <label htmlFor="activity-date" className="text-sm font-medium">
              Date
            </label>
            <input
              id="activity-date"
              type="date"
              value={selectedDate}
              max={today}
              disabled={confirmation !== null}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            />
          </div>

          {inputMode === 'duration' ? (
            <>
              <DurationInput
                value={durationValue}
                inputRef={inputRef}
                previousDailyMinutes={previousDailyMinutes}
                disabled={confirmation !== null}
                onValueChange={(nextValue) => {
                  setDurationValue(nextValue)
                  if (durationError) {
                    setDurationError('')
                  }
                }}
              />

              {durationError ? (
                <p role="alert" className="-mt-2 text-sm/6 text-destructive">
                  {durationError}
                </p>
              ) : null}

              <button
                type="button"
                disabled={confirmation !== null}
                onClick={() => setInputMode('time-range')}
                className="-mt-2 self-start text-xs/6 text-muted-foreground underline-offset-2 hover:underline disabled:pointer-events-none disabled:opacity-50">
                Use start / end time instead
              </button>
            </>
          ) : (
            <>
              <TimeRangeInput
                startTime={startTime}
                endTime={endTime}
                nonWalking={nonWalking}
                endTimeError={endTimeError}
                nonWalkingError={nonWalkingError}
                disabled={confirmation !== null}
                onStartTimeChange={setStartTime}
                onEndTimeChange={setEndTime}
                onNonWalkingChange={setNonWalking}
              />

              <button
                type="button"
                disabled={confirmation !== null}
                onClick={() => setInputMode('duration')}
                className="-mt-2 self-start text-xs/6 text-muted-foreground underline-offset-2 hover:underline disabled:pointer-events-none disabled:opacity-50">
                Use duration instead
              </button>
            </>
          )}

          {confirmation ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm/6 font-semibold tabular-nums text-foreground">
                {selectedDate !== today ? `${selectedDate}: ` : 'Today total: '}
                {confirmation.dailyXpToday} XP · That counted.
              </p>
              <MotivationalMessage message={confirmation.message} className="text-left" />
            </div>
          ) : null}

          <Button
            type="submit"
            size="lg"
            disabled={submitDisabled}
            className="h-12 text-sm font-semibold">
            Log it
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
