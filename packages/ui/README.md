# `@bubbles/ui`

Shared **React 19** UI layer for bubbles-verse: Tailwind v4, **Base UI**, **Hugeicons**, **CVA**, **next-themes**, **Sonner**, and **shadcn**-style building blocks. Apps should import **stable subpath exports** so bundlers tree-shake and API surface stays explicit.

## Add to a workspace

In `package.json`:

```json
{
  "dependencies": {
    "@bubbles/ui": "workspace:*"
  }
}
```

Run `bun install` from the **monorepo root**.

## Public exports

From [`package.json`](package.json) `exports` (wildcard = any file under that tree):

| Specifier                    | Role                                                                       |
| ---------------------------- | -------------------------------------------------------------------------- |
| `@bubbles/ui/globals.css`    | Tailwind / token entry — import **once** in the app root layout.           |
| `@bubbles/ui/postcss.config` | Shared Postcss for apps that want identical pipeline to the design system. |
| `@bubbles/ui/fonts`          | Shared `next/font/google` objects for Montserrat, Poppins, and Fira Code.  |
| `@bubbles/ui/shadcn/*`       | Low-level primitives (buttons, forms, dialog, …).                          |
| `@bubbles/ui/components/*`   | Higher-level composed components shipped with the package.                 |
| `@bubbles/ui/lib/*`          | Utilities (`cn`, helpers).                                                 |
| `@bubbles/ui/hooks/*`        | Hooks intended for reuse (forms, theme, etc.).                             |

### Example

```tsx
import { firaCode, montserrat, poppins } from '@bubbles/ui/fonts';
import { Button } from '@bubbles/ui/shadcn/button';
import { Toaster } from '@bubbles/ui/shadcn/sonner';

import '@bubbles/ui/globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      className={`${montserrat.variable} ${poppins.variable} ${firaCode.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

Do **not** deep-import paths that are not listed in `exports` — they may break under package encapsulation.

## Tailwind and Prettier

Root Prettier config sets `tailwindStylesheet` to **`packages/ui/src/styles/globals.css`**. That file is the canonical class/token source for **Tailwind class sorting** across the repo. If you relocate it, update [`.prettierrc`](../../.prettierrc).

## Scripts (from `packages/ui`)

| Command             | Purpose                   |
| ------------------- | ------------------------- |
| `bun run lint`      | ESLint                    |
| `bun run format`    | Prettier for `ts` / `tsx` |
| `bun run typecheck` | `tsc --noEmit`            |

Via Turbo: `bunx turbo run lint typecheck --filter=@bubbles/ui`.

## When to change this package

- **Do:** Visual primitives, shared hooks, token tweaks, cross-app form controls.
- **Don’t:** App routes, server-only data loading, or copy that belongs to a single marketing site — keep those in `apps/<name>`.

`SelectContent` defaults to popper-style content-fit positioning. Pass
`alignItemWithTrigger={true}` when a consumer needs the popup width/alignment to
track the trigger exactly.

## Typography baseline

`globals.css` ships heading, body, and code defaults that read `--font-heading`, `--font-body`, and `--font-code`.
Those variables stay inert until a consuming app applies the classes from `@bubbles/ui/fonts` on `<html>`.

More detail: [documentation/overview.md](documentation/overview.md) · [CHANGELOG.md](CHANGELOG.md)
