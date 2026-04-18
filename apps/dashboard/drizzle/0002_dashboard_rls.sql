create schema if not exists "private";
--> statement-breakpoint
revoke all on schema "private" from public;
--> statement-breakpoint
revoke all on schema "private" from anon;
--> statement-breakpoint
grant usage on schema "private" to authenticated;
--> statement-breakpoint
drop function if exists "private"."is_public_vault_category"(text) cascade;
--> statement-breakpoint

create or replace function "private"."is_dashboard_user"()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce((select auth.jwt() ->> 'dashboard_access')::boolean, false)
    and (select auth.uid()) is not null;
$$;
--> statement-breakpoint

create or replace function "private"."current_dashboard_role"()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select auth.jwt() ->> 'user_role'), '');
$$;
--> statement-breakpoint

create or replace function "private"."is_dashboard_owner"()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select "private"."current_dashboard_role"()) = 'owner';
$$;
--> statement-breakpoint

create or replace function "private"."can_manage_dashboard_content"()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select "private"."current_dashboard_role"()) in ('owner', 'editor');
$$;
--> statement-breakpoint

create or replace function "private"."current_profile_id"()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p."id"
  from "public"."profiles" p
  where p."authUserId" = ((select auth.uid())::text)
  limit 1;
$$;
--> statement-breakpoint

create or replace function "private"."can_manage_profile"(target_profile_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select "private"."is_dashboard_owner"())
    or exists (
      select 1
      from "public"."profiles" p
      where p."id" = target_profile_id
        and p."authUserId" = ((select auth.uid())::text)
    );
$$;
--> statement-breakpoint

create or replace function "private"."can_insert_content_item"(
  target_author_profile_id text,
  target_created_by_profile_id text,
  target_updated_by_profile_id text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select "private"."is_dashboard_user"())
    and (select "private"."current_profile_id"()) is not null
    and target_created_by_profile_id = (select "private"."current_profile_id"())
    and target_updated_by_profile_id = (select "private"."current_profile_id"())
    and (
      (select "private"."can_manage_dashboard_content"())
      or (
        (select "private"."current_dashboard_role"()) = 'guest_author'
        and target_author_profile_id = (select "private"."current_profile_id"())
      )
    );
$$;
--> statement-breakpoint

create or replace function "private"."can_edit_content_item"(target_content_item_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select "private"."is_dashboard_user"())
    and exists (
      select 1
      from "public"."content_items" ci
      where ci."id" = target_content_item_id
        and (
          (select "private"."can_manage_dashboard_content"())
          or (
            (select "private"."current_dashboard_role"()) = 'guest_author'
            and ci."authorProfileId" = (select "private"."current_profile_id"())
          )
        )
    );
$$;
--> statement-breakpoint

grant execute on function "private"."is_dashboard_user"() to authenticated;
--> statement-breakpoint
grant execute on function "private"."current_dashboard_role"() to authenticated;
--> statement-breakpoint
grant execute on function "private"."is_dashboard_owner"() to authenticated;
--> statement-breakpoint
grant execute on function "private"."can_manage_dashboard_content"() to authenticated;
--> statement-breakpoint
grant execute on function "private"."current_profile_id"() to authenticated;
--> statement-breakpoint
grant execute on function "private"."can_manage_profile"(text) to authenticated;
--> statement-breakpoint
grant execute on function "private"."can_insert_content_item"(text, text, text) to authenticated;
--> statement-breakpoint
grant execute on function "private"."can_edit_content_item"(text) to authenticated;
--> statement-breakpoint
revoke all on function "private"."is_dashboard_user"() from public, anon;
--> statement-breakpoint
revoke all on function "private"."current_dashboard_role"() from public, anon;
--> statement-breakpoint
revoke all on function "private"."is_dashboard_owner"() from public, anon;
--> statement-breakpoint
revoke all on function "private"."can_manage_dashboard_content"() from public, anon;
--> statement-breakpoint
revoke all on function "private"."current_profile_id"() from public, anon;
--> statement-breakpoint
revoke all on function "private"."can_manage_profile"(text) from public, anon;
--> statement-breakpoint
revoke all on function "private"."can_insert_content_item"(text, text, text) from public, anon;
--> statement-breakpoint
revoke all on function "private"."can_edit_content_item"(text) from public, anon;
--> statement-breakpoint

alter table "public"."app_modules" enable row level security;
--> statement-breakpoint
alter table "public"."profiles" enable row level security;
--> statement-breakpoint
alter table "public"."profile_social_links" enable row level security;
--> statement-breakpoint
alter table "public"."content_items" enable row level security;
--> statement-breakpoint
alter table "public"."content_item_tags" enable row level security;
--> statement-breakpoint
alter table "public"."vault_categories" enable row level security;
--> statement-breakpoint
alter table "public"."vault_entries" enable row level security;
--> statement-breakpoint
alter table "private"."dashboard_github_allowlist" enable row level security;
--> statement-breakpoint

grant select, insert, update, delete on table "private"."dashboard_github_allowlist" to authenticated;
--> statement-breakpoint
revoke all on table "private"."dashboard_github_allowlist" from anon;
--> statement-breakpoint

drop policy if exists "dashboard read app modules" on "public"."app_modules";
--> statement-breakpoint
drop policy if exists "public read active app modules" on "public"."app_modules";
--> statement-breakpoint
create policy "public read active app modules"
on "public"."app_modules"
for select
to authenticated, anon
using ("isActive" = true);
--> statement-breakpoint

drop policy if exists "dashboard read app modules" on "public"."app_modules";
--> statement-breakpoint
create policy "dashboard read app modules"
on "public"."app_modules"
for select
to authenticated
using ((select "private"."is_dashboard_user"()));
--> statement-breakpoint

drop policy if exists "owner manage app modules" on "public"."app_modules";
--> statement-breakpoint
create policy "owner manage app modules"
on "public"."app_modules"
for all
to authenticated
using ((select "private"."is_dashboard_owner"()))
with check ((select "private"."is_dashboard_owner"()));
--> statement-breakpoint

drop policy if exists "public read published author profiles" on "public"."profiles";
--> statement-breakpoint
create policy "public read published author profiles"
on "public"."profiles"
for select
to authenticated, anon
using (
  exists (
    select 1
    from "public"."content_items" ci
    where ci."authorProfileId" = "profiles"."id"
      and ci."status" = 'published'
  )
);
--> statement-breakpoint

drop policy if exists "dashboard read profiles" on "public"."profiles";
--> statement-breakpoint
create policy "dashboard read profiles"
on "public"."profiles"
for select
to authenticated
using ((select "private"."is_dashboard_user"()));
--> statement-breakpoint

drop policy if exists "users insert own profile" on "public"."profiles";
--> statement-breakpoint
create policy "users insert own profile"
on "public"."profiles"
for insert
to authenticated
with check (
  (select "private"."is_dashboard_user"())
  and "authUserId" = ((select auth.uid())::text)
);
--> statement-breakpoint

drop policy if exists "users manage own profile" on "public"."profiles";
--> statement-breakpoint
create policy "users manage own profile"
on "public"."profiles"
for update
to authenticated
using ((select "private"."can_manage_profile"("id")))
with check (
  (select "private"."can_manage_profile"("id"))
  and (
    (select "private"."is_dashboard_owner"())
    or "authUserId" = ((select auth.uid())::text)
  )
);
--> statement-breakpoint

drop policy if exists "owners delete profiles" on "public"."profiles";
--> statement-breakpoint
create policy "owners delete profiles"
on "public"."profiles"
for delete
to authenticated
using ((select "private"."is_dashboard_owner"()));
--> statement-breakpoint

drop policy if exists "public read published author social links" on "public"."profile_social_links";
--> statement-breakpoint
create policy "public read published author social links"
on "public"."profile_social_links"
for select
to authenticated, anon
using (
  exists (
    select 1
    from "public"."content_items" ci
    where ci."authorProfileId" = "profile_social_links"."profileId"
      and ci."status" = 'published'
  )
);
--> statement-breakpoint

drop policy if exists "dashboard read profile social links" on "public"."profile_social_links";
--> statement-breakpoint
create policy "dashboard read profile social links"
on "public"."profile_social_links"
for select
to authenticated
using ((select "private"."is_dashboard_user"()));
--> statement-breakpoint

drop policy if exists "users manage own profile social links" on "public"."profile_social_links";
--> statement-breakpoint
create policy "users manage own profile social links"
on "public"."profile_social_links"
for all
to authenticated
using ((select "private"."can_manage_profile"("profileId")))
with check ((select "private"."can_manage_profile"("profileId")));
--> statement-breakpoint

drop policy if exists "public read published content items" on "public"."content_items";
--> statement-breakpoint
create policy "public read published content items"
on "public"."content_items"
for select
to authenticated, anon
using ("status" = 'published');
--> statement-breakpoint

drop policy if exists "dashboard read content items" on "public"."content_items";
--> statement-breakpoint
create policy "dashboard read content items"
on "public"."content_items"
for select
to authenticated
using ((select "private"."is_dashboard_user"()));
--> statement-breakpoint

drop policy if exists "dashboard insert content items" on "public"."content_items";
--> statement-breakpoint
create policy "dashboard insert content items"
on "public"."content_items"
for insert
to authenticated
with check (
  (select "private"."can_insert_content_item"(
    "authorProfileId",
    "createdByProfileId",
    "updatedByProfileId"
  ))
);
--> statement-breakpoint

drop policy if exists "dashboard update content items" on "public"."content_items";
--> statement-breakpoint
create policy "dashboard update content items"
on "public"."content_items"
for update
to authenticated
using (
  (select "private"."can_manage_dashboard_content"())
  or (
    (select "private"."current_dashboard_role"()) = 'guest_author'
    and "authorProfileId" = (select "private"."current_profile_id"())
  )
)
with check (
  (select "private"."is_dashboard_user"())
  and "updatedByProfileId" = (select "private"."current_profile_id"())
  and (
    (select "private"."can_manage_dashboard_content"())
    or (
      (select "private"."current_dashboard_role"()) = 'guest_author'
      and "authorProfileId" = (select "private"."current_profile_id"())
    )
  )
);
--> statement-breakpoint

drop policy if exists "owners and editors delete content items" on "public"."content_items";
--> statement-breakpoint
create policy "owners and editors delete content items"
on "public"."content_items"
for delete
to authenticated
using ((select "private"."can_manage_dashboard_content"()));
--> statement-breakpoint

drop policy if exists "public read published content item tags" on "public"."content_item_tags";
--> statement-breakpoint
create policy "public read published content item tags"
on "public"."content_item_tags"
for select
to authenticated, anon
using (
  exists (
    select 1
    from "public"."content_items" ci
    where ci."id" = "content_item_tags"."contentItemId"
      and ci."status" = 'published'
  )
);
--> statement-breakpoint

drop policy if exists "dashboard read content item tags" on "public"."content_item_tags";
--> statement-breakpoint
create policy "dashboard read content item tags"
on "public"."content_item_tags"
for select
to authenticated
using ((select "private"."is_dashboard_user"()));
--> statement-breakpoint

drop policy if exists "dashboard insert content item tags" on "public"."content_item_tags";
--> statement-breakpoint
create policy "dashboard insert content item tags"
on "public"."content_item_tags"
for insert
to authenticated
with check ((select "private"."can_edit_content_item"("contentItemId")));
--> statement-breakpoint

drop policy if exists "dashboard delete content item tags" on "public"."content_item_tags";
--> statement-breakpoint
create policy "dashboard delete content item tags"
on "public"."content_item_tags"
for delete
to authenticated
using ((select "private"."can_edit_content_item"("contentItemId")));
--> statement-breakpoint

drop policy if exists "public read published vault categories" on "public"."vault_categories";
--> statement-breakpoint
create policy "public read published vault categories"
on "public"."vault_categories"
for select
to authenticated, anon
using (true);
--> statement-breakpoint

drop policy if exists "dashboard read vault categories" on "public"."vault_categories";
--> statement-breakpoint
create policy "dashboard read vault categories"
on "public"."vault_categories"
for select
to authenticated
using ((select "private"."is_dashboard_user"()));
--> statement-breakpoint

drop policy if exists "owners and editors manage vault categories" on "public"."vault_categories";
--> statement-breakpoint
create policy "owners and editors manage vault categories"
on "public"."vault_categories"
for all
to authenticated
using ((select "private"."can_manage_dashboard_content"()))
with check ((select "private"."can_manage_dashboard_content"()));
--> statement-breakpoint

drop policy if exists "public read published vault entries" on "public"."vault_entries";
--> statement-breakpoint
create policy "public read published vault entries"
on "public"."vault_entries"
for select
to authenticated, anon
using (
  exists (
    select 1
    from "public"."content_items" ci
    where ci."id" = "vault_entries"."contentItemId"
      and ci."status" = 'published'
  )
);
--> statement-breakpoint

drop policy if exists "dashboard read vault entries" on "public"."vault_entries";
--> statement-breakpoint
create policy "dashboard read vault entries"
on "public"."vault_entries"
for select
to authenticated
using ((select "private"."is_dashboard_user"()));
--> statement-breakpoint

drop policy if exists "dashboard manage vault entries" on "public"."vault_entries";
--> statement-breakpoint
create policy "dashboard manage vault entries"
on "public"."vault_entries"
for all
to authenticated
using ((select "private"."can_edit_content_item"("contentItemId")))
with check ((select "private"."can_edit_content_item"("contentItemId")));
--> statement-breakpoint

drop policy if exists "owners read dashboard allowlist" on "private"."dashboard_github_allowlist";
--> statement-breakpoint
create policy "owners read dashboard allowlist"
on "private"."dashboard_github_allowlist"
for select
to authenticated
using ((select "private"."is_dashboard_owner"()));
--> statement-breakpoint

drop policy if exists "owners manage dashboard allowlist" on "private"."dashboard_github_allowlist";
--> statement-breakpoint
create policy "owners manage dashboard allowlist"
on "private"."dashboard_github_allowlist"
for all
to authenticated
using ((select "private"."is_dashboard_owner"()))
with check ((select "private"."is_dashboard_owner"()));
