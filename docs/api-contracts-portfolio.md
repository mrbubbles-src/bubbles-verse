# API Contracts: Portfolio

> Generated: 2026-04-05 | Scan Level: Exhaustive

## Server Actions

### `sendEmail(formData: FormData)`
**Location:** `app/actions/send-mails.ts`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | yes | Sender's name |
| email | string | yes | Sender's email |
| message | string | yes | Message content |
| captcha | string | yes | Cloudflare Turnstile token |
| locale | 'de' \| 'en' | yes | User's language |

**Response:** `{ success: boolean, error?: unknown }`

**Flow:**
1. Validate Turnstile token via `POST https://challenges.cloudflare.com/turnstile/v0/siteverify`
2. Generate localized HTML + plain text emails
3. Send owner notification to `contact@mrbubbles-src.dev` via Resend SMTP
4. Send auto-reply to sender with portfolio info
5. Return success/error

## API Routes

### `GET /api/og`
**Location:** `app/api/og/route.tsx`

**Response:** PNG image (1200x630px)
- Content: Dynamic OG preview with logo, name, title
- Used by: OpenGraph meta tags for social media sharing
