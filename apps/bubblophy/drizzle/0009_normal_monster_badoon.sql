DROP INDEX "bubblophy_issue_events_issue_created_idx";--> statement-breakpoint
DROP INDEX "bubblophy_project_events_project_created_idx";--> statement-breakpoint
CREATE INDEX "bubblophy_issue_events_issue_created_idx" ON "bubblophy_issue_events" USING btree ("issue_id","created_at","id");--> statement-breakpoint
CREATE INDEX "bubblophy_project_events_project_created_idx" ON "bubblophy_project_events" USING btree ("project_id","created_at","id");