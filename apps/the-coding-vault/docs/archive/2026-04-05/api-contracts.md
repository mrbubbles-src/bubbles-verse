# API Contracts: The Coding Vault

> Generated: 2026-04-05 | Scan Level: Exhaustive

## Authentication

### `POST /api/auth/login`
**Request:**
```json
{ "username": "string", "password": "string" }
```
**Response:** Redirect to `/admin/dashboard` (sets httpOnly JWT cookie, 30 day expiry)
**Errors:** 401 (invalid credentials)

### `POST /api/auth/register`
**Request:**
```json
{ "username": "string", "email": "string", "password": "string", "role": "SUPERADMIN" | "MODERATOR" | "GUEST" }
```
**Response:** 201 Created
**Errors:** 400 (duplicate username/email), 422 (validation)

### `POST /api/auth/logout`
**Response:** `{ "message": "Logout erfolgreich" }` (clears token cookie)

### `GET /api/auth/user`
**Auth:** JWT cookie required
**Response:** `{ "username": "string", "id": "string", "role": "string" }` or `null`

## Vault Content

### `POST /api/vault/save-entry`
**Request:**
```json
{
  "title": "string",
  "content": { "time": "number", "blocks": "TEditorBlock[]", "version": "string" },
  "slug": "string",
  "categoryId": "UUID",
  "authorId": "UUID",
  "description": "string",
  "order": "number"
}
```
**Response:** 200 OK
**Validation:** Content must have at least one block
**Errors:** 400 (validation), 500 (server)

### `GET /api/vault/categories`
**Response:** Array of categories with vault entries
**Cache:** `public, max-age=3600, s-maxage=86400`
**Fallback:** Empty array if DB disabled

### `POST /api/vault/image-upload`
**Request:** `multipart/form-data` with `image` file
**Response:**
```json
{
  "success": 1,
  "file": {
    "url": "string (Cloudinary CDN URL)",
    "original_filename": "string",
    "display_name": "string",
    "public_id": "string",
    "width": "number",
    "height": "number"
  }
}
```
**Destination:** Cloudinary folder `vault-uploads`

## Utility

### `POST /api/error/report-error`
**Request:**
```json
{ "message": "string", "stack": "string?", "digest": "string?", "cause": "string?" }
```
**Destination:** Discord webhook (`DISCORD_WEBHOOK_URL`)

### `GET /api/og`
**Response:** PNG image (1200x630px) — The Coding Vault branding
