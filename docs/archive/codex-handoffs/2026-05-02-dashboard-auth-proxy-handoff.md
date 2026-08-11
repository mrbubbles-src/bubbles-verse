# Dashboard Auth/Proxy Handoff

Date: 2026-05-02  
Repo: `/Users/mrbubbles/dev/bubbles-verse`  
Branch: `new-app/dashboard`

## Current goal

Stabilize local `apps/dashboard` development performance and eliminate the
"dev server hangs until restart" behavior, especially around auth/proxy/caching
and the first request after a cold dev-server start.

## What we already completed

### Implemented and committed

1. `00d9456 feat: implement caching strategy and enhance dashboard performance`
   - Enabled Next.js Cache Components in `apps/dashboard`.
   - Added shared dashboard cache tags and invalidation.
   - Kept auth/session checks outside persistent `use cache`.
   - Added request-scoped React `cache()` dedupe for dashboard session loading.
   - Added route/action invalidation hooks and test coverage.

2. `3e47aa8 fix: reduce dashboard auth proxy load`
   - Replaced the broad dashboard proxy regex matcher with explicit page-route
     matching.
   - Removed proxy-level Supabase auth network calls.
   - Switched proxy auth to optimistic cookie-presence checks only.
   - Added a visible dashboard shell Suspense fallback.
   - Added development timing logs and a single retry for transient Postgres
     statement timeouts on the allowlist read.

### Investigated and confirmed

- The original broad regex matcher pattern was likely recreating the same class
  of problem previously seen in `novari-education-lms`: too many proxy/auth
  hits on dev/internal requests.
- Supabase dashboard showed the smoking gun at one point:
  `1 database request` vs `306 auth requests` over 24h.
- After the proxy/auth fix, page-to-page navigation became much faster and
  Supabase auth requests stopped spiking.
- The allowlist query itself is not unindexed:
  `private.dashboard_github_allowlist` has the composite primary-key index on
  `(github_username, email)`.
- Direct database measurements showed the query plan is cheap; the remaining
  issue looks like cold connection/pooler latency rather than bad SQL.

## Current status

- Current working tree appears clean except for this handoff doc.
- The committed proxy/auth fixes are still present in `HEAD`.
- `apps/dashboard/.next/dev/trace-turbopack` exists.
- `apps/dashboard/.next/dev/logs/next-development.log` exists.

## Files touched or investigated

### Touched in committed work

- `apps/dashboard/proxy.ts`
- `apps/dashboard/lib/supabase/proxy.ts`
- `apps/dashboard/app/(dashboard)/layout.tsx`
- `apps/dashboard/lib/account/dashboard-access.ts`
- `apps/dashboard/__tests__/proxy.test.ts`
- `apps/dashboard/__tests__/lib/account/dashboard-access.server.test.ts`
- `apps/dashboard/README.md`
- `apps/dashboard/CHANGELOG.md`

### Touched in earlier caching work

- `apps/dashboard/next.config.ts`
- `apps/dashboard/lib/cache/tags.ts`
- `apps/dashboard/lib/auth/session.ts`
- `apps/dashboard/lib/account/dashboard-access.ts`
- `apps/dashboard/lib/dashboard/home.ts`
- `apps/dashboard/lib/profile/profile.ts`
- `apps/dashboard/lib/vault/categories.ts`
- `apps/dashboard/lib/vault/entries.ts`
- `apps/dashboard/lib/vault/overview.ts`
- `apps/dashboard/app/(dashboard)/account/actions.ts`
- `apps/dashboard/app/(dashboard)/profile/actions.ts`
- `apps/dashboard/app/(dashboard)/vault/categories/actions.ts`
- `apps/dashboard/app/api/vault/entries/route.ts`
- `apps/dashboard/app/api/vault/entries/[id]/route.ts`
- `apps/dashboard/app/api/vault/entries/[id]/duplicate/route.ts`
- `apps/dashboard/app/api/editor-image-upload/route.ts`
- `apps/dashboard/vitest.setup.ts`
- `apps/dashboard/__tests__/app/api/vault-entries-route.test.ts`
- `apps/dashboard/__tests__/app/api/vault-entry-route.test.ts`
- `apps/dashboard/__tests__/app/api/vault-entry-duplicate-route.test.ts`
- `apps/dashboard/__tests__/lib/cache/tags.test.ts`

### Investigated but not changed in the final proxy/auth fix

- `apps/dashboard/lib/supabase/server.ts`
- `apps/dashboard/drizzle/db/index.ts`
- `apps/dashboard/drizzle/0001_sloppy_rogue.sql`
- `apps/dashboard/drizzle/db/schema.ts`
- `apps/dashboard/app/(dashboard)/vault/entries/[id]/page.tsx`
- `apps/dashboard/app/(dashboard)/vault/preview/[id]/page.tsx`
- `apps/dashboard/app/(dashboard)/loading.tsx`
- `/Users/mrbubbles/dev/novari/novari-education-lms/proxy.ts`
- `node_modules/.bun/next@16.2.3+75fd914bd500a5b7/node_modules/next/dist/docs/...`

## Commands and checks already run

### Repo and git

- `git status --short`
- `git branch --show-current`
- `git log --oneline -5`
- `git show --stat --oneline HEAD`
- `git show --stat --oneline 00d9456`

### Dashboard quality checks

Run multiple times during this session:

- `bunx prettier --write ...`
- `cd apps/dashboard && bun run lint`
- `cd apps/dashboard && bun run test:run`
- `cd apps/dashboard && bun run typecheck`
- `cd apps/dashboard && bun run build`

Known recent green state:

- `vitest`: `35 passed`, `103 tests`
- `typecheck`: success
- `build`: success with Cache Components enabled

### Runtime/debug commands used

- `bun dev --filter=dashboard`
- `NEXT_TURBOPACK_TRACING=1 bun dev --filter=dashboard`
- `tail -n ... apps/dashboard/.next/dev/logs/next-development.log`
- `lsof -nP -iTCP:3004`
- `pgrep -fl ...`
- direct DB inspection with `bun --bun -e ...` against `DATABASE_URL`
- `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` for the allowlist query
- `pg_stat_activity`, `pg_locks`, `pg_settings`, `pg_indexes`

## Known errors, warnings, or failing checks

### No currently failing repo checks

- Lint, tests, typecheck, and build were green after the committed fixes.

### Still-observed runtime issue

The first request after a cold dev-server start can still be very slow.

Observed terminal output:

- Slow auth warning from `apps/dashboard/lib/account/dashboard-access.ts`
  around `1.8s - 2.1s` on the allowlist read.
- Cold requests like:
  - `GET / 200 in 11.7s`
  - `GET /vault/entries/[id] 200 in 11.2s`
- Warm follow-up requests usually settle around `140ms - 300ms`.

### Historical error seen before the latest retry/logging change

- `PostgresError: canceling statement due to statement timeout`
- failed query:
  `select ... from private.dashboard_github_allowlist where github_username = $1 and email = $2 limit 1`

### Current log behavior

- Terminal shows:
  `[dashboard-auth] Dashboard access read was slow. { attempt: 1, elapsedMs: ... }`
- `next-development.log` currently seems to serialize the metadata poorly and
  often only shows `{}` for those warnings.

## Important findings

1. The proxy/auth flood was real and is now reduced.
   - Broad regex matcher + proxy-level Supabase auth calls were a major source
     of wasted requests.

2. The remaining slowdown is no longer centered in `proxy.ts`.
   - Recent logs show `proxy.ts: 2ms - 5ms`.

3. The allowlist SQL plan is cheap.
   - The DB query is indexed and fast when the connection is healthy.

4. The remaining first-hit slowness likely points to one or more of:
   - Supabase pooler cold-start/queue latency
   - first request session/auth handshake cost
   - initial app compile plus request-time auth happening together

## Open decisions

1. Whether to keep using the Supabase transaction pooler URL on port `6543`
   for local dev, or switch local dev to session pooler / direct DB connection.

2. Whether dashboard page auth should continue to hit the allowlist table on
   every request, or whether `dashboard_access` / `user_role` JWT claims should
   become the primary request-time authorization source.

3. Whether to keep the current single retry only for `57014`, or expand the
   resilience strategy slightly once more runtime evidence is collected.

4. Whether the remaining cold-start slowness is worth pursuing via Turbopack
   trace analysis now, or only after DB/pooler decisions are settled.

## Constraints, user preferences, and do-not-touch areas

### Repo/process constraints from `AGENTS.md`

- Read local Next.js docs under `node_modules/next/dist/docs/` before touching
  Next.js behavior.
- Be extremely concise.
- Run formatting, linting, and typechecking before finishing.
- Add/update tests with functional changes.
- Update app-local docs and changelog for app-scoped changes.
- Use umlauts in German text.
- If a file would be changed significantly, ask before proceeding.

### User preferences and session-specific constraints

- User wanted investigation first, then narrowly scoped fixes.
- User explicitly wanted the proxy/matcher checked against the Novari LMS
  behavior because a broad regex matcher had previously "DDOS'ed" a backend.
- User asked to keep auth logic sensible:
  check whether the logged-in user is valid and authorized per request, but
  avoid redundant/expensive repeated checks in the wrong layer.
- User asked for a commit; the proxy/auth work was committed as `3e47aa8`.

### Do-not-touch / be careful

- Do not revert unrelated user changes if they reappear.
- Be careful with `packages/markdown-editor` and dashboard editor-layout work:
  there were unrelated workbench-style changes in the working tree during this
  session, and they were intentionally left out of the auth/proxy commit.
- Avoid reintroducing a broad proxy regex matcher unless there is strong proof
  it is safe.

## Next concrete steps

1. Reproduce one fresh cold-start run with `NEXT_TURBOPACK_TRACING=1` and
   capture:
   - terminal logs
   - `apps/dashboard/.next/dev/trace-turbopack`
   - the first two slow request timings

2. Add more granular dev-only timing around `loadDashboardSession()`:
   - `supabase.auth.getUser()`
   - allowlist DB read
   - total session load

3. Test local dev against a non-`6543` DB connection option if available
   (Supabase session pooler or direct connection) and compare the first-request
   timings.

4. Evaluate moving page-level authorization to JWT claims
   (`dashboard_access`, `user_role`) with DB allowlist checks reserved for
   account management, claim issuance, and critical server mutations.

5. If cold-start remains large after DB connection experiments, inspect the
   Turbopack trace to separate compile cost from app auth cost.

6. Keep the proxy narrow and page-only; do not let `_next`, `/api`, icons,
   manifest, or similar internal requests trigger auth work again.

## Reactivation prompt

Paste this into a fresh Codex chat:

```text
Continue work in `/Users/mrbubbles/dev/bubbles-verse` on branch `new-app/dashboard`.

Start by reading:
- `/Users/mrbubbles/dev/bubbles-verse/AGENTS.md`
- `/Users/mrbubbles/dev/bubbles-verse/docs/codex-handoffs/2026-05-02-dashboard-auth-proxy-handoff.md`
- the relevant Next.js docs under `node_modules/next/dist/docs/`

Current focus:
- `apps/dashboard` local dev performance is much better after narrowing the
  dashboard proxy and removing proxy-level Supabase auth requests.
- The remaining issue is cold-start slowness on the first request after a fresh
  dev-server start.

Already completed:
- Cache Components and dashboard cache-tag strategy are in place.
- Proxy is explicit page-route matching only and uses optimistic cookie checks.
- Request-time allowlist read has dev slow logs and one retry for Postgres
  statement timeout `57014`.
- These changes were committed in:
  - `00d9456 feat: implement caching strategy and enhance dashboard performance`
  - `3e47aa8 fix: reduce dashboard auth proxy load`

Current evidence:
- Warm requests are generally fast (`~140-300ms`).
- Cold requests can still be very slow (`~11s` total observed).
- Slow logs point at the request-time allowlist read, but the SQL plan itself
  is cheap and indexed.
- `proxy.ts` is no longer the bottleneck.
- Turbopack trace file exists at:
  `/Users/mrbubbles/dev/bubbles-verse/apps/dashboard/.next/dev/trace-turbopack`

Please investigate the cold-start path next without relying on old chat
context. Do not revert unrelated user changes. Be especially careful not to
reintroduce a broad proxy regex matcher.
```
