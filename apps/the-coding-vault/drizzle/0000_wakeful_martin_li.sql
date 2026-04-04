CREATE TYPE "public"."IconKey" AS ENUM('github', 'node', 'html', 'css', 'js', 'react', 'backend', 'database', 'default', 'git');--> statement-breakpoint
CREATE TYPE "public"."Role" AS ENUM('SUPERADMIN', 'MODERATOR', 'GUEST');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"order" integer NOT NULL,
	"iconKey" "IconKey" DEFAULT 'default' NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"numericId" serial NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text NOT NULL,
	"role" "Role" DEFAULT 'GUEST' NOT NULL,
	"authorInfo" jsonb,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vaultEntries" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"numericId" serial NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"content" jsonb NOT NULL,
	"authorId" text NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"categoryId" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"isFeatured" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vaultEntries" ADD CONSTRAINT "VaultEntry_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "vaultEntries" ADD CONSTRAINT "VaultEntry_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "Category_name_key" ON "categories" USING btree ("name" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "Category_slug_key" ON "categories" USING btree ("slug" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "User_email_key" ON "users" USING btree ("email" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "User_numericId_key" ON "users" USING btree ("numericId" int4_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "User_username_key" ON "users" USING btree ("username" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "VaultEntry_numericId_key" ON "vaultEntries" USING btree ("numericId" int4_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "VaultEntry_slug_key" ON "vaultEntries" USING btree ("slug" text_ops);