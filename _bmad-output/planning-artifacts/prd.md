---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
classification:
  projectType: web_app
  designPriority: mobile-first
  domain: general
  complexity: low
  projectContext: brownfield
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-stepquest.md
  - _bmad-output/planning-artifacts/product-brief-stepquest-distillate.md
  - inline: system-spec-v1.5 (provided by Manuel in session)
workflowType: 'prd'
---

# Product Requirements Document — It Counts

**Author:** Manuel
**Date:** 2026-04-06

---

## Executive Summary

It Counts is a personal movement tracking app built on a single non-negotiable principle: every outdoor movement counts, without exception. It solves a specific failure mode — not a lack of fitness, but the cognitive overhead of self-judgment that makes leaving the apartment harder than it needs to be.

Built for Manuel's personal use (V1), designed generally enough for anyone with the same problem. No monetisation, no social layer, no GPS. A fixed XP table converts active movement time to points; a minimum 4-week level duration prevents dopamine-chasing; an optional AI layer (V2, bring your own API key, model-agnostic) reduces logging friction and personalises progression over time.

### What Makes It Special

Most movement apps optimise for performance — more steps, more distance, more calories. It Counts optimises for consistency. The XP cap is intentional: 60 minutes earns the same XP as 30. The core rule applies to all active outdoor movement — the grocery walk, the 5-minute errand, the route to an appointment. Short incidental waiting (bus, queue) is fine to include; extended passive standing can reasonably be excluded. The distinction is low-friction: log what you moved, don't obsess over deducting.

Fragmented movement is a first-class feature. No streaks, no punishment for missed days, no minimum threshold. The product name is the philosophy: every time you went outside and moved — It Counts.

### Background

This app was designed to solve a real, personal failure. In August 2025, Manuel started working out to lose weight. It worked initially, but the system generated stress on top of existing stress — obsessing over fitting in workouts, frustration when weight plateaued, eventual complete abandonment. The problem wasn't willpower. It was perfectionism baked into every system he tried. It Counts is the direct response: get moving consistently, without stress, without judgment. Weight loss is a side effect. Consistency is the goal.

---

## Project Classification

| Field | Value |
|-------|-------|
| Project Type | Web app (Next.js App Router) |
| Design Priority | Mobile-first |
| Domain | Personal wellness / movement tracking |
| Complexity | Low |
| Project Context | Brownfield — new app in `apps/it-counts` within bubbles-verse monorepo |
| V1 Scope | Single-user (owner only) |

---

## Success Criteria

### User Success

- Manuel goes outside more often as a direct result of using the app — even on low-energy days
- Every outdoor activity gets logged without internal debate about whether it "counts"
- The 5-minute minimum is used on rough days and feels genuinely valid, not like cheating
- After 4 weeks at Level 1, XP earned feels like an honest reflection of actual effort
- Level progression feels earned, not rushed or gamed
- The system causes zero stress — no guilt, no shame, no "I should have done more"

### Business Success

Personal project, no revenue goals. Success is sustained use and genuine behavioural change:

- App actively used for at least 3 consecutive levels (12+ weeks) without falling off
- Manuel notices a real shift in how often he leaves the apartment
- V2 (AI) is considered worth adding because manual mode already proved its value

### Technical Success

- XP calculation correct 100% of the time: fragmented movement summed correctly, tier cap applied consistently
- 4-week level minimum enforced — level-up impossible before week 4 regardless of XP
- OverXP tracked accurately and displayed
- Activity history persists reliably — no data loss
- App loads fast on mobile (primary use case: logging on the go)

### Measurable Outcomes

| Outcome | Definition of Done |
|---------|-------------------|
| Core loop | Log activity → XP calculated → progress visible → level-up after 4 weeks + 100 XP |
| XP correctness | Daily entries summed; highest qualifying tier applied; cap enforced |
| Level system | 100 XP threshold + 4-week minimum both enforced; OverXP tracked separately |
| MVP usability | Full core loop functional without AI — manual logging sufficient |
| V2 AI logging | Natural language parsed correctly; XP calculated and confirmed before logging |

---

## Product Scope

### MVP — Phase 1

- Activity log entry: direct duration OR start time + end time + non-walking time (system calculates walking time)
- Multiple entries per day, summed to daily total
- Weekly XP summary with 10 XP/week motivational target (never punishing)
- Week defined as Monday–Sunday; resets each Monday
- Level display: current level, XP toward 100, weeks elapsed
- OverXP counter + pace indicator (on track / slightly over / well over)
- Level-up eligibility indicator (4 weeks AND 100 XP both required)
- Level transition: XP reset, new level requirements displayed
- Motivational messages: on log, end of week, and dashboard (hardcoded collection)
- Activity history
- Data persistence: localStorage (no auth, no server)
- PWA installable on iOS and Android homescreen
- Basic SEO
- Light/dark mode via `@bubbles/theme` package

### AI Layer — Phase 2 (V2)

- Natural language logging via user-provided API key (model-agnostic: Anthropic, OpenAI, or compatible)
- AI confirms parsed walking time and XP before logging
- AI-maintained user profile: accumulated context from sessions
- Personalised tips based on profile
- AI difficulty recommendation at level-up
- API key management (provider + key configurable)
- Personalised motivational messages replacing hardcoded collection
- Push notifications: forgotten end-time reminder + anchor-day activity reminder
- Hidden achievements (triggered by AI, not visible in advance)

### Platform — Phase 3

- Cross-device sync via Supabase (after localStorage proves the concept)
- Level 4+ system design (intentionally deferred)
- Refined difficulty scaling algorithm
- Potential multi-user support — open question: self-hosted DB option to eliminate owner's data privacy concerns

---

## User Journeys

### Journey 1 — The Normal Day (Primary, Success Path)

Manuel had a decent day. He walked to the pharmacy, did a grocery run, wandered around a bit. Back home, phone in hand.

He opens It Counts. He types in 35 minutes total walking time. The app calculates 5 XP — 30+ minute tier. Weekly total ticks up to 8 XP; target is 10. He notes he needs one more decent outing this week. Closes the app.

30 seconds. No decision about whether the pharmacy walk "counts." It does. Logged. Done.

*Reveals: quick-entry logging, daily XP calculation, weekly progress view.*

---

### Journey 2 — The Low-Energy Day (Primary, Edge Case)

Rough day. Manuel hasn't left the apartment. 6pm. He knows he won't do much — but there's the rule: 5 minutes minimum, always counts.

He puts on shoes. Goes to the corner and back. 7 minutes. He logs it: 1 XP. The app doesn't comment on the size of the entry. XP added, weekly total barely moves, engagement continues.

No "that's all?" No sad face. 1 XP, move on.

*Reveals: no-judgment UI, low-friction entry, no streak mechanics, neutral/positive feedback on small entries.*

---

### Journey 3 — The Fragmented Day (Primary, Edge Case)

Scattered day. Brief walk in the morning (10 min), quick errand after lunch (5 min), short walk in the evening (15 min). Each trip felt small. None felt "worth logging" on its own.

He adds three entries. The app sums them: 30 minutes total = 5 XP. Fragmentation cost him nothing.

*Reveals: multiple entries per day, daily aggregation, fragment summary display.*

---

### Journey 4 — The Level-Up (Primary, Milestone)

Week 4 ends. Manuel opens the app: 112 XP, 4 weeks completed. Level-up eligibility lights up — both conditions met.

OverXP: 12 above threshold. Indicator: "slightly over pace." He levels up to Level 2. XP resets to 0; OverXP signal carries forward — Level 2 starts with a slight intensity nudge.

Level 2 requirement: one intentional 10–20 min walk per week. It feels achievable. A month of Level 1 made it feel that way.

*Reveals: level-up flow, OverXP display, level transition screen, next level requirements.*

---

### Journey Requirements Summary

| Journey | Capabilities Needed |
|---------|-------------------|
| Normal day | Quick entry form, XP auto-calc, daily/weekly totals |
| Low-energy day | Neutral UI for small entries, no streak pressure, 1 XP confirmation |
| Fragmented day | Multiple entries per day, daily aggregation, fragment summary |
| Level-up | Eligibility indicator, OverXP display, level transition, next level requirements |

**Note:** V1 is single-user — no admin, support, or API-consumer journeys applicable. V2 may introduce a secondary user journey if the app opens to others.

---

## Innovation & Novel Patterns

### Anti-Perfectionism by Design

Most wellness apps are built around visible progress systems — streaks, achievements, targets, leaderboards. These work for some users but create a specific failure mode for others: perfectionism-driven stress leading to complete abandonment. It Counts rejects the reward-optimisation model at the architecture level:

- No streaks to protect
- No achievement lists visible in advance
- XP cap intentionally prevents intensity from being rewarded over consistency
- Weekly target is motivational, never punishing — missing it has no consequence
- The 5-minute minimum is a pressure valve, not a consolation prize
- Activity logs are permanent — no edit or delete, preventing retroactive "cleanup" of imperfect entries

### Hidden Achievements (V2)

The one exception to the no-visible-rewards model: achievements that the user cannot see in advance. They appear after the fact, as recognition rather than targets. Because they're invisible until triggered, they can't be gamed, optimised for, or stressed about. Surprise and validation without pressure.

### Validation Approach

No technical validation needed. Effectiveness is inherently personal — the success metric is whether Manuel goes outside more and feels less stressed. Level 1 (first 4 weeks) is the validation window.

---

## Web App Requirements

### Platform Overview

Mobile-first Next.js App Router web application, installable as a PWA on iOS and Android. Primary use: mobile (quick logging on the go). Secondary use: desktop. No native app required.

### Browser Support

| Environment | Support |
|-------------|---------|
| Modern browsers (Chrome, Safari, Firefox, Edge) | ✓ Full |
| iOS Safari (PWA, Homescreen) | ✓ iOS 16.4+ |
| Android Chrome (PWA, Homescreen) | ✓ Full |
| Legacy browsers | ✗ Not supported |

### PWA Requirements

- Installable on iOS and Android homescreen
- Offline-capable: entries saved to localStorage with no network dependency
- App manifest with icon, name, theme color
- Service worker for caching and offline support

### Design Constraints

- Mobile-first layout — small viewports first, scaled up for desktop
- Colors and design tokens from `@bubbles/ui` monorepo globals
- Avoid card-heavy layouts — prefer clean, list- or section-based UI with clear hierarchy; cards only where they add genuine visual separation
- Light/dark mode via `@bubbles/theme` package (extracted from TeacherBuddy, shared across monorepo)

### SEO

Basic SEO for quality, not discoverability:
- Semantic HTML, `<title>` and `<meta description>` per page, Open Graph tags
- No public sitemap needed

### Notifications (V2)

**Forgotten end-time:** User tells AI "heading out at 5pm." If no end time logged after 1–2 hours: *"You haven't logged your end time yet — still out, or did you forget?"*

**Anchor-day reminder:** User optionally configures recurring activity days (flexible, not hardcoded). If configured day passes without a log entry by a set time: *"You had an activity planned today — were you out? Want to log it?"*

Both types are opt-in, configurable, PWA push (iOS 16.4+ supported).

> **Monorepo prerequisite:** Extract `@bubbles/theme` package from TeacherBuddy before or alongside building It Counts. Package includes: `next-themes` setup, View Transitions–animated theme toggle, reusable toggle component. It Counts consumes it from day one.

---

## Functional Requirements

### Activity Logging

- **FR1:** User can log an activity entry with either (a) a direct walking duration input, or (b) a start time picker + end time picker + non-walking time input — system calculates walking time automatically from option (b): `(end_time − start_time) − non_walking_time`
- **FR1a:** Option (b) validates: end time must be after start time; if not, an error is shown and the user must correct their selection before submitting
- **FR1b:** Option (b) validates: non-walking time must not exceed total duration (end − start); if it does, an error is shown and the user must correct before submitting
- **FR1c:** Minimum calculated walking time is 0 minutes — no negative values are possible
- **FR2:** User can log multiple activity entries for the same day
- **FR3:** System sums all walking time entries for a given day into a daily total
- **FR4:** System calculates XP from the daily total using the fixed XP tier table

> Activity logs are permanent — no edit or delete. Intentional: editing entries would allow retroactive "cleanup" of history, undermining the "it counts as it happened" principle.

### XP Calculation

- **FR5:** System applies the highest qualifying XP tier based on daily total walking time: 5min→1XP, 10min→2XP, 20min→3XP, 30+min→5XP
- **FR6:** System enforces the XP cap — no XP earned beyond the 30+ minute tier regardless of duration
- **FR7:** System accumulates XP across all logged days within the current level

### Level Progression

- **FR8:** System tracks weeks elapsed since the current level started. **Level timer rules:** Level 1 timer starts on the date of the first ever logged entry; Level 2+ timer starts on the date the level-up is triggered. A week is Monday–Sunday; weekly XP totals reset each Monday. All date calculations use device local time.
- **FR9:** System displays level-up eligibility only when both 100 XP AND 4 full weeks have been reached
- **FR10:** User can trigger a level-up when both eligibility conditions are met
- **FR11:** System resets XP to zero and increments level number upon level-up
- **FR12:** System calculates and displays OverXP (XP earned beyond the 100 threshold within the level)
- **FR13:** System displays an OverXP pace indicator (on track / slightly over / well over)
- **FR14:** System displays the requirements and new abilities of both the completed and upcoming level at level-up

### Dashboard & Progress View

- **FR15:** User can view current level, XP progress toward 100, and weeks elapsed in the current level
- **FR16:** User can view the daily XP total for the current day
- **FR17:** User can view weekly XP total and the 10 XP/week motivational target
- **FR18:** System never displays negative feedback or penalties for missing the weekly target
- **FR19:** User can view current level requirements and unlocked abilities

### Motivational Messaging

- **FR20:** System displays a short motivational message when the user logs an activity
- **FR21:** System displays a motivational message at the start of each new week (Monday) — tone always encouraging, never judgmental, regardless of last week's XP
- **FR22:** System displays a motivational message when the weekly XP target (10 XP) is reached
- **FR22b:** System displays a motivational message once per app session on the dashboard (on first load if none shown yet during that session)
- **FR23:** MVP messages drawn from a curated hardcoded collection; V2 messages personalised by AI based on user profile

### Activity History

- **FR24:** User can view a chronological list of all past activity entries
- **FR25:** User can view aggregated daily and weekly XP totals in history
- **FR26:** Activity history persists across app sessions

### App & Data

- **FR27:** App data persists locally via localStorage — no authentication required
- **FR28:** App is installable as a PWA on iOS and Android
- **FR29:** App functions offline — entries saved locally with no network dependency

### AI Interaction (V2)

- **FR30:** User can configure an AI provider and API key (provider-agnostic: Anthropic, OpenAI, or compatible)
- **FR31:** User can submit a natural language activity description for AI parsing
- **FR32:** AI confirms parsed walking time and calculated XP before logging the entry
- **FR33:** AI maintains a persistent user profile built from logged sessions and notes
- **FR34:** AI surfaces personalised tips based on the user profile
- **FR35:** AI recommends difficulty adjustments at level-up based on OverXP and profile context
- **FR36:** User can view their AI-maintained profile

### Notifications & Achievements (V2)

- **FR37:** User can configure optional recurring activity days for reminder notifications
- **FR38:** System sends a push notification on configured days if no activity logged by a set time
- **FR39:** System sends a push notification if AI has recorded a start intent but no end time logged after a configurable duration
- **FR40:** User can opt in or out of each notification type individually
- **FR41:** System awards hidden achievements based on usage patterns — not visible to the user in advance
- **FR42:** User is notified when an achievement is unlocked
- **FR43:** User can view previously unlocked achievements (but not future ones)

---

## Non-Functional Requirements

### Performance

- Activity log entry: user action to confirmation < 500ms
- Initial app load on mobile (4G): LCP < 2.5s
- Dashboard render (all weekly/level data): < 300ms
- XP calculation: synchronous, no perceivable delay
- Bundle size: lean — no heavy dependencies without justification

### Reliability

- Activity data persists immediately on write — no loss on refresh, tab close, or device restart
- No data loss on service worker update or app upgrade
- Offline logging functional with no network dependency
- Weekly XP reset (Monday) executes correctly regardless of device timezone

### Security

**MVP:** No sensitive personal data beyond activity timestamps and durations. No authentication — localStorage data is private by default.

**V2 (API key):** User-provided API key stored encrypted, never exposed in source code, logs, or client-side JavaScript. Transmitted only to the user-configured provider endpoint.

### Accessibility

- All interactive elements keyboard-navigable
- Semantic HTML with correct heading hierarchy and ARIA landmarks
- Color contrast compliant with monorepo global tokens
- No information conveyed by color alone (e.g. OverXP indicator uses text label + color)

### UX & Animations

- Subtle, purposeful animations reinforce feedback (XP gain, level-up, entry confirmation) — not decorative
- Animations run alongside user feedback, never delaying it
- Page transitions via View Transitions API (`vercel-react-view-transitions` pattern)
- Theme toggle (light/dark) uses View Transitions for a smooth animated switch
- All animations respect `prefers-reduced-motion`
