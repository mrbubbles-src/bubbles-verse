# The Coding Vault (`apps/the-coding-vault`)

Knowledge / CMS-style application: **Next.js 16**, **MDX**, **Editor.js**, **Drizzle ORM**, **PostgreSQL** (often via Supabase or any hosted Postgres), **JWT** auth (**jose**), **bcryptjs**, **Cloudinary** media, and shared **`@bubbles/ui`**.

**Status:** Active development — verify `drizzle/` and routes in source when docs and code disagree.

Current baseline in this workspace is validated against **Next.js 16.2.3**.

## Quick start (monorepo)

```bash
cd /path/to/bubbles-verse
bun install
cp apps/the-coding-vault/.env.example apps/the-coding-vault/.env
# edit .env — database URL, JWT secret, Cloudinary, etc.

bunx turbo dev --filter=the-coding-vault
```

Single-directory workflow:

```bash
cd apps/the-coding-vault
bun install    # only after root install if dependencies are missing
bun run dev
```

## Scripts

| Script | Purpose |
| ------ | ------- |
| `bun run dev` | Next development server. |
| `bun run build` | Production build. |
| `bun run start` | Run built app. |
| `bun run lint` | ESLint. |
| `bun run typecheck` | TypeScript check. |
| `bun run seed` | `tsx ./drizzle/db/seed.ts` — development data (verify before prod). |

Database schema and migrations live under **`drizzle/`**. Use Drizzle Kit (`bunx drizzle-kit …`) after schema changes; commit generated SQL.

## Environment (summary)

Required shape depends on features you enable; **`.env.example`** is authoritative. Commonly:

- **DB:** `DATABASE_URL`, optional `DIRECT_URL`
- **Auth:** `JWT_SECRET`
- **App URL:** `NEXT_PUBLIC_APP_URL`
- **Cloudinary:** `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- **Optional:** `DISCORD_WEBHOOK_URL`, Supabase CLI tokens, `THE_CODING_VAULT_ENABLE_NO_DB_FALLBACK`

Cross-check new vars with root [`turbo.json`](../../turbo.json) `env` lists if builds look cached or wrong.

## Documentation

- **[documentation/overview.md](documentation/overview.md)** — Drizzle workflow, content stack, auth/media notes, troubleshooting.
- **[CHANGELOG.md](CHANGELOG.md)** — app-scoped history.
