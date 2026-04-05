# Architecture: TeacherBuddy

> Generated: 2026-04-05 | Scan Level: Exhaustive

## Executive Summary

Classroom tools app for teachers: student management, random name picker, quiz builder/player with timer, project groupings, and breakout room generator. All data persists in localStorage — no backend required.

## Technology Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| Runtime | React | 19.2.4 |
| Language | TypeScript | 5.9.3 |
| Styling | Tailwind CSS v4 | 4.1.18 |
| UI Library | @bubbles/ui (shadcn) | workspace |
| Themes | next-themes | 0.4.6 |
| Testing | Vitest + React Testing Library | 4.0.18 |
| Coverage | @vitest/coverage-v8 | 4.0.18 |
| Package Manager | Bun | 1.3.11 |

## Architecture Pattern

**Client-Side Application with Server-Rendered Shell**

- Pages are server components that render client component trees
- All interactive state managed via React Context + useReducer
- Data persists entirely in localStorage (no server-side storage)
- Skeleton loaders bridge server render → client hydration gap

## Routing Architecture

```
/                           # Dashboard with tool cards
/students                   # Class & student management
/generator                  # Random student name picker
/quizzes                    # Quiz builder/editor
/play                       # Quiz play mode with timer
/projects                   # Project grouping tool
/breakout-rooms             # Breakout room generator
/api/og                     # OG image generation
```

## State Management

### Central Store: `context/app-store.tsx`

**Pattern:** React Context + useReducer + localStorage sync

```
AppState {
  persisted: {                    # Synced to localStorage
    classes: Classroom[]
    activeClassId: string | null
    students: Student[]
    quizIndex: QuizIndexEntry[]
    quizzes: Record<string, Quiz>
    projectLists: ProjectList[]
    breakoutGroupsByClass: Record<string, BreakoutGroups>
  }
  domain: {
    generator: { usedStudentIds, currentStudentId }
    quizPlay: { selectedQuizId, usedQuestionIds, usedStudentIds, currentQuestionId, currentStudentId, answerRevealed }
  }
  ui: {
    quizEditor: { activeQuizId, editingQuestionId }
    isHydrated: boolean
  }
}
```

**Reducer:** 26 action types covering class/student/quiz/project/breakout CRUD + generator/play session state.

**Key behaviors:**
- Cascading deletes (class removal → students/projects/groups cleanup)
- Deduplication by normalized name
- Sorted quiz index (newest first)
- Active class scoping for all tools
- Hydration gate (`isHydrated`) prevents flash of empty state

### Hook: `useAppStore()`
Returns `{ state, actions }` with memoized action creators. All IDs generated via `crypto.randomUUID()`.

## Data Models

```typescript
Classroom { id, name, createdAt }
Student { id, name, status: "active"|"excluded", createdAt, classId }
Quiz { id, title, description?, questions: Question[], createdAt, updatedAt }
Question { id, prompt, answer }
QuizIndexEntry { id, title, createdAt }
ProjectList { id, classId, name, projectType, description, studentIds, groups: string[][], createdAt }
BreakoutGroups { classId, groupSize, groupIds: string[][], createdAt }
```

## Storage Architecture

**Library:** `lib/storage.ts` — localStorage abstraction with type-safe load/save functions.

| Key | Data |
|-----|------|
| `teacherbuddy:classes` | Classroom[] |
| `teacherbuddy:active-class` | string |
| `teacherbuddy:students` | Student[] |
| `teacherbuddy:quiz-index` | QuizIndexEntry[] |
| `teacherbuddy:quiz:{id}` | Individual Quiz objects |
| `teacherbuddy:project-lists` | ProjectList[] |
| `teacherbuddy:breakout-groups` | Record<classId, BreakoutGroups> |
| `teacherbuddy:timer` | PersistedTimerState |
| `teacherbuddy:timer-favorites` | number[] |
| `teacherbuddy:privacy-notice-acknowledged` | "1" |

**Hydration:** `loadPersistedState()` handles legacy format migration, orphan cleanup, and default class creation.

## Custom Hooks

| Hook | Purpose | Persistence |
|------|---------|-------------|
| `useTimer()` | Countdown timer with alerts | localStorage |
| `useStudentGenerator()` | Legacy random name picker | localStorage |
| `useCopyToClipboard()` | Clipboard API wrapper | None |
| `useTheme()` | Theme access via context | next-themes |

## API Design

Single endpoint: `GET /api/og` — OG image generation for social media previews.

No other API routes — all data operations happen client-side via the reducer.

## Component Architecture

```
AppShell
├── SidebarNav (phase-based navigation: Prepare/Start/Engage/Review)
├── Header (title + PageInfoDialog)
├── ClassSelector (global class switcher on feature pages)
└── Route Content
    ├── DashboardCards (/)
    ├── StudentForm + StudentTable (/students)
    ├── GeneratorCard (/generator)
    ├── QuizEditor → QuizEditorForm (/quizzes)
    ├── QuizPlayCard + QuizTimerCard (/play)
    ├── ProjectListBuilder + ProjectListView (/projects)
    └── BreakoutGroupsCard (/breakout-rooms)
```

**Skeleton loaders** (separate files): generator-card, quiz-editor, quiz-play-card, student-form, student-table.

## Testing Strategy

**Framework:** Vitest 4.0 + React Testing Library + jsdom

**Setup:**
- `vitest.setup.ts`: Mocks localStorage (in-memory) + `crypto.randomUUID()`
- `__tests__/test-utils.tsx`: `renderWithProvider()` wrapping AppStoreProvider

**Coverage targets:** `lib/`, `hooks/`, `context/`

**Test files (13):**
- Reducer tests (app-reducer)
- Utility tests (classes, students, storage, type-guards)
- Hook tests (use-timer, use-copy-to-clipboard)
- Component tests (student-form, quiz-editor-form, quiz-selector, select, page-info-dialog)

## Deployment

- **Platform:** Vercel
- **Build:** `bun --bun next build`
- **Env vars:** Optional `NEXT_PUBLIC_SITE_URL` for canonical URLs
- **No database required**
