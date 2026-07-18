ALTER TABLE "bubblophy_issue_events" ADD COLUMN "actor_oauth_client_id" text;--> statement-breakpoint
ALTER TABLE "bubblophy_issue_plans" ADD COLUMN "created_by_oauth_client_id" text;--> statement-breakpoint
ALTER TABLE "bubblophy_project_events" ADD COLUMN "actor_oauth_client_id" text;--> statement-breakpoint
CREATE INDEX "bubblophy_issue_events_actor_oauth_client_idx" ON "bubblophy_issue_events" USING btree ("actor_oauth_client_id");--> statement-breakpoint
CREATE INDEX "bubblophy_project_events_actor_oauth_client_idx" ON "bubblophy_project_events" USING btree ("actor_oauth_client_id");