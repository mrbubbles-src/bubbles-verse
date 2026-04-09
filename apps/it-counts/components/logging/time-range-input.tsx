'use client'

import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from '@bubbles/ui/shadcn/field'
import { Input } from '@bubbles/ui/shadcn/input'

type TimeRangeInputProps = {
  startTime: string
  endTime: string
  nonWalking: string
  endTimeError: string | null
  nonWalkingError: string | null
  disabled?: boolean
  onStartTimeChange: (v: string) => void
  onEndTimeChange: (v: string) => void
  onNonWalkingChange: (v: string) => void
}

/**
 * Collects a start time, end time, and optional non-walking minutes.
 * All validation state is passed in from the parent; this component is
 * purely presentational. Errors are shown inline below the affected field.
 */
export function TimeRangeInput({
  startTime,
  endTime,
  nonWalking,
  endTimeError,
  nonWalkingError,
  disabled = false,
  onStartTimeChange,
  onEndTimeChange,
  onNonWalkingChange,
}: TimeRangeInputProps) {
  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="start-time">Start time</FieldLabel>
        <FieldContent>
          <Input
            id="start-time"
            type="time"
            disabled={disabled}
            value={startTime}
            onChange={(e) => onStartTimeChange(e.target.value)}
            className="h-12 text-base tabular-nums"
          />
        </FieldContent>
      </Field>

      <Field>
        <FieldLabel htmlFor="end-time">End time</FieldLabel>
        <FieldContent>
          <Input
            id="end-time"
            type="time"
            disabled={disabled}
            value={endTime}
            onChange={(e) => onEndTimeChange(e.target.value)}
            className="h-12 text-base tabular-nums"
          />
          {endTimeError ? (
            <FieldDescription>
              <span role="alert" className="text-destructive">
                {endTimeError}
              </span>
            </FieldDescription>
          ) : null}
        </FieldContent>
      </Field>

      <Field>
        <FieldLabel htmlFor="non-walking-minutes">Non-walking minutes</FieldLabel>
        <FieldContent>
          <Input
            id="non-walking-minutes"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            disabled={disabled}
            placeholder="0"
            value={nonWalking}
            onChange={(e) => {
              const next = e.target.value.replace(/\D+/g, '').slice(0, 3)
              onNonWalkingChange(next)
            }}
            className="h-12 text-base tabular-nums"
          />
          {nonWalkingError ? (
            <FieldDescription>
              <span role="alert" className="text-destructive">
                {nonWalkingError}
              </span>
            </FieldDescription>
          ) : null}
        </FieldContent>
      </Field>
    </FieldGroup>
  )
}
