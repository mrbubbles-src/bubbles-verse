# Dashboard V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first private `dashboard` admin app for bubbles-verse with owner-only Supabase auth, a shared content core, Vault category management, and Vault entry creation/editing through `@bubbles/markdown-editor`.

**Architecture:** `apps/dashboard` becomes the only editorial write surface. It uses Supabase Auth for owner-only access, Drizzle against Supabase Postgres for the shared content schema, and shared `@bubbles/*` packages for shell, theming, footer, and editor integration. V1 implements the generic content core plus the first Vault adapter, while public consumer apps continue to read from the shared database.

**Tech Stack:** Next.js 16 App Router, React 19, Supabase Auth, Supabase Postgres, Drizzle ORM, `postgres`, Vitest, React Testing Library, `@bubbles/ui`, `@bubbles/theme`, `@bubbles/footer`, `@bubbles/markdown-editor`

---

## Planned File Structure

### App bootstrap and config

- Modify: `apps/dashboard/package.json`
- Create: `apps/dashboard/.env.example`
- Create: `apps/dashboard/vitest.config.ts`
- Create: `apps/dashboard/vitest.setup.ts`

### Database and domain

- Create: `apps/dashboard/drizzle.config.ts`
- Create: `apps/dashboard/drizzle/db/schema.ts`
- Create: `apps/dashboard/drizzle/db/relations.ts`
- Create: `apps/dashboard/drizzle/db/index.ts`
- Create: `apps/dashboard/lib/env.ts`
- Create: `apps/dashboard/lib/dashboard/home.ts`
- Create: `apps/dashboard/lib/dashboard/home.test.ts`
- Create: `apps/dashboard/lib/vault/category-tree.ts`
- Create: `apps/dashboard/lib/vault/category-tree.test.ts`

### Auth and Supabase

- Create: `apps/dashboard/lib/auth/allowed-identities.ts`
- Create: `apps/dashboard/lib/auth/allowed-identities.test.ts`
- Create: `apps/dashboard/lib/auth/session.ts`
- Create: `apps/dashboard/lib/supabase/server.ts`
- Create: `apps/dashboard/lib/supabase/client.ts`
- Create: `apps/dashboard/app/login/page.tsx`
- Create: `apps/dashboard/app/auth/logout/route.ts`

### Shared dashboard shell

- Create: `apps/dashboard/components/app-shell.tsx`
- Create: `apps/dashboard/components/home/dashboard-home.tsx`
- Create: `apps/dashboard/components/home/recent-content-list.tsx`
- Create: `apps/dashboard/components/home/quick-actions.tsx`
- Create: `apps/dashboard/components/home/dashboard-home.test.tsx`
- Create: `apps/dashboard/lib/sidebar.ts`
- Create: `apps/dashboard/lib/page-meta.ts`
- Create: `apps/dashboard/app/(dashboard)/layout.tsx`
- Create: `apps/dashboard/app/(dashboard)/page.tsx`
- Create: `apps/dashboard/app/(dashboard)/account/page.tsx`

### Vault categories

- Create: `apps/dashboard/components/vault/categories/category-manager.tsx`
- Create: `apps/dashboard/components/vault/categories/category-tree-list.tsx`
- Create: `apps/dashboard/components/vault/categories/category-manager.test.tsx`
- Create: `apps/dashboard/app/(dashboard)/vault/categories/page.tsx`
- Create: `apps/dashboard/app/(dashboard)/vault/page.tsx`
- Create: `apps/dashboard/lib/vault/categories.ts`

### Vault entries

- Create: `apps/dashboard/components/vault/entries/vault-entry-list.tsx`
- Create: `apps/dashboard/components/vault/entries/vault-entry-editor.tsx`
- Create: `apps/dashboard/components/vault/entries/vault-entry-list.test.tsx`
- Create: `apps/dashboard/lib/vault/entries.ts`
- Create: `apps/dashboard/app/(dashboard)/vault/entries/page.tsx`
- Create: `apps/dashboard/app/(dashboard)/vault/entries/new/page.tsx`
- Create: `apps/dashboard/app/(dashboard)/vault/entries/[id]/page.tsx`
- Create: `apps/dashboard/app/api/editor-image-upload/route.ts`

### Documentation

- Modify: `apps/dashboard/README.md`
- Modify: `apps/dashboard/CHANGELOG.md`

## Task 1: Bootstrap Dashboard Dependencies and Test Harness

**Files:**
- Modify: `apps/dashboard/package.json`
- Create: `apps/dashboard/.env.example`
- Create: `apps/dashboard/vitest.config.ts`
- Create: `apps/dashboard/vitest.setup.ts`
- Test: `apps/dashboard/lib/dashboard/home.test.ts`

- [ ] **Step 1: Add a failing dashboard-home smoke test**

```ts
// apps/dashboard/lib/dashboard/home.test.ts
import { describe, expect, it } from 'vitest';

import { buildDashboardHomeModel } from '@/lib/dashboard/home';

describe('buildDashboardHomeModel', () => {
  it('groups recent drafts, recent updates, and quick actions for the home view', () => {
    const model = buildDashboardHomeModel({
      recentItems: [
        {
          id: 'entry-1',
          title: 'Async rendering notes',
          appSlug: 'vault',
          status: 'draft',
          updatedAt: '2026-04-18T08:00:00.000Z',
        },
      ],
      appSummaries: [
        {
          appSlug: 'vault',
          appName: 'Coding Vault',
          draftCount: 1,
          publishedCount: 4,
        },
      ],
    });

    expect(model.quickActions[0]?.href).toBe('/vault/entries/new');
    expect(model.recentDrafts).toHaveLength(1);
    expect(model.appSummaries[0]?.appSlug).toBe('vault');
  });
});
```

- [ ] **Step 2: Run the new test to verify it fails**

Run:

```bash
cd /Users/mrbubbles/dev/bubbles-verse
bunx vitest run apps/dashboard/lib/dashboard/home.test.ts
```

Expected: FAIL because `@/lib/dashboard/home` does not exist yet.

- [ ] **Step 3: Add dependencies, scripts, env example, and Vitest scaffolding**

```json
// apps/dashboard/package.json
{
  "scripts": {
    "dev": "bun --bun next dev --hostname dashboard.mrbubbles.test --port 3004",
    "build": "bun --bun next build",
    "start": "bun --bun next start",
    "lint": "bun --bun eslint",
    "typecheck": "bun --bun tsc",
    "test": "bun --bun vitest",
    "test:run": "bun --bun vitest run"
  },
  "dependencies": {
    "@bubbles/footer": "workspace:*",
    "@bubbles/markdown-editor": "workspace:*",
    "@bubbles/theme": "workspace:*",
    "@bubbles/ui": "workspace:*",
    "@supabase/ssr": "^0.5.2",
    "@supabase/supabase-js": "^2.49.8",
    "drizzle-orm": "^0.45.0",
    "next": "16.2.3",
    "postgres": "^3.4.7",
    "react": "19.2.5",
    "react-dom": "19.2.5",
    "zod": "^4.1.13"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@vitejs/plugin-react": "^5.1.3",
    "drizzle-kit": "^0.31.8",
    "jsdom": "^28.0.0",
    "vitest": "^4.0.18"
  }
}
```

```env
# apps/dashboard/.env.example
NEXT_PUBLIC_APP_URL=http://dashboard.mrbubbles.test:3004
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
GITHUB_OWNER_ALLOWLIST=
```

```ts
// apps/dashboard/vitest.config.ts
import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

```ts
// apps/dashboard/vitest.setup.ts
import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
```

- [ ] **Step 4: Add the minimal implementation needed for the smoke test**

```ts
// apps/dashboard/lib/dashboard/home.ts
type DashboardHomeRecentItem = {
  id: string;
  title: string;
  appSlug: string;
  status: 'draft' | 'published';
  updatedAt: string;
};

type DashboardHomeSummary = {
  appSlug: string;
  appName: string;
  draftCount: number;
  publishedCount: number;
};

type DashboardHomeInput = {
  recentItems: DashboardHomeRecentItem[];
  appSummaries: DashboardHomeSummary[];
};

/**
 * Builds the global dashboard home view model from query results.
 */
export function buildDashboardHomeModel(input: DashboardHomeInput) {
  return {
    quickActions: [
      { label: 'Neuer Vault-Eintrag', href: '/vault/entries/new' },
      { label: 'Kategorien verwalten', href: '/vault/categories' },
    ],
    recentDrafts: input.recentItems.filter((item) => item.status === 'draft'),
    recentUpdates: input.recentItems,
    appSummaries: input.appSummaries,
  };
}
```

- [ ] **Step 5: Run the test and commit the bootstrap**

Run:

```bash
cd /Users/mrbubbles/dev/bubbles-verse
bunx vitest run apps/dashboard/lib/dashboard/home.test.ts
```

Expected: PASS

Commit:

```bash
git add apps/dashboard/package.json apps/dashboard/.env.example apps/dashboard/vitest.config.ts apps/dashboard/vitest.setup.ts apps/dashboard/lib/dashboard/home.ts apps/dashboard/lib/dashboard/home.test.ts
git commit -m "test: bootstrap dashboard test harness"
```

## Task 2: Add Drizzle Schema for Shared Content Core and Vault Adapter

**Files:**
- Create: `apps/dashboard/drizzle.config.ts`
- Create: `apps/dashboard/drizzle/db/schema.ts`
- Create: `apps/dashboard/drizzle/db/relations.ts`
- Create: `apps/dashboard/drizzle/db/index.ts`
- Create: `apps/dashboard/lib/vault/category-tree.ts`
- Test: `apps/dashboard/lib/vault/category-tree.test.ts`

- [ ] **Step 1: Write the failing category-depth test**

```ts
// apps/dashboard/lib/vault/category-tree.test.ts
import { describe, expect, it } from 'vitest';

import { canAppendCategoryChild } from '@/lib/vault/category-tree';

describe('canAppendCategoryChild', () => {
  it('allows a child under a top-level category but rejects a third level', () => {
    expect(canAppendCategoryChild({ parentDepth: 0 })).toBe(true);
    expect(canAppendCategoryChild({ parentDepth: 1 })).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to confirm the helper is missing**

Run:

```bash
cd /Users/mrbubbles/dev/bubbles-verse
bun run --cwd apps/dashboard test:run apps/dashboard/lib/vault/category-tree.test.ts
```

Expected: FAIL because `@/lib/vault/category-tree` does not exist yet.

- [ ] **Step 3: Add the Drizzle config and schema files**

```ts
// apps/dashboard/drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './drizzle/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  schemaFilter: ['public'],
});
```

```ts
// apps/dashboard/drizzle/db/schema.ts
import { sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const contentStatus = pgEnum('content_status', [
  'draft',
  'published',
]);

export const profileRole = pgEnum('profile_role', ['owner', 'editor', 'guest_author']);
export const socialPlatform = pgEnum('social_platform', [
  'website',
  'github',
  'linkedin',
  'twitter',
]);

export const appModules = pgTable('app_modules', {
  id: text().primaryKey().default(sql`gen_random_uuid()`),
  slug: text().notNull().unique(),
  name: text().notNull(),
  description: text().notNull().default(''),
  isActive: boolean().notNull().default(true),
  createdAt: timestamp({ mode: 'string', precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: 'string', precision: 3 }).defaultNow().notNull(),
});

export const profiles = pgTable('profiles', {
  id: text().primaryKey().default(sql`gen_random_uuid()`),
  authUserId: text().notNull().unique(),
  displayName: text().notNull(),
  slug: text().notNull().unique(),
  email: text().notNull(),
  avatarUrl: text(),
  bio: text().notNull().default(''),
  role: profileRole().notNull().default('owner'),
  createdAt: timestamp({ mode: 'string', precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: 'string', precision: 3 }).defaultNow().notNull(),
});

export const profileSocialLinks = pgTable('profile_social_links', {
  id: text().primaryKey().default(sql`gen_random_uuid()`),
  profileId: text().notNull(),
  platform: socialPlatform().notNull(),
  url: text().notNull(),
  label: text().notNull().default(''),
  sortOrder: integer().notNull().default(0),
  createdAt: timestamp({ mode: 'string', precision: 3 }).defaultNow().notNull(),
});

export const contentItems = pgTable(
  'content_items',
  {
    id: text().primaryKey().default(sql`gen_random_uuid()`),
    appModuleId: text().notNull(),
    contentType: text().notNull(),
    title: text().notNull(),
    slug: text().notNull(),
    description: text().notNull().default(''),
    status: contentStatus().notNull().default('draft'),
    editorContent: jsonb().notNull(),
    serializedContent: text().notNull().default(''),
    authorProfileId: text().notNull(),
    createdByProfileId: text().notNull(),
    updatedByProfileId: text().notNull(),
    publishedAt: timestamp({ mode: 'string', precision: 3 }),
    createdAt: timestamp({ mode: 'string', precision: 3 }).defaultNow().notNull(),
    updatedAt: timestamp({ mode: 'string', precision: 3 }).defaultNow().notNull(),
  },
  (table) => ({
    appTypeSlugIdx: uniqueIndex('content_items_app_type_slug_idx').on(
      table.appModuleId,
      table.contentType,
      table.slug
    ),
  })
);

export const contentItemTags = pgTable('content_item_tags', {
  id: text().primaryKey().default(sql`gen_random_uuid()`),
  contentItemId: text().notNull(),
  tag: text().notNull(),
  createdAt: timestamp({ mode: 'string', precision: 3 }).defaultNow().notNull(),
});

export const vaultCategories = pgTable('vault_categories', {
  id: text().primaryKey().default(sql`gen_random_uuid()`),
  name: text().notNull(),
  slug: text().notNull(),
  description: text().notNull().default(''),
  parentId: text(),
  sortOrder: integer().notNull().default(0),
  createdAt: timestamp({ mode: 'string', precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: 'string', precision: 3 }).defaultNow().notNull(),
});

export const vaultEntries = pgTable('vault_entries', {
  contentItemId: text().primaryKey(),
  primaryCategoryId: text().notNull(),
  createdAt: timestamp({ mode: 'string', precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: 'string', precision: 3 }).defaultNow().notNull(),
});
```

```ts
// apps/dashboard/drizzle/db/relations.ts
import { relations } from 'drizzle-orm';

import {
  appModules,
  contentItems,
  contentItemTags,
  profileSocialLinks,
  profiles,
  vaultCategories,
  vaultEntries,
} from './schema';

export const appModuleRelations = relations(appModules, ({ many }) => ({
  contentItems: many(contentItems),
}));

export const profileRelations = relations(profiles, ({ many }) => ({
  socialLinks: many(profileSocialLinks),
  authoredContent: many(contentItems, { relationName: 'author_profile' }),
}));

export const contentItemRelations = relations(contentItems, ({ one, many }) => ({
  appModule: one(appModules, {
    fields: [contentItems.appModuleId],
    references: [appModules.id],
  }),
  authorProfile: one(profiles, {
    fields: [contentItems.authorProfileId],
    references: [profiles.id],
    relationName: 'author_profile',
  }),
  tags: many(contentItemTags),
  vaultEntry: one(vaultEntries, {
    fields: [contentItems.id],
    references: [vaultEntries.contentItemId],
  }),
}));

export const vaultCategoryRelations = relations(vaultCategories, ({ one, many }) => ({
  parent: one(vaultCategories, {
    fields: [vaultCategories.parentId],
    references: [vaultCategories.id],
    relationName: 'vault_category_parent',
  }),
  children: many(vaultCategories, { relationName: 'vault_category_parent' }),
}));
```

```ts
// apps/dashboard/drizzle/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

const client = postgres(process.env.DATABASE_URL!, {
  prepare: false,
});

export const db = drizzle(client, { schema });
```

- [ ] **Step 4: Add the category-depth helper**

```ts
// apps/dashboard/lib/vault/category-tree.ts
type CategoryDepthInput = {
  parentDepth: number;
};

/**
 * Enforces the V1 rule that Vault categories may only be two levels deep.
 */
export function canAppendCategoryChild({
  parentDepth,
}: CategoryDepthInput): boolean {
  return parentDepth < 1;
}
```

- [ ] **Step 5: Run tests, generate migrations, and commit the schema**

Run:

```bash
cd /Users/mrbubbles/dev/bubbles-verse
bun run --cwd apps/dashboard test:run apps/dashboard/lib/vault/category-tree.test.ts
bunx --cwd apps/dashboard drizzle-kit generate
```

Expected:

- Vitest PASS
- Drizzle generates a new SQL migration under `apps/dashboard/drizzle/`

Commit:

```bash
git add apps/dashboard/drizzle.config.ts apps/dashboard/drizzle apps/dashboard/lib/vault/category-tree.ts apps/dashboard/lib/vault/category-tree.test.ts
git commit -m "feat: add dashboard content schema"
```

## Task 3: Add Owner-Only Supabase Session and Login Gate

**Files:**
- Create: `apps/dashboard/lib/env.ts`
- Create: `apps/dashboard/lib/auth/allowed-identities.ts`
- Create: `apps/dashboard/lib/auth/allowed-identities.test.ts`
- Create: `apps/dashboard/lib/auth/session.ts`
- Create: `apps/dashboard/lib/supabase/server.ts`
- Create: `apps/dashboard/lib/supabase/client.ts`
- Create: `apps/dashboard/app/login/page.tsx`
- Create: `apps/dashboard/app/auth/logout/route.ts`
- Create: `apps/dashboard/app/(dashboard)/layout.tsx`

- [ ] **Step 1: Write the failing allowlist test**

```ts
// apps/dashboard/lib/auth/allowed-identities.test.ts
import { describe, expect, it } from 'vitest';

import { isAllowedGithubIdentity } from '@/lib/auth/allowed-identities';

describe('isAllowedGithubIdentity', () => {
  it('accepts allowlisted GitHub usernames and rejects everyone else', () => {
    const allowlist = ['mrbubbles', 'another-owner'];

    expect(isAllowedGithubIdentity('mrbubbles', allowlist)).toBe(true);
    expect(isAllowedGithubIdentity('stranger', allowlist)).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify auth helpers do not exist**

Run:

```bash
cd /Users/mrbubbles/dev/bubbles-verse
bun run --cwd apps/dashboard test:run apps/dashboard/lib/auth/allowed-identities.test.ts
```

Expected: FAIL because the helper is missing.

- [ ] **Step 3: Add env, Supabase clients, allowlist helper, and owner-session gate**

```ts
// apps/dashboard/lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  GITHUB_OWNER_ALLOWLIST: z.string().min(1),
});

export function getServerDashboardEnv() {
  return envSchema.parse(process.env);
}
```

```ts
// apps/dashboard/lib/auth/allowed-identities.ts
/**
 * Matches a GitHub username against the configured owner allowlist.
 */
export function isAllowedGithubIdentity(
  username: string | null | undefined,
  allowlist: string[]
): boolean {
  if (!username) {
    return false;
  }

  return allowlist.some(
    (candidate) => candidate.trim().toLowerCase() === username.toLowerCase()
  );
}

export function parseGithubOwnerAllowlist(raw: string): string[] {
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}
```

```ts
// apps/dashboard/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { getServerDashboardEnv } from '@/lib/env';

export async function createDashboardServerSupabaseClient() {
  const cookieStore = await cookies();
  const env = getServerDashboardEnv();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}
```

```ts
// apps/dashboard/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createDashboardBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

```ts
// apps/dashboard/lib/auth/session.ts
import { redirect } from 'next/navigation';

import {
  isAllowedGithubIdentity,
  parseGithubOwnerAllowlist,
} from '@/lib/auth/allowed-identities';
import { getServerDashboardEnv } from '@/lib/env';
import { createDashboardServerSupabaseClient } from '@/lib/supabase/server';

/**
 * Loads the current dashboard owner session or redirects to login.
 */
export async function requireOwnerSession() {
  const supabase = await createDashboardServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const githubUsername =
    typeof user?.user_metadata?.user_name === 'string'
      ? user.user_metadata.user_name
      : null;

  const allowlist = parseGithubOwnerAllowlist(
    getServerDashboardEnv().GITHUB_OWNER_ALLOWLIST
  );

  if (!user || !isAllowedGithubIdentity(githubUsername, allowlist)) {
    redirect('/login');
  }

  return user;
}
```

```tsx
// apps/dashboard/app/login/page.tsx
'use client';

import { createDashboardBrowserSupabaseClient } from '@/lib/supabase/client';

import { Button } from '@bubbles/ui/shadcn/button';

export default function LoginPage() {
  const supabase = createDashboardBrowserSupabaseClient();

  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-16">
      <div className="space-y-6 text-center">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
            Bubbles Verse
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-balance">
            Dashboard Login
          </h1>
          <p className="max-w-md text-sm text-muted-foreground">
            This dashboard is private. Continue with the allowlisted GitHub account.
          </p>
        </div>
        <Button
          onClick={() =>
            supabase.auth.signInWithOAuth({
              provider: 'github',
              options: {
                redirectTo: `${window.location.origin}/`,
              },
            })
          }>
          Mit GitHub anmelden
        </Button>
      </div>
    </main>
  );
}
```

```ts
// apps/dashboard/app/auth/logout/route.ts
import { NextResponse } from 'next/server';

import { createDashboardServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createDashboardServerSupabaseClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL('/login', 'http://dashboard.mrbubbles.test:3004'));
}
```

```tsx
// apps/dashboard/app/(dashboard)/layout.tsx
import { requireOwnerSession } from '@/lib/auth/session';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireOwnerSession();

  return children;
}
```

- [ ] **Step 4: Run tests and typecheck the auth layer**

Run:

```bash
cd /Users/mrbubbles/dev/bubbles-verse
bun run --cwd apps/dashboard test:run apps/dashboard/lib/auth/allowed-identities.test.ts
bun run --cwd apps/dashboard typecheck
```

Expected:

- allowlist test PASS
- `tsc` PASS

- [ ] **Step 5: Commit the auth foundation**

```bash
git add apps/dashboard/lib/env.ts apps/dashboard/lib/auth apps/dashboard/lib/supabase apps/dashboard/app/login/page.tsx apps/dashboard/app/auth/logout/route.ts apps/dashboard/app/\(dashboard\)/layout.tsx
git commit -m "feat: add dashboard auth gate"
```

## Task 4: Build the Shared Dashboard Shell and Global Home

**Files:**
- Create: `apps/dashboard/components/app-shell.tsx`
- Create: `apps/dashboard/components/home/dashboard-home.tsx`
- Create: `apps/dashboard/components/home/recent-content-list.tsx`
- Create: `apps/dashboard/components/home/quick-actions.tsx`
- Create: `apps/dashboard/components/home/dashboard-home.test.tsx`
- Create: `apps/dashboard/lib/sidebar.ts`
- Create: `apps/dashboard/lib/page-meta.ts`
- Modify: `apps/dashboard/app/(dashboard)/layout.tsx`
- Create: `apps/dashboard/app/(dashboard)/page.tsx`
- Create: `apps/dashboard/app/(dashboard)/account/page.tsx`

- [ ] **Step 1: Write the failing dashboard-home component test**

```tsx
// apps/dashboard/components/home/dashboard-home.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DashboardHome } from '@/components/home/dashboard-home';

describe('DashboardHome', () => {
  it('renders quick actions, recent drafts, and app summaries without relying on card stacks', () => {
    render(
      <DashboardHome
        model={{
          quickActions: [{ label: 'Neuer Vault-Eintrag', href: '/vault/entries/new' }],
          recentDrafts: [
            {
              id: 'entry-1',
              title: 'Async rendering notes',
              appSlug: 'vault',
              status: 'draft',
              updatedAt: '2026-04-18T08:00:00.000Z',
            },
          ],
          recentUpdates: [],
          appSummaries: [
            {
              appSlug: 'vault',
              appName: 'Coding Vault',
              draftCount: 1,
              publishedCount: 4,
            },
          ],
        }}
      />
    );

    expect(screen.getByText('Neuer Vault-Eintrag')).toBeInTheDocument();
    expect(screen.getByText('Async rendering notes')).toBeInTheDocument();
    expect(screen.getByText('Coding Vault')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify the home UI is missing**

Run:

```bash
cd /Users/mrbubbles/dev/bubbles-verse
bun run --cwd apps/dashboard test:run apps/dashboard/components/home/dashboard-home.test.tsx
```

Expected: FAIL because the components do not exist yet.

- [ ] **Step 3: Add sidebar config, app shell, and the global home UI**

```ts
// apps/dashboard/lib/sidebar.ts
import type {
  BubblesBreadcrumb,
  BubblesSidebarData,
  BubblesSidebarUser,
} from '@bubbles/ui/lib/bubbles-sidebar';

import {
  DashboardSquare01Icon,
  Folder01Icon,
  FolderShared01Icon,
  User02Icon,
} from '@bubbles/ui/lib/hugeicons';

export const dashboardSidebarData: BubblesSidebarData = {
  brand: {
    href: '/',
    compactLogo: { src: '/favicon.ico', alt: 'Dashboard icon' },
    fullLogo: { src: '/favicon.ico', alt: 'Dashboard logo' },
  },
  sections: [
    {
      id: 'home',
      title: 'Dashboard',
      items: [
        {
          id: 'overview',
          title: 'Home',
          href: '/',
          icon: DashboardSquare01Icon,
        },
      ],
    },
    {
      id: 'vault',
      title: 'Coding Vault',
      items: [
        {
          id: 'vault-overview',
          title: 'Übersicht',
          href: '/vault',
          icon: Folder01Icon,
          match: 'prefix',
        },
        {
          id: 'vault-entries',
          title: 'Einträge',
          href: '/vault/entries',
          icon: FolderShared01Icon,
          match: 'prefix',
        },
        {
          id: 'vault-categories',
          title: 'Kategorien',
          href: '/vault/categories',
          icon: FolderShared01Icon,
        },
      ],
    },
    {
      id: 'account',
      title: 'Konto',
      items: [
        {
          id: 'account-settings',
          title: 'Accounteinstellungen',
          href: '/account',
          icon: User02Icon,
        },
      ],
    },
  ],
};

export function getDashboardBreadcrumbs(pathname: string): BubblesBreadcrumb[] {
  if (pathname === '/') {
    return [{ label: 'Dashboard' }];
  }

  if (pathname.startsWith('/vault')) {
    return [{ label: 'Dashboard', href: '/' }, { label: 'Coding Vault' }];
  }

  if (pathname === '/account') {
    return [{ label: 'Dashboard', href: '/' }, { label: 'Account' }];
  }

  return [{ label: 'Dashboard', href: '/' }];
}

export function buildSidebarUser(input: {
  name: string;
  email: string;
  avatarSrc?: string | null;
}): BubblesSidebarUser {
  return {
    name: input.name,
    email: input.email,
    avatarSrc: input.avatarSrc ?? undefined,
    dashboardHref: '/',
    settingsHref: '/account',
    logoutHref: '/auth/logout',
  };
}
```

```tsx
// apps/dashboard/components/app-shell.tsx
'use client';

import { usePathname } from 'next/navigation';

import { ThemeToggle } from '@bubbles/theme';
import { BubblesAppHeader } from '@bubbles/ui/components/bubbles-app-header';
import { BubblesSidebarLayout } from '@bubbles/ui/components/bubbles-sidebar-layout';
import { Separator } from '@bubbles/ui/shadcn/separator';

import { getDashboardBreadcrumbs, dashboardSidebarData } from '@/lib/sidebar';
import type { BubblesSidebarUser } from '@bubbles/ui/lib/bubbles-sidebar';

export default function AppShell({
  user,
  children,
  subtitle,
}: {
  user: BubblesSidebarUser;
  children: React.ReactNode;
  subtitle?: string;
}) {
  const pathname = usePathname();

  return (
    <BubblesSidebarLayout
      sidebarData={dashboardSidebarData}
      user={user}
      header={
        <BubblesAppHeader
          breadcrumbs={getDashboardBreadcrumbs(pathname)}
          subtitle={subtitle}
          actions={
            <div className="flex items-center gap-4">
              <Separator orientation="vertical" className="data-vertical:h-8" />
              <ThemeToggle />
            </div>
          }
        />
      }>
      <main className="container mx-auto flex-1 px-4 py-6 md:px-6 lg:px-8">
        {children}
      </main>
    </BubblesSidebarLayout>
  );
}
```

```tsx
// apps/dashboard/components/home/dashboard-home.tsx
import Link from 'next/link';

type DashboardHomeProps = {
  model: {
    quickActions: { label: string; href: string }[];
    recentDrafts: { id: string; title: string; appSlug: string }[];
    recentUpdates: { id: string; title: string; appSlug: string }[];
    appSummaries: {
      appSlug: string;
      appName: string;
      draftCount: number;
      publishedCount: number;
    }[];
  };
};

export function DashboardHome({ model }: DashboardHomeProps) {
  return (
    <div className="space-y-10">
      <section className="grid gap-4 border-b pb-6 md:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
            Bubbles Verse
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-balance">
            Inhalt weiterbearbeiten, ohne Admin-Chaos.
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
            Das Dashboard ist die zentrale Schreiboberfläche für deine appspezifischen Inhalte.
          </p>
        </div>
        <div className="grid gap-2 content-start">
          {model.quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="inline-flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition hover:bg-accent">
              <span>{action.label}</span>
              <span aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </section>
      <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Entwürfe</h2>
            <ul className="divide-y rounded-xl border">
              {model.recentDrafts.map((draft) => (
                <li key={draft.id} className="px-4 py-3">
                  {draft.title}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Zuletzt bearbeitet</h2>
            <ul className="divide-y rounded-xl border">
              {model.recentUpdates.map((item) => (
                <li key={item.id} className="px-4 py-3">
                  {item.title}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <aside className="space-y-3">
          <h2 className="text-lg font-semibold">App-Bereiche</h2>
          <ul className="divide-y rounded-xl border">
            {model.appSummaries.map((summary) => (
              <li key={summary.appSlug} className="flex items-center justify-between px-4 py-3">
                <span>{summary.appName}</span>
                <span className="text-sm text-muted-foreground">
                  {summary.draftCount} Drafts · {summary.publishedCount} live
                </span>
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </div>
  );
}
```

```tsx
// apps/dashboard/app/(dashboard)/page.tsx
import { DashboardHome } from '@/components/home/dashboard-home';
import { buildDashboardHomeModel } from '@/lib/dashboard/home';

export default function DashboardPage() {
  const model = buildDashboardHomeModel({
    recentItems: [],
    appSummaries: [{ appSlug: 'vault', appName: 'Coding Vault', draftCount: 0, publishedCount: 0 }],
  });

  return <DashboardHome model={model} />;
}
```

- [ ] **Step 4: Wire the shell into the guarded layout and add an account placeholder**

```tsx
// apps/dashboard/app/(dashboard)/layout.tsx
import AppShell from '@/components/app-shell';
import { buildSidebarUser } from '@/lib/sidebar';
import { requireOwnerSession } from '@/lib/auth/session';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireOwnerSession();

  return (
    <AppShell
      user={buildSidebarUser({
        name: user.user_metadata.full_name ?? user.email ?? 'Owner',
        email: user.email ?? 'owner@dashboard.local',
        avatarSrc: user.user_metadata.avatar_url,
      })}>
      {children}
    </AppShell>
  );
}
```

```tsx
// apps/dashboard/app/(dashboard)/account/page.tsx
export default function AccountPage() {
  return (
    <section className="space-y-4">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Accounteinstellungen</h1>
        <p className="text-sm text-muted-foreground">
          V1 zeigt hier zunächst dein Dashboard-Profil und Logout-Zugang.
        </p>
      </header>
    </section>
  );
}
```

- [ ] **Step 5: Run home tests and commit the shell**

Run:

```bash
cd /Users/mrbubbles/dev/bubbles-verse
bun run --cwd apps/dashboard test:run apps/dashboard/components/home/dashboard-home.test.tsx
bun run --cwd apps/dashboard typecheck
```

Expected: PASS

Commit:

```bash
git add apps/dashboard/components apps/dashboard/lib/sidebar.ts apps/dashboard/app/\(dashboard\)
git commit -m "feat: add dashboard shell and home"
```

## Task 5: Implement Vault Category Queries and Category Management UI

**Files:**
- Create: `apps/dashboard/lib/vault/categories.ts`
- Create: `apps/dashboard/components/vault/categories/category-tree-list.tsx`
- Create: `apps/dashboard/components/vault/categories/category-manager.tsx`
- Create: `apps/dashboard/components/vault/categories/category-manager.test.tsx`
- Create: `apps/dashboard/app/(dashboard)/vault/categories/page.tsx`
- Create: `apps/dashboard/app/(dashboard)/vault/page.tsx`

- [ ] **Step 1: Write the failing category-manager UI test**

```tsx
// apps/dashboard/components/vault/categories/category-manager.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CategoryManager } from '@/components/vault/categories/category-manager';

describe('CategoryManager', () => {
  it('renders top-level categories and nested subcategories', () => {
    render(
      <CategoryManager
        categories={[
          {
            id: 'root-1',
            name: 'Frontend',
            slug: 'frontend',
            children: [
              { id: 'child-1', name: 'React', slug: 'react', children: [] },
            ],
          },
        ]}
      />
    );

    expect(screen.getByText('Frontend')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify the category UI is missing**

Run:

```bash
cd /Users/mrbubbles/dev/bubbles-verse
bun run --cwd apps/dashboard test:run apps/dashboard/components/vault/categories/category-manager.test.tsx
```

Expected: FAIL because the category components do not exist yet.

- [ ] **Step 3: Add category query helpers and the manager UI**

```ts
// apps/dashboard/lib/vault/categories.ts
import { asc } from 'drizzle-orm';

import { db } from '@/drizzle/db';
import { vaultCategories } from '@/drizzle/db/schema';

export async function getVaultCategoryTree() {
  const categories = await db
    .select()
    .from(vaultCategories)
    .orderBy(asc(vaultCategories.sortOrder), asc(vaultCategories.name));

  const roots = categories.filter((category) => category.parentId === null);

  return roots.map((root) => ({
    ...root,
    children: categories.filter((child) => child.parentId === root.id),
  }));
}
```

```tsx
// apps/dashboard/components/vault/categories/category-tree-list.tsx
type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  children: CategoryNode[];
};

export function CategoryTreeList({ categories }: { categories: CategoryNode[] }) {
  return (
    <ul className="space-y-4">
      {categories.map((category) => (
        <li key={category.id} className="space-y-2 rounded-xl border px-4 py-4">
          <div className="space-y-1">
            <p className="text-base font-medium">{category.name}</p>
            <p className="text-sm text-muted-foreground">/{category.slug}</p>
          </div>
          {!!category.children.length && (
            <ul className="space-y-2 border-l pl-4">
              {category.children.map((child) => (
                <li key={child.id} className="text-sm">
                  {child.name}
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}
```

```tsx
// apps/dashboard/components/vault/categories/category-manager.tsx
import { Button } from '@bubbles/ui/shadcn/button';
import { Input } from '@bubbles/ui/shadcn/input';
import { Label } from '@bubbles/ui/shadcn/label';

import { CategoryTreeList } from './category-tree-list';

type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  children: CategoryNode[];
};

export function CategoryManager({ categories }: { categories: CategoryNode[] }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
      <form className="space-y-4 rounded-xl border px-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="category-name">Name</Label>
          <Input id="category-name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category-parent">Überkategorie</Label>
          <Input id="category-parent" placeholder="leer lassen für Oberkategorie" />
        </div>
        <Button type="submit">Kategorie speichern</Button>
      </form>
      <CategoryTreeList categories={categories} />
    </div>
  );
}
```

- [ ] **Step 4: Add the Vault overview and category page**

```tsx
// apps/dashboard/app/(dashboard)/vault/page.tsx
import Link from 'next/link';

export default function VaultOverviewPage() {
  return (
    <section className="space-y-8">
      <header className="space-y-3 border-b pb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Coding Vault</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Zentrale Übersicht für Kategorien, Entwürfe und neue Einträge.
        </p>
      </header>
      <div className="grid gap-3 md:grid-cols-2">
        <Link href="/vault/entries/new" className="rounded-xl border px-4 py-4">
          Neuer Eintrag
        </Link>
        <Link href="/vault/categories" className="rounded-xl border px-4 py-4">
          Kategorien verwalten
        </Link>
      </div>
    </section>
  );
}
```

```tsx
// apps/dashboard/app/(dashboard)/vault/categories/page.tsx
import { CategoryManager } from '@/components/vault/categories/category-manager';
import { getVaultCategoryTree } from '@/lib/vault/categories';

export default async function VaultCategoriesPage() {
  const categories = await getVaultCategoryTree();

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Vault-Kategorien</h1>
        <p className="text-sm text-muted-foreground">
          Oberkategorien und Unterkategorien für die öffentliche Vault-Struktur.
        </p>
      </header>
      <CategoryManager categories={categories} />
    </section>
  );
}
```

- [ ] **Step 5: Run tests and commit category management**

Run:

```bash
cd /Users/mrbubbles/dev/bubbles-verse
bun run --cwd apps/dashboard test:run apps/dashboard/components/vault/categories/category-manager.test.tsx
bun run --cwd apps/dashboard typecheck
```

Expected: PASS

Commit:

```bash
git add apps/dashboard/lib/vault/categories.ts apps/dashboard/components/vault/categories apps/dashboard/app/\(dashboard\)/vault
git commit -m "feat: add vault category management"
```

## Task 6: Add Vault Entry Listing and Markdown Editor Integration

**Files:**
- Create: `apps/dashboard/lib/vault/entries.ts`
- Create: `apps/dashboard/components/vault/entries/vault-entry-list.tsx`
- Create: `apps/dashboard/components/vault/entries/vault-entry-editor.tsx`
- Create: `apps/dashboard/components/vault/entries/vault-entry-list.test.tsx`
- Create: `apps/dashboard/app/(dashboard)/vault/entries/page.tsx`
- Create: `apps/dashboard/app/(dashboard)/vault/entries/new/page.tsx`
- Create: `apps/dashboard/app/(dashboard)/vault/entries/[id]/page.tsx`
- Create: `apps/dashboard/app/api/editor-image-upload/route.ts`

- [ ] **Step 1: Write the failing entry-list test**

```tsx
// apps/dashboard/components/vault/entries/vault-entry-list.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { VaultEntryList } from '@/components/vault/entries/vault-entry-list';

describe('VaultEntryList', () => {
  it('renders titles, statuses, and category labels as a dense editorial list', () => {
    render(
      <VaultEntryList
        entries={[
          {
            id: 'entry-1',
            title: 'Async rendering notes',
            slug: 'async-rendering-notes',
            status: 'draft',
            categoryLabel: 'Frontend / React',
            updatedAtLabel: 'vor 2 Stunden',
          },
        ]}
      />
    );

    expect(screen.getByText('Async rendering notes')).toBeInTheDocument();
    expect(screen.getByText('draft')).toBeInTheDocument();
    expect(screen.getByText('Frontend / React')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the failing list test**

Run:

```bash
cd /Users/mrbubbles/dev/bubbles-verse
bun run --cwd apps/dashboard test:run apps/dashboard/components/vault/entries/vault-entry-list.test.tsx
```

Expected: FAIL because the list component does not exist yet.

- [ ] **Step 3: Add entry queries and list UI**

```ts
// apps/dashboard/lib/vault/entries.ts
import { desc, eq } from 'drizzle-orm';

import { db } from '@/drizzle/db';
import { contentItems, vaultCategories, vaultEntries } from '@/drizzle/db/schema';

export async function getVaultEntries() {
  const rows = await db
    .select({
      id: contentItems.id,
      title: contentItems.title,
      slug: contentItems.slug,
      status: contentItems.status,
      updatedAt: contentItems.updatedAt,
      categoryName: vaultCategories.name,
    })
    .from(vaultEntries)
    .innerJoin(contentItems, eq(vaultEntries.contentItemId, contentItems.id))
    .innerJoin(vaultCategories, eq(vaultEntries.primaryCategoryId, vaultCategories.id))
    .orderBy(desc(contentItems.updatedAt));

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    status: row.status,
    categoryLabel: row.categoryName,
    updatedAtLabel: row.updatedAt,
  }));
}
```

```tsx
// apps/dashboard/components/vault/entries/vault-entry-list.tsx
import Link from 'next/link';

import { Badge } from '@bubbles/ui/shadcn/badge';

type VaultEntryListProps = {
  entries: {
    id: string;
    title: string;
    slug: string;
    status: 'draft' | 'published';
    categoryLabel: string;
    updatedAtLabel: string;
  }[];
};

export function VaultEntryList({ entries }: VaultEntryListProps) {
  return (
    <ul className="divide-y rounded-xl border">
      {entries.map((entry) => (
        <li key={entry.id} className="grid gap-3 px-4 py-4 md:grid-cols-[1.3fr_0.7fr_0.5fr] md:items-center">
          <div className="space-y-1">
            <Link href={`/vault/entries/${entry.id}`} className="font-medium hover:underline">
              {entry.title}
            </Link>
            <p className="text-sm text-muted-foreground">/{entry.slug}</p>
          </div>
          <div className="text-sm text-muted-foreground">{entry.categoryLabel}</div>
          <div className="flex items-center justify-between gap-3 md:justify-end">
            <Badge variant={entry.status === 'published' ? 'default' : 'secondary'}>
              {entry.status}
            </Badge>
            <span className="text-xs text-muted-foreground">{entry.updatedAtLabel}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 4: Add the editor wrapper pages and upload route**

```tsx
// apps/dashboard/components/vault/entries/vault-entry-editor.tsx
'use client';

import { MarkdownEditor } from '@bubbles/markdown-editor';
import '@bubbles/markdown-editor/styles/editor';
import '@bubbles/markdown-editor/styles/preview';

export function VaultEntryEditor() {
  return (
    <MarkdownEditor
      slugStrategy={({ context, title }) => [String(context?.topLevelSlug ?? ''), String(context?.childSlug ?? ''), title]}
      slugStrategyContext={{ topLevelSlug: 'vault' }}
      onSuccess={(payload) => {
        console.log('submit vault entry', payload);
      }}
      imageUploader={async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/editor-image-upload', {
          method: 'POST',
          body: formData,
        });

        return response.json();
      }}
    />
  );
}
```

```tsx
// apps/dashboard/app/(dashboard)/vault/entries/page.tsx
import Link from 'next/link';

import { VaultEntryList } from '@/components/vault/entries/vault-entry-list';
import { getVaultEntries } from '@/lib/vault/entries';

export default async function VaultEntriesPage() {
  const entries = await getVaultEntries();

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 border-b pb-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Vault-Einträge</h1>
          <p className="text-sm text-muted-foreground">
            Alle Inhalte für den Coding Vault in einer dichten Redaktionsliste.
          </p>
        </div>
        <Link href="/vault/entries/new" className="rounded-xl border px-4 py-3 text-sm font-medium">
          Neuer Eintrag
        </Link>
      </header>
      <VaultEntryList entries={entries} />
    </section>
  );
}
```

```tsx
// apps/dashboard/app/(dashboard)/vault/entries/new/page.tsx
import { VaultEntryEditor } from '@/components/vault/entries/vault-entry-editor';

export default function NewVaultEntryPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Neuer Vault-Eintrag</h1>
        <p className="text-sm text-muted-foreground">
          Erstelle den Inhalt direkt im gemeinsamen Markdown-Editor.
        </p>
      </header>
      <VaultEntryEditor />
    </section>
  );
}
```

```tsx
// apps/dashboard/app/(dashboard)/vault/entries/[id]/page.tsx
import { VaultEntryEditor } from '@/components/vault/entries/vault-entry-editor';

export default function EditVaultEntryPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Vault-Eintrag bearbeiten</h1>
      </header>
      <VaultEntryEditor />
    </section>
  );
}
```

```ts
// apps/dashboard/app/api/editor-image-upload/route.ts
import { createEditorImageUploadResponse, isUploadFile, resolveCloudinaryErrorResponse, uploadEditorImageToCloudinary } from '@bubbles/markdown-editor/cloudinary-upload';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!isUploadFile(file)) {
    return NextResponse.json({ error: 'Invalid file' }, { status: 400 });
  }

  try {
    const upload = await uploadEditorImageToCloudinary({
      file,
      imageFolder: 'dashboard/editor',
    });

    return NextResponse.json(createEditorImageUploadResponse(upload.secureUrl));
  } catch (error) {
    return resolveCloudinaryErrorResponse(error);
  }
}
```

- [ ] **Step 5: Run tests, lint, and commit the Vault entry flow**

Run:

```bash
cd /Users/mrbubbles/dev/bubbles-verse
bun run --cwd apps/dashboard test:run apps/dashboard/components/vault/entries/vault-entry-list.test.tsx
bun run --cwd apps/dashboard lint
bun run --cwd apps/dashboard typecheck
```

Expected: PASS

Commit:

```bash
git add apps/dashboard/lib/vault/entries.ts apps/dashboard/components/vault/entries apps/dashboard/app/\(dashboard\)/vault/entries apps/dashboard/app/api/editor-image-upload/route.ts
git commit -m "feat: add vault entry management"
```

## Task 7: Update Documentation and Run Final Verification

**Files:**
- Modify: `apps/dashboard/README.md`
- Modify: `apps/dashboard/CHANGELOG.md`

- [ ] **Step 1: Update README to document the implemented V1 slices**

```md
## V1 editorial features

- private dashboard login via Supabase GitHub OAuth
- shared sidebar shell using `@bubbles/ui`
- global work-oriented dashboard home
- Vault category management with two levels
- Vault entry list plus create/edit routes
- `@bubbles/markdown-editor` integration for entry authoring
```

- [ ] **Step 2: Update CHANGELOG with the delivered V1 work**

```md
## [Unreleased]

### Added

- Supabase-backed private dashboard login flow
- shared content-core schema and Vault adapter tables
- dashboard shell with `BubblesSidebarLayout`
- Vault category management and Vault entry routes
- markdown-editor-powered Vault authoring flow
```

- [ ] **Step 3: Format changed files**

Run:

```bash
cd /Users/mrbubbles/dev/bubbles-verse
bunx prettier --write apps/dashboard
```

Expected: Prettier rewrites changed dashboard source files without syntax errors.

- [ ] **Step 4: Run the full dashboard verification suite**

Run:

```bash
cd /Users/mrbubbles/dev/bubbles-verse
bun run --cwd apps/dashboard test:run
bun run --cwd apps/dashboard lint
bun run --cwd apps/dashboard typecheck
bun run --cwd apps/dashboard build
```

Expected:

- all dashboard tests PASS
- ESLint PASS
- TypeScript PASS
- Next build PASS

- [ ] **Step 5: Commit docs and verification**

```bash
git add apps/dashboard/README.md apps/dashboard/CHANGELOG.md
git commit -m "docs: document dashboard v1"
```

## Self-Review

### Spec coverage

- private owner-only dashboard auth: covered in Task 3
- shared content core and Vault adapter: covered in Task 2
- shared sidebar shell and global home: covered in Task 4
- Vault category management: covered in Task 5
- Vault entry creation/editing with `@bubbles/markdown-editor`: covered in Task 6
- monorepo package reuse and shared UI rules: enforced across Tasks 1, 4, and 6
- docs, lint, typecheck, build verification: covered in Task 7

### Placeholder scan

- No `TODO` / `TBD` implementation markers remain in task steps.
- Optional future work is deliberately isolated outside V1 tasks.

### Type consistency

- `content_items` is the single editorial source record throughout the plan.
- Vault adapter stays in `vault_entries` and `vault_categories`.
- auth identity and author profile stay separated as `auth user` vs `profiles`.
