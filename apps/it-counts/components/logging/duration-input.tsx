'use client'

import type { RefObject } from 'react'

import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from '@bubbles/ui/shadcn/field'
import { Input } from '@bubbles/ui/shadcn/input'

import { calculateDailyXp } from '@/lib/xp'

type DurationInputProps = {
  value: string
  disabled?: boolean
  inputRef: RefObject<HTMLInputElement | null>
  previousDailyMinutes?: number
  onValueChange: (nextValue: string) => void
}

/**
 * Captures a walking duration in whole minutes and previews the resulting XP
 * tier as the user types.
 */
export function DurationInput({
  value,
  disabled = false,
  inputRef,
  previousDailyMinutes = 0,
  onValueChange,
}: DurationInputProps) {
  const parsedDuration = value ? Number(value) : NaN
  const xpPreview =
    Number.isFinite(parsedDuration) && parsedDuration > 0
      ? calculateDailyXp(previousDailyMinutes + parsedDuration) -
        calculateDailyXp(previousDailyMinutes)
      : null

  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="duration-minutes">Minutes</FieldLabel>
        <FieldContent>
          <Input
            ref={inputRef}
            id="duration-minutes"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            disabled={disabled}
            placeholder="20"
            value={value}
            onChange={(event) => {
              const nextValue = event.target.value.replace(/\D+/g, '').slice(0, 3)
              onValueChange(nextValue)
            }}
            className="h-12 text-base tabular-nums"
          />
          <FieldDescription className="min-h-6">
            {xpPreview && xpPreview > 0 ? (
              <span className="font-medium tabular-nums text-foreground">
                = {xpPreview} XP
              </span>
            ) : (
              'XP starts at 5 minutes.'
            )}
          </FieldDescription>
        </FieldContent>
      </Field>
    </FieldGroup>
  )
}
