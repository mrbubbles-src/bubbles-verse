CREATE TABLE "bubblophy_user_profiles" (
	"auth_user_id" text PRIMARY KEY NOT NULL,
	"normalized_email" text NOT NULL,
	"display_name" text,
	"created_at" timestamp(3) DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) DEFAULT now() NOT NULL,
	CONSTRAINT "bubblophy_user_profiles_normalized_email_check" CHECK ("bubblophy_user_profiles"."normalized_email" = lower(btrim("bubblophy_user_profiles"."normalized_email")) and length("bubblophy_user_profiles"."normalized_email") between 3 and 320 and position('@' in "bubblophy_user_profiles"."normalized_email") > 1),
	CONSTRAINT "bubblophy_user_profiles_display_name_check" CHECK ("bubblophy_user_profiles"."display_name" is null or ("bubblophy_user_profiles"."display_name" = btrim("bubblophy_user_profiles"."display_name") and length("bubblophy_user_profiles"."display_name") between 1 and 120))
);
--> statement-breakpoint
ALTER TABLE "public"."bubblophy_user_profiles" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL ON TABLE "public"."bubblophy_user_profiles" FROM public, anon, authenticated;
--> statement-breakpoint
COMMENT ON TABLE "public"."bubblophy_user_profiles" IS
  'Display-only identity projection synchronized from verified server sessions. Direct client access is intentionally closed; project membership remains the sole access source.';
