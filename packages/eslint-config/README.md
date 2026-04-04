# `@bubbles/eslint-config`

**ESLint 9 flat configs** shared by every TypeScript workspace. Each preset composes `@eslint/js`, `typescript-eslint`, React rules where relevant, **`eslint-config-prettier`** (formatting stays in Prettier), and **`eslint-plugin-turbo`** for env hygiene.

## Package exports

| Import path | Intended for |
| ----------- | ------------- |
| `@bubbles/eslint-config/base` | Non-React or generic TS; extend with your framework. |
| `@bubbles/eslint-config/next-js` | Next.js **App Router** applications (`apps/*` Next projects). |
| `@bubbles/eslint-config/react-internal` | React **libraries** (e.g. `@bubbles/ui`) without Next runtime assumptions. |

## Wire-up

In `eslint.config.mjs`:

```js
import { nextJsConfig } from '@bubbles/eslint-config/next-js';

export default [...nextJsConfig];
```

Match the **named export shape** from each config file under this package (`next.js`, `base.js`, …) — copy an existing app if ESLint fails to load.

## Design choices

- **Prettier last:** `eslint-config-prettier` disables stylistic ESLint rules that fight Prettier.
- **Type-aware rules:** `typescript-eslint` recommended sets are included in `base` / Next stacks consumers extend.
- **Turbo env:** Lint may warn when code reads `process.env.X` that Turbo does not know about — fix by updating [`turbo.json`](../../turbo.json) or by isolating env access.

## Docs

- [documentation/consuming.md](documentation/consuming.md)
- [CHANGELOG.md](CHANGELOG.md)

This package has no `lint` script; it is exercised when consumers run ESLint.
