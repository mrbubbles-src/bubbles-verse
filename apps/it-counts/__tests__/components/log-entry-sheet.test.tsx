import { cloneElement, createContext, type ReactElement, type ReactNode, useContext } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const addDurationEntryMock = vi.fn()
const addXpMock = vi.fn()

vi.mock('@/hooks/use-activity-store', () => ({
  useActivityStore: vi.fn((selector: (state: { addDurationEntry: typeof addDurationEntryMock; entries: never[] }) => unknown) =>
    selector({
      addDurationEntry: addDurationEntryMock,
      entries: [],
    })
  ),
}))

vi.mock('@/hooks/use-level-store', () => ({
  useLevelStore: vi.fn((selector: (state: { addXp: typeof addXpMock }) => unknown) =>
    selector({
      addXp: addXpMock,
    })
  ),
}))

vi.mock('@/lib/dates', () => ({
  getTodayString: vi.fn(() => '2026-04-07'),
}))

vi.mock('@/lib/messages', () => ({
  getRandomMessage: vi.fn(() => 'Quiet win.'),
}))

type SheetContextValue = {
  open: boolean
  onOpenChange?: (nextOpen: boolean) => void
}

const SheetContext = createContext<SheetContextValue>({ open: false })

vi.mock('@bubbles/ui/shadcn/sheet', () => {
  function Sheet({
    open = false,
    onOpenChange,
    children,
  }: {
    open?: boolean
    onOpenChange?: (nextOpen: boolean) => void
    children: ReactNode
  }) {
    return (
      <SheetContext.Provider value={{ open, onOpenChange }}>
        {children}
      </SheetContext.Provider>
    )
  }

  function SheetTrigger({
    render,
    children,
  }: {
    render?: ReactElement<{ children?: ReactNode; onClick?: () => void }>
    children?: ReactNode
  }) {
    const context = useContext(SheetContext)
    const element = render ?? <button type="button" />

    return cloneElement(
      element,
      {
        onClick: () => {
          element.props.onClick?.()
          context.onOpenChange?.(true)
        },
      },
      element.props.children ?? children,
    )
  }

  function SheetContent({ children }: { children: ReactNode }) {
    const context = useContext(SheetContext)

    if (!context.open) {
      return null
    }

    return <div role="dialog">{children}</div>
  }

  function SheetHeader({ children }: { children: ReactNode }) {
    return <div>{children}</div>
  }

  function SheetTitle({ children, className }: { children: ReactNode; className?: string }) {
    return <h2 className={className}>{children}</h2>
  }

  function SheetDescription({
    children,
    className,
  }: {
    children: ReactNode
    className?: string
  }) {
    return <p className={className}>{children}</p>
  }

  return {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
  }
})

import { LogEntrySheet } from '@/components/logging/log-entry-sheet'

describe('LogEntrySheet', () => {
  beforeEach(() => {
    addDurationEntryMock.mockReset()
    addXpMock.mockReset()
    addDurationEntryMock.mockReturnValue({
      entry: {
        id: 'generated-id',
        date: '2026-04-07',
        durationMin: 30,
        loggedAt: '2026-04-07T10:15:00.000Z',
      },
      xpEarned: 5,
    })
  })

  it('opens the sheet, focuses the minutes input, and previews XP live', async () => {
    render(<LogEntrySheet />)

    fireEvent.click(screen.getByRole('button', { name: /log activity/i }))

    const input = screen.getByLabelText(/minutes/i)

    await waitFor(() => {
      expect(input).toHaveFocus()
    })

    fireEvent.change(input, { target: { value: '30' } })

    expect(screen.getByText('= 5 XP')).toBeInTheDocument()
  })

  it('submits the duration, mirrors earned xp into the level store, and shows inline confirmation', async () => {
    render(<LogEntrySheet />)

    fireEvent.click(screen.getByRole('button', { name: /log activity/i }))
    fireEvent.change(screen.getByLabelText(/minutes/i), {
      target: { value: '30' },
    })
    fireEvent.click(screen.getByRole('button', { name: /log it/i }))

    expect(addDurationEntryMock).toHaveBeenCalledWith(30)
    expect(addXpMock).toHaveBeenCalledWith(5)
    expect(screen.getByText('+5 XP · That counted.')).toBeInTheDocument()
    expect(screen.getByText('Quiet win.')).toBeInTheDocument()

    await waitFor(
      () => {
        expect(screen.queryByText('+5 XP · That counted.')).not.toBeInTheDocument()
      },
      { timeout: 1500 },
    )
  })

  it('shows a validation error when the input is empty or invalid', () => {
    render(<LogEntrySheet />)

    fireEvent.click(screen.getByRole('button', { name: /log activity/i }))
    fireEvent.click(screen.getByRole('button', { name: /log it/i }))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Enter whole minutes greater than 0.',
    )
    expect(addDurationEntryMock).not.toHaveBeenCalled()
  })
})
