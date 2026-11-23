-- =============================================================================
-- Migration: 20261111000000_fix_permissions_and_profile_columns.sql
-- Fix table grants, add profile full_name/email columns, and align RLS policies
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Table Grants for anon and authenticated roles
-- -----------------------------------------------------------------------------

grant select on public.event_proposals to anon, authenticated;
grant insert, update, delete on public.event_proposals to authenticated;

grant select on public.proposal_reviews to anon, authenticated;
grant insert, update, delete on public.proposal_reviews to authenticated;

grant select on public.event_registrations to anon, authenticated;
grant insert, update, delete on public.event_registrations to authenticated;

grant select on public.attendance_records to anon, authenticated;
grant insert, update, delete on public.attendance_records to authenticated;

grant select on public.notifications to anon, authenticated;
grant insert, update, delete on public.notifications to authenticated;

-- Function Execution Grants
grant execute on function public.check_venue_conflict to anon, authenticated;
grant execute on function public.approve_event_proposal to authenticated;
grant execute on function public.register_for_event to authenticated;
grant execute on function public.withdraw_from_event to authenticated;
grant execute on function public.record_attendance_entry to authenticated;
grant execute on function public.cancel_approved_event to authenticated;

-- -----------------------------------------------------------------------------
-- 2. Schema Alignments on public.profiles
-- -----------------------------------------------------------------------------

-- Add full_name as a generated column mirroring display_name
alter table public.profiles
  add column if not exists full_name text generated always as (
    case when display_name is not null and display_name <> '' then display_name else 'User' end
  ) stored;

-- Add email to profiles for report rosters and notifications
alter table public.profiles
  add column if not exists email text;

-- Backfill profile emails from auth.users
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

-- Update trigger function to populate email and support full_name in metadata
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_is_superuser boolean := false;
  v_is_staff boolean := false;
  v_name text;
  v_school_id text;
  v_default_group_id uuid;
begin
  select count(*) into v_count from public.profiles;

  -- The first registered user in the system automatically becomes Superuser and Staff
  if v_count = 0 then
    v_is_superuser := true;
    v_is_staff := true;
  end if;

  v_name := coalesce(
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  v_school_id := new.raw_user_meta_data->>'school_id';

  insert into public.profiles (id, display_name, school_id, is_superuser, is_staff, email)
  values (new.id, v_name, v_school_id, v_is_superuser, v_is_staff, new.email)
  on conflict (id) do update
  set
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    school_id = coalesce(excluded.school_id, public.profiles.school_id),
    email = coalesce(excluded.email, public.profiles.email);

  -- Assign newly registered non-superusers to the default "Students" group
  if not v_is_superuser then
    select id into v_default_group_id from public.groups where name = 'Students' limit 1;
    if v_default_group_id is not null then
      insert into public.user_groups (user_id, group_id)
      values (new.id, v_default_group_id)
      on conflict do nothing;
    end if;
  end if;

  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 3. Schema Alignments on public.attendance_records
-- -----------------------------------------------------------------------------

-- Add aliases verified_at and verification_method as generated columns for query compatibility
alter table public.attendance_records
  add column if not exists verified_at timestamptz generated always as (check_in_at) stored,
  add column if not exists verification_method text generated always as (check_in_method) stored;

-- -----------------------------------------------------------------------------
-- 4. RLS Policy Enhancements
-- -----------------------------------------------------------------------------

-- Proposal Select: allow author to always view their own proposal regardless of status
drop policy if exists "event_proposals_select" on public.event_proposals;
create policy "event_proposals_select" on public.event_proposals for select using (
  status in ('approved', 'cancelled')
  or created_by = auth.uid()
  or public.is_org_officer(organization_id)
  or public.is_org_adviser(organization_id)
  or public.is_staff()
);

-- Proposal Reviews Select: allow proposal author to view audit remarks
drop policy if exists "proposal_reviews_select" on public.proposal_reviews;
create policy "proposal_reviews_select" on public.proposal_reviews for select using (
  public.is_org_officer((select organization_id from public.event_proposals where id = proposal_id))
  or public.is_org_adviser((select organization_id from public.event_proposals where id = proposal_id))
  or public.is_staff()
  or exists (
    select 1 from public.event_proposals ep
    where ep.id = proposal_id and ep.created_by = auth.uid()
  )
);

-- Event Registrations Select: allow reading confirmed registrations on approved events for capacity metrics
drop policy if exists "event_registrations_select" on public.event_registrations;
create policy "event_registrations_select" on public.event_registrations for select using (
  student_id = auth.uid()
  or public.is_org_officer((select organization_id from public.event_proposals where id = proposal_id))
  or public.is_staff()
  or exists (
    select 1 from public.event_proposals ep
    where ep.id = proposal_id and ep.status in ('approved', 'cancelled')
  )
);

-- Attendance Records Select: allow reading attendance counts on approved events
drop policy if exists "attendance_records_select" on public.attendance_records;
create policy "attendance_records_select" on public.attendance_records for select using (
  student_id = auth.uid()
  or public.is_org_officer((select organization_id from public.event_proposals where id = proposal_id))
  or public.is_staff()
  or exists (
    select 1 from public.event_proposals ep
    where ep.id = proposal_id and ep.status in ('approved', 'cancelled')
  )
);
