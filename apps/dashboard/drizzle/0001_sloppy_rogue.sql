CREATE SCHEMA IF NOT EXISTS "private";
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "private"."dashboard_github_allowlist" (
	"github_username" text NOT NULL,
	"email" text NOT NULL,
	"note" text,
	"user_role" text DEFAULT 'owner' NOT NULL,
	"dashboard_access" boolean DEFAULT true NOT NULL,
	"created_at" timestamp(3) DEFAULT now() NOT NULL,
	CONSTRAINT "dashboard_github_allowlist_pkey" PRIMARY KEY("github_username","email")
);
