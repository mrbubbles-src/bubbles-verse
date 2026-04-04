# Consuming `@bubbles/eslint-config`

## Choosing a preset

| You are building… | Use |
| ----------------- | --- |
| A Next.js app in `apps/*` | `next-js` |
| A reusable React package (design system, headless helpers) | `react-internal` |
| Node/CLI tooling with TS only | `base` (+ add globals for `node` or `vitest` in your local `eslint.config`) |

**Do not** import `next-js` inside pure libraries — it pulls Next-specific plugins and globals you do not need.

## Extending locally

Flat config is an array; spread the preset and append objects:

```js
import { nextJsConfig } from '@bubbles/eslint-config/next-js';

export default [
  ...nextJsConfig,
  {
    rules: {
      // repo-specific overrides only
    },
  },
];
```

Keep overrides **small**; if every app needs the same rule, change `@bubbles/eslint-config` instead.

## Prettier interaction

Run **Prettier** for formatting; ESLint should not enforce quote style or semicolons. If you see conflicts, ensure `eslint-config-prettier` is still last in the composed config (our presets already include it).

## Turbo and `process.env`

`eslint-plugin-turbo` compares env reads against [`turbo.json`](../../../turbo.json). Common workflows:

- **New secret for `next build`:** add the key to `tasks.build.env` and `tasks.dev.env`.
- **Test-only env:** configure test runner globals in a separate ESLint override file if needed, or access env in a thin wrapper file you exclude from lint.

## CI

Use the same `eslint.config.*` entry locally and in CI. Mismatched working directories sometimes break plugin resolution — run lint from the workspace that owns the config (`cd apps/foo && bun run lint`).
