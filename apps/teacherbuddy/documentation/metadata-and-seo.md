# Metadata and SEO (TeacherBuddy)

TeacherBuddy is a **client-heavy** dashboard; SEO still matters for share cards and installable metadata. This doc ties together **root layout metadata**, **per-route titles**, **`sitemap` / `robots`**, and **Open Graph** generation.

## Global metadata

[`app/layout.tsx`](../app/layout.tsx) exports `metadata`:

- **`metadataBase`** — `new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://teacherbuddy.mrbubbles-src.dev')`. Set **`NEXT_PUBLIC_SITE_URL`** in production so canonical and OG URLs match your domain.
- **`title.template`** — `%s | TeacherBuddy` for inner pages.
- **`openGraph`** / **`twitter`** — both reference **`/api/og`** as the social image (1200×630).
- **`other['apple-mobile-web-app-title']`** — PWA-ish home screen title.

When changing the **default title or description**, update this block and smoke-test `/api/og` output.

## Per-route titles and descriptions

Feature pages re-export **`generateMetadata`** or static `metadata` (see `app/students/page.tsx`, `app/quizzes/page.tsx`, etc.). Copy should stay aligned with [`lib/page-meta.ts`](../lib/page-meta.ts):

- **`ROUTE_PAGE_META`** — single source for **path → title + description** used in UI headers and as a reference for SEO text.
- **`ROUTE_PAGE_META_BY_PATH`** — derived map for lookups.

**Workflow:** When adding a route under [`ROUTES` / paths](../lib/page-meta.ts):

1. Append `ROUTE_PAGE_META` with `id`, `path`, `title`, `description`.
2. Add the page under `app/<segment>/page.tsx` with matching `metadata` or `generateMetadata`.
3. Expose the route in navigation (`sidebar`/header) and in [`routes.md`](routes.md) if you maintain it.

## Open Graph image (`/api/og`)

Dynamic OG is served from **`app/api/og`** (inspect `route.tsx` or handler there). It should read the same branding as the shell (title, tagline, colors). If text is truncated, adjust layout in that route — not in consumer pages.

**Checklist when rebranding:**

- [ ] Root `metadata.openGraph.images`
- [ ] Twitter `images`
- [ ] `/api/og` implementation
- [ ] Optional: `lib/page-meta.ts` wording for each feature page

## `sitemap.ts` and `robots.ts`

Next serves:

- **`/sitemap.xml`** from [`app/sitemap.ts`](../app/sitemap.ts)
- **`/robots.txt`** from [`app/robots.ts`](../app/robots.ts)

Update included URLs when you add **marketing-relevant** pages. Internal-only tools rarely need to appear on the public sitemap. For staging hosts, confirm `disallow` rules in `robots.ts` so private deployments are not indexed unintentionally.

## Version in the shell

The sidebar shows **`appVersion`** passed from the server layout, sourced from [`package.json`](../package.json). Release docs should bump **`package.json` `version`** and [`CHANGELOG.md`](../CHANGELOG.md) together.

## Quick verification

```bash
cd apps/teacherbuddy
bun run build
# After deploy or locally:
curl -I https://<host>/api/og
curl https://<host>/sitemap.xml
```

Use social debuggers (Facebook/Slack/Twitter card validators) after changing OG behavior.

## Related docs

- [routes.md](routes.md) — URL inventory
- [structure.md](structure.md) — where layout and providers live
- [../README.md](../README.md) — env vars overview
