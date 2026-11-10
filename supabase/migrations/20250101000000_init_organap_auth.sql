-- =============================================================================
-- OrGanap — Dynamic RBAC & Initial Schema Migration
--
-- Features:
-- 1. Institutional-agnostic design (not hardcoded to any specific school).
-- 2. Complete Role-Based Access Control (RBAC):
--    - superadmin: Full unrestricted system access.
--    - student_affairs: Institutional administration (create/update/delete orgs & venues, assign officers/advisers).
--    - officer: Org proposal drafting, org roster viewing, event attendance check-in.
--    - adviser: Endorsement/return/rejection of assigned org proposals.
--    - student: Public browsing, registration, withdrawal, personal pass.
-- 3. High-performance security helper functions for RLS.
-- 4. Automated first-user superadmin promotion.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum (
      'superadmin',
      'student_affairs',
      'adviser',
      'officer',
      'student'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'proposal_status') then
    create type public.proposal_status as enum (
      'draft',
      'pending_adviser',
      'returned_by_adviser',
      'rejected_by_adviser',
      'pending_student_affairs',
      'returned_by_student_affairs',
      'rejected_by_student_affairs',
      'approved',
      'cancelled'
    );
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- 2. Profiles Table
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  role         public.user_role not null default 'student',
  school_id    text,
  display_name text not null default '',
  avatar_url   text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create unique index if not exists profiles_school_id_idx
  on public.profiles (lower(school_id))
  where school_id is not null;

alter table public.profiles enable row level security;
grant select, insert, update on public.profiles to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Organizations Table
-- ---------------------------------------------------------------------------

create table if not exists public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  acronym     text not null,
  slug        text not null unique,
  description text,
  category    text not null default 'academic',
  logo_url    text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.organizations enable row level security;
grant select on public.organizations to anon, authenticated;
grant insert, update, delete on public.organizations to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Organization Memberships Table
-- ---------------------------------------------------------------------------

create table if not exists public.organization_members (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  org_role        text not null default 'member', -- 'officer', 'adviser', 'member'
  position_title  text,
  created_at      timestamptz not null default now(),
  unique (organization_id, user_id)
);

alter table public.organization_members enable row level security;
grant select on public.organization_members to anon, authenticated;
grant insert, update, delete on public.organization_members to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Venues Table
-- ---------------------------------------------------------------------------

create table if not exists public.venues (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  location   text,
  capacity   integer not null default 50,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.venues enable row level security;
grant select on public.venues to anon, authenticated;
grant insert, update, delete on public.venues to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Dynamic System Settings (Institution-Agnostic)
-- ---------------------------------------------------------------------------

create table if not exists public.system_settings (
  key         text primary key,
  value       jsonb not null default '{}'::jsonb,
  description text,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.profiles(id)
);

alter table public.system_settings enable row level security;
grant select on public.system_settings to anon, authenticated;
grant insert, update, delete on public.system_settings to authenticated;

-- Default institutional settings
insert into public.system_settings (key, value, description)
values
  ('institution', '{"name": "Campus University", "short_name": "Campus", "academic_year": "2026-2027", "semester": "1st Semester"}'::jsonb, 'General institution branding and term'),
  ('proposals', '{"min_advance_days": 7, "require_adviser_endorsement": true}'::jsonb, 'Proposal submission parameters')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- 7. RBAC Helper Functions (Security Definer)
-- ---------------------------------------------------------------------------

create or replace function public.get_auth_role()
returns public.user_role
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_superadmin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'superadmin' and is_active = true
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('superadmin', 'student_affairs')
      and is_active = true
  );
$$;

create or replace function public.is_org_officer(p_org_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('superadmin', 'student_affairs') and p.is_active = true
  ) or exists (
    select 1 from public.organization_members om
    join public.profiles p on p.id = om.user_id
    where om.organization_id = p_org_id
      and om.user_id = auth.uid()
      and om.org_role = 'officer'
      and p.is_active = true
  );
$$;

create or replace function public.is_org_adviser(p_org_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('superadmin', 'student_affairs') and p.is_active = true
  ) or exists (
    select 1 from public.organization_members om
    join public.profiles p on p.id = om.user_id
    where om.organization_id = p_org_id
      and om.user_id = auth.uid()
      and om.org_role = 'adviser'
      and p.is_active = true
  );
$$;

-- ---------------------------------------------------------------------------
-- 8. Row Level Security Policies
-- ---------------------------------------------------------------------------

-- System Settings
drop policy if exists "settings_select" on public.system_settings;
create policy "settings_select"
  on public.system_settings
  for select
  using (true);

drop policy if exists "settings_manage_admin" on public.system_settings;
create policy "settings_manage_admin"
  on public.system_settings
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Organizations
drop policy if exists "organizations_select" on public.organizations;
create policy "organizations_select"
  on public.organizations
  for select
  using (is_active = true or public.is_admin());

drop policy if exists "organizations_insert" on public.organizations;
create policy "organizations_insert"
  on public.organizations
  for insert
  with check (public.is_admin());

drop policy if exists "organizations_update" on public.organizations;
create policy "organizations_update"
  on public.organizations
  for update
  using (public.is_admin() or public.is_org_officer(id))
  with check (public.is_admin() or public.is_org_officer(id));

drop policy if exists "organizations_delete" on public.organizations;
create policy "organizations_delete"
  on public.organizations
  for delete
  using (public.is_admin());

-- Organization Members
drop policy if exists "org_members_select" on public.organization_members;
create policy "org_members_select"
  on public.organization_members
  for select
  using (true);

drop policy if exists "org_members_insert" on public.organization_members;
create policy "org_members_insert"
  on public.organization_members
  for insert
  with check (
    public.is_admin() or public.is_org_officer(organization_id)
  );

drop policy if exists "org_members_update" on public.organization_members;
create policy "org_members_update"
  on public.organization_members
  for update
  using (
    public.is_admin() or public.is_org_officer(organization_id)
  )
  with check (
    public.is_admin() or public.is_org_officer(organization_id)
  );

drop policy if exists "org_members_delete" on public.organization_members;
create policy "org_members_delete"
  on public.organization_members
  for delete
  using (
    public.is_admin() or public.is_org_officer(organization_id) or auth.uid() = user_id
  );

-- Venues
drop policy if exists "venues_select" on public.venues;
create policy "venues_select"
  on public.venues
  for select
  using (is_active = true or public.is_admin());

drop policy if exists "venues_insert" on public.venues;
create policy "venues_insert"
  on public.venues
  for insert
  with check (public.is_admin());

drop policy if exists "venues_update" on public.venues;
create policy "venues_update"
  on public.venues
  for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "venues_delete" on public.venues;
create policy "venues_delete"
  on public.venues
  for delete
  using (public.is_admin());

-- Profiles
drop policy if exists "profiles_select_policy" on public.profiles;
create policy "profiles_select_policy"
  on public.profiles
  for select
  using (
    auth.uid() = id
    or public.is_admin()
    or exists (
      select 1 from public.organization_members my_om
      join public.organization_members other_om on other_om.organization_id = my_om.organization_id
      where my_om.user_id = auth.uid() and other_om.user_id = public.profiles.id
    )
  );

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin"
  on public.profiles
  for update
  using (auth.uid() = id or public.is_admin())
  with check (
    public.is_admin() or (
      auth.uid() = id and role = (select p.role from public.profiles p where p.id = auth.uid())
    )
  );

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
  on public.profiles
  for insert
  with check (auth.uid() = id or public.is_admin());

-- ---------------------------------------------------------------------------
-- 9. Trigger for Auto-Creating Profiles on Signup
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_role  public.user_role;
  v_name  text;
  v_school_id text;
begin
  select count(*) into v_count from public.profiles;

  -- First registered user becomes superadmin
  if v_count = 0 then
    v_role := 'superadmin';
  else
    v_role := coalesce(
      (new.raw_user_meta_data->>'role')::public.user_role,
      'student'::public.user_role
    );
    -- Enforce that self-registered users cannot grant themselves superadmin or student_affairs
    if v_role in ('superadmin', 'student_affairs') then
      v_role := 'student';
    end if;
  end if;

  v_name := coalesce(
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  v_school_id := new.raw_user_meta_data->>'school_id';

  insert into public.profiles (id, role, school_id, display_name)
  values (new.id, v_role, v_school_id, v_name)
  on conflict (id) do update
  set
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    school_id = coalesce(excluded.school_id, public.profiles.school_id);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
