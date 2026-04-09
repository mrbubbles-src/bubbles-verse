# Component Inventory: TeacherBuddy

> Generated: 2026-04-05 | Scan Level: Exhaustive

## Layout Components

| Component | File | Props | Purpose |
|-----------|------|-------|---------|
| AppShell | `components/app-shell.tsx` | appVersion, defaultSidebarOpen, children, footer | Global sidebar + header + main content wrapper |
| AppSidebar | `components/app-sidebar.tsx` | — | Legacy hash-link sidebar (demo mode) |
| Header | `components/header.tsx` | — | Page title + info button |
| Footer | `components/footer.tsx` | — | App footer |

## Navigation Components

| Component | File | Props | Purpose |
|-----------|------|-------|---------|
| SidebarNav | `components/navigation/sidebar-nav.tsx` | — | Phase-based nav menu (Prepare/Start/Engage/Review) |
| ClassSelector | `components/classes/class-selector.tsx` | — | Global class dropdown (syncs with store) |

## Form Components

| Component | File | Props | Purpose |
|-----------|------|-------|---------|
| StudentForm | `components/students/student-form.tsx` | — | Add class/students, text+JSON import |
| StudentTable | `components/students/student-table.tsx` | — | Student roster: sort, edit, toggle absent, delete |
| QuizEditorForm | `components/quizzes/quiz-editor-form.tsx` | — | Quiz Q&A editor: add/edit/delete questions |
| QuizEditor | `components/quizzes/quiz-editor.tsx` | — | Wrapper with hydration skeleton |
| QuizSelector | `components/quizzes/quiz-selector.tsx` | label, value, onChange, quizzes, placeholder | Reusable quiz dropdown |

## Display/Interactive Components

| Component | File | Props | Purpose |
|-----------|------|-------|---------|
| DashboardCards | `components/dashboard/dashboard-cards.tsx` | — | Homepage tool cards by phase |
| GeneratorCard | `components/generator/generator-card.tsx` | — | Random student picker with stats |
| QuizPlayCard | `components/play/quiz-play-card.tsx` | — | Live quiz: draw question+student, reveal answer |
| QuizTimerCard | `components/play/quiz-timer-card.tsx` | — | Countdown timer with audio alerts + presets |
| BreakoutGroupsCard | `components/breakout/breakout-groups-card.tsx` | — | Randomized group generator + copy |
| ProjectListBuilder | `components/projects/project-list-builder.tsx` | — | Create project with student groups |
| ProjectListView | `components/projects/project-list-view.tsx` | — | Display saved project lists |
| StudentNameGenerator | `components/student-name-generator.tsx` | — | Legacy random name generator |

## Utility Components

| Component | File | Props | Purpose |
|-----------|------|-------|---------|
| ThemeToggle | `components/utility/theme-toggle.tsx` | — | Dark/light theme button |
| PageInfoDialog | `components/utility/page-info-dialog.tsx` | — | Help/info modal per page |
| PrivacyNotice | `components/privacy-notice.tsx` | — | localStorage usage banner |

## Loading Skeletons

| Component | File |
|-----------|------|
| GeneratorCardSkeleton | `components/loading/generator-card-skeleton.tsx` |
| QuizEditorSkeleton | `components/loading/quiz-editor-skeleton.tsx` |
| QuizPlayCardSkeleton | `components/loading/quiz-play-card-skeleton.tsx` |
| StudentFormSkeleton | `components/loading/student-form-skeleton.tsx` |
| StudentTableSkeleton | `components/loading/student-table-skeleton.tsx` |

## UI Variants

| File | Purpose |
|------|---------|
| `components/ui/badge-variants.ts` | Badge variant definitions |
| `components/ui/button-variants.ts` | Button variant definitions |

## Consumed from @bubbles/ui

Button, Card, Sidebar, Sheet, Dialog, Input, Select, Tabs, Tooltip, Badge, Skeleton, Separator, NavigationMenu, Toaster, Form, Popover, Combobox
