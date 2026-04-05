---
title: "Product Brief Distillate: StepQuest"
type: llm-distillate
source: "product-brief-stepquest.md"
created: "2026-04-06"
purpose: "Token-efficient context for downstream PRD/development work"
---

# Product Brief Distillate: StepQuest

## Core Philosophy (Never Compromise This)

- **"You are never allowed to decide something doesn't count."** This is the foundational rule. Every piece of movement outside the home is valid. The app must never create a path where the user dismisses their own activity.
- **Consistency over intensity.** The XP cap is intentional — 60 minutes earns the same XP as 30 minutes. The system rewards showing up, not pushing hard.
- **Fragmented movement is fully valid.** 5 min + 5 min + 10 min = 20 min = 3 XP. The app must sum movement correctly across a day, not require single continuous sessions.
- **Everyday activity is valid.** Grocery run, taking out the trash, waiting in a queue outside. If you were outside and moved, it counts.

## Rejected Ideas & Explicit Exclusions

- **No GPS tracking** — user logs manually what they did. The app is not a tracker.
- **No social features** — no leaderboards, no friends, no sharing, no competition.
- **No paid tier** — the app will never cost money to use. Not now, not later.
- **No managing other users' AI API costs** — bring your own API key, or use manual mode. The owner will not subsidise AI usage for others.
- **No fitness tracker / wearable integration** — manual logging is intentional, not a gap to fill.
- **No performance optimisation framing** — this is not a fitness app. Do not frame features around calories, distance, speed, or "hitting targets." The framing is always "you went outside, that's good."
- **No streak mechanics** — missing a day should not feel punishing. The 4-week level minimum already handles this; no additional streak/streak-break pressure.

## XP System — Exact Rules

```
5 min walking  → +1 XP
10 min walking → +2 XP
20 min walking → +3 XP
30+ min walking → +5 XP (hard cap — 60 min = 5 XP, same as 30 min)
```

**Fragmentation rule:** XP is calculated on total walking time accumulated in a day, not per session. Sum all walking segments, then apply the table.

**Tier determination:** Use the highest qualifying tier.
- 0–4 min = 0 XP
- 5–9 min = 1 XP
- 10–19 min = 2 XP
- 20–29 min = 3 XP
- 30+ min = 5 XP

**What counts as "walking time":** Active movement on foot. Sitting in a car, bus, queue does not count toward walking time even if it was part of the outdoor trip.

## Level System — Exact Rules

| Level | Weekly XP Target | Unlock / Ability |
|-------|----------------|-----------------|
| 1 | No target (earn what you earn) | Core XP tracking |
| 2 | No target | + One intentional 10–20 min walk per week |
| 3 | 12 XP/week | Same activities, higher weekly target enforced |
| 4 | TBD | + Light workouts, longer walks, targeted training (NOT YET DESIGNED) |

**Level progression rules:**
- Each level requires exactly **100 XP** to trigger eligibility for level-up
- Each level lasts a **minimum of 4 weeks** — level-up cannot happen before 4 weeks even if 100 XP reached earlier
- Level-up happens at the end of the 4th week IF 100 XP has been reached

**Extra XP mechanics:**
- XP earned beyond 100 within a level = "extra XP"
- Extra XP affects difficulty of the next level:
  - 100 XP exactly → next level difficulty unchanged
  - 101–119 XP → slight difficulty increase
  - 120+ XP → more significant difficulty increase (scales with how far over 120)
- Extra XP does NOT carry over as a head start toward the next level's 100 XP requirement — it only affects difficulty scaling
- The AI (V2) recommends specific difficulty adjustments based on extra XP; MVP can show the extra XP count and a rough indicator ("easy pace / good pace / pushing it")

**Example scenario:**
- User finishes Level 1 with 200 XP (4 weeks, 100 XP extra above threshold)
- System/AI notes user found Level 1 very easy
- Level 2 starts with meaningfully higher intensity requirements

## AI Layer — Detailed Behaviour

### Natural Language Logging (V2)
User input example:
> "I was out from 12 to 2pm. 30 minutes in car, 45 minutes in a queue, walked about 25 minutes total in bits."

AI must:
1. Identify total walking time (25 minutes)
2. Apply XP table (25 min = 3 XP)
3. Log the entry with timestamp and XP
4. Confirm back to user what was logged

### User Profile Building
AI accumulates context across sessions:
- Preferred times of day for outdoor activity
- Typical routes or locations mentioned
- Physical feedback (pain, fatigue, comfort)
- Gear/equipment mentioned (shoes etc.)
- Weather preferences or aversions
- Personal notes ("tried a new route today", "felt good")

Profile is used to give personalized suggestions. Example:
- User repeatedly mentions crocs → foot pain → AI recommends footwear change before increasing walk duration
- User always goes out in the evening → AI times motivational nudges accordingly

### Difficulty Recommendation at Level-Up
AI reviews:
- Extra XP earned in completed level
- Notes from the level (user-provided context)
- Profile data
→ Recommends specific adjustments for next level (e.g., "bump weekly XP target to 15" or "add one longer walk requirement")

### API Key Handling
- User provides their own Anthropic (or compatible) API key
- Key stored securely (encrypted, never exposed client-side)
- AI features are unavailable without a key — graceful degradation to manual mode
- No API costs are borne by the app owner

## MVP vs V2 Feature Split

### MVP (no AI required)
- Activity log entry: date, walking time input, auto-calculated XP
- Daily XP total (summed from fragmented entries)
- Weekly XP summary
- Level display: current level, XP toward 100, weeks elapsed in current level
- Extra XP counter
- Level-up eligibility indicator (4 weeks + 100 XP both met)
- Activity history (log of past entries)
- Difficulty preview: rough indicator based on extra XP (no AI required)

### V2 additions
- Natural language input field + AI parsing
- User profile (AI-maintained, viewable by user)
- Personalised tips surface (AI-generated, profile-informed)
- AI difficulty recommendation at level-up
- API key management screen

## Technical Context

- **Monorepo placement:** `apps/stepquest` (name TBD) in bubbles-verse
- **Shared packages:** @bubbles/ui, @bubbles/eslint-config, @bubbles/typescript-config
- **Persistence:** Supabase (if DB added) or localStorage (MVP could start local-first like TeacherBuddy)
- **Auth:** Owner-only for V1 — Supabase Auth if DB is used, no auth if localStorage-only
- **AI:** Anthropic API (Claude) with user-provided key — aligns with owner's stack knowledge
- **Framework:** Next.js App Router (consistent with ecosystem)

## Open Questions

- **App name:** "StepQuest" is a working title. Final name TBD.
- **Level 4+ design:** Intentionally not designed yet. MVP ships without it; system should be flexible enough to accommodate future level definitions.
- **Local-first vs DB from day one:** MVP could be localStorage (fast to build, no auth needed) with Supabase migration later — similar pattern to TeacherBuddy. Or start with Supabase if the owner wants cross-device sync immediately.
- **Exact difficulty scaling algorithm:** Direction is clear (more extra XP → harder next level), exact formula TBD. Could be linear, stepped, or AI-determined.
- **Weekly XP target enforcement:** Missing the weekly XP target is **never punished**. MVP: a short encouraging message ("hey, that's okay — not every week is the same"). V2: AI gives a personalised, contextual response. The target is motivational, not a failure condition.
- **V2 AI model choice:** Claude API (natural fit given owner's stack) or model-agnostic? BYOK means user could bring any compatible key.

## Scope Signals From Owner

- "Every movement outside counts, it doesn't have to be at once" — fragmentation is a first-class feature, not an edge case
- "You can never decide that doesn't count" — core rule, must be enforced by UX, not just policy
- "I'd like the AI in there but it could also make sense to do the MVP completely without" — AI is V2, not blocking
- "I won't pay for other people, and I don't want money for this either" — BYOK is the only acceptable AI monetisation model
- "I'm not 100% mentally there yet" — Level 4+ and exact difficulty algorithm are intentionally deferred
- "We haven't gotten further than that lol" — this is an early, evolving concept; the brief captures current thinking, not final spec
