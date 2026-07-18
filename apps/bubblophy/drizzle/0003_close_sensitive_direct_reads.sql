revoke select on table "public"."bubblophy_agent_runs" from authenticated;
--> statement-breakpoint
revoke select on table "public"."bubblophy_issue_events" from authenticated;
--> statement-breakpoint

drop policy if exists "bubblophy project members read agent runs" on "public"."bubblophy_agent_runs";
--> statement-breakpoint
drop policy if exists "bubblophy project members read issue events" on "public"."bubblophy_issue_events";
--> statement-breakpoint

comment on table "public"."bubblophy_agent_runs" is
  'Direct authenticated reads are closed because agent result JSON can contain sensitive material. Use membership-checked server-only DTO reads.';
--> statement-breakpoint
comment on table "public"."bubblophy_issue_events" is
  'Direct authenticated reads are closed because raw agent event payloads can contain sensitive material. Use membership-checked server-only DTO reads.';
