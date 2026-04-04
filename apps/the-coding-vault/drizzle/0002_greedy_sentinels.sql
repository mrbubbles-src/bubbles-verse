ALTER TABLE "vaultEntries" DROP CONSTRAINT "VaultEntry_authorId_fkey";
--> statement-breakpoint
ALTER TABLE "vaultEntries" DROP CONSTRAINT "VaultEntry_categoryId_fkey";
--> statement-breakpoint
DROP INDEX "Category_name_key";--> statement-breakpoint
DROP INDEX "Category_slug_key";--> statement-breakpoint
DROP INDEX "User_email_key";--> statement-breakpoint
DROP INDEX "User_numericId_key";--> statement-breakpoint
DROP INDEX "User_username_key";--> statement-breakpoint
DROP INDEX "VaultEntry_numericId_key";--> statement-breakpoint
DROP INDEX "VaultEntry_slug_key";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "authorInfo" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "vaultEntries" ADD CONSTRAINT "vaultEntries_authorId_users_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vaultEntries" ADD CONSTRAINT "vaultEntries_categoryId_categories_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_slug_unique" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_numericId_unique" UNIQUE("numericId");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_username_unique" UNIQUE("username");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");--> statement-breakpoint
ALTER TABLE "vaultEntries" ADD CONSTRAINT "vaultEntries_numericId_unique" UNIQUE("numericId");--> statement-breakpoint
ALTER TABLE "vaultEntries" ADD CONSTRAINT "vaultEntries_slug_unique" UNIQUE("slug");