# Portfolio (`apps/portfolio`)

Personal developer site: **Next.js 16** (App Router), **React 19**, **TypeScript**, **Tailwind v4**, shared **`@bubbles/ui`**, **react-hook-form**, **Resend**, **Cloudflare Turnstile**, **next-sitemap**, and locale routing **`de` / `en`**.

Live: [mrbubbles-src.dev](https://mrbubbles-src.dev)

## Run in the monorepo

```bash
# from bubbles-verse root
bun install
bunx turbo dev --filter=portfolio
```

```bash
# or from this directory
cd apps/portfolio
bun run dev
```

Default URL: [http://localhost:3000](http://localhost:3000) (locale redirect may send you to `/de` or `/en`).

## Environment

Copy `.env.example` → `.env`. Typical groups:

- **Resend** — transactional email from server actions.
- **Turnstile** — site key (public) + secret (server).
- **Site URL** — canonical/OG (`NEXT_PUBLIC_SITE_URL` or related; align with deployment).

See [`documentation/overview.md`](documentation/overview.md) for how routing and actions use these.

## Scripts

| Script | Purpose |
| ------ | ------- |
| `bun run dev` | Development (`bun --bun next dev`). |
| `bun run build` | Production build; **`postbuild`** runs `next-sitemap`. |
| `bun run start` | Serve production build. |
| `bun run lint` | ESLint. |
| `bun run typecheck` | `tsc --noEmit`. |

## App structure (high level)

```text
app/
├── [lang]/              # Localized tree (de, en)
│   ├── page.tsx
│   ├── cv/
│   ├── datenschutz/
│   ├── impressum/
│   └── [...not-found]/
├── actions/             # Server actions (e.g. mail)
├── api/og/route.tsx     # Dynamic Open Graph image
components/              # Layout sections, locale switcher, data
proxy.ts                 # Locale detection + redirect (matcher)
i18n-config.ts           # defaultLocale + locales list
```

## Documentation

- **[documentation/overview.md](documentation/overview.md)** — i18n pipeline, Resend/Turnstile, SEO.
- **[CHANGELOG.md](CHANGELOG.md)** — app-scoped release notes.

## License

MIT © mrbubbles-src
