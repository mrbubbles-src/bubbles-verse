# Portfolio — developer guide

## Routing and locale

- **Locales:** `de` (default) and `en` — see [`i18n-config.ts`](../i18n-config.ts).
- **Segment:** All localized pages live under `app/[lang]/…`.
- **Detection / redirect:** [`proxy.ts`](../proxy.ts) runs on the Next matcher, uses **`negotiator`** + **`@formatjs/intl-localematcher`** against `Accept-Language`, and **redirects** paths without a locale prefix (for example `/` → `/de` or `/en` depending on negotiation).
- **Excluded paths:** Static assets listed in `proxy.ts` bypass locale redirection (favicons, PDFs, OG images, etc.) — add new public filenames there if the browser requests them at root paths.

When adding a **new top-level route**, nest it under `app/[lang]/` and ensure dictionaries (`getDictionary`, JSON under `components/dictionaries/` or equivalent) receive new keys for both locales.

## Dictionaries and UI copy

Localized strings are loaded per request in the `[lang]` layout (see [`app/[lang]/layout.tsx`](../app/[lang]/layout.tsx)). JSON lives under [`dictionaries/`](../dictionaries/) (`de.json`, `en.json`).

- Add/extend keys in both locale files; keep shape identical.
- Pass slices of the dictionary into layout components (`Navbar`, `Footer`, sections) as props rather than importing locale inside leaf components — keeps server boundaries clear.

## Contact form and email

- **Transport:** **Resend** from **server actions** under `app/actions/` (or the path your refactor uses).
- **Validation:** **Zod** + **react-hook-form** on the client; re-validate or trust server-side Zod in the action before sending.
- **Env:** API key and sender domain must match Resend dashboard configuration; production failures are often domain verification or missing `RESEND_API_KEY`.

Document exact variable names in `.env.example` (not committed here) — never commit secrets.

## Turnstile (bot mitigation)

- **Public key** → `NEXT_PUBLIC_*` (widget script).
- **Secret** → server-only var; verify server-side in the same action that sends mail or persists data.
- Rotate keys if exposed; widget failures often show as silent form rejections — check server logs and Turnstile dashboard.

## SEO and social

- **Sitemap:** `next-sitemap` runs in `postbuild`; ensure production `siteUrl` config matches your domain.
- **Open Graph:** Dynamic route under `app/api/og` (or current equivalent) — keep `NEXT_PUBLIC_SITE_URL` / canonical base aligned with Vercel env so OG URLs are not `localhost`.
- **Structured data:** Person JSON-LD is embedded in [`app/[lang]/layout.tsx`](../app/[lang]/layout.tsx); update when profile facts change.

## Styling and shared UI

- Import **`@bubbles/ui/globals.css`** once in the root layout stack.
- Use **`@bubbles/ui/shadcn/*`** for primitives; keep **marketing-only** sections and portfolio-specific data (`components/data/`, project cards) inside `apps/portfolio`.

## PDF / CV

CV routes under `[lang]/cv` reference static assets in `public/` (German/English PDFs). When replacing files, keep filenames or update references in the CV page and `proxy.ts` allowlist if served from root.

## Debugging checklist

| Problem | Check |
| ------- | ----- |
| Wrong default language | `Accept-Language`, `i18n.defaultLocale`, redirect logic in `proxy.ts`. |
| 404 on `/foo` without locale | Expected — add path to matcher exclusions or use `/{lang}/foo`. |
| Email not sent | Resend key, from-domain, server action error logs. |
| Turnstile always fails | Key pair mismatch, domain not allowed, secret not in server env. |
