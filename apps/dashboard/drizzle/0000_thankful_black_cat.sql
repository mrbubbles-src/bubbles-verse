CREATE TYPE "public"."content_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."profile_role" AS ENUM('owner', 'editor', 'guest_author');--> statement-breakpoint
CREATE TYPE "public"."social_platform" AS ENUM('website', 'github', 'linkedin', 'twitter');--> statement-breakpoint
CREATE TABLE "app_modules" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp(3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp(3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_item_tags" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contentItemId" text NOT NULL,
	"tag" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_items" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appModuleId" text NOT NULL,
	"contentType" text NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"editorContent" jsonb NOT NULL,
	"serializedContent" text DEFAULT '' NOT NULL,
	"authorProfileId" text NOT NULL,
	"createdByProfileId" text NOT NULL,
	"updatedByProfileId" text NOT NULL,
	"publishedAt" timestamp(3),
	"createdAt" timestamp(3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp(3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_social_links" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profileId" text NOT NULL,
	"platform" "social_platform" NOT NULL,
	"url" text NOT NULL,
	"label" text DEFAULT '' NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp(3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"authUserId" text NOT NULL,
	"displayName" text NOT NULL,
	"slug" text NOT NULL,
	"email" text NOT NULL,
	"avatarUrl" text,
	"bio" text DEFAULT '' NOT NULL,
	"role" "profile_role" DEFAULT 'owner' NOT NULL,
	"createdAt" timestamp(3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp(3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vault_categories" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"parentId" text,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp(3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp(3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vault_entries" (
	"contentItemId" text PRIMARY KEY NOT NULL,
	"primaryCategoryId" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp(3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content_item_tags" ADD CONSTRAINT "content_item_tags_contentItemId_content_items_id_fk" FOREIGN KEY ("contentItemId") REFERENCES "public"."content_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_appModuleId_app_modules_id_fk" FOREIGN KEY ("appModuleId") REFERENCES "public"."app_modules"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_authorProfileId_profiles_id_fk" FOREIGN KEY ("authorProfileId") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_createdByProfileId_profiles_id_fk" FOREIGN KEY ("createdByProfileId") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_updatedByProfileId_profiles_id_fk" FOREIGN KEY ("updatedByProfileId") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_social_links" ADD CONSTRAINT "profile_social_links_profileId_profiles_id_fk" FOREIGN KEY ("profileId") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vault_categories" ADD CONSTRAINT "vault_categories_parentId_vault_categories_id_fk" FOREIGN KEY ("parentId") REFERENCES "public"."vault_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vault_entries" ADD CONSTRAINT "vault_entries_contentItemId_content_items_id_fk" FOREIGN KEY ("contentItemId") REFERENCES "public"."content_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vault_entries" ADD CONSTRAINT "vault_entries_primaryCategoryId_vault_categories_id_fk" FOREIGN KEY ("primaryCategoryId") REFERENCES "public"."vault_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "app_modules_slug_idx" ON "app_modules" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "content_item_tags_content_item_tag_idx" ON "content_item_tags" USING btree ("contentItemId","tag");--> statement-breakpoint
CREATE UNIQUE INDEX "content_items_app_type_slug_idx" ON "content_items" USING btree ("appModuleId","contentType","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "profile_social_links_profile_platform_idx" ON "profile_social_links" USING btree ("profileId","platform");--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_auth_user_id_idx" ON "profiles" USING btree ("authUserId");--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_slug_idx" ON "profiles" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "vault_categories_slug_idx" ON "vault_categories" USING btree ("slug");