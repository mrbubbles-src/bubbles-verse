# Product

## Register

product

## Users

The monorepo is primarily for Manuel's own projects, with the expectation that some apps, packages, and patterns may also help other people. Users include Manuel as the main builder and maintainer, occasional collaborators, future employers or clients reviewing the work, and project-specific end users who should be able to understand each interface without studying it first.

## Product Purpose

bubbles-verse is a personal product ecosystem for reusable frontend apps, shared packages, and project-specific experiences. It exists to make genuinely reusable pieces, such as UI primitives, themes, layouts, editor tools, and app patterns, available across projects while keeping each project distinct enough to fit its purpose. Success means the projects clearly feel connected to Manuel, stay easy to navigate, and avoid rebuilding the same foundations again and again.

## Brand Personality

Simple, modern, cool, approachable, and pragmatic. The work should feel personal without becoming overly playful, technical without becoming cold, and polished without losing clarity. The shared identity should be recognizable through calm structure, Catppuccin-based theming, tasteful details, and consistent component behavior rather than loud branding.

## Anti-references

Avoid card-heavy layouts where every piece of content becomes the same rounded box. Avoid generic SaaS dashboards, corporate blue defaults, overdesigned marketing gloss, decorative complexity, and interfaces that require too much study before the next action is clear. Do not treat shadcn components as files to freely rewrite; they are the base layer for building own reusable components unless there is a specific, discussed reason to change the primitive itself.

## Design Principles

Build reusable foundations first: shared components, hooks, packages, and tokens should make cross-project reuse practical, not theoretical.

Keep one recognizable system with project-level expression: every app should feel like it belongs to bubbles-verse while still adapting layout, emphasis, and mood to the project.

Prefer clarity over cleverness: navigation, copy, hierarchy, and flows should be understandable without needing expert context.

Use cards with intent: cards are useful for grouped objects, repeated items, and framed tools, but page structure should not collapse into endless card grids.

Base UI work on shadcn: use the shadcn primitives in `@bubbles/ui` as the default foundation, then compose app-specific and reusable components around them.

## Accessibility & Inclusion

Use WCAG AA as the baseline. Interfaces should be responsive, keyboard usable, readable in light and dark mode, and respectful of reduced motion preferences. Color choices should keep enough contrast within the Catppuccin Latte and Mocha themes, and project-specific additions should preserve that accessibility standard.
