# `@bubbles/typescript-config`

Single source of truth for **compiler options** in bubbles-verse. Every `tsconfig.json` should **`extend`** one of the JSON files here instead of copying `strict`, `module`, or `jsx` settings.

## Profiles

| File | `extends` | Use when |
| ---- | --------- | -------- |
| [`base.json`](base.json) | — | Foundation: `strict`, `noUncheckedIndexedAccess`, `NodeNext` modules, DOM libs, declarations. |
| [`nextjs.json`](nextjs.json) | `base.json` | **Next.js apps**: `next` TS plugin, `Bundler` resolution, `jsx: preserve`, `noEmit`. |
| [`react-library.json`](react-library.json) | `base.json` | **React packages** consumed by apps: `jsx: react-jsx`, keeps `NodeNext` from base unless overridden. |

## Consumer `tsconfig.json` pattern

Next app (simplified):

```json
{
  "extends": "@bubbles/typescript-config/nextjs.json",
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Library:

```json
{
  "extends": "@bubbles/typescript-config/react-library.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src"]
}
```

Path aliases are **never** defined in the shared package — each workspace owns its `paths`.

## Version alignment

The root repo pins a single **`typescript`** devDependency version. Bump TypeScript in **one** place (root or per-workspace if you deliberately diverge) and re-run `bun run typecheck` across Turbo.

## Documentation

- [documentation/profiles.md](documentation/profiles.md)
- [CHANGELOG.md](CHANGELOG.md)
