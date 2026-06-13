create schema if not exists "private";
--> statement-breakpoint
revoke all on schema "private" from public;
--> statement-breakpoint
revoke all on schema "private" from anon;
--> statement-breakpoint
grant usage on schema "private" to authenticated;
--> statement-breakpoint

create or replace function "private"."bubblophy_current_auth_user_id"()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid())::text;
$$;
--> statement-breakpoint

create or replace function "private"."bubblophy_is_project_member"(target_project_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from "public"."bubblophy_project_members" m
    where m."project_id" = target_project_id
      and m."auth_user_id" = (select "private"."bubblophy_current_auth_user_id"())
  );
$$;
--> statement-breakpoint

create or replace function "private"."bubblophy_can_read_issue"(target_issue_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from "public"."bubblophy_issues" i
    where i."id" = target_issue_id
      and (select "private"."bubblophy_is_project_member"(i."project_id"))
  );
$$;
--> statement-breakpoint

grant execute on function "private"."bubblophy_current_auth_user_id"() to authenticated;
--> statement-breakpoint
grant execute on function "private"."bubblophy_is_project_member"(text) to authenticated;
--> statement-breakpoint
grant execute on function "private"."bubblophy_can_read_issue"(text) to authenticated;
--> statement-breakpoint
revoke all on function "private"."bubblophy_current_auth_user_id"() from public, anon;
--> statement-breakpoint
revoke all on function "private"."bubblophy_is_project_member"(text) from public, anon;
--> statement-breakpoint
revoke all on function "private"."bubblophy_can_read_issue"(text) from public, anon;
--> statement-breakpoint

alter table "public"."bubblophy_projects" enable row level security;
--> statement-breakpoint
alter table "public"."bubblophy_project_members" enable row level security;
--> statement-breakpoint
alter table "public"."bubblophy_issues" enable row level security;
--> statement-breakpoint
alter table "public"."bubblophy_issue_plans" enable row level security;
--> statement-breakpoint
alter table "public"."bubblophy_issue_events" enable row level security;
--> statement-breakpoint
alter table "public"."bubblophy_project_events" enable row level security;
--> statement-breakpoint
alter table "public"."bubblophy_agent_tokens" enable row level security;
--> statement-breakpoint
alter table "public"."bubblophy_agent_runs" enable row level security;
--> statement-breakpoint

revoke all on table "public"."bubblophy_projects" from public, anon, authenticated;
--> statement-breakpoint
revoke all on table "public"."bubblophy_project_members" from public, anon, authenticated;
--> statement-breakpoint
revoke all on table "public"."bubblophy_issues" from public, anon, authenticated;
--> statement-breakpoint
revoke all on table "public"."bubblophy_issue_plans" from public, anon, authenticated;
--> statement-breakpoint
revoke all on table "public"."bubblophy_issue_events" from public, anon, authenticated;
--> statement-breakpoint
revoke all on table "public"."bubblophy_project_events" from public, anon, authenticated;
--> statement-breakpoint
revoke all on table "public"."bubblophy_agent_tokens" from public, anon, authenticated;
--> statement-breakpoint
revoke all on table "public"."bubblophy_agent_runs" from public, anon, authenticated;
--> statement-breakpoint

grant select on table "public"."bubblophy_projects" to authenticated;
--> statement-breakpoint
grant select on table "public"."bubblophy_project_members" to authenticated;
--> statement-breakpoint
grant select on table "public"."bubblophy_issues" to authenticated;
--> statement-breakpoint
grant select on table "public"."bubblophy_issue_plans" to authenticated;
--> statement-breakpoint
grant select on table "public"."bubblophy_issue_events" to authenticated;
--> statement-breakpoint
grant select on table "public"."bubblophy_project_events" to authenticated;
--> statement-breakpoint
grant select on table "public"."bubblophy_agent_runs" to authenticated;
--> statement-breakpoint

drop policy if exists "bubblophy project members read projects" on "public"."bubblophy_projects";
--> statement-breakpoint
create policy "bubblophy project members read projects"
on "public"."bubblophy_projects"
for select
to authenticated
using ((select "private"."bubblophy_is_project_member"("id")));
--> statement-breakpoint

drop policy if exists "bubblophy project members read memberships" on "public"."bubblophy_project_members";
--> statement-breakpoint
create policy "bubblophy project members read memberships"
on "public"."bubblophy_project_members"
for select
to authenticated
using ((select "private"."bubblophy_is_project_member"("project_id")));
--> statement-breakpoint

drop policy if exists "bubblophy project members read issues" on "public"."bubblophy_issues";
--> statement-breakpoint
create policy "bubblophy project members read issues"
on "public"."bubblophy_issues"
for select
to authenticated
using ((select "private"."bubblophy_is_project_member"("project_id")));
--> statement-breakpoint

drop policy if exists "bubblophy project members read issue plans" on "public"."bubblophy_issue_plans";
--> statement-breakpoint
create policy "bubblophy project members read issue plans"
on "public"."bubblophy_issue_plans"
for select
to authenticated
using ((select "private"."bubblophy_can_read_issue"("issue_id")));
--> statement-breakpoint

drop policy if exists "bubblophy project members read issue events" on "public"."bubblophy_issue_events";
--> statement-breakpoint
create policy "bubblophy project members read issue events"
on "public"."bubblophy_issue_events"
for select
to authenticated
using ((select "private"."bubblophy_can_read_issue"("issue_id")));
--> statement-breakpoint

drop policy if exists "bubblophy project members read project events" on "public"."bubblophy_project_events";
--> statement-breakpoint
create policy "bubblophy project members read project events"
on "public"."bubblophy_project_events"
for select
to authenticated
using ((select "private"."bubblophy_is_project_member"("project_id")));
--> statement-breakpoint

drop policy if exists "bubblophy project members read agent runs" on "public"."bubblophy_agent_runs";
--> statement-breakpoint
create policy "bubblophy project members read agent runs"
on "public"."bubblophy_agent_runs"
for select
to authenticated
using ((select "private"."bubblophy_can_read_issue"("issue_id")));
--> statement-breakpoint

comment on table "public"."bubblophy_agent_tokens" is
  'RLS is enabled, but direct authenticated reads are intentionally closed because token_hash is secret. Use server-only DTO reads or a future safe view.';
