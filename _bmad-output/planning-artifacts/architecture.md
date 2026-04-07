---
stepsCompleted: ['step-01-init', 'step-02-context', 'step-03-starter', 'step-04-decisions', 'step-05-patterns', 'step-06-structure', 'step-07-validation', 'step-08-complete']
status: 'complete'
completedAt: '2026-04-07'
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/product-brief-stepquest.md
workflowType: 'architecture'
project_name: 'It Counts'
user_name: 'Manuel'
date: '2026-04-07'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
43 FRs in 8 Capability-Bereichen. MVP (FR1–FR29) ist ausschließlich frontend/local — keine Serverkomponenten, keine Auth, kein API-Backend erforderlich. V2 (FR30–FR43) fügt AI-Integration, Push Notifications und Hidden Achievements hinzu.

Architekturell relevante FR-Cluster:
- **Logging-System** (FR1–FR4): Dual-input (Dauer ODER Start/End-Zeit), Tagesaggregation, Validierung
- **XP-Engine** (FR5–FR7): Deterministische Berechnung, muss 100% korrekt sein — zentrales Stück Logik
- **Level-Tracker** (FR8–FR14): Zeitbasiert (4-Wochen-Gate) + XP-basiert, OverXP, Level-Transition
- **Dashboard + History** (FR15–FR26): Read-heavy, aggregierte Views über localStorage-Daten
- **PWA + Offline** (FR27–FR29): Service Worker, Manifest, localStorage-native
- **AI-Layer** (FR30–FR36, V2): Externer API-Call, NLP-Parsing, persistiertes User-Profil
- **Notifications + Achievements** (FR37–FR43, V2): Push API, scheduled triggers

**Non-Functional Requirements mit architektonischen Konsequenzen:**

| NFR | Konsequenz |
|-----|-----------|
| LCP < 2.5s on 4G | Lean bundle, kein heavy SSR für persönliche Daten |
| Dashboard < 300ms | Aggregationen müssen gecacht/vorberechnet sein |
| Sofortige localStorage-Persistenz | Writes synchron nach jedem Log-Eintrag |
| Offline logging | Service Worker + localStorage-first, kein fetch-dependency |
| API key encrypted (V2) | Kein plaintext in localStorage — benötigt Encryption-Layer |
| View Transitions + Animationen | Client-side Navigation, kein full-page reload |
| prefers-reduced-motion | Animation-System muss Media-Query respektieren |

**Scale & Complexity:**

- Primary domain: Web/PWA Frontend (Single-User, keine Backend-Services für MVP)
- Complexity level: **Low** (MVP) → **Medium** (V2 mit AI + Push)
- Architekturelle Komponenten MVP: ~6 (Router, Logging UI, XP Engine, Level Tracker, Dashboard, History)
- V2 Additions: +3 (AI Client, Push Notification Manager, Achievements Engine)

### Technical Constraints & Dependencies

- **Monorepo:** `apps/it-counts` innerhalb bubbles-verse
- **Shared packages:** `@bubbles/ui`, `@bubbles/eslint-config`, `@bubbles/typescript-config`
- **Prerequisite:** `@bubbles/theme` muss vor dem Build extrahiert werden (next-themes + View Transitions Toggle)
- **Framework:** Next.js App Router — konsistent mit dem Rest des Monorepos
- **Persistence MVP:** localStorage only — kein Supabase, kein Auth
- **Persistence V3:** Supabase Migration (nicht jetzt designen, aber Schema muss migrierbar sein)
- **AI (V2):** Model-agnostisch (Anthropic/OpenAI/compatible) — kein proprietäres SDK lockin

### Cross-Cutting Concerns

1. **Date/Time-Handling** — Device local time überall; Wochengrenzen (Mo–So), Tagesgrenzen; Level-Timer-Start. Muss in einer zentralen Utility leben, nicht verstreut.
2. **XP Calculation Engine** — Wird beim Logging, im Dashboard, in der History und beim Level-up verwendet. Muss als pure function isoliert und vollständig testbar sein.
3. **Persistence Layer** — localStorage-Zugriff muss über ein abstrahiertes Interface laufen (erleichtert spätere Supabase-Migration in V3 ohne Umbau der gesamten App).
4. **Motivational Messaging** — Erscheint in 4 verschiedenen Kontexten (Log-Confirmation, Weekly Reset, Goal Reached, Session-Start). Braucht einen zentralen Message-Provider.
5. **Level Definition Schema** — Level 4+ ist noch nicht designed. Das Level-Schema muss erweiterbar sein ohne Breaking Changes auf bestehenden Daten.

## Starter Template

### Primary Technology Domain

Brownfield Next.js web app — neue App `apps/it-counts` in bestehendem Turborepo-Monorepo.

### Selected Approach: `create-next-app` → Monorepo-Anpassung

**Rationale:** Immer das offizielle CLI verwenden — nie manuell scaffolden oder aus Docs nachbauen. `create-next-app` liefert den kanonischen Ausgangspunkt; danach wird die App an Monorepo-Konventionen angepasst (Workspace-Packages, Turbo-Config, ESLint/TS-Configs).

**Status:** `apps/it-counts` wurde via `create-next-app` angelegt. Monorepo-Anpassung steht noch aus (erste Implementierungs-Story).

**Initialization Sequence (Epic 1, Story 1):**

```bash
# App bereits erstellt via:
bunx create-next-app@latest it-counts --typescript --tailwind --app --no-src-dir

# Shadcn initialisieren
cd apps/it-counts && bunx shadcn@latest init

# Shadcn-Komponenten immer via CLI hinzufügen
bunx shadcn@latest add <component>

# Monorepo-Packages einbinden (package.json anpassen)
# @bubbles/ui, @bubbles/theme, @bubbles/eslint-config, @bubbles/typescript-config
```

> **Regel:** Jedes neue Package / jede shadcn-Komponente wird über das offizielle CLI hinzugefügt — nie manuell aus Dokumentation nachgebaut.

### Monorepo Stack (vorgegeben)

| Bereich | Technologie |
|---------|-------------|
| Language | TypeScript 5.9.3 |
| Framework | Next.js 16.1.6 (App Router) |
| Runtime | React 19.2.4 |
| Package Manager | bun@1.3.11 |
| Monorepo | Turborepo 2.9.3 |
| Styling | Tailwind CSS v4 (`@tailwindcss/postcss`) |
| Design Tokens | `@bubbles/ui` |
| Theme / Dark Mode | `@bubbles/theme` (zu extrahieren — Prerequisite) |
| Testing | Vitest 4.x + `@testing-library/react` 16.x |
| Linting | ESLint 9.x via `@bubbles/eslint-config` |
| Formatting | Prettier + tailwindcss + sort-imports plugins |

### Code Organization

```
apps/it-counts/
├── app/              # Next.js App Router (pages, layouts, routes)
├── components/       # UI-Komponenten
├── lib/              # Business Logic
│   ├── xp.ts         # XP Calculation Engine (pure functions)
│   ├── levels.ts     # Level Definitions + Tracker
│   ├── dates.ts      # Date/Time Utilities (device local time)
│   └── storage.ts    # Persistence Abstraction (localStorage → Supabase-ready)
├── hooks/            # React Hooks
└── types/            # TypeScript Typen
```

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- localStorage schema and key structure
- State management library selection
- Next.js version pinned to latest

**Important Decisions (Shape Architecture):**
- Model-agnostic AI client pattern (V2)
- API key encryption strategy (V2)
- Hosting platform

**Deferred Decisions (Post-MVP):**
- Supabase migration schema (V3)
- Level 4+ system design
- Multi-user / self-hosted DB option (V3)

---

### Data Architecture

**Persistence:** localStorage, namespaced keys, all access via `lib/storage.ts` — no direct `localStorage` calls outside this module.

**Schema:**

```ts
// Key: "it-counts:entries"
type ActivityEntry = {
  id: string           // crypto.randomUUID()
  date: string         // "YYYY-MM-DD" (device local time)
  durationMin: number  // calculated walking time in minutes
  loggedAt: string     // ISO 8601 timestamp
}

// Key: "it-counts:current-level"
type LevelState = {
  level: number
  startDate: string    // "YYYY-MM-DD" — Level 1: first entry date; Level 2+: level-up date
  xp: number           // accumulated XP in current level
  overXp: number       // OverXP from previous level (affects next-level difficulty)
}

// Key: "it-counts:settings"
type AppSettings = {
  // MVP: empty — reserved for V2 (notifications, AI provider config)
}
```

**Rationale:**
- 3 namespaced keys keeps reads targeted — no full-scan aggregations
- `storage.ts` abstraction makes Supabase migration (V3) a single-file change
- `ActivityEntry` is append-only — no edit/delete (intentional anti-perfectionism principle)
- All date values use device local time (`YYYY-MM-DD` strings, not UTC timestamps)

---

### Authentication & Security

**MVP:** No authentication. No sensitive data beyond activity timestamps and durations. localStorage is private by default.

**V2 (API Key):** User-provided API key encrypted in the browser using the **Web Crypto API** (AES-GCM, device-generated key via `crypto.getRandomValues`). Key stored encrypted in localStorage — never stored or transmitted in plaintext. Transmitted only to the user-configured provider endpoint via `lib/ai.ts`.

---

### API & Communication Patterns

**MVP:** No backend API. All data operations are synchronous localStorage reads/writes.

**V2 — AI Client:** Model-agnostic fetch-based client in `lib/ai.ts`. No SDK lock-in. Client receives `{ provider, apiKey, model, endpoint }` from `AppSettings` and constructs provider-specific requests directly. Supports Anthropic, OpenAI, and any OpenAI-compatible API.

---

### Frontend Architecture

**Framework:** Next.js 16.2.2 (latest), App Router. Client Components where interactivity/localStorage required; Server Components for static layout shells.

**State Management:** **Zustand** — minimal, no boilerplate, works well with Next.js App Router (client-side stores). One store per domain concern:
- `useActivityStore` — entries, daily/weekly aggregates
- `useLevelStore` — level state, XP, OverXP, eligibility
- `useUIStore` — transient UI state (motivational message shown this session, etc.)

Stores hydrate from `lib/storage.ts` on mount; write-through on every mutation.

**Routing:** App Router pages. Navigation via View Transitions API (`vercel-react-view-transitions` pattern). Planned routes:
- `/` — Dashboard
- `/log` — Activity Log Entry
- `/history` — Activity History
- `/level-up` — Level Transition screen
- `/settings` (V2) — AI provider + notification config

**Component Architecture:** shadcn/ui components (added via CLI only). Custom components in `components/`. No card-heavy layouts — prefer list/section-based hierarchy per PRD design constraints.

**Animations:** Purposeful micro-animations for XP gain, log confirmation, level-up. All respect `prefers-reduced-motion`. Never delay feedback.

---

### Infrastructure & Deployment

**Hosting:** Vercel. `apps/it-counts` deployed as a new Vercel project within the existing bubbles-verse workspace (not yet live — this is the target platform).

**Build:** Turborepo pipeline (`turbo build`) — existing monorepo CI/CD applies. Remote cache already in place.

**Environment:** No server-side env vars required for MVP. V2 adds no backend secrets (API key lives client-side, encrypted).

---

### Decision Impact Analysis

**Implementation Sequence:**
1. `lib/storage.ts` — persistence abstraction (all other modules depend on it)
2. `lib/dates.ts` — date utilities (needed by XP engine and level tracker)
3. `lib/xp.ts` — XP calculation pure functions (needed by stores)
4. `lib/levels.ts` — level definitions + tracker (depends on xp.ts and dates.ts)
5. Zustand stores — wire business logic to UI state
6. App Router pages + components — consume stores
7. PWA: service worker + manifest
8. V2: `lib/ai.ts` + encrypted settings

**Cross-Component Dependencies:**
- `storage.ts` ← all stores hydrate from here
- `dates.ts` ← used by xp.ts, levels.ts, weekly reset logic
- `xp.ts` ← used by activity store, dashboard, history
- `levels.ts` ← depends on xp.ts; drives level store
- All lib modules are pure or storage-only — no React imports, fully unit-testable

## Implementation Patterns & Consistency Rules

### Naming Patterns

**Files & Directories:** kebab-case throughout
```
log-entry-form.tsx
use-activity-store.ts
xp-calculation.test.ts
```

**React Components:** PascalCase exports
```ts
export function LogEntryForm() { ... }
```

**Types:** `type` (not `interface`) — consistent with shadcn/Tailwind v4 conventions

**Variables & Functions:** camelCase
```ts
const dailyTotal = ...
function calculateXp(durationMin: number): number { ... }
```

**Zustand Stores:** `useXxxStore` — one store per domain concern

---

### Structure Patterns

**Tests:** dedicated `__tests__/` directory — never co-located with source
```
apps/it-counts/__tests__/lib/xp.test.ts
apps/it-counts/__tests__/components/log-entry-form.test.tsx
```

**Components:** grouped by feature, not by type
```
components/
  logging/     # log-entry-form, duration-input, time-picker
  dashboard/   # xp-progress, level-info, weekly-summary
  history/     # activity-list, daily-group
  shared/      # motivational-message, level-badge
```

**Skeletons:** separate files (e.g. `log-entry-form-skeleton.tsx` alongside `log-entry-form.tsx`)

---

### Format Patterns

**localStorage JSON keys:** camelCase (TypeScript-native, no mapping layer needed)

**Date format:** `YYYY-MM-DD` strings (device local time) for all date keys; ISO 8601 only for `loggedAt` timestamp

**Duration & XP values:** always `number` in minutes (never strings, never seconds)

---

### State Management Patterns (Zustand)

```ts
// Store file: hooks/use-activity-store.ts
// Pattern: state + actions in same object, no slice pattern (app too small)

const useActivityStore = create<ActivityStore>((set, get) => ({
  entries: [],
  loadFromStorage: () => { ... },
  addEntry: (entry) => {
    set((s) => ({ entries: [...s.entries, entry] }))
    storage.saveEntries(get().entries) // write-through immediately
  },
}))
```

**Rule:** Every store mutation writes through to `storage.ts` immediately — no deferred flush.

**Hydration:** Stores load from storage on mount via `loadFromStorage()` called in the root layout.

---

### Error Handling Patterns

- `lib/` functions: throw only on programmer error (wrong inputs) — no user-facing strings in lib
- Components: `try/catch` only at storage boundaries; error states via store booleans
- MVP: no global ErrorBoundary — local state sufficient for app size
- V2 AI errors: surface via store `{ aiError: string | null }` — displayed inline, never crash

---

### Loading State Patterns

- MVP: all operations synchronous → no loading states needed
- V2 AI calls: `{ isAiParsing: boolean }` in the relevant store only
- No global loading indicator — loading is always scoped to the action that triggered it

---

### Process Patterns

**Validation:** at form boundary only (components) — `lib/` functions assume valid input

**Anti-patterns to avoid:**
- Direct `localStorage` access outside `lib/storage.ts`
- Importing React in `lib/` files
- `interface` instead of `type`
- Co-located test files
- `any`, `unknown`, `never` in TypeScript (per CLAUDE.md)

## Project Structure & Boundaries

### Monorepo CSS Convention

Each app owns one app-specific CSS file named `<app-name>.css` (e.g. `it-counts.css`). This file contains only truly app-specific overrides. The vast majority of styles come from shared packages:

- **`@bubbles/ui/globals.css`** — design tokens, typographic defaults (h1–h6, paragraph sizes, line-heights), monorepo-wide base styles
- **`@bubbles/theme`** — light/dark mode setup (next-themes), View Transitions animated theme toggle, global View Transitions CSS
- **`app/it-counts.css`** — app-specific overrides only; often empty

### Complete Project Directory Structure

```
apps/it-counts/
├── app/
│   ├── layout.tsx                    # Root layout — store hydration, @bubbles/theme provider
│   ├── page.tsx                      # Dashboard (FR15–FR19)
│   ├── it-counts.css                 # App-specific CSS overrides (often empty)
│   ├── log/
│   │   └── page.tsx                  # Log Entry (FR1–FR4)
│   ├── history/
│   │   └── page.tsx                  # Activity History (FR24–FR26)
│   ├── level-up/
│   │   └── page.tsx                  # Level Transition screen (FR14)
│   └── settings/                     # V2
│       └── page.tsx                  # AI config + notification settings
├── components/
│   ├── logging/
│   │   ├── log-entry-form.tsx        # Main form — duration OR start/end/non-walking
│   │   ├── log-entry-form-skeleton.tsx
│   │   ├── duration-input.tsx        # Direct duration input
│   │   └── time-range-input.tsx      # Start/end + non-walking time input
│   ├── dashboard/
│   │   ├── xp-progress.tsx           # XP bar + level counter
│   │   ├── level-info.tsx            # Current level requirements + abilities
│   │   ├── weekly-summary.tsx        # Weekly XP + 10 XP target
│   │   ├── over-xp-indicator.tsx     # OverXP pace (FR12–FR13)
│   │   └── level-up-indicator.tsx    # Eligibility banner (FR9)
│   ├── history/
│   │   ├── activity-list.tsx         # Full chronological list
│   │   ├── daily-group.tsx           # Day-level grouping + daily XP
│   │   └── weekly-group.tsx          # Week-level grouping + weekly XP
│   ├── shared/
│   │   ├── motivational-message.tsx  # Reusable message display (FR20–FR22b)
│   │   └── level-badge.tsx           # Level indicator used in multiple views
│   └── ui/                           # shadcn components (CLI-generated only)
├── hooks/
│   ├── use-activity-store.ts         # Entries, daily/weekly aggregates
│   ├── use-level-store.ts            # Level state, XP, OverXP, eligibility
│   └── use-ui-store.ts               # Transient UI state (session message shown, etc.)
├── lib/
│   ├── storage.ts                    # localStorage abstraction (Supabase-ready interface)
│   ├── xp.ts                         # XP calculation pure functions (FR5–FR7)
│   ├── levels.ts                     # Level definitions + tracker (FR8–FR14)
│   ├── dates.ts                      # Date/time utilities, week boundaries (device local)
│   ├── messages.ts                   # Hardcoded motivational message collection (FR23)
│   └── ai.ts                         # V2: model-agnostic fetch client
├── types/
│   └── index.ts                      # ActivityEntry, LevelState, AppSettings + all shared types
├── __tests__/
│   ├── lib/
│   │   ├── xp.test.ts
│   │   ├── levels.test.ts
│   │   ├── dates.test.ts
│   │   └── storage.test.ts
│   └── components/
│       └── log-entry-form.test.tsx
├── public/
│   ├── manifest.json                 # PWA manifest (FR28)
│   ├── sw.js                         # Service worker — cache + offline (FR29)
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
├── documentation/
│   └── level-design.md               # Level 1–3 specs + extensibility notes
├── next.config.ts
├── postcss.config.mjs
├── package.json
├── tsconfig.json
├── eslint.config.mjs
├── CHANGELOG.md
└── README.md
```

### Architectural Boundaries

**Storage Boundary:** `lib/storage.ts` is the only point with localStorage access. All reads/writes go through this interface — nothing else touches `localStorage` directly.

**Business Logic Boundary:** `lib/` has no React imports. Hooks in `hooks/` mediate between lib and UI. Components import from hooks only.

**Data Flow:**
```
storage.ts → store.loadFromStorage() [on mount]
           ↓
     Zustand store
           ↓
     React components
           ↓
     user action → store mutation → storage.ts [write-through]
```

### Requirements to Structure Mapping

| FR Cluster | Components | Hooks | Lib |
|-----------|-----------|-------|-----|
| Activity Logging (FR1–FR4) | `components/logging/` | `use-activity-store.ts` | `xp.ts`, `storage.ts` |
| XP Engine (FR5–FR7) | — | `use-activity-store.ts` | `xp.ts` |
| Level Tracker (FR8–FR14) | `components/dashboard/level-*` | `use-level-store.ts` | `levels.ts`, `dates.ts` |
| Dashboard (FR15–FR19) | `components/dashboard/` | both stores | `xp.ts`, `levels.ts` |
| Motivational Messages (FR20–FR23) | `components/shared/motivational-message.tsx` | `use-ui-store.ts` | `messages.ts` |
| History (FR24–FR26) | `components/history/` | `use-activity-store.ts` | `dates.ts` |
| PWA/Offline (FR27–FR29) | — | — | `public/` |
| AI (FR30–FR36, V2) | `app/settings/` | — | `ai.ts`, `storage.ts` |

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:** All technology choices are compatible. Next.js 16.2.2 App Router, Zustand, localStorage, and shadcn/ui work together without conflict. No version incompatibilities identified.

**Pattern Consistency:** Naming conventions (kebab-case files, PascalCase components, `type` over `interface`) are consistent across all areas. Store patterns align with App Router's client-component model.

**Structure Alignment:** Project structure supports all architectural decisions. Storage boundary, business logic boundary, and data flow are cleanly separated and enforceable.

---

### Requirements Coverage Validation ✅

**Functional Requirements (MVP — FR1–FR29):** All covered. Every FR cluster maps to specific files and directories (see Requirements to Structure Mapping above).

**Functional Requirements (V2 — FR30–FR43):** Architecturally stubbed — `lib/ai.ts`, `app/settings/page.tsx`, Web Crypto API for key encryption. Not built in MVP, but no structural rework needed when V2 begins.

**Non-Functional Requirements:**
| NFR | Architectural Support |
|-----|----------------------|
| LCP < 2.5s | localStorage-first, lean bundle, no SSR for personal data |
| Dashboard < 300ms | Synchronous localStorage reads, Zustand derived state |
| Offline logging | Custom Service Worker (Cache-First) + localStorage |
| Immediate persistence | Write-through on every store mutation |
| View Transitions | `@bubbles/theme` package |
| prefers-reduced-motion | Noted in Frontend Architecture — respected by all animations |
| API key encrypted (V2) | Web Crypto API (AES-GCM) |

---

### Implementation Readiness Validation ✅

**Decision Completeness:** All critical decisions documented with versions. Technology stack fully specified. Integration patterns defined.

**Structure Completeness:** Complete directory tree with all files. FR-to-file mapping explicit. Component boundaries clear.

**Pattern Completeness:** Naming, structure, state management, error handling, and loading state patterns all defined. Anti-patterns documented.

---

### Gap Analysis Results

**Critical Gaps:** None.

**Resolved During Validation:**
- PWA tooling gap identified and resolved: **Custom Service Worker** (`public/sw.js`, Cache-First for static assets). No third-party PWA package — `@ducanh2912/next-pwa` was evaluated but not adopted (last updated 2 years ago). Registration via `useEffect` in `app/layout.tsx`.

**Deferred by Design:**
- Level 4+ system — intentionally not designed; `lib/levels.ts` schema must be extensible
- Supabase migration — `lib/storage.ts` abstraction makes this a single-file change in V3
- OverXP → difficulty algorithm — handled by AI recommendation in V2

---

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context and constraints analyzed
- [x] Scale and complexity assessed (Low MVP → Medium V2)
- [x] Technical constraints identified (monorepo, localStorage-first, PWA)
- [x] Cross-cutting concerns mapped (dates, XP engine, persistence, messaging)

**✅ Architectural Decisions**
- [x] Technology stack fully specified with versions
- [x] State management: Zustand
- [x] Persistence: localStorage via `storage.ts` abstraction
- [x] Security: Web Crypto API for V2 API key
- [x] Hosting: Vercel
- [x] PWA: Custom Service Worker

**✅ Implementation Patterns**
- [x] Naming conventions (files, components, stores, types)
- [x] Structure patterns (tests, components by feature)
- [x] State management patterns (write-through, hydration)
- [x] Error handling and loading state patterns
- [x] Anti-patterns documented

**✅ Project Structure**
- [x] Complete directory structure with all files
- [x] Architectural boundaries defined
- [x] FR-to-structure mapping complete
- [x] CSS convention established (`it-counts.css`, `@bubbles/ui` for globals)

---

### Architecture Readiness Assessment

**Overall Status: READY FOR IMPLEMENTATION**

**Confidence Level: High**

**Key Strengths:**
- Clean separation: lib (pure) → hooks (state) → components (UI)
- Storage abstraction makes V3 Supabase migration low-risk
- No external PWA dependency — custom SW keeps the stack lean
- All MVP FRs fully covered with explicit file locations
- Anti-perfectionism philosophy encoded at data layer (append-only entries)

**Areas for Future Enhancement:**
- Level 4+ design (deferred intentionally)
- OverXP → difficulty scaling algorithm (V2, AI-assisted)
- Notification scheduling strategy (V2, Push API)

---

### Implementation Handoff

**First Implementation Priority (Epic 1, Story 1):**
```bash
# 1. Adapt apps/it-counts to monorepo conventions
#    - Update package.json (workspace packages, scripts)
#    - Add @bubbles/ui, @bubbles/theme, @bubbles/eslint-config, @bubbles/typescript-config
#    - Update tsconfig.json, eslint.config.mjs
#    - Update next.config.ts (Next.js 16.2.2)
#    - Rename globals.css → it-counts.css

# 2. Initialize shadcn
cd apps/it-counts && bunx shadcn@latest init

# 3. Implement lib/ layer first (storage → dates → xp → levels → messages)
# 4. Zustand stores
# 5. App Router pages + components
# 6. PWA (manifest + custom SW)
```

**AI Agent Guidelines:**
- Follow naming conventions exactly (kebab-case files, PascalCase exports, `type` not `interface`)
- Never access `localStorage` outside `lib/storage.ts`
- Never import React in `lib/` files
- Add shadcn components via CLI only — never copy from docs
- Tests go in `__tests__/` — never co-located
