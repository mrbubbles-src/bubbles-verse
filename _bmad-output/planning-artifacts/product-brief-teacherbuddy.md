---
title: "Product Brief: TeacherBuddy"
status: "complete"
created: "2026-04-05"
updated: "2026-04-05"
inputs:
  - product-brief-bubbles-verse.md
  - docs/architecture-teacherbuddy.md
  - docs/component-inventory-teacherbuddy.md
---

# Product Brief: TeacherBuddy

## Executive Summary

TeacherBuddy is a set of classroom tools for teachers — student management, random picker, quiz builder/player, project groupings, and breakout rooms. It is feature-complete, tested, and live. It is the lowest-priority app in the bubbles-verse ecosystem for active development.

The only meaningful work remaining is a design refresh: less reliance on cards, cleaner layout, consistent with the Catppuccin-based ecosystem aesthetic. Everything else stays as-is.

## What It Is

A client-side app with localStorage persistence — no backend, no accounts, no server. Everything a teacher needs lives in the browser. This is a deliberate, permanent architecture decision rooted in privacy: TeacherBuddy handles student names and classroom data. Keeping it local means no data ever leaves the device, no GDPR surface, no liability for whoever uses it.

**Current features:**
- Student management with class scoping
- Random student picker / generator
- Quiz builder and quiz play mode
- Project groupings
- Breakout room assignment

## What Changes

**Design refresh — lower card density:**
The app works well but visually leans heavily on cards. The same "too many cards" feeling present across the current bubbles-verse apps applies here. The fix is design polish: reduce card usage where it doesn't add clarity, align with the Catppuccin palette and ecosystem aesthetic.

**Monorepo migration check:**
Something in the current monorepo state looks visually off — UI elements appear smaller than expected. Likely a missing style import or a Tailwind config that didn't fully carry over from the standalone project. Needs a quick audit before the design refresh proper begins.

**No other functional changes planned.**

## What Doesn't Change

- **localStorage stays** — no database, no Supabase, no backend. Privacy is the reason; it's non-negotiable.
- **Optional DB mode (future maybe):** If the owner is logged in to the bubbles-verse Dashboard, TeacherBuddy could optionally sync to DB for cross-device persistence. This is a personal quality-of-life feature for the owner only — not for general users. Not MVP scope.
- **Features stay as-is** — new features possible in the future but no concrete plans. Feature-complete for now.
- **Tests stay** — existing Vitest + React Testing Library coverage is maintained. New tests added if new functionality is added.

## Who This Serves

Teachers in classroom settings — specifically the owner and any teacher who forks or finds the tool. No accounts, no sign-up, no server. Works offline. Student data never leaves the device.

## Success Criteria

| Metric | Definition of Done |
|--------|-------------------|
| Design refresh complete | Card usage reduced, Catppuccin palette applied, visually consistent with ecosystem |
| Monorepo styles fixed | UI looks correct — same as standalone version before migration |
| Deployed | App is live on Vercel |

## Known Constraints

- **Lowest priority** — this gets worked on last, after Portfolio, Dashboard, and Coding Vault.
- **Privacy is a hard constraint** — any feature that sends student data to a server requires explicit deliberate decision-making. Default is always local.
- **Feature scope is stable** — do not add features speculatively. Only extend if a concrete need arises.
