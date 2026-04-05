---
title: "Product Brief: StepQuest (working title)"
status: "complete"
created: "2026-04-05"
updated: "2026-04-05"
inputs:
  - user discovery conversation 2026-04-05
---

# Product Brief: StepQuest *(working title)*

## Executive Summary

StepQuest is a personal movement tracking app built around one core philosophy: every step outside counts, and you are never allowed to decide otherwise. It solves a specific, real problem — the kind of low-grade demotivation that makes leaving the apartment feel harder than it needs to be — with a light gamification system that rewards consistency over intensity.

The system is built on SMART principles but asks nothing complicated of the user: log what you did, earn XP, level up over time. A fixed XP table means no judgment calls (25 minutes is 25 minutes, not "almost 30"), a minimum 4-week level duration prevents rushing, and an AI layer helps log activity naturally, builds a user profile, and eventually tailors progression difficulty to the individual.

This is a personal project solving a personal problem. Others who share the same problem are welcome to use it.

## The Problem

Motivating yourself to move more is easy to start and hard to sustain. The usual failure modes: setting goals that are too ambitious, dismissing everyday movement as "not really counting," and the pressure of streaks or performance metrics that make a missed day feel catastrophic.

The existing system (SMART goals + manual tracking with AI assist) works — the owner has been using it and it's helping. The app exists to make it more structured, persistent, and eventually smarter.

## The Core System

### XP Table (fixed, no exceptions)

| Walking time | XP earned |
|-------------|-----------|
| 5 minutes | +1 XP |
| 10 minutes | +2 XP |
| 20 minutes | +3 XP |
| 30+ minutes | +5 XP |

**Key rules:**
- XP caps at each tier — 25 minutes = 3 XP, 60 minutes = 5 XP. No bonus for going longer.
- Fragmented movement counts — 5 min here, 10 min later, 5 min after that = 3 XP total for the day.
- All outdoor activity is valid — groceries, taking out the trash, waiting in a queue outside. If you were outside and moved, it counts.
- **You are never allowed to decide something doesn't count.** This is the rule.

### Level System

Each level lasts a **minimum of 4 weeks**, regardless of XP earned. Each level requires **100 XP** to progress.

| Level | Weekly XP Target | Abilities / Requirements |
|-------|----------------|--------------------------|
| 1 | Flexible (earn what you earn) | Basic tracking, XP system |
| 2 | Flexible | + One intentional 10–20 min walk per week |
| 3 | 12 XP/week | Same activities, higher weekly target |
| 4 | TBD | + Light workouts, longer walks, targeted training *(still being designed)* |

**Difficulty scaling via extra XP:**
- Earn exactly 100 XP in a level → next level difficulty stays the same
- Earn 101–119 XP → slight difficulty increase next level
- Earn 120+ XP → more significant difficulty increase (more the user earns over cap, the more next level intensifies)
- This prevents sandbagging and auto-adjusts to the user's actual capacity

**Example:** Finish level 1 with 200 XP → level 2 will be meaningfully harder than default. System infers the user found level 1 easy.

### AI Layer

The AI reduces friction for logging and adds personalisation over time.

**Natural language logging:**
> "I was out from 12 to 2pm. 30 minutes in the car, 45 minutes in a queue, and walked about 25 minutes in between."

AI parses this, calculates XP (3 XP for 25 min walking), and logs it. User doesn't have to do the math.

**User profile building:**
The AI accumulates context across sessions — preferred times, typical routes, recurring notes, physical feedback the user mentions. Over time it gives more targeted suggestions. Example: user repeatedly mentions foot pain after longer walks → AI suggests footwear evaluation before increasing walking targets.

**Difficulty recommendation:**
As the user approaches a level-up, the AI reviews the extra XP earned and recommends how much to increase next level's intensity — informing the system's auto-scaling.

**Bring your own API key:**
AI features require the user to provide their own API key (Anthropic or similar). The app will never pay for AI on behalf of users. This keeps the app free to use and removes any GDPR/data liability concern for the owner.

## MVP Approach

The AI layer is the nicest-to-have, not the must-have. MVP can ship without it:

**MVP (no AI):**
- Manual activity logging with XP calculation (user inputs time, app calculates XP)
- Level tracking with 4-week minimum enforcement
- Extra XP tracking for difficulty scaling visibility
- Basic activity history

**V2 (with AI):**
- Natural language logging via user's own API key
- Profile building and personalised tips
- AI-assisted difficulty recommendations at level-up

## What Makes This Different

Most movement/fitness apps optimise for performance: more steps, more distance, more calories. StepQuest optimises for consistency. The XP cap means intensity is never rewarded over frequency. The "nothing doesn't count" rule removes the cognitive overhead of deciding whether today's activity was worth logging. The minimum level duration prevents the dopamine-chasing of rapid progression.

It's not a fitness app. It's a "get yourself outside more often" app.

## Who This Serves

**Primary:** The owner — someone who struggles with motivation to leave the apartment and needs a low-pressure system that validates any and all movement.

**Secondary:** Anyone with the same problem. The app is personal-first but the system is universal enough that others can benefit. No monetisation, no premium tier. Bring your own API key for AI features; use the manual version for free.

## Success Criteria

| Metric | Definition of Done |
|--------|-------------------|
| Core loop works | Log activity → earn XP → see progress → level up after 4 weeks |
| XP rules enforced | Fragmented movement correctly summed; XP cap applied per tier |
| Level system correct | 100 XP threshold + 4-week minimum enforced; extra XP tracked |
| MVP shipped | Usable without AI — manual logging covers full core loop |
| AI logging works (V2) | Natural language input parsed correctly; XP calculated and logged |

## Scope

### MVP

- Activity logging (manual: time input → XP output)
- Daily and weekly XP summary
- Level tracking with 4-week minimum and 100 XP threshold
- Extra XP tracking and difficulty scaling preview
- Activity history

### V2

- Natural language logging (user-provided API key)
- AI user profile and personalised tips
- AI difficulty recommendation at level-up

### Out of Scope

- **No social features** — no leaderboards, no friends, no sharing
- **No GPS tracking** — the user logs what they did; the app doesn't track them
- **No paid tier** — this will never cost money to use
- **No managing other users' API costs** — bring your own key or use manual mode
- **No integration with fitness trackers/wearables** — manual logging is intentional, keeps it simple

## Known Constraints

- **System is still being designed at Level 4+** — MVP can ship without Level 4 defined. The system should be designed to accommodate future level definitions without breaking existing data.
- **AI difficulty recommendation is still conceptual** — the exact algorithm for scaling difficulty from extra XP is clear in direction but not fully specified. Can be refined during development.
- **Monorepo fit:** New app in `apps/stepquest` (or chosen name), consumes `@bubbles/ui`, shared configs. Supabase for persistence if DB is added.
- **Name is a working title** — "StepQuest" is placeholder. Final name TBD.

## Vision

StepQuest works quietly in the background of daily life. A 5-minute walk to the corner shop gets logged. A longer afternoon out earns more. Over weeks, the level system reflects genuine progress — not a performance metric, but a record of showing up consistently. The AI layer eventually knows enough about the user to give advice that actually fits: not generic "walk more" but "you mentioned your route through the park is easier on your knees — that's where to start this week."

Small app, real problem, honest solution.
