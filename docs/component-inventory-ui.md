# Component Inventory: @bubbles/ui

> Generated: 2026-04-05 | Scan Level: Exhaustive

## Shadcn Components (26)

All built on @base-ui/react primitives with Tailwind CSS v4 styling and `data-slot` attributes.

### Dialog & Overlay

| Component | Exports | Variants |
|-----------|---------|----------|
| AlertDialog | AlertDialog, Trigger, Portal, Overlay, Content, Header, Footer, Media, Title, Description, Action, Cancel | size: default/sm |
| Dialog | Dialog, Trigger, Portal, Close, Overlay, Content, Header, Footer, Title, Description | showCloseButton |
| Sheet | Sheet, Trigger, Close, Content, Header, Footer, Title, Description | side: top/right/bottom/left |
| Popover | Popover, Content, Description, Header, Title, Trigger | — |

### Form & Input

| Component | Exports | Variants |
|-----------|---------|----------|
| Button | Button, buttonVariants | variant: default/outline/secondary/ghost/destructive/link; size: default/xs/sm/lg/icon/icon-xs/icon-sm/icon-lg |
| Input | Input | — |
| Textarea | Textarea | — |
| Checkbox | Checkbox | — |
| Select | Select, Content, Group, Item, Label, ScrollDown/Up, Separator, Trigger, Value | size: sm/default |
| Combobox | Combobox, Input, Content, List, Item, Group, Label, Collection, Empty, Separator, Chips, Chip, ChipsInput, Trigger, Value, useComboboxAnchor | showTrigger, showClear |
| InputGroup | InputGroup, Addon, Button, Text, Input, Textarea | align: inline-start/end/block-start/end |
| Field | Field, Label, Description, Error, Group, Legend, Separator, Set, Content, Title | orientation: vertical/horizontal/responsive |
| Form | Form, Control, Description, Field, Item, Label, Message, useFormField | react-hook-form integration |
| Label | Label | — |

### Navigation

| Component | Exports | Variants |
|-----------|---------|----------|
| NavigationMenu | NavigationMenu, Content, Indicator, Item, Link, List, Trigger, Positioner | — |
| Tabs | Tabs, List, Trigger, Content, tabsListVariants | variant: default/line; orientation: horizontal/vertical |
| DropdownMenu | DropdownMenu, Portal, Trigger, Content, Group, Label, Item, CheckboxItem, RadioGroup, RadioItem, Separator, Shortcut, Sub, SubTrigger, SubContent | variant: default/destructive; inset |
| Sidebar | Sidebar + 23 sub-components, SidebarProvider, useSidebar | variant: sidebar/floating/inset; collapsible: offcanvas/icon/none |

### Display

| Component | Exports | Variants |
|-----------|---------|----------|
| Avatar | Avatar, Image, Fallback, Group, GroupCount, Badge | size: default/sm/lg |
| Badge | Badge, badgeVariants | variant: default/secondary/destructive/outline/ghost/link |
| Card | Card, Header, Footer, Title, Action, Description, Content | size: default/sm |
| Separator | Separator | orientation: horizontal/vertical |
| Skeleton | Skeleton | — |
| Tooltip | Tooltip, Trigger, Content, Provider | side, align, offsets |

### Notification

| Component | Exports | Features |
|-----------|---------|----------|
| Sonner (Toaster) | Toaster | Theme-aware, custom Hugeicon icons |

## Hooks (1)

| Hook | File | Returns | Purpose |
|------|------|---------|---------|
| useIsMobile | `src/hooks/use-mobile.ts` | boolean | 768px breakpoint detection |

## Utilities (3)

| Utility | File | Purpose |
|---------|------|---------|
| cn() | `src/lib/utils.ts` | clsx + tailwind-merge class merging |
| hugeicons | `src/lib/hugeicons.ts` | Re-exports 48+ Hugeicons + HugeiconsIcon wrapper |
| toast | `src/lib/sonner.ts` | Sonner toast function re-export |

## Design Tokens

Global CSS variables defined in `src/styles/globals.css` — Tailwind v4 theme with color scales, spacing, typography, and animation tokens consumed by all apps.
