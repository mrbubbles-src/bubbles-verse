'use client'

import type { Student } from '@/lib/models'

import { formatStudentName } from '@/lib/students'

import { useEffect, useMemo, useRef, useState } from 'react'

import ClassSelector from '@/components/classes/class-selector'
import GeneratorCardSkeleton from '@/components/loading/generator-card-skeleton'
import { Badge } from '@bubbles/ui/shadcn/badge'
import { Button } from '@bubbles/ui/shadcn/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@bubbles/ui/shadcn/card'
import { Input } from '@bubbles/ui/shadcn/input'
import {
  Copy01Icon,
  HugeiconsIcon,
  Tick02Icon,
} from '@bubbles/ui/lib/hugeicons'
import { toast } from '@bubbles/ui/lib/sonner'
import { useAppStore } from '@/context/app-store'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { useTheme } from '@/hooks/use-theme'

const DEFAULT_GROUP_SIZE = 3

/**
 * Renders breakout room generation controls and the resulting class-scoped student groups.
 */
export default function BreakoutGroupsCard() {
  const { theme } = useTheme()
  const { state, actions } = useAppStore()
  const [groupSizeOverride, setGroupSizeOverride] = useState<number | null>(null)
  const {
    copy: copyAll,
    isCopied: isAllCopied,
    reset: resetAllCopy,
  } = useCopyToClipboard()
  const { copy: copyGroup, reset: resetGroupCopy } = useCopyToClipboard()
  const [copiedGroupIndex, setCopiedGroupIndex] = useState<number | null>(null)
  const copyGroupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const activeClassId = state.persisted.activeClassId

  useEffect(() => {
    return () => {
      if (copyGroupTimeoutRef.current !== null) {
        clearTimeout(copyGroupTimeoutRef.current)
      }
    }
  }, [])

  const activeStudents = useMemo(
    () =>
      state.persisted.students.filter(
        (student) =>
          student.classId === activeClassId && student.status === 'active'
      ),
    [activeClassId, state.persisted.students]
  )

  const persistedGroups = activeClassId
    ? state.persisted.breakoutGroupsByClass[activeClassId] ?? null
    : null

  const groupSizeToUse =
    groupSizeOverride ?? persistedGroups?.groupSize ?? DEFAULT_GROUP_SIZE
  const canGenerateGroups =
    !!activeClassId && activeStudents.length > 0 && groupSizeToUse > 0

  const studentById = useMemo(() => {
    return new Map(activeStudents.map((student) => [student.id, student]))
  }, [activeStudents])

  const groups = useMemo((): Student[][] => {
    if (!persistedGroups) return []
    return persistedGroups.groupIds
      .map((group) =>
        group.map((id) => studentById.get(id)).filter(Boolean) as Student[]
      )
      .filter((group) => group.length > 0)
  }, [persistedGroups, studentById])

  const groupSummary = useMemo(() => {
    return groups
      .map((group, index) => {
        const names = group
          .map((student) => formatStudentName(student.name))
          .join(', ')
        return `Group ${index + 1}: ${names}`
      })
      .join('\n')
  }, [groups])

  /**
   * Randomizes students and chunks them into equally-sized groups.
   */
  const buildGroups = (students: Student[], size: number) => {
    const shuffled = [...students]
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1))
      const currentStudent = shuffled[index]
      const swapStudent = shuffled[swapIndex]
      if (!currentStudent || !swapStudent) {
        continue
      }
      shuffled[index] = swapStudent
      shuffled[swapIndex] = currentStudent
    }
    const nextGroups: Student[][] = []
    for (let index = 0; index < shuffled.length; index += size) {
      nextGroups.push(shuffled.slice(index, index + size))
    }
    return nextGroups
  }

  if (!state.ui.isHydrated) {
    return <GeneratorCardSkeleton />
  }

  return (
    <Card className='relative overflow-hidden rounded-xl border-border/50 py-6 shadow-md lg:gap-6 xl:gap-8 xl:py-8'>
      <div
        className='absolute left-0 top-0 h-full w-1 rounded-l-xl'
        style={{ backgroundColor: 'var(--chart-4)', opacity: 0.6 }}
      />
      <CardHeader className='flex flex-col gap-3 px-6 xl:px-8'>
        <div className='flex flex-row items-start justify-between gap-2'>
          <div className='flex flex-col gap-1'>
            <CardTitle className='text-xl font-bold tracking-tight'>
              Breakout Rooms
            </CardTitle>
            <CardDescription className='text-base/relaxed'>
              Shuffle active students into randomized breakout groups.
            </CardDescription>
          </div>
          <Badge
            variant='outline'
            className='shrink-0 rounded-full px-2 py-0.5 text-xs font-medium'
            style={{
              backgroundColor:
                'color-mix(in oklch, var(--chart-4) 10%, transparent)',
              color: 'var(--chart-4)',
            }}>
            {activeStudents.length} students
          </Badge>
        </div>
        <ClassSelector compact />
      </CardHeader>
      <CardContent className='flex flex-col gap-4 px-6 text-base/relaxed text-muted-foreground lg:gap-5 xl:gap-6 xl:px-8'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-end'>
          <label className='flex flex-1 flex-col gap-1 text-sm font-medium text-foreground lg:text-base'>
            Group size
            <Input
              type='number'
              min={1}
              inputMode='numeric'
              value={groupSizeToUse}
              onChange={(event) => {
                const nextValue = Number(event.target.value)
                if (!Number.isNaN(nextValue)) {
                  setGroupSizeOverride(nextValue)
                }
              }}
              className='h-9 text-base/relaxed placeholder:text-base/relaxed placeholder:text-muted-foreground/70'
            />
          </label>
          <Button
            className='h-9 text-base font-semibold sm:min-w-32'
            disabled={!canGenerateGroups}
            onClick={() => {
              if (!activeClassId) return
              const size = Math.max(groupSizeToUse, 1)
              const nextGroups = buildGroups(activeStudents, size)
              actions.setBreakoutGroups({
                classId: activeClassId,
                groupSize: size,
                groupIds: nextGroups.map((group) =>
                  group.map((student) => student.id)
                ),
                createdAt: Date.now(),
              })
              setGroupSizeOverride(null)
              resetAllCopy()
              resetGroupCopy()
              if (copyGroupTimeoutRef.current !== null) {
                clearTimeout(copyGroupTimeoutRef.current)
                copyGroupTimeoutRef.current = null
              }
              setCopiedGroupIndex(null)
            }}>
            Generate Groups
          </Button>
          <Button
            variant='secondary'
            className='h-9 text-base font-semibold sm:min-w-32'
            disabled={!groups.length}
            onClick={async () => {
              const ok = await copyAll(groupSummary)
              if (!ok) toast.error('Failed to copy to clipboard.')
            }}>
            {isAllCopied ? 'Copied!' : 'Copy Groups'}
          </Button>
        </div>
        {groups.length ? (
          <div className='flex flex-wrap items-stretch gap-4'>
            {groups.map((group, index) => (
              <div
                key={`group-${index}`}
                className='flex w-full flex-col rounded-md border border-border/60 px-3 py-2 sm:w-fit sm:min-w-72'>
                <div className='flex items-center justify-between gap-2'>
                  <p className='text-sm/relaxed font-medium uppercase tracking-[0.2em] text-muted-foreground'>
                    Group {index + 1}
                  </p>
                  <Button
                    disabled={copiedGroupIndex === index}
                    type='button'
                    variant='ghost'
                    size='icon-sm'
                    aria-label={
                      copiedGroupIndex === index
                        ? `Copied group ${index + 1}`
                        : `Copy group ${index + 1}`
                    }
                    onClick={async () => {
                      const names = group
                        .map((student) => formatStudentName(student.name))
                        .join(', ')
                      const ok = await copyGroup(names)
                      if (!ok) {
                        toast.error('Failed to copy to clipboard.')
                        return
                      }
                      setCopiedGroupIndex(index)
                      if (copyGroupTimeoutRef.current !== null) {
                        clearTimeout(copyGroupTimeoutRef.current)
                      }
                      copyGroupTimeoutRef.current = setTimeout(() => {
                        setCopiedGroupIndex(null)
                        copyGroupTimeoutRef.current = null
                      }, 2000)
                    }}>
                    {copiedGroupIndex === index ? (
                      <HugeiconsIcon
                        icon={Tick02Icon}
                        strokeWidth={2}
                        className={
                          theme === 'dark'
                            ? 'text-ctp-mocha-green'
                            : 'text-ctp-latte-green'
                        }
                      />
                    ) : (
                      <HugeiconsIcon
                        icon={Copy01Icon}
                        strokeWidth={2}
                        className='text-muted-foreground'
                      />
                    )}
                  </Button>
                </div>
                <p className='mt-2 text-lg/relaxed text-foreground'>
                  {group
                    .map((student) => formatStudentName(student.name))
                    .join(', ')}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className='flex min-h-[100px] flex-col justify-center rounded-md border border-dashed border-border/60 bg-background/60 px-4 py-3'>
            <p className='text-sm text-muted-foreground lg:text-base'>
              Generate groups to see the breakout room list.
            </p>
            {!activeClassId ? (
              <p className='mt-2 text-xs text-muted-foreground lg:text-sm'>
                Add and select a class to begin.
              </p>
            ) : !activeStudents.length ? (
              <p className='mt-2 text-xs text-muted-foreground lg:text-sm'>
                Add or re-enable students to begin.
              </p>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  )
}