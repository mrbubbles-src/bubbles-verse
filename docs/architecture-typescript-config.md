# Architecture: @bubbles/typescript-config

> Generated: 2026-04-05 | Scan Level: Exhaustive

## Executive Summary

Shared TypeScript compiler configuration profiles for the monorepo. Provides 3 profiles: base (strict foundation), nextjs (Next.js apps), react-library (React packages).

## Config Profiles

### base.json
| Setting | Value |
|---------|-------|
| target | ES2022 |
| module | NodeNext |
| moduleResolution | NodeNext |
| moduleDetection | force |
| strict | true |
| isolatedModules | true |
| declaration | true |
| declarationMap | true |
| noUncheckedIndexedAccess | true |
| skipLibCheck | true |
| resolveJsonModule | true |
| lib | es2022, DOM, DOM.Iterable |

### nextjs.json (extends base)
| Override | Value |
|----------|-------|
| module | ESNext |
| moduleResolution | Bundler |
| allowJs | true |
| jsx | preserve |
| noEmit | true |
| plugins | [{ name: "next" }] |

### react-library.json (extends base)
| Override | Value |
|----------|-------|
| jsx | react-jsx |

## Consumers

| Config | Used by |
|--------|---------|
| base.json | Root tsconfig |
| nextjs.json | portfolio, teacherbuddy, the-coding-vault |
| react-library.json | @bubbles/ui |
