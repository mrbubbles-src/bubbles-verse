CREATE TYPE "public"."bubblophy_project_event_type" AS ENUM('agent_token_created', 'agent_token_revoked', 'agent_run_requested', 'agent_run_approved', 'project_updated');--> statement-breakpoint
CREATE TABLE "bubblophy_project_events" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" text NOT NULL,
	"event_type" "bubblophy_project_event_type" NOT NULL,
	"actor_auth_user_id" text,
	"actor_agent_token_id" text,
	"agent_run_id" text,
	"summary" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp(3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bubblophy_project_events" ADD CONSTRAINT "bubblophy_project_events_project_id_bubblophy_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."bubblophy_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bubblophy_project_events" ADD CONSTRAINT "bubblophy_project_events_actor_agent_token_id_bubblophy_agent_tokens_id_fk" FOREIGN KEY ("actor_agent_token_id") REFERENCES "public"."bubblophy_agent_tokens"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bubblophy_project_events" ADD CONSTRAINT "bubblophy_project_events_agent_run_id_bubblophy_agent_runs_id_fk" FOREIGN KEY ("agent_run_id") REFERENCES "public"."bubblophy_agent_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bubblophy_project_events_project_created_idx" ON "bubblophy_project_events" USING btree ("project_id","created_at");--> statement-breakpoint
CREATE INDEX "bubblophy_project_events_actor_auth_user_idx" ON "bubblophy_project_events" USING btree ("actor_auth_user_id");--> statement-breakpoint
CREATE INDEX "bubblophy_project_events_actor_agent_token_idx" ON "bubblophy_project_events" USING btree ("actor_agent_token_id");--> statement-breakpoint
CREATE INDEX "bubblophy_project_events_agent_run_idx" ON "bubblophy_project_events" USING btree ("agent_run_id");