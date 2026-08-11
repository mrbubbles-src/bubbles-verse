# Architecture: @bubbles/ui

> Generated: 2026-04-05 | Scan Level: Exhaustive

## Executive Summary

Shared design system package providing 26 shadcn-style components built on Base UI React primitives, styled with Tailwind CSS v4 and class-variance-authority. Consumed by all 3 apps via subpath exports.

## Technology Stack

| Category | Technology | Version |
|----------|-----------|---------|
| UI Primitives | @base-ui/react | 1.3.0 |
| Icons | @hugeicons/react + core-free-icons | 1.1.6 / 4.0.0 |
| Styling | Tailwind CSS v4 | 4.1.18 |
| Variants | class-variance-authority (CVA) | 0.7.1 |
| Utilities | clsx + tailwind-merge | 2.1.1 / 3.5.0 |
| Forms | react-hook-form | 7.68.0 |
| Validation | Zod | 3.25.76 |
| Notifications | Sonner | 2.0.7 |
| Themes | next-themes | 0.4.6 |
| Animation | tw-animate-css | 1.4.0 |

## Package Exports

```
./globals.css     → src/styles/globals.css    # Tailwind v4 design tokens
./postcss.config  → postcss.config.mjs        # PostCSS entry
./lib/*           → src/lib/*.ts              # Utilities (cn, hugeicons, sonner)
./components/*    → src/components/*.tsx       # Custom components
./shadcn/*        → src/components/shadcn/*.tsx # Shadcn components
./hooks/*         → src/hooks/*.ts            # Hooks (use-mobile)
```

## Component Inventory (26 shadcn components)

### Dialog/Overlay
| Component | Variants | Key Features |
|-----------|----------|--------------|
| AlertDialog | size: default/sm | Confirmation dialogs with overlay blur |
| Dialog | — | Modal with optional close button |
| Sheet | side: top/right/bottom/left | Off-canvas drawer |
| Popover | — | Floating panel with arrow |

### Form/Input
| Component | Variants | Key Features |
|-----------|----------|--------------|
| Button | variant: 6, size: 7 | Primary action component |
| Input | — | Text input with aria-invalid styling |
| Textarea | — | Multi-line with field-sizing |
| Checkbox | — | Hugeicons tick icon |
| Select | size: sm/default | Scroll arrows, value display |
| Combobox | — | Search + chips mode + anchor ref |
| InputGroup | align: 4 directions | Addon groups (button, text, input) |
| Field | orientation: 3 modes | Labels, descriptions, errors |
| Form | — | react-hook-form wrapper with ARIA |
| Label | — | Basic accessible label |

### Navigation
| Component | Variants | Key Features |
|-----------|----------|--------------|
| NavigationMenu | — | Trigger with animated arrow, viewport |
| Tabs | variant: default/line | Horizontal/vertical with indicator |
| DropdownMenu | variant: default/destructive | Checkbox/radio items, submenus |
| Sidebar | variant: 3, collapsible: 3 | Full context management, keyboard shortcut, responsive sheet |

### Display
| Component | Variants | Key Features |
|-----------|----------|--------------|
| Avatar | size: 3 | Image + fallback + badge + group |
| Badge | variant: 6 | CVA-managed variants |
| Card | size: default/sm | Header/footer/content composition |
| Separator | orientation: 2 | Horizontal/vertical rule |
| Skeleton | — | Animated pulse placeholder |
| Tooltip | — | Floating with arrow + delay |

### Notification
| Component | Key Features |
|-----------|--------------|
| Sonner (Toaster) | Theme-aware toasts with Hugeicon custom icons |

## Architectural Patterns

1. **Data-Slot Attributes:** All components use `data-slot="name"` for CSS targeting
2. **CVA Variant System:** Button, Badge, Tabs use class-variance-authority
3. **Composition Pattern:** Card, Dialog, Sheet have sub-components (Header, Footer, Content)
4. **Context Hooks:** Sidebar exposes `useSidebar()` hook; Form wraps react-hook-form context
5. **Headless-First:** All built on Base UI primitives — styling applied, not locked
6. **Responsive Design:** Sidebar switches to Sheet at 768px breakpoint

## Utilities

| Export | Purpose |
|--------|---------|
| `cn()` | clsx + tailwind-merge for conflict-free class merging |
| `hugeicons` | Re-exports 48+ icon components |
| `toast` | Sonner toast function |

## Hook

| Hook | Returns | Purpose |
|------|---------|---------|
| `useIsMobile()` | boolean | Media query detection (768px) |

## TypeScript Config

Extends `@bubbles/typescript-config/react-library.json` with path alias `@bubbles/ui/*` → `./src/*`.
