-- Custom SQL migration file, put your code below! --
drop policy if exists "bubblophy direct sessions exclude oauth clients" on "public"."bubblophy_projects";
--> statement-breakpoint
create policy "bubblophy direct sessions exclude oauth clients"
on "public"."bubblophy_projects"
as restrictive
for all
to authenticated
using (((select auth.jwt()) ->> 'client_id') is null)
with check (((select auth.jwt()) ->> 'client_id') is null);
--> statement-breakpoint

drop policy if exists "bubblophy direct sessions exclude oauth clients" on "public"."bubblophy_project_members";
--> statement-breakpoint
create policy "bubblophy direct sessions exclude oauth clients"
on "public"."bubblophy_project_members"
as restrictive
for all
to authenticated
using (((select auth.jwt()) ->> 'client_id') is null)
with check (((select auth.jwt()) ->> 'client_id') is null);
--> statement-breakpoint

drop policy if exists "bubblophy direct sessions exclude oauth clients" on "public"."bubblophy_issues";
--> statement-breakpoint
create policy "bubblophy direct sessions exclude oauth clients"
on "public"."bubblophy_issues"
as restrictive
for all
to authenticated
using (((select auth.jwt()) ->> 'client_id') is null)
with check (((select auth.jwt()) ->> 'client_id') is null);
--> statement-breakpoint

drop policy if exists "bubblophy direct sessions exclude oauth clients" on "public"."bubblophy_issue_plans";
--> statement-breakpoint
create policy "bubblophy direct sessions exclude oauth clients"
on "public"."bubblophy_issue_plans"
as restrictive
for all
to authenticated
using (((select auth.jwt()) ->> 'client_id') is null)
with check (((select auth.jwt()) ->> 'client_id') is null);
--> statement-breakpoint

drop policy if exists "bubblophy direct sessions exclude oauth clients" on "public"."bubblophy_issue_events";
--> statement-breakpoint
create policy "bubblophy direct sessions exclude oauth clients"
on "public"."bubblophy_issue_events"
as restrictive
for all
to authenticated
using (((select auth.jwt()) ->> 'client_id') is null)
with check (((select auth.jwt()) ->> 'client_id') is null);
--> statement-breakpoint

drop policy if exists "bubblophy direct sessions exclude oauth clients" on "public"."bubblophy_project_events";
--> statement-breakpoint
create policy "bubblophy direct sessions exclude oauth clients"
on "public"."bubblophy_project_events"
as restrictive
for all
to authenticated
using (((select auth.jwt()) ->> 'client_id') is null)
with check (((select auth.jwt()) ->> 'client_id') is null);
--> statement-breakpoint

drop policy if exists "bubblophy direct sessions exclude oauth clients" on "public"."bubblophy_agent_tokens";
--> statement-breakpoint
create policy "bubblophy direct sessions exclude oauth clients"
on "public"."bubblophy_agent_tokens"
as restrictive
for all
to authenticated
using (((select auth.jwt()) ->> 'client_id') is null)
with check (((select auth.jwt()) ->> 'client_id') is null);
--> statement-breakpoint

drop policy if exists "bubblophy direct sessions exclude oauth clients" on "public"."bubblophy_agent_runs";
--> statement-breakpoint
create policy "bubblophy direct sessions exclude oauth clients"
on "public"."bubblophy_agent_runs"
as restrictive
for all
to authenticated
using (((select auth.jwt()) ->> 'client_id') is null)
with check (((select auth.jwt()) ->> 'client_id') is null);
