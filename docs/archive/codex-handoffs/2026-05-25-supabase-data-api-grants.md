# Codex Handoff: Supabase Data API Grants

Date: 2026-05-25
Repo: /Users/mrbubbles/dev/bubbles-verse
Branch: new-app/dashboard
Commit: a5576a9
Working tree: clean before this handoff file was created

## Current Goal

Assess whether the repository is affected by Supabase's upcoming change where new `public` schema tables are not exposed to the Data API without explicit grants.

## Completed

- Reviewed the Supabase email screenshot supplied by the user.
- Checked repository usage of Supabase client libraries and direct Data API patterns.
- Confirmed `apps/dashboard` uses `@supabase/ssr` / `supabase-js` for authentication flows.
- Confirmed dashboard data reads and writes appear to use Drizzle with direct Postgres connections, not `supabase.from(...)`.
- Checked dashboard migrations and found `public` tables plus RLS policies, but no explicit `grant ... on table "public"...` statements in the inspected SQL.
- Reported to the user that the project is likely not acutely affected, with a future migration caveat.

## Files Touched Or Investigated

Touched:

- `docs/codex-handoffs/2026-05-25-supabase-data-api-grants.md` - continuation handoff for this investigation.

Investigated:

- `AGENTS.md` - repo instructions: be concise, verify docs/tooling, run checks for code changes, keep docs scoped.
- `apps/dashboard/package.json` - confirms Supabase and Drizzle dependencies.
- `apps/dashboard/lib/supabase/server.ts` - server Supabase client is for request-scoped auth/session handling.
- `apps/dashboard/lib/supabase/client.ts` - browser Supabase client is for GitHub OAuth/auth actions.
- `apps/dashboard/app/login/page.tsx` - uses `supabase.auth.signInWithOAuth`.
- `apps/dashboard/app/auth/callback/route.ts` - uses `supabase.auth.exchangeCodeForSession`.
- `apps/dashboard/app/auth/logout/route.ts` - uses `supabase.auth.signOut`.
- `apps/dashboard/app/api/vault/entries/route.ts` - uses Supabase auth for user lookup.
- `apps/dashboard/app/api/vault/entries/[id]/route.ts` - uses Supabase auth for user lookup.
- `apps/dashboard/app/api/vault/entries/[id]/duplicate/route.ts` - uses Supabase auth for user lookup.
- `apps/dashboard/lib/vault/entries.ts` - imports Drizzle `db`; `.from(...)` calls are Drizzle query builder usage.
- `apps/dashboard/lib/profile/profile.ts` - imports Drizzle `db`; profile data access is direct Postgres via Drizzle.
- `apps/dashboard/lib/dashboard/home.ts` - imports Drizzle `db`; dashboard summaries use direct Postgres via Drizzle.
- `apps/dashboard/lib/account/dashboard-access.ts` - imports Drizzle `db`; allowlist access uses direct Postgres via Drizzle.
- `apps/dashboard/drizzle/0000_thankful_black_cat.sql` - creates dashboard `public` tables.
- `apps/dashboard/drizzle/0001_sloppy_rogue.sql` - creates `private.dashboard_github_allowlist`.
- `apps/dashboard/drizzle/0002_dashboard_rls.sql` - enables RLS and defines policies; grants only found for private schema/functions/table, not public tables.
- `apps/dashboard/drizzle/0003_dashboard_home_indexes.sql` - adds indexes only.
- `apps/the-coding-vault/.env.example` - references Supabase-hosted Postgres connection strings.
- `apps/the-coding-vault/drizzle/*` - inspected as another direct Postgres/Drizzle app area.

## Commands And Checks Run

- `rg -n "supabase|@supabase|createClient|/rest/v1|/graphql/v1|postgrest|GRANT|grant |public\\." .` - found Supabase deps/docs, dashboard auth usage, Drizzle metadata, and dashboard RLS grants.
- `rg --files -g '*migration*' -g '*.sql' -g 'supabase/**' -g 'packages/**' -g 'apps/**'` - listed migrations and many repo files; output was very large.
- `find . -maxdepth 3 -iname '*supabase*' -o -name 'package.json' -o -name '.env*'` - found Supabase packages and app env/package files.
- `rg -n "create table|alter table|grant |revoke |enable row level security|policy|public\\." apps/dashboard/drizzle apps/the-coding-vault/drizzle --glob '*.sql'` - found dashboard RLS policies and grants, no public table grants in inspected output.
- `rg -n "\\.from\\(|\\.rpc\\(|storage\\.|functions\\.|channel\\(|supabase\\." apps/dashboard apps/the-coding-vault packages --glob '!**/.next/**' --glob '!**/node_modules/**' --glob '!**/docs/**'` - confirmed Supabase client usage is auth-focused; `.from(...)` hits in data modules are Drizzle.
- `sed -n '1,220p' apps/dashboard/lib/supabase/server.ts && sed -n '1,160p' apps/dashboard/lib/supabase/client.ts && sed -n '1,220p' apps/dashboard/drizzle/0000_thankful_black_cat.sql && sed -n '1,240p' apps/dashboard/drizzle/0001_sloppy_rogue.sql && sed -n '1,260p' apps/dashboard/drizzle/0002_dashboard_rls.sql && sed -n '1,160p' apps/dashboard/drizzle/0003_dashboard_home_indexes.sql` - inspected relevant Supabase client and migration excerpts.
- `sed -n '1,80p' apps/dashboard/lib/vault/entries.ts && sed -n '1,80p' apps/dashboard/lib/profile/profile.ts && sed -n '1,80p' apps/dashboard/lib/dashboard/home.ts && sed -n '1,80p' apps/dashboard/lib/account/dashboard-access.ts` - verified data modules import Drizzle `db`.
- `rg -n "from '@/drizzle|from '@/lib/db|drizzle|postgres|DATABASE_URL|DIRECT_URL" apps/dashboard apps/the-coding-vault --glob '!**/.next/**' --glob '!**/node_modules/**'` - confirmed direct Postgres/Drizzle architecture.
- `rg -n "grant .* on table \\\"public\\\"|grant .* on table public|alter default privileges|default privileges|grant usage on schema \\\"public\\\"|grant usage on schema public" apps/dashboard/drizzle apps/the-coding-vault/drizzle --glob '*.sql'` - no matching public grants found.
- `git rev-parse --show-toplevel` - repo root `/Users/mrbubbles/dev/bubbles-verse`.
- `git branch --show-current` - branch `new-app/dashboard`.
- `git rev-parse --short HEAD` - commit `a5576a9`.
- `git status --short` - clean before creating this handoff.
- `git diff --name-only` - no output before creating this handoff.
- `git diff --stat` - no output before creating this handoff.
- `find . -maxdepth 4 \\( -path './.git' -o -path './node_modules' -o -path './apps/*/.next' \\) -prune -o \\( -type d -path '*/codex-handoffs' -o -type d -path '*/handoffs' \\) -print` - found `./docs/codex-handoffs`.
- `sed -n '1,240p' AGENTS.md` - read repo instructions.

## Known Errors, Warnings, Or Failing Checks

- No tests, lint, typecheck, or formatting were run because no product code was changed.
- The first broad `rg --files` command included generated `.next` paths and produced a very large truncated output.
- No live Supabase dashboard/Security Advisor check was performed.

## Open Decisions

- Decide whether future dashboard migrations should add explicit public table grants whenever a table is intended for Supabase Data API/PostgREST access.
- Decide whether to add a small migration convention/documentation note near `apps/dashboard/drizzle/` or `apps/dashboard/README.md`.
- Decide whether to verify the production Supabase project with Security Advisor for actual current grants.

## Constraints, Preferences, And Do-Not-Touch Areas

- User calls the assistant Lio.
- Be extremely concise.
- Do not terminate user-managed long-running processes.
- For Next.js work, read relevant `node_modules/next/dist/docs/` docs before coding due breaking changes.
- Ask before significantly changing a file.
- Always run formatting, linting, and typechecking before finishing code changes.
- For UI work, use frontend-design, userinterface-wiki, and shadcn skills; check `@bubbles/ui` first.
- Use direct repo evidence; do not guess about Supabase production settings.
- Do not include secrets from `.env` files.

## Next Steps

1. If continuing the Supabase task, inspect actual Supabase dashboard Security Advisor or database privileges if credentials/tooling are available.
2. Add a concise migration guideline for future `public` tables if the team wants to prevent this from recurring.
3. If Data API access is desired for any new table, add explicit `grant` statements in the relevant migration and matching RLS policies.
4. Re-run `rg` for `supabase.from`, `/rest/v1`, `/graphql/v1`, and generated client usage after any future data-layer change.
5. If changing docs or migrations, run the repo's normal formatting/lint/typecheck commands before final handoff.

## Reactivation Prompt

```text
Continue this work from the handoff document:
/Users/mrbubbles/dev/bubbles-verse/docs/codex-handoffs/2026-05-25-supabase-data-api-grants.md

Work in repo:
/Users/mrbubbles/dev/bubbles-verse

Start by reading the handoff and any repo instructions such as AGENTS.md. Verify the current branch and working tree with git status before editing. Do not rely on old chat context; treat the handoff and repository as the source of truth.

Current goal:
Assess whether the repository is affected by Supabase's upcoming Data API grant change and decide whether future migration guidance or explicit grants are needed.

Important constraints:
- Be concise.
- Do not guess production Supabase settings.
- Ask before significantly changing files.
- Avoid secrets from .env files.
- Run formatting, linting, and typechecking before finishing code changes.

Begin with the next steps listed in the handoff, and report any mismatch between the handoff and the current repo state before changing files.
```
