---
stepsCompleted: ['step-01-document-discovery', 'step-02-prd-analysis', 'step-03-epic-coverage-validation', 'step-04-ux-alignment', 'step-05-epic-quality-review', 'step-06-final-assessment']
documentsInventoried:
  prd: _bmad-output/planning-artifacts/prd.md
  architecture: null
  epics: null
  ux: null
---

# Implementation Readiness Assessment Report

**Date:** 2026-04-06
**Project:** It Counts (bubbles-verse)

## PRD Analysis

### Functional Requirements

FR1: User can log an activity entry with either (a) a direct walking duration, or (b) start time + end time + non-walking time — system calculates walking time from option (b)
FR2: User can log multiple activity entries for the same day
FR3: System sums all walking time entries for a given day into a daily total
FR4: System calculates XP from the daily total using the fixed XP tier table
FR5: System applies the highest qualifying XP tier (5min→1XP, 10min→2XP, 20min→3XP, 30+min→5XP)
FR6: System enforces the XP cap — no XP earned beyond the 30+ minute tier regardless of duration
FR7: System accumulates XP across all logged days within the current level
FR8: System tracks weeks elapsed since current level started; week = Monday–Sunday, resets Monday
FR9: System displays level-up eligibility only when both 100 XP AND 4 full weeks have been reached
FR10: User can trigger a level-up when both eligibility conditions are met
FR11: System resets XP to zero and increments level number upon level-up
FR12: System calculates and displays OverXP (XP earned beyond the 100 threshold)
FR13: System displays an OverXP pace indicator (on track / slightly over / well over)
FR14: System displays requirements and new abilities of completed and upcoming level at level-up
FR15: User can view current level, XP progress toward 100, and weeks elapsed
FR16: User can view the daily XP total for the current day
FR17: User can view weekly XP total and the 10 XP/week motivational target
FR18: System never displays negative feedback or penalties for missing the weekly target
FR19: User can view current level requirements and unlocked abilities
FR20: System displays a short motivational message when the user logs an activity
FR21: System displays a short motivational message at end of week, always encouraging, never judgmental
FR22: System occasionally surfaces motivational messages on the dashboard between log entries
FR23: MVP messages from hardcoded curated collection; V2 messages personalised by AI based on user profile
FR24: User can view a chronological list of all past activity entries
FR25: User can view aggregated daily and weekly XP totals in history
FR26: Activity history persists across app sessions
FR27: App data persists locally via localStorage — no authentication required
FR28: App is installable as a PWA on iOS and Android
FR29: App functions offline — entries saved locally with no network dependency
FR30: User can configure an AI provider and API key (provider-agnostic: Anthropic, OpenAI, or compatible) [V2]
FR31: User can submit a natural language activity description for AI parsing [V2]
FR32: AI confirms parsed walking time and calculated XP before logging the entry [V2]
FR33: AI maintains a persistent user profile built from logged sessions and notes [V2]
FR34: AI surfaces personalised tips based on the user profile [V2]
FR35: AI recommends difficulty adjustments at level-up based on OverXP and profile context [V2]
FR36: User can view their AI-maintained profile [V2]
FR37: User can configure optional recurring activity days for reminder notifications [V2]
FR38: System sends a push notification on configured days if no activity logged by a set time [V2]
FR39: System sends a push notification if AI has recorded a start intent but no end time logged after configurable duration [V2]
FR40: User can opt in or out of each notification type individually [V2]
FR41: System awards hidden achievements based on usage patterns — not visible in advance [V2]
FR42: User is notified when an achievement is unlocked [V2]
FR43: User can view previously unlocked achievements (but not future ones) [V2]

**Total FRs: 43** (FR1–FR29 = MVP; FR30–FR43 = V2)

### Non-Functional Requirements

NFR1: Activity log entry: user action to confirmation < 500ms
NFR2: Initial app load on mobile (4G): LCP < 2.5s
NFR3: Dashboard render (all weekly/level data): < 300ms
NFR4: XP calculation synchronous — no perceivable delay
NFR5: Bundle size lean — no heavy dependencies without justification
NFR6: Activity data persists immediately on write — no loss on refresh, tab close, or device restart
NFR7: No data loss on service worker update or app upgrade
NFR8: Offline logging functional with no network dependency
NFR9: Weekly XP reset (Monday) executes correctly regardless of device timezone
NFR10: No sensitive personal data collected beyond activity timestamps and durations [MVP]
NFR11: No authentication required — localStorage data private by default [MVP]
NFR12: User-provided API key stored encrypted, never exposed in source/logs/client JS [V2]
NFR13: API key transmitted only to user-configured provider endpoint [V2]
NFR14: All interactive elements keyboard-navigable
NFR15: Semantic HTML with correct heading hierarchy and ARIA landmarks
NFR16: Color contrast compliant with monorepo global tokens
NFR17: No information conveyed by color alone
NFR18: Subtle, purposeful animations reinforce feedback — not decorative
NFR19: Animations run alongside user feedback, never delaying it
NFR20: Page transitions via View Transitions API (vercel-react-view-transitions pattern)
NFR21: Theme toggle (light/dark) uses View Transitions for smooth animated switch
NFR22: All animations respect prefers-reduced-motion

**Total NFRs: 22**

### Additional Requirements & Constraints

- Activity logs are permanent — no edit or delete (intentional, anti-perfectionism philosophy)
- Week definition: Monday–Sunday, resets Monday (affects weekly XP calc and target display)
- XP tier cap is hard: 30+ minutes = 5 XP regardless of duration (60 min = 5 XP, same as 30 min)
- OverXP does NOT carry forward as head-start — only affects next level difficulty
- Level 4+ intentionally not designed — system must be flexible enough to accommodate future level definitions
- Monorepo prerequisite: `@bubbles/theme` package must be extracted from TeacherBuddy before build
- V1 scope: single-user only, no auth, localStorage persistence
- PWA: iOS 16.4+ required for push notifications and homescreen install

## Epic Coverage Validation

**Status: N/A** — No epics document exists yet. PRD is the current artifact; epics will be created in the next phase.

## UX Alignment Assessment

**UX Document Status:** Not found — UX design has not been created yet.

**Assessment:** UX is clearly implied (web app, mobile-first, user-facing). The PRD contains UX constraints (no cards, design tokens from `@bubbles/ui`, light/dark mode, animations) but no wireframes or interaction flows. This is expected at this stage.

⚠️ **Warning:** UX design should be created before epic breakdown to ensure interaction flows are correctly scoped into stories.

## Epic Quality Review

**Status: N/A** — No epics exist yet.

## Summary and Recommendations

### Overall Readiness Status

**✅ PRD READY** — The PRD is complete, well-structured, and ready to feed into Architecture and UX Design.

**⏳ Implementation Not Ready** — Architecture, UX Design, and Epics do not yet exist. This is expected: the PRD was just completed and is the correct artifact at this stage.

### PRD Quality Findings

#### 🟡 Minor Gaps Requiring Attention Before Epics

**1. Unspecified: Level start date**
When does a level's 4-week timer start? On the day of first activity logged? On the day of level-up trigger? This determines how FR8 (weeks elapsed) is calculated. Recommended: level timer starts on the day of level-up (or app first use for Level 1).

**2. Unspecified: Entry validation for start/end time logging (FR1 option b)**
FR1 allows start time + end time + non-walking time. No validation rule defined for edge cases: what if non-walking time exceeds total duration? What if end time is before start time? Needs a validation rule (e.g., walking time floor = 0 min, no negative values).

**3. Vague quantifier: "Occasionally" in FR22**
"System occasionally surfaces motivational messages on the dashboard" — "occasionally" is not testable. Recommend specifying: e.g., shown once per session, or after N days without opening the app, or on a defined rotation.

**4. Timezone handling for weekly reset (NFR9)**
NFR9 states weekly reset executes correctly regardless of timezone, but no timezone strategy is defined. For localStorage-only MVP (single device, single user), device timezone is likely sufficient. Recommend explicitly stating: "Use device local time for all date calculations in MVP."

#### ✅ No Critical Issues Found

The PRD has:
- Clear, complete FR list (43 FRs, MVP vs V2 clearly labelled)
- Measurable NFRs with specific targets
- 4 user journeys covering success and edge cases
- Explicit scope decisions with rationale
- Strong product philosophy that should guide all downstream decisions

### Recommended Next Steps

1. **Resolve the 4 minor gaps above** — add clarifications directly to the PRD (small edits)
2. **Create Architecture document** — data model (localStorage schema), component architecture, PWA setup, V2 AI integration pattern
3. **Create UX Design** — interaction flows for the 4 user journeys, mobile-first screens
4. **Create `@bubbles/theme` package** — monorepo prerequisite before any It Counts build work begins
5. **Create Epics & Stories** — after Architecture and UX exist, break PRD into implementable stories

### Final Note

This assessment found **4 minor PRD gaps** across **1 category** (requirement clarity). No critical issues block progression. The PRD is solid and ready for the next phase. Address the minor gaps before epic breakdown to avoid ambiguity in story acceptance criteria.
