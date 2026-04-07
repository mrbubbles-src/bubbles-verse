# Deferred Work

## Deferred from: code review of 1-1-extract-bubbles-theme-package (2026-04-07)

- **'system' unsafely cast to Theme in ThemeBridge** (`packages/theme/src/theme-provider.tsx:23,25`) — pre-existing code copied from TeacherBuddy; `next.theme` can be `'system'` before hydration but components correctly use `resolvedTheme` for behavior, not `theme`. Consider adding a runtime guard or narrowing the type in a future cleanup story.
- **startVt CSS variables written even when startViewTransition unsupported** (`packages/theme/src/view-transition.ts`) — `--vt-x`/`--vt-y` are set on `documentElement` even in fallback browsers that don't support `startViewTransition`. Dangling CSS vars are benign but could interfere with future CSS. Pre-existing from TeacherBuddy.
- **Hydration flash on ThemeToggle icons** (`packages/theme/src/theme-toggle.tsx`) — `isHydrated` pattern causes icons to briefly show the wrong state on first render. Pre-existing from TeacherBuddy. Could be addressed with a skeleton or CSS-only approach.
- **German error message in useTheme** (`packages/theme/src/use-theme.ts:29`) — `useTheme` throws a German-language error. Intentional for this personal project by a German-speaking developer. Translate if the package is ever open-sourced.
- **Redundant `?? theme` fallback in ThemeToggle click handler** (`packages/theme/src/theme-toggle.tsx`) — `resolvedTheme` is always set in the bridge (falls back to `'dark'`), making `?? theme` dead code. Pre-existing from TeacherBuddy. Minor cleanup.
