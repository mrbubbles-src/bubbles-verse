# Architecture: The Coding Vault

> Generated: 2026-04-05 | Scan Level: Exhaustive

## Executive Summary

Full-stack CMS/knowledge base for coding tutorials. Features a public vault with MDX-rendered entries and a protected admin area with an Editor.js-based content editor. Uses PostgreSQL (Drizzle ORM), JWT authentication, and Cloudinary for media.

## Technology Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| Runtime | React | 19.2.4 |
| Language | TypeScript | 5.9.3 |
| Database | PostgreSQL | via pg/postgres |
| ORM | Drizzle ORM | 0.45.0 |
| Auth | JWT (jose) + bcryptjs | 6.1.3 / 3.0.3 |
| Content Editor | Editor.js | 2.31.0 |
| Content Render | next-mdx-remote-client + remark-gfm | 2.1.7 |
| Syntax Highlight | Shiki | 3.19.0 |
| Media | Cloudinary + next-cloudinary | 2.8.0 / 6.17.5 |
| Styling | Tailwind CSS v4 | 4.x |
| UI Library | @bubbles/ui (shadcn) | workspace |
| Forms | react-hook-form + @hookform/resolvers | 7.68.0 |
| Validation | Zod | 4.1.13 |
| Themes | next-themes | 0.4.6 |
| Notifications | Sonner | 2.0.7 |
| Data Tables | @tanstack/react-table | 8.21.3 |
| Icons | Font Awesome, Hugeicons | 7.1 / 4.0 |
| Package Manager | Bun | 1.3.11 |

## Architecture Pattern

**Full-Stack with Route Groups + Role-Based Access**

- Two route groups: `(vault)` (public, mostly static) and `(admin)` (protected, dynamic)
- Server components for data fetching, client components for interactivity
- JWT-based auth with role hierarchy (SUPERADMIN > MODERATOR > GUEST)
- Content pipeline: Editor.js → JSON → MDX → Rendered HTML

## Routing Architecture

### Public Routes `(vault)`
```
/                           # Landing page
/vault                      # Entry listing
/vault/[slug]               # Individual entry (MDX rendered)
```
- `dynamic: 'force-static'`, `revalidate: 3600`

### Admin Routes `(admin)`
```
/admin/login                # Authentication
/admin/dashboard            # Admin home
/admin/dashboard/entries/
  ├── submit                # Create entry (Editor.js)
  ├── all                   # All entries
  ├── published             # Published only
  ├── unpublished           # Unpublished only
  └── delete                # Delete entry
/admin/dashboard/users/
  ├── all                   # User list (SUPERADMIN)
  ├── create                # Create user (SUPERADMIN)
  └── delete                # Delete user (SUPERADMIN)
```
- `dynamic: 'force-dynamic'`

## API Design

### Auth Endpoints

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| POST | `/api/auth/login` | Authenticate user, set JWT cookie | None |
| POST | `/api/auth/register` | Create new user | None (should be protected) |
| POST | `/api/auth/logout` | Clear JWT cookie | None |
| GET | `/api/auth/user` | Get current user from token | JWT cookie |

### Vault Endpoints

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| POST | `/api/vault/save-entry` | Create/update vault entry | Implicit (admin) |
| GET | `/api/vault/categories` | List all categories | None (cached 24h) |
| POST | `/api/vault/image-upload` | Upload image to Cloudinary | Implicit (admin) |

### Utility Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/error/report-error` | Send error to Discord webhook |
| GET | `/api/og` | Generate OG image |

## Data Architecture

### Database Schema (Drizzle ORM + PostgreSQL)

#### `users`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, gen_random_uuid |
| numericId | serial | unique |
| username | varchar | unique, not null |
| password | varchar | bcrypt hashed |
| email | varchar | unique, not null |
| role | enum | SUPERADMIN / MODERATOR / GUEST |
| authorInfo | JSONB | { name, email, avatar, authorSocials } |
| createdAt | timestamp | default now() |
| updatedAt | timestamp | default now() |

#### `categories`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| name | varchar | unique, not null |
| slug | varchar | unique, not null |
| order | integer | not null |
| iconKey | enum | git/github/node/html/css/js/react/backend/database/default |
| createdAt | timestamp | |
| updatedAt | timestamp | |

#### `vaultEntries`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| numericId | serial | unique |
| title | varchar | not null |
| slug | varchar | unique, not null |
| content | JSONB | Editor.js block format |
| description | varchar | default '' |
| authorId | UUID | FK → users.id (cascade delete) |
| categoryId | UUID | FK → categories.id (cascade delete) |
| published | boolean | default false |
| isFeatured | boolean | default false |
| order | integer | default 0 |
| createdAt | timestamp | |
| updatedAt | timestamp | |

#### Relationships
- users → many vaultEntries
- categories → many vaultEntries
- vaultEntries → one user (author)
- vaultEntries → one category

### Seed Data
9 default categories: Git, GitHub, Node.js, HTML, CSS, JavaScript, React, Backend, Database.

## Authentication & Authorization

### JWT Implementation (`lib/auth.ts`)
- **Algorithm:** HS256
- **Expiry:** 30 days
- **Payload:** `{ id, username, role }`
- **Storage:** httpOnly cookie (`secure`, `sameSite: lax`)

### Role-Based Access (`lib/roles.ts`)
| Permission | SUPERADMIN | MODERATOR | GUEST |
|------------|:----------:|:---------:|:-----:|
| Submit entry | x | x | x |
| View entries | x | x | x |
| Delete entry | x | - | - |
| Manage users | x | - | - |

### Auth Guards
- `authGuard()` — Redirects to login if no valid token
- `multiRoleGuard(roles)` — Checks user role against allowed list
- `getCurrentUser()` — Returns user payload or error type

## Content Pipeline

```
Admin creates entry
  → Editor.js (14 block types)
  → Save as JSONB to PostgreSQL
  → Convert blocks to MDX string (convert-editor-js-to-mdx.tsx)
  → Render via next-mdx-remote-client with custom components
  → Display with Shiki syntax highlighting
```

### Editor.js Block Types
Header, List (ordered/unordered/checklist), Code, Quote, Alert, Delimiter, Toggle, Table, Embed, Image, Inline Code, Strikethrough, Annotation, Inline Hotkey

### MDX Custom Components
| Component | Renders |
|-----------|---------|
| VaultCodeBlock | Syntax-highlighted code (Shiki, one-dark-pro) |
| VaultAlerts | Styled alert boxes (info/success/warning/danger) |
| VaultDetailsToggle | Collapsible sections |
| VaultEmbed | iframe embeds (YouTube, etc.) |
| VaultImage | Cloudinary images with blur placeholder |
| VaultLink | Smart links (internal/anchor/external) |
| VaultChecklist | Nested checkbox lists |

## Media Management

- **Upload:** `/api/vault/image-upload` → Cloudinary (`vault-uploads` folder)
- **Delivery:** CDN URLs via next-cloudinary
- **Avatars:** Cloudinary transformations (`c_fill,g_face,w_160,h_160`)
- **Blur placeholders:** Server-side base64 generation for images

## State Management

Minimal — server-side data fetching dominates:

| State | Scope | Mechanism |
|-------|-------|-----------|
| Theme | Global | next-themes (cookie) |
| Sidebar open/close | Layout | Cookie persistence |
| Auth user | Server | JWT cookie + `getCurrentUser()` |
| Editor content | Admin editor | Editor.js instance state |
| Form data | Forms | react-hook-form |

## Error Handling

- Error boundaries at vault and entry level
- Error reporting to Discord webhook
- No-DB fallback mode (`THE_CODING_VAULT_ENABLE_NO_DB_FALLBACK`) for UI development

## External Integrations

| Service | Purpose | Integration |
|---------|---------|-------------|
| PostgreSQL | Database | Drizzle ORM (postgres-js driver) |
| Cloudinary | Media CDN | Upload API + next-cloudinary rendering |
| Discord | Error reporting | Webhook POST |

## Testing Strategy

No tests currently configured for The Coding Vault.

## Deployment

- **Platform:** Vercel
- **Build:** `bun --bun next build` (with MDX plugin)
- **Database:** External PostgreSQL (connection via `DATABASE_URL`)
- **Required env vars:** `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, Cloudinary keys, `DISCORD_WEBHOOK_URL`
- **Experimental features:** `useCache: true`, `mdxRs` with GFM, `typedRoutes: true`
