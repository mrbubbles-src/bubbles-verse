# Story 5.3: Performance, Accessibility & Animation Audit

Status: ready-for-dev

## Story

As a user,
I want the app to load fast, be keyboard-navigable, and respect my motion preferences,
so that it works well for everyone on any device or capability.

## Acceptance Criteria

1. **Given** the app is deployed to Vercel
   **When** measured on mobile (simulated 4G, Lighthouse or WebPageTest)
   **Then** LCP < 2.5s and the dashboard renders its full data in < 300ms

2. **Given** all interactive elements across all pages
   **When** tested keyboard-only (Tab, Enter, Space, Escape)
   **Then** all buttons, links, inputs, and sheet open/close are fully operable without a pointer
   **And** focus indicators are visible at all times

3. **Given** all pages and components
   **When** audited with a screen reader (VoiceOver on iOS) and browser DevTools accessibility panel
   **Then** ARIA landmarks are correct (`<main>`, `<nav>`), heading hierarchy is consistent, and no information is conveyed by color alone

4. **Given** a device with `prefers-reduced-motion: reduce` enabled
   **When** the user interacts with the app (logging, level-up, page navigation)
   **Then** all animations are suppressed or replaced with instant transitions — no motion occurs
   **And** all feedback (confirmations, XP updates) still appears immediately without animation

5. **Given** any animation in the app (confetti, XP bar fill, sheet slide-in, View Transitions)
   **When** the animation plays under normal conditions
   **Then** user feedback is never delayed by an animation — the data updates instantly, animations run alongside

## Tasks / Subtasks

- [ ] Task 1: Run the audit passes
  - [ ] Measure mobile performance on a deployed build
  - [ ] Run keyboard-only and reduced-motion checks across all pages
  - [ ] Run screen reader and DevTools accessibility review
- [ ] Task 2: Fix the issues the audit finds
  - [ ] Address performance bottlenecks, focus issues, landmark problems, and motion gaps
  - [ ] Keep fixes scoped to the actual findings
- [ ] Task 3: Record the results
  - [ ] Add an app-local audit note or changelog entry with metrics, issues fixed, and any residual risk

## Dev Notes

### Implementation Focus

- Treat this story as a fix-and-verify sweep, not a greenfield feature build.
- Keep user feedback instant even when animation is present.
- If the audit uncovers build-time or deployment blockers, capture them in app-local docs next to the fixes.

### Guardrails

- Do not add heavy dependencies just to chase Lighthouse points.
- Preserve the calm visual language while improving accessibility and motion handling.
- Reduced-motion support must disable motion, not remove functional feedback.

### Project Structure Notes

- Likely touch: `apps/it-counts/app/...`, `apps/it-counts/components/...`, `apps/it-counts/documentation/...`, `apps/it-counts/CHANGELOG.md`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.3]
- [Source: _bmad-output/planning-artifacts/prd.md#Performance]
- [Source: _bmad-output/planning-artifacts/prd.md#Accessibility]
- [Source: _bmad-output/planning-artifacts/prd.md#UX & Animations]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Accessibility Strategy]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Testing Strategy]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

### Completion Notes List

### File List
