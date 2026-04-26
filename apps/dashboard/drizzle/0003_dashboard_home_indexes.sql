CREATE INDEX IF NOT EXISTS "content_items_updated_at_idx" ON "content_items" ("updatedAt");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "content_items_status_updated_at_idx" ON "content_items" ("status", "updatedAt");
