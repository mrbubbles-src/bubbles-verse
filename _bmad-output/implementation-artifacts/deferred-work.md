# Deferred Work

## Deferred from: code review of 1-1-extract-bubbles-theme-package (2026-04-07)

- **'system' unsafely cast to Theme in ThemeBridge** (`packages/theme/src/theme-provider.tsx:23,25`) — pre-existing code copied from TeacherBuddy; `next.theme` can be `'system'` before hydration but components correctly use `resolvedTheme` for behavior, not `theme`. Consider adding a runtime guard or narrowing the type in a future cleanup story.
- **startVt CSS variables written even when startViewTransition unsupported** (`packages/theme/src/view-transition.ts`) — `--vt-x`/`--vt-y` are set on `documentElement` even in fallback browsers that don't support `startViewTransition`. Dangling CSS vars are benign but could interfere with future CSS. Pre-existing from TeacherBuddy.
- **Hydration flash on ThemeToggle icons** (`packages/theme/src/theme-toggle.tsx`) — `isHydrated` pattern causes icons to briefly show the wrong state on first render. Pre-existing from TeacherBuddy. Could be addressed with a skeleton or CSS-only approach.
- **German error message in useTheme** (`packages/theme/src/use-theme.ts:29`) — `useTheme` throws a German-language error. Intentional for this personal project by a German-speaking developer. Translate if the package is ever open-sourced.
- **Redundant `?? theme` fallback in ThemeToggle click handler** (`packages/theme/src/theme-toggle.tsx`) — `resolvedTheme` is always set in the bridge (falls back to `'dark'`), making `?? theme` dead code. Pre-existing from TeacherBuddy. Minor cleanup.

## Deferred from: code review of 1-2-add-shared-fonts-and-typography-to-bubbles-ui (2026-04-07)

- **pickRandomItem duplicated in 3 TeacherBuddy files** — identical helper in `context/app-store.tsx`, `hooks/use-student-generator.ts`, `components/student-name-generator.tsx`. Should be extracted to a shared utility.
- **~40 non-null assertions (`!`) in TB tests** — added to silence strict array-index nullability. Should be proper assertions or helper functions.
- **postcss.config.mjs uses fragile relative path** — changed from `@bubbles/ui/postcss.config` package export to `../../packages/ui/postcss.config.mjs`. Breaks if directory structure changes.
- **progress.tsx shipped with no tests** — new 103-line shadcn progress component in `packages/ui` has no test coverage.
- **::selection/input vars reference undefined custom properties** — `--overlay-2`, `--text`, `--rosewater` used in `globals.css` @layer base but never defined. Pre-existing.
- **touch-hitbox uses ::before pseudo-element** — could conflict with components that already use `::before` for decorative content.
- **class-variance-authority added as TB dependency** — CVA consumer (`button.tsx`) lives in `@bubbles/ui`, not TB. Dependency may be misplaced.

## Deferred from: code review of 2-3-start-end-time-logging-mode.md (2026-04-07)

- **AC4 persistence not integration-tested for time-range submit** — Component tests mock `useActivityStore`; AC requires the same storage path as duration mode. Same pattern as existing duration tests; add store or e2e coverage in a later pass if desired.

## Deferred from: code review of 2-2-duration-based-activity-logging (2026-04-07)

- **localStorage QuotaExceededError silent failure** — `saveEntries`/`saveCurrentLevel` catch block silently returns. In-memory state diverges from persisted state on storage full. Pre-existing pattern in `storage.ts`.
- **"+0 XP" confirmation for entries < 5 min** — user logs 1-4 minutes, sees "+0 XP · That counted." which is technically correct but potentially confusing UX.
- **DurationInput accepts non-numeric strings** — `pattern="[0-9]*"` is cosmetic only, `onChange` passes raw string through. Decimals and letters possible.
- **No atomicity between addDurationEntry and addXp** — two stores mutated sequentially without rollback. Acceptable for MVP sync flow.
- **/log route is vestigial** — shows only "logging now from dashboard" text. Could be removed or redirected.
- **addXp silently swallows invalid values** — silent return for NaN/negative/Infinity, caller gets no feedback.
- **autoFocus redundancy** — both `autoFocus` prop and manual `requestAnimationFrame` focus in log-entry-sheet.
- **Storage validator accepts durationMin:0 but form rejects it** — slight inconsistency at the validation boundary.
