-- =============================================================================
-- OrGanap — Authentication, Profile, and Organization Bootstrap (Phase 1)
--
-- 1. Creates `user_role` enum ('superadmin', 'student_affairs', 'adviser', 'officer', 'student').
-- 2. Creates `public.profiles` mirroring `auth.users` 1:1.
-- 3. Creates `public.organizations` and `public.organization_members`.
-- 4. Creates `public.venues` for institutional venue booking.
-- 5. Enables Row Level Security (RLS) with role-aware policies.
-- 6. Trigger on `auth.users` auto-populates `public.profiles` on signup.
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
end
$$;

-- ---------------------------------------------------------------------------
-- 2. Profiles Table
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  role         public.user_role not null default 'student',
  school_id    text unique,
  display_name text not null default '',
  avatar_url   text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

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
  created_at  timestamptz not null default now()
);

alter table public.organizations enable row level security;
grant select on public.organizations to anon, authenticated;
grant insert, update, delete on public.organizations to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Organization Memberships
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
-- 6. Row Level Security Policies
-- ---------------------------------------------------------------------------

-- Profiles: Users can read their own profile, or advisers/officers/SA can read profiles
drop policy if exists "profiles_select_policy" on public.profiles;
create policy "profiles_select_policy"
  on public.profiles
  for select
  using (
    auth.uid() = id
    or exists (
      select 1 from public.profiles self
      where self.id = auth.uid()
      and self.role in ('superadmin', 'student_affairs', 'adviser', 'officer')
    )
  );

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- Organizations: Active organizations are readable by everyone
drop policy if exists "organizations_select_active" on public.organizations;
create policy "organizations_select_active"
  on public.organizations
  for select
  using (is_active = true or auth.uid() is not null);

-- Venues: Active venues readable by everyone
drop policy if exists "venues_select_active" on public.venues;
create policy "venues_select_active"
  on public.venues
  for select
  using (is_active = true or auth.uid() is not null);

-- Organization Members: Read memberships
drop policy if exists "organization_members_select" on public.organization_members;
create policy "organization_members_select"
  on public.organization_members
  for select
  using (true);

-- ---------------------------------------------------------------------------
-- 7. New User Trigger
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
    -- Read optional role requested from raw_user_meta_data
    v_role := coalesce(
      (new.raw_user_meta_data->>'role')::public.user_role,
      'student'::public.user_role
    );
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
