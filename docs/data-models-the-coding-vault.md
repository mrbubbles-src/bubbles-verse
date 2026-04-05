# Data Models: The Coding Vault

> Generated: 2026-04-05 | Scan Level: Exhaustive

## Database

**Engine:** PostgreSQL
**ORM:** Drizzle ORM 0.45.0
**Schema:** `apps/the-coding-vault/drizzle/db/schema.ts`
**Migrations:** `apps/the-coding-vault/drizzle/migrations/`

## Tables

### users

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | UUID | PK | gen_random_uuid() |
| numericId | serial | unique | auto |
| username | varchar | unique, not null | — |
| password | varchar | not null | — |
| email | varchar | unique, not null | — |
| role | enum('SUPERADMIN','MODERATOR','GUEST') | not null | 'GUEST' |
| authorInfo | JSONB | nullable | — |
| createdAt | timestamp | — | CURRENT_TIMESTAMP |
| updatedAt | timestamp | — | CURRENT_TIMESTAMP |

**authorInfo JSONB schema:**
```typescript
{
  name?: string
  email?: string
  avatar?: string  // Cloudinary public_id
  authorSocials?: {
    website?: string
    github?: string
    linkedin?: string
    codepen?: string
    stackoverflow?: string
    youtube?: string
    twitter?: string
    twitch?: string
    discord?: string
    instagram?: string
    tiktok?: string
    facebook?: string
  }
}
```

### categories

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | UUID | PK | — |
| name | varchar | unique, not null | — |
| slug | varchar | unique, not null | — |
| order | integer | not null | — |
| iconKey | enum | — | — |
| createdAt | timestamp | — | — |
| updatedAt | timestamp | — | — |

**iconKey enum values:** git, github, node, html, css, js, react, backend, database, default

### vaultEntries

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | UUID | PK | — |
| numericId | serial | unique | auto |
| title | varchar | not null | — |
| slug | varchar | unique, not null | — |
| content | JSONB | not null | — |
| description | varchar | — | '' |
| authorId | UUID | FK → users.id (cascade) | — |
| categoryId | UUID | FK → categories.id (cascade) | — |
| published | boolean | — | false |
| isFeatured | boolean | — | false |
| order | integer | — | 0 |
| createdAt | timestamp | — | — |
| updatedAt | timestamp | — | — |

**content JSONB schema (Editor.js format):**
```typescript
{
  time: number
  version: string
  blocks: Array<{
    id: string
    type: 'paragraph' | 'header' | 'list' | 'code' | 'quote' | 'alert' | 'delimiter' | 'toggle' | 'table' | 'embed' | 'image'
    data: Record<string, unknown>
  }>
}
```

## Relationships

```
users (1) ──→ (N) vaultEntries    via authorId (cascade delete)
categories (1) ──→ (N) vaultEntries    via categoryId (cascade delete)
```

## Seed Data

9 default categories seeded via `drizzle/db/seed.ts`:

| Name | Slug | Icon |
|------|------|------|
| Git | git | git |
| GitHub | github | github |
| Node.js | nodejs | node |
| HTML | html | html |
| CSS | css | css |
| JavaScript | javascript | js |
| React | react | react |
| Backend | backend | backend |
| Database | database | database |

## Data Models: TeacherBuddy (localStorage)

TeacherBuddy has no database but uses structured data models persisted in localStorage:

```typescript
Classroom { id: string, name: string, createdAt: number }
Student { id: string, name: string, status: "active"|"excluded", createdAt: number, classId: string }
Quiz { id: string, title: string, description?: string, questions: Question[], createdAt: number, updatedAt: number }
Question { id: string, prompt: string, answer: string }
ProjectList { id: string, classId: string, name: string, projectType: string, description: string, studentIds: string[], groups: string[][], createdAt: number }
BreakoutGroups { classId: string, groupSize: number, groupIds: string[][], createdAt: number }
```

See [architecture-teacherbuddy.md](./architecture-teacherbuddy.md) for full storage key mapping.
