CREATE TYPE "public"."bubblophy_agent_run_state" AS ENUM('requested', 'approved', 'running', 'needs_review', 'completed', 'cancelled', 'failed');--> statement-breakpoint
CREATE TYPE "public"."bubblophy_agent_token_state" AS ENUM('active', 'paused', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."bubblophy_issue_event_type" AS ENUM('created', 'status_changed', 'plan_updated', 'human_approved', 'agent_token_created', 'agent_run_requested', 'agent_run_event', 'commented');--> statement-breakpoint
CREATE TYPE "public"."bubblophy_issue_priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."bubblophy_issue_status" AS ENUM('triage', 'planned', 'ready', 'in_progress', 'review', 'blocked', 'done');--> statement-breakpoint
CREATE TYPE "public"."bubblophy_project_role" AS ENUM('owner', 'maintainer', 'member', 'viewer');--> statement-breakpoint
CREATE TABLE "bubblophy_agent_runs" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"issue_id" text NOT NULL,
	"agent_token_id" text NOT NULL,
	"state" "bubblophy_agent_run_state" DEFAULT 'requested' NOT NULL,
	"requested_by_auth_user_id" text NOT NULL,
	"approved_by_auth_user_id" text,
	"approved_at" timestamp(3),
	"started_at" timestamp(3),
	"finished_at" timestamp(3),
	"result" jsonb,
	"created_at" timestamp(3) DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bubblophy_agent_tokens" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" text NOT NULL,
	"label" text NOT NULL,
	"token_hash" text NOT NULL,
	"scopes" jsonb NOT NULL,
	"state" "bubblophy_agent_token_state" DEFAULT 'active' NOT NULL,
	"created_by_auth_user_id" text NOT NULL,
	"last_used_at" timestamp(3),
	"expires_at" timestamp(3),
	"revoked_at" timestamp(3),
	"created_at" timestamp(3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bubblophy_issue_events" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"issue_id" text NOT NULL,
	"event_type" "bubblophy_issue_event_type" NOT NULL,
	"actor_auth_user_id" text,
	"actor_agent_token_id" text,
	"agent_run_id" text,
	"summary" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp(3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bubblophy_issue_plans" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"issue_id" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"steps" jsonb NOT NULL,
	"created_by_auth_user_id" text,
	"created_by_agent_token_id" text,
	"approved_by_auth_user_id" text,
	"approved_at" timestamp(3),
	"created_at" timestamp(3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bubblophy_issues" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" text NOT NULL,
	"parent_issue_id" text,
	"issue_number" integer NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" "bubblophy_issue_status" DEFAULT 'triage' NOT NULL,
	"priority" "bubblophy_issue_priority" DEFAULT 'medium' NOT NULL,
	"created_by_auth_user_id" text NOT NULL,
	"assigned_auth_user_id" text,
	"requires_human_approval" boolean DEFAULT true NOT NULL,
	"created_at" timestamp(3) DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bubblophy_project_members" (
	"project_id" text NOT NULL,
	"auth_user_id" text NOT NULL,
	"role" "bubblophy_project_role" DEFAULT 'member' NOT NULL,
	"created_at" timestamp(3) DEFAULT now() NOT NULL,
	CONSTRAINT "bubblophy_project_members_pkey" PRIMARY KEY("project_id","auth_user_id")
);
--> statement-breakpoint
CREATE TABLE "bubblophy_projects" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"repository_url" text,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_by_auth_user_id" text NOT NULL,
	"created_at" timestamp(3) DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bubblophy_agent_runs" ADD CONSTRAINT "bubblophy_agent_runs_issue_id_bubblophy_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."bubblophy_issues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bubblophy_agent_runs" ADD CONSTRAINT "bubblophy_agent_runs_agent_token_id_bubblophy_agent_tokens_id_fk" FOREIGN KEY ("agent_token_id") REFERENCES "public"."bubblophy_agent_tokens"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bubblophy_agent_tokens" ADD CONSTRAINT "bubblophy_agent_tokens_project_id_bubblophy_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."bubblophy_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bubblophy_issue_events" ADD CONSTRAINT "bubblophy_issue_events_issue_id_bubblophy_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."bubblophy_issues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bubblophy_issue_events" ADD CONSTRAINT "bubblophy_issue_events_actor_agent_token_id_bubblophy_agent_tokens_id_fk" FOREIGN KEY ("actor_agent_token_id") REFERENCES "public"."bubblophy_agent_tokens"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bubblophy_issue_events" ADD CONSTRAINT "bubblophy_issue_events_agent_run_id_bubblophy_agent_runs_id_fk" FOREIGN KEY ("agent_run_id") REFERENCES "public"."bubblophy_agent_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bubblophy_issue_plans" ADD CONSTRAINT "bubblophy_issue_plans_issue_id_bubblophy_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."bubblophy_issues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bubblophy_issues" ADD CONSTRAINT "bubblophy_issues_project_id_bubblophy_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."bubblophy_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bubblophy_issues" ADD CONSTRAINT "bubblophy_issues_parent_issue_id_bubblophy_issues_id_fk" FOREIGN KEY ("parent_issue_id") REFERENCES "public"."bubblophy_issues"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bubblophy_project_members" ADD CONSTRAINT "bubblophy_project_members_project_id_bubblophy_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."bubblophy_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bubblophy_agent_runs_issue_state_idx" ON "bubblophy_agent_runs" USING btree ("issue_id","state");--> statement-breakpoint
CREATE INDEX "bubblophy_agent_runs_agent_token_idx" ON "bubblophy_agent_runs" USING btree ("agent_token_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bubblophy_agent_tokens_token_hash_idx" ON "bubblophy_agent_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "bubblophy_agent_tokens_project_state_idx" ON "bubblophy_agent_tokens" USING btree ("project_id","state");--> statement-breakpoint
CREATE INDEX "bubblophy_issue_events_issue_created_idx" ON "bubblophy_issue_events" USING btree ("issue_id","created_at");--> statement-breakpoint
CREATE INDEX "bubblophy_issue_events_actor_auth_user_idx" ON "bubblophy_issue_events" USING btree ("actor_auth_user_id");--> statement-breakpoint
CREATE INDEX "bubblophy_issue_events_actor_agent_token_idx" ON "bubblophy_issue_events" USING btree ("actor_agent_token_id");--> statement-breakpoint
CREATE INDEX "bubblophy_issue_events_agent_run_idx" ON "bubblophy_issue_events" USING btree ("agent_run_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bubblophy_issue_plans_issue_version_idx" ON "bubblophy_issue_plans" USING btree ("issue_id","version");--> statement-breakpoint
CREATE INDEX "bubblophy_issue_plans_approved_idx" ON "bubblophy_issue_plans" USING btree ("approved_at");--> statement-breakpoint
CREATE UNIQUE INDEX "bubblophy_issues_project_number_idx" ON "bubblophy_issues" USING btree ("project_id","issue_number");--> statement-breakpoint
CREATE INDEX "bubblophy_issues_project_status_idx" ON "bubblophy_issues" USING btree ("project_id","status");--> statement-breakpoint
CREATE INDEX "bubblophy_issues_parent_issue_idx" ON "bubblophy_issues" USING btree ("parent_issue_id");--> statement-breakpoint
CREATE INDEX "bubblophy_issues_assigned_user_idx" ON "bubblophy_issues" USING btree ("assigned_auth_user_id");--> statement-breakpoint
CREATE INDEX "bubblophy_project_members_auth_user_idx" ON "bubblophy_project_members" USING btree ("auth_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bubblophy_projects_slug_idx" ON "bubblophy_projects" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "bubblophy_projects_key_idx" ON "bubblophy_projects" USING btree ("key");
