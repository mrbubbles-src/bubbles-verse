---
title: "Product Brief: Private Recipe Library"
status: "work-in-progress"
created: "2026-08-10"
updated: "2026-08-10"
inputs:
  - user-delegated scope
---

# Product Brief: Private Recipe Library

## Status and Intent

This is a work-in-progress specification for a later, separate Next.js app in the bubbles-verse monorepo. It records the currently intended product boundary; it is not an implementation plan and does not establish a database schema, provider configuration, or delivery scope.

The library is a fully private, non-commercial Family-and-Friends collection. It is not a public recipe website, a community platform, or a commercial product.

## Product Goal

Give a small, explicitly approved group a protected place to preserve, search, and share family recipes, including recipes captured from paper, images, or PDFs. The system should turn submitted material into reviewable structured recipe data while retaining the original private source.

## App and Expected Platform Direction

- A later standalone Next.js app inside this monorepo; the final workspace name and location are open.
- UI direction: shadcn.
- Expected backend direction: Supabase for authentication, persisted recipe data, and access control.
- Expected media direction: original scans remain private; recipe images may later use Cloudinary.
- All access enforcement must happen server-side. Client-side visibility is not an authorization boundary.

Provider selection, project boundaries, storage layout, database schema, Row Level Security policy design, and Cloudinary upload/delivery model remain open decisions.

## Access and Roles

Access is login-protected. Owner Manuel deliberately grants read and write permissions to individual people after they have logged in; no account receives library access merely by existing.

| Role | Intended permissions |
| --- | --- |
| Owner (Manuel) | Grants and revokes read/write access; can view, edit, moderate, approve, or reject every recipe and submission. |
| Approved reader | Can view only recipes and submissions they are authorized to see. |
| Approved contributor | Has reader access plus permission to submit recipes; may edit only recipes they uploaded. |
| Pending contributor submission | The uploader and Owner can see it; other members cannot until it is approved. |

The exact role model, invitation flow, and whether read and write permissions are represented independently are open decisions.

## Recipe Intake and Data Quality

Recipes can later be imported through a mobile camera capture or by uploading an image or PDF. Extraction must produce structured recipe data and run a required-field validation before a recipe can progress through its workflow.

The final required recipe fields, extraction method/provider, confidence thresholds, correction interface, and handling of unreadable or incomplete source material are open decisions. They must be decided before implementation rather than inferred from this brief.

Original scans and uploaded source files are private. They are source evidence for the recipe, not public assets.

## Submission and Moderation Workflow

1. A contributor uploads a source and submits extracted, validated recipe data.
2. The submission is `pending`; only its uploader and Owner can access it.
3. Owner reviews the submission and either approves it or rejects it with a reason.
4. A rejected uploader can revise and submit again; the exact revision/history semantics are open.
5. Once approved, the recipe becomes visible to the intended authorized library members.

Moderation feedback is delivered as grouped in-app notices. Email and push notifications are future extensions, not part of this initial scope.

## Recipe Ownership and Duplicate Titles

- Contributors may edit only recipes they uploaded.
- Owner may edit or moderate every recipe.
- When a title duplicate is detected, the contributor must see a preview and choose whether to treat it as a duplicate or create a linked alternative recipe.
- A linked alternative is not assumed to replace or overwrite the existing recipe.

The duplicate-matching rules, what a preview includes, relationship/data model for alternatives, and whether Owner approval is required for the chosen duplicate outcome remain open decisions.

## Privacy, Sharing, and Attribution

- No public recipe URLs.
- Internal sharing uses protected share links only; link access must remain subject to server-side authorization.
- Pages and any accidental externally reachable route must be marked `noindex`.
- Each recipe carries an internal source attribution and a normal private-use notice.

The exact protected-link behavior (for example, expiry, revocation, recipient binding, and whether links are necessary at all), source-attribution format, and private-use notice wording are open decisions.

## Later Extensions

These are explicitly later possibilities, not initial scope:

- Manually created recipes without an imported scan.
- Shopping lists.
- Portion scaling.
- Push and email notifications.

## Out of Scope for This Spec

- Implementation of the app, authentication, database, media storage, extraction, or moderation tooling.
- Configuration or dependency changes.
- Public discovery, public recipe pages, SEO growth, commercial use, advertising, payments, or multi-tenant SaaS behavior.
- A final data model, permission policy, vendor integration, or delivery timeline.
