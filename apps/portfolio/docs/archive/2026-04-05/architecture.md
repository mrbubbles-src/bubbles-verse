# Architecture: Portfolio

> Generated: 2026-04-05 | Scan Level: Exhaustive

## Executive Summary

Developer portfolio website with internationalization (DE/EN), email contact via Resend, Cloudflare Turnstile CAPTCHA, and PDF CV viewer. Fully server-rendered with minimal client state.

## Technology Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| Runtime | React | 19.2.4 |
| Language | TypeScript | 5.9.3 |
| Styling | Tailwind CSS v4 | 4.1.18 |
| UI Library | @bubbles/ui (shadcn) | workspace |
| Icons | Hugeicons, Font Awesome | 4.0/7.1 |
| Email | Resend (via nodemailer) | 6.5.2 |
| CAPTCHA | Cloudflare Turnstile | react-turnstile 1.1.4 |
| PDF | react-pdf | latest |
| i18n | @formatjs/intl-localematcher + negotiator | 0.6.2 |
| Forms | react-hook-form | 7.68.0 |
| Validation | Zod | 4.1.13 |
| Themes | next-themes | 0.4.6 |
| SEO | next-sitemap | 4.2.3 |
| Package Manager | Bun | 1.3.11 |

## Architecture Pattern

**Server-First Rendering with Selective Client Hydration**

- Pages are server components by default
- Client components only where interaction is needed (ContactForm, CV viewer, theme toggle)
- Server Actions for form submission (email sending)
- Static generation for both locales via `generateStaticParams`

## Routing Architecture

```
/[lang]/                    # i18n root (de/en)
├── page.tsx                # Homepage (About, Stack, Projects, Contact)
├── cv/page.tsx             # PDF CV viewer (client-rendered)
├── datenschutz/page.tsx    # Privacy policy
├── impressum/page.tsx      # Legal notice
├── loading.tsx             # Suspense fallback
├── not-found.tsx           # 404
└── [...not-found]/page.tsx # Catch-all 404

/api/og/route.tsx           # OG image generation (1200x630)
```

**i18n Middleware** (`proxy.ts`):
- Detects preferred language from `Accept-Language` header
- Redirects URLs without locale prefix to detected locale
- Ignores static assets (PDFs, images, manifests)

## API Design

### Server Action: `sendEmail(formData)`
- **Location:** `app/actions/send-mails.ts`
- **Flow:** Validate Turnstile → Extract form data → Generate localized emails → Send via Resend SMTP
- **Sends 2 emails:** Owner notification + auto-reply to sender
- **Returns:** `{ success: boolean, error?: unknown }`

### API Route: `GET /api/og`
- Returns dynamic PNG OG image (1200x630) via `ImageResponse`

## State Management

Minimal client-side state — no global store:

| State | Scope | Mechanism |
|-------|-------|-----------|
| Theme | Global | next-themes (localStorage) |
| Form data | ContactForm | react-hook-form |
| CAPTCHA token | ContactForm | useState |
| PDF navigation | CV page | useState (page, loading) |
| Mobile menu | Navbar | useState |
| Scroll position | ScrollToTop | IntersectionObserver |
| Input modality | Global | DOM class (`mouse-mode`) |

## Security

- **CSP Headers:** Script/frame restrictions for Cloudflare Turnstile
- **HSTS:** 2-year max-age with preload
- **X-Frame-Options:** SAMEORIGIN
- **X-Content-Type-Options:** nosniff
- **CAPTCHA:** Server-side Turnstile token validation
- **Cache-Control:** Static assets immutable; HTML stale-while-revalidate

## Data Architecture

No database. Static data in TypeScript files:

| File | Content |
|------|---------|
| `data/projects.ts` | Portfolio projects (title, tech, links, images) |
| `data/stack.ts` | Technology categories (Frontend, Backend, Tooling) |
| `data/email_replies.ts` | Localized email templates (HTML + plain text) |
| `dictionaries/de.json` | German translations |
| `dictionaries/en.json` | English translations |

## External Integrations

| Service | Purpose | Integration Point |
|---------|---------|-------------------|
| Resend | Email delivery | Server action via SMTP |
| Cloudflare Turnstile | CAPTCHA | Client component + server validation |
| Google Fonts | Typography | Montserrat (layout.tsx) |

## Testing Strategy

No tests currently configured for the portfolio app.

## Deployment

- **Platform:** Vercel
- **Build:** `bun --bun next build` → `next-sitemap` (postbuild)
- **Env vars required:** `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `NEXT_PUBLIC_APP_URL`
