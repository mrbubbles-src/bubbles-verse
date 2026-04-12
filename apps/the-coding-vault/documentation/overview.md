# The Coding Vault — developer guide

## What this app is

A **content + admin** style Next.js app: **MDX** and **Editor.js** for rich text, **Drizzle ORM** against **PostgreSQL**, **JWT** session pattern (`jose`), password hashing (**bcryptjs**), and **Cloudinary** (plus **`next-cloudinary`**) for media. It consumes **`@bubbles/ui`** for shared primitives and Tailwind tokens.

Treat it as **under active development** — schema and routes evolve; prefer reading `drizzle/db/schema.ts` over outdated prose.

## Monorepo commands

```bash
bunx turbo dev --filter=the-coding-vault
# or
cd apps/the-coding-vault && bun run dev
```

## Environment

Start from **`.env.example`**. Groups you normally need:

| Area | Typical variables |
| ---- | ----------------- |
| Database | `DATABASE_URL`, sometimes `DIRECT_URL` for hosted Postgres (migrations vs pooled URL). |
| Auth | `JWT_SECRET` (long random), strength requirements enforced in code. |
| App | `NEXT_PUBLIC_APP_URL` for absolute links and callbacks. |
| Media | `NEXT_PUBLIC_CLOUDINARY_*`, `CLOUDINARY_API_SECRET`. |
| Integrations | `DISCORD_WEBHOOK_URL`, Supabase-related tokens if you use CLI or auth bridge. |

**No-DB fallback:** `THE_CODING_VAULT_ENABLE_NO_DB_FALLBACK` appears in root [`turbo.json`](../../../turbo.json) — useful for UI-only work when the database is unavailable; confirm behavior in source before relying on it in production.

## Database and Drizzle

- **Schema:** [`drizzle/db/schema.ts`](../drizzle/db/schema.ts), relations in [`relations.ts`](../drizzle/db/relations.ts).
- **Client:** [`drizzle/db/index.ts`](../drizzle/db/index.ts) (or as refactored).
- **Migrations:** managed with **Drizzle Kit** (`drizzle-kit` in devDependencies). Common workflow:

  ```bash
  cd apps/the-coding-vault
  # after schema changes — exact subcommand depends on your drizzle.config
  bunx drizzle-kit generate
  bunx drizzle-kit migrate
  ```

  Keep migration artifacts **in version control**; do hand-editing only when you understand SQL impact.

- **Seeding:** `bun run seed` → `tsx ./drizzle/db/seed.ts` — safe to run only against disposable DBs unless seed is idempotent.

## Content stack

- **Public entry rendering:** stored Editor.js blocks are converted to MDX and rendered via **`@bubbles/markdown-renderer`** in the Vault route. Import `@bubbles/markdown-renderer/styles/renderer` from the Vault layout for syntax highlighting variables and inline-code styles.
- **Editor.js:** Plugin set in dependencies — upgrading **@editorjs/\*** majors can change JSON output; regression-test save/load when bumping versions.
- **Legacy MDX app config:** if `next.config.ts` still carries MDX support for historical reasons, treat the shared renderer package as the source of truth for public entry rendering behavior.

## Auth and security

- Treat **`JWT_SECRET`** like production credentials — rotate if leaked.
- Passwords: **bcryptjs** only; never log raw credentials.
- Prefer server components or server actions for secret-bearing operations; keep Cloudinary signatures server-side.

## Media

- Configure upload presets and folders in Cloudinary; restrict transformations in code to what you need (avoid open-ended eager transforms).

## Shared UI

Import **`@bubbles/ui/globals.css`** in the app root layout. Prefer package **shadcn** paths for buttons/forms to match other apps.

## When things go wrong

| Symptom | Check |
| ------- | ----- |
| Migrations fail | `DATABASE_URL` vs `DIRECT_URL`, SSL mode, drizzle folder state. |
| JWT invalid after deploy | Secret mismatch across Vercel envs, clock skew rare but possible. |
| Images broken | Cloudinary cloud name / API key / unsigned vs signed URLs. |
| Build differs locally vs CI | Env not listed in `turbo.json` — see [documentation/tooling.md](../../../documentation/tooling.md). |

## Related docs

- App [README.md](../README.md) — scripts and env list.
- **Root** [documentation/architecture.md](../../../documentation/architecture.md) — monorepo boundaries.
