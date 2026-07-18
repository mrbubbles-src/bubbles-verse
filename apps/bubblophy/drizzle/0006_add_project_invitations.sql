CREATE TABLE "bubblophy_project_invitations" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" text NOT NULL,
	"normalized_email" text NOT NULL,
	"role" "bubblophy_project_role" NOT NULL,
	"token_hash" text NOT NULL,
	"invited_by_auth_user_id" text NOT NULL,
	"accepted_by_auth_user_id" text,
	"revoked_by_auth_user_id" text,
	"expires_at" timestamp(3) NOT NULL,
	"accepted_at" timestamp(3),
	"revoked_at" timestamp(3),
	"created_at" timestamp(3) DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) DEFAULT now() NOT NULL,
	CONSTRAINT "bubblophy_project_invitations_role_check" CHECK ("bubblophy_project_invitations"."role" <> 'owner'),
	CONSTRAINT "bubblophy_project_invitations_normalized_email_check" CHECK ("bubblophy_project_invitations"."normalized_email" = lower(btrim("bubblophy_project_invitations"."normalized_email")) and length("bubblophy_project_invitations"."normalized_email") between 3 and 320 and position('@' in "bubblophy_project_invitations"."normalized_email") > 1),
	CONSTRAINT "bubblophy_project_invitations_token_hash_check" CHECK ("bubblophy_project_invitations"."token_hash" ~ '^sha256:[0-9a-f]{64}$'),
	CONSTRAINT "bubblophy_project_invitations_expiry_check" CHECK ("bubblophy_project_invitations"."expires_at" > "bubblophy_project_invitations"."created_at"),
	CONSTRAINT "bubblophy_project_invitations_acceptance_pair_check" CHECK (("bubblophy_project_invitations"."accepted_at" is null) = ("bubblophy_project_invitations"."accepted_by_auth_user_id" is null)),
	CONSTRAINT "bubblophy_project_invitations_revocation_pair_check" CHECK (("bubblophy_project_invitations"."revoked_at" is null) = ("bubblophy_project_invitations"."revoked_by_auth_user_id" is null)),
	CONSTRAINT "bubblophy_project_invitations_terminal_state_check" CHECK (not ("bubblophy_project_invitations"."accepted_at" is not null and "bubblophy_project_invitations"."revoked_at" is not null)),
	CONSTRAINT "bubblophy_project_invitations_terminal_time_check" CHECK (("bubblophy_project_invitations"."accepted_at" is null or ("bubblophy_project_invitations"."accepted_at" >= "bubblophy_project_invitations"."created_at" and "bubblophy_project_invitations"."accepted_at" < "bubblophy_project_invitations"."expires_at")) and ("bubblophy_project_invitations"."revoked_at" is null or "bubblophy_project_invitations"."revoked_at" >= "bubblophy_project_invitations"."created_at"))
);
--> statement-breakpoint
ALTER TABLE "bubblophy_project_invitations" ADD CONSTRAINT "bubblophy_project_invitations_project_id_bubblophy_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."bubblophy_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bubblophy_project_invitations_token_hash_idx" ON "bubblophy_project_invitations" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "bubblophy_project_invitations_open_email_idx" ON "bubblophy_project_invitations" USING btree ("project_id","normalized_email") WHERE "bubblophy_project_invitations"."accepted_at" is null and "bubblophy_project_invitations"."revoked_at" is null;--> statement-breakpoint
CREATE INDEX "bubblophy_project_invitations_project_created_idx" ON "bubblophy_project_invitations" USING btree ("project_id","created_at");--> statement-breakpoint
ALTER TABLE "public"."bubblophy_project_invitations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
REVOKE ALL ON TABLE "public"."bubblophy_project_invitations" FROM public, anon, authenticated;--> statement-breakpoint
COMMENT ON TABLE "public"."bubblophy_project_invitations" IS
  'Invitation email and token hashes are server-only. Direct public, anon, and authenticated access is intentionally closed.';
