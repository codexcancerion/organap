-- =============================================================================
-- Migration: 20261111090000_fix_profile_rls_recursion.sql
-- Fix infinite recursion in public.profiles and auth helper functions by:
-- 1. Converting SECURITY DEFINER SQL functions to PL/pgSQL (prevents query inlining)
-- 2. Setting profiles SELECT policy to allow standard university directory reads
-- 3. Hardening profiles UPDATE policy using PL/pgSQL helper checks
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Convert Security Definer Functions to PL/pgSQL (Prevents RLS inlining)
-- -----------------------------------------------------------------------------

create or replace function public.is_superuser(p_user_id uuid default auth.uid())
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_res boolean;
begin
  if p_user_id is null then
    return false;
  end if;
  select is_superuser into v_res
  from public.profiles
  where id = p_user_id and is_active = true;
  return coalesce(v_res, false);
end;
$$;

create or replace function public.is_staff(p_user_id uuid default auth.uid())
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_res boolean;
begin
  if p_user_id is null then
    return false;
  end if;
  select (is_staff or is_superuser) into v_res
  from public.profiles
  where id = p_user_id and is_active = true;
  return coalesce(v_res, false);
end;
$$;

create or replace function public.has_perm(p_code text, p_user_id uuid default auth.uid())
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if p_user_id is null then
    return false;
  end if;

  -- 1. Superusers hold all permissions
  if exists (
    select 1 from public.profiles
    where id = p_user_id and is_superuser = true and is_active = true
  ) then
    return true;
  end if;

  -- 2. Direct user permissions
  if exists (
    select 1
    from public.user_permissions up
    join public.permissions p on p.id = up.permission_id
    join public.profiles prof on prof.id = up.user_id
    where up.user_id = p_user_id
      and p.code = p_code
      and prof.is_active = true
  ) then
    return true;
  end if;

  -- 3. Group permissions
  if exists (
    select 1
    from public.user_groups ug
    join public.group_permissions gp on gp.group_id = ug.group_id
    join public.permissions p on p.id = gp.permission_id
    join public.profiles prof on prof.id = ug.user_id
    where ug.user_id = p_user_id
      and p.code = p_code
      and prof.is_active = true
  ) then
    return true;
  end if;

  return false;
end;
$$;

create or replace function public.has_any_perm(p_codes text[], p_user_id uuid default auth.uid())
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if p_user_id is null or p_codes is null then
    return false;
  end if;
  return exists (
    select 1 from unnest(p_codes) as c where public.has_perm(c, p_user_id)
  );
end;
$$;

create or replace function public.is_org_officer(p_org_id uuid, p_user_id uuid default auth.uid())
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if p_user_id is null then
    return false;
  end if;

  if public.is_superuser(p_user_id) then
    return true;
  end if;

  if public.has_perm('organizations.manage_all', p_user_id) then
    return true;
  end if;

  return exists (
    select 1 from public.organization_members om
    where om.organization_id = p_org_id
      and om.user_id = p_user_id
      and om.is_officer = true
  );
end;
$$;

create or replace function public.is_org_adviser(p_org_id uuid, p_user_id uuid default auth.uid())
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if p_user_id is null then
    return false;
  end if;

  if public.is_superuser(p_user_id) then
    return true;
  end if;

  if public.has_perm('organizations.manage_all', p_user_id) then
    return true;
  end if;

  return exists (
    select 1 from public.organization_members om
    where om.organization_id = p_org_id
      and om.user_id = p_user_id
      and om.is_adviser = true
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- 2. Non-Recursive Profiles RLS Policies
-- -----------------------------------------------------------------------------

-- Select policy: University profiles are public directory records
drop policy if exists "profiles_select_policy" on public.profiles;
create policy "profiles_select_policy"
  on public.profiles
  for select
  using (true);

-- Update policy: User self-edit, staff, superuser, or users.manage
drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin"
  on public.profiles
  for update
  using (
    auth.uid() = id
    or public.is_superuser()
    or public.is_staff()
    or public.has_perm('users.manage')
  )
  with check (
    public.is_superuser()
    or (
      -- Normal users updating their own profile cannot escalate privileges
      auth.uid() = id
      and is_superuser = public.is_superuser(id)
      and (is_staff = public.is_staff(id) or not is_staff)
    )
    or (
      -- Staff with users.manage can manage users, but cannot create superusers unless superuser themselves
      (public.has_perm('users.manage') or public.is_staff())
      and (not is_superuser or public.is_superuser())
    )
  );

-- Insert policy
drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
  on public.profiles
  for insert
  with check (
    auth.uid() = id
    or public.is_superuser()
    or public.is_staff()
    or public.has_perm('users.manage')
  );
