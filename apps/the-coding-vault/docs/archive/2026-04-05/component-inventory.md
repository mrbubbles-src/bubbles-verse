# Component Inventory: The Coding Vault

> Generated: 2026-04-05 | Scan Level: Exhaustive

## Layout Components

| Component | File | Props | Purpose |
|-----------|------|-------|---------|
| Navbar | `components/layout/general/navbar.tsx` | — | Sticky nav with sidebar trigger + theme toggle |
| Footer | `components/layout/general/footer.tsx` | — | Basic footer wrapper |
| VaultSidebar | `components/layout/vault/sidebar/vault-sidebar.tsx` | — | Collapsible category sidebar with entry links |
| AdminSidebar | `components/layout/admin/sidebar/admin-sidebar.tsx` | — | Admin menu with role-based navigation |

## Navigation Components

| Component | File | Props | Purpose |
|-----------|------|-------|---------|
| VaultSidebarEntryLink | `components/layout/vault/sidebar/vault-sidebar-entry-link.tsx` | — | Active link with tooltip |
| SidebarIconTrigger | `components/layout/vault/sidebar/sidebar-icon-trigger.tsx` | — | Category icon button with toggle |
| VaultSidebarFooter | `components/layout/vault/sidebar/vault-sidebar-footer.tsx` | — | Sidebar footer content |

## Auth Components

| Component | File | Props | Purpose |
|-----------|------|-------|---------|
| LoginForm | `components/layout/auth/login-form.tsx` | — | Username/password form (react-hook-form) |
| LogoutButton | `components/ui/user-logout.tsx` | — | Logout action button |

## Editor/Admin Components

| Component | File | Props | Purpose |
|-----------|------|-------|---------|
| Editor | `components/layout/admin/editor/editor.tsx` | — | Editor.js instance (14+ block tools) |
| EditorForm | `components/layout/admin/editor/editor-form.tsx` | — | Entry metadata form (title, slug, category) |
| SubmitEntryClient | `components/layout/admin/editor/submit-entry-client.tsx` | — | Dynamic Editor import wrapper (no SSR) |
| ConvertEditorJsToMdx | `components/layout/admin/editor/convert-editor-js-to-mdx.tsx` | — | Editor.js blocks → MDX string conversion |

## Content Display (MDX Renderers)

| Component | File | Props | Purpose |
|-----------|------|-------|---------|
| VaultCodeBlock | `components/layout/vault/vault-components/vault-code/vault-codeblock.tsx` | data | Syntax-highlighted code (Shiki, one-dark-pro) with copy + line numbers |
| CopyCode | `components/layout/vault/vault-components/vault-code/copy-code.tsx` | text | Copy-to-clipboard with visual feedback |
| VaultAlerts | `components/layout/vault/vault-components/vault-alerts.tsx` | data | Styled alert boxes (info/success/warning/danger) |
| VaultChecklist | `components/layout/vault/vault-components/vault-checklist.tsx` | data | Nested checkbox list renderer |
| VaultDetailsToggle | `components/layout/vault/vault-components/vault-details-toggle.tsx` | data | Collapsible details section |
| VaultEmbed | `components/layout/vault/vault-components/vault-embed.tsx` | data | iframe embed wrapper (YouTube, etc.) |
| VaultImage | `components/layout/vault/vault-components/vault-image/vault-image.tsx` | data | Cloudinary image with blur placeholder + caption |
| VaultCldImage | `components/layout/vault/vault-components/vault-image/vault-cdimage.tsx` | — | Client wrapper for next-cloudinary CldImage |
| VaultLink | `components/layout/vault/vault-components/vault-link.tsx` | href, children | Smart link router (internal/anchor/external) |

## Author Components

| Component | File | Props | Purpose |
|-----------|------|-------|---------|
| VaultAuthor | `components/layout/vault/vault-author/vault-author.tsx` | — | Author info with hover/click expanded card |
| VaultAuthorCard | `components/layout/vault/vault-author/vault-author-card.tsx` | — | Detailed author card with avatar + socials |
| VaultAuthorAvatar | `components/layout/vault/vault-author/vault-author-avatar.tsx` | — | Avatar image with fallback + hover effect |
| VaultAuthorSocials | `components/layout/vault/vault-author/vault-author-socials.tsx` | — | Social icon links with tooltips |

## UI Components

| Component | File | Props | Purpose |
|-----------|------|-------|---------|
| ThemeToggle | `components/ui/theme-toggle.tsx` | — | Light/Dark/System theme switcher |
| Spinner | `components/ui/loading/spinner.tsx` | — | Animated loading spinner |
| VaultEntrySkeleton | `components/ui/loading/vault-entry-skeleton.tsx` | — | Entry page loading skeleton |

## Consumed from @bubbles/ui

Button, Card, Sidebar, Sheet, Dialog, AlertDialog, Avatar, DropdownMenu, Input, Form, Skeleton, Separator, Tooltip, Collapsible, Toaster
