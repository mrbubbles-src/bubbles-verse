# Component Inventory: Portfolio

> Generated: 2026-04-05 | Scan Level: Exhaustive

## Layout Components

| Component | File | Props | Purpose |
|-----------|------|-------|---------|
| Navbar | `components/layout/navbar/navbar.tsx` | dictionary, lang | Sticky header: logo, nav links, locale switcher, theme toggle |
| Footer | `components/layout/footer/footer.tsx` | dictionary | Footer: locale switcher, theme toggle, social links, legal |

## Display Components

| Component | File | Props | Purpose |
|-----------|------|-------|---------|
| About | `components/layout/about/about.tsx` | dictionary | Hero section with profile image, age calculation, action buttons |
| ContactAbout | `components/layout/about/contact-about.tsx` | dictionary | Contact info card with profile and links |
| ProjectCard | `components/layout/projects/project-card.tsx` | tech[], github, live, image, dictionary | Project showcase with tech badges |
| ProjectImage | `components/layout/projects/project-image.tsx` | title, live, image | Responsive project screenshot |
| StackGrid | `components/layout/stack/stack-grid.tsx` | — | 3-column tech stack display (data from stack.ts) |
| CurriculumVitae | `components/layout/curriculum-vitae/curriculum-vitae.tsx` | lang | PDF viewer with page navigation (react-pdf) |
| CurriculumVitaeClient | `components/layout/curriculum-vitae/curriculum-vitae.client.tsx` | lang | Dynamic import wrapper (SSR disabled) |
| CurriculumVitaeSkeleton | `components/layout/curriculum-vitae/curriculum-vitae-skeleton.tsx` | — | Loading skeleton for PDF viewer |

## Form Components

| Component | File | Props | Purpose |
|-----------|------|-------|---------|
| ContactForm | `components/layout/contact/ContactForm.tsx` | dictionary, language | Email form with react-hook-form + Turnstile CAPTCHA |

## Navigation/UI Components

| Component | File | Props | Purpose |
|-----------|------|-------|---------|
| LocaleSwitcher | `components/ui/locale-switcher.tsx` | dictionary | Language toggle (DE/EN) via DropdownMenu |
| ThemeToggle | `components/ui/theme-toggle.tsx` | dictionary | Light/Dark/System theme switcher |

## Utility Components

| Component | File | Props | Purpose |
|-----------|------|-------|---------|
| ScrollToTop | `components/utility/scroll-to-top.tsx` | lang | Floating scroll-to-top button (IntersectionObserver) |
| InputModalityTracker | `components/modailty-hack.tsx` | — | Mouse vs keyboard input detection |

## Consumed from @bubbles/ui

Button, Card, Badge, Form, Input, Textarea, DropdownMenu, NavigationMenu, Skeleton, Toaster, Separator
