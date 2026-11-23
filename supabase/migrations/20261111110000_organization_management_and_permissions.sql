-- =============================================================================
-- Migration: 20261111110000_organization_management_and_permissions.sql
-- Description:
--   1. Add / normalize granular organization permissions:
--      - organizations.view (canViewOrganizations)
--      - organizations.change_own (canUpdateOwnOrganization: org info, add/remove members, change member positions, change leaders; cannot change self if current leader)
--      - organizations.change_all (canUpdateAllOrganizations: can update any organization)
--      - organizations.delete (canDeleteOrganizations)
--      - organizations.create (create organization)
--   2. Map permissions to default groups (Student Affairs, Faculty Advisers, Officers, Students)
--   3. Create stored procedures for secure server-side mutations:
--      - public.add_organization_member(p_org_id, p_user_id, p_position, p_is_officer, p_is_adviser, p_caller_id)
--      - public.remove_organization_member(p_member_id, p_caller_id)
--      - public.update_organization_leaders(p_org_id, p_governor_id, p_adviser_id, p_caller_id)
--      - public.update_organization_info(p_org_id, p_name, p_acronym, p_slug, p_category, p_description, p_logo_url, p_is_active, p_caller_id)
--      - public.create_organization(p_name, p_acronym, p_slug, p_category, p_description, p_logo_url, p_governor_id, p_adviser_id, p_caller_id)
--      - public.delete_organization(p_org_id, p_caller_id)
--   4. Update RLS policies on public.organizations and public.organization_members
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Insert & Sync Permissions
-- -----------------------------------------------------------------------------

insert into public.permissions (code, name, module, description)
values
  ('organizations.view', 'Can view organizations', 'organizations', 'Browse recognized student organizations'),
  ('organizations.create', 'Can create organizations', 'organizations', 'Register new student organizations'),
  ('organizations.change_own', 'Can update own organization', 'organizations', 'Governors and advisers can update organization profile, roster, member positions, and leadership (except self-removal)'),
  ('organizations.change_all', 'Can update all organizations', 'organizations', 'Student affairs and administrators can update any organization, members, and leadership'),
  ('organizations.delete', 'Can delete organizations', 'organizations', 'Institutional administrators can de-recognize and delete organizations')
on conflict (code) do update set
  name = excluded.name,
  module = excluded.module,
  description = excluded.description;

-- Ensure legacy organizations.change also maps to change_all
insert into public.permissions (code, name, module, description)
values ('organizations.change', 'Can edit organizations (all)', 'organizations', 'Legacy alias for editing any organization')
on conflict (code) do nothing;

-- -----------------------------------------------------------------------------
-- 2. Wire Permissions to Default Groups
-- -----------------------------------------------------------------------------

-- Student Affairs gets all organization permissions
insert into public.group_permissions (group_id, permission_id)
select g.id, p.id
from public.groups g, public.permissions p
where g.name = 'Student Affairs'
  and p.code in (
    'organizations.view',
    'organizations.create',
    'organizations.change_own',
    'organizations.change_all',
    'organizations.change',
    'organizations.delete',
    'organizations.manage_members'
  )
on conflict do nothing;

-- Faculty Advisers get view and own organization update
insert into public.group_permissions (group_id, permission_id)
select g.id, p.id
from public.groups g, public.permissions p
where g.name = 'Faculty Advisers'
  and p.code in (
    'organizations.view',
    'organizations.change_own'
  )
on conflict do nothing;

-- Student Organization Officers get view and own organization update
insert into public.group_permissions (group_id, permission_id)
select g.id, p.id
from public.groups g, public.permissions p
where g.name = 'Student Organization Officers'
  and p.code in (
    'organizations.view',
    'organizations.change_own'
  )
on conflict do nothing;

-- Students get view
insert into public.group_permissions (group_id, permission_id)
select g.id, p.id
from public.groups g, public.permissions p
where g.name = 'Students'
  and p.code in ('organizations.view')
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- 3. Helper Functions for Organization Authorization
-- -----------------------------------------------------------------------------

-- Can user update the specified organization?
create or replace function public.can_user_update_org(
  p_org_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org public.organizations%rowtype;
begin
  if p_user_id is null then
    return false;
  end if;

  if public.is_superuser(p_user_id) or public.is_staff(p_user_id) then
    return true;
  end if;

  if public.has_perm('organizations.change_all', p_user_id)
     or public.has_perm('organizations.change', p_user_id) then
    return true;
  end if;

  select * into v_org from public.organizations where id = p_org_id;
  if not found then
    return false;
  end if;

  -- If user has change_own permission, verify they are Governor or Adviser of this org
  if public.has_perm('organizations.change_own', p_user_id)
     or public.has_perm('organizations.manage_members', p_user_id) then
    if v_org.governor_id = p_user_id
       or v_org.adviser_id = p_user_id
       or public.is_org_adviser(p_org_id, p_user_id)
       or public.is_org_officer(p_org_id, p_user_id) then
      return true;
    end if;
  end if;

  -- Governor or Adviser direct ownership fallback
  if v_org.governor_id = p_user_id or v_org.adviser_id = p_user_id then
    return true;
  end if;

  return false;
end;
$$;

grant execute on function public.can_user_update_org to authenticated;

-- Can user delete the specified organization?
create or replace function public.can_user_delete_org(
  p_org_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null then
    return false;
  end if;

  if public.is_superuser(p_user_id) or public.is_staff(p_user_id) then
    return true;
  end if;

  if public.has_perm('organizations.delete', p_user_id) then
    return true;
  end if;

  return false;
end;
$$;

grant execute on function public.can_user_delete_org to authenticated;

-- -----------------------------------------------------------------------------
-- 4. Stored Procedures for Organization Management Actions
-- -----------------------------------------------------------------------------

-- 4.1 Update Member Position (Updated with change_all / change_own check)
create or replace function public.update_member_position(
  p_member_id uuid,
  p_position text,
  p_user_id uuid default auth.uid()
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member public.organization_members%rowtype;
begin
  if p_user_id is null then
    raise exception 'AUTHENTICATION_REQUIRED: Must be logged in';
  end if;

  select * into v_member
  from public.organization_members
  where id = p_member_id;

  if not found then
    raise exception 'NOT_FOUND: Organization member not found';
  end if;

  if not public.can_user_update_org(v_member.organization_id, p_user_id) then
    raise exception 'PERMISSION_DENIED: You do not have permission to edit member positions in this organization';
  end if;

  update public.organization_members
  set position = trim(p_position),
      position_title = trim(p_position)
  where id = p_member_id;

  return jsonb_build_object(
    'success', true,
    'member_id', p_member_id,
    'position', trim(p_position)
  );
end;
$$;

-- 4.2 Add Organization Member
create or replace function public.add_organization_member(
  p_org_id uuid,
  p_user_id uuid,
  p_position text default 'Member',
  p_is_officer boolean default false,
  p_is_adviser boolean default false,
  p_caller_id uuid default auth.uid()
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_id uuid;
begin
  if p_caller_id is null then
    raise exception 'AUTHENTICATION_REQUIRED: Must be logged in';
  end if;

  if not public.can_user_update_org(p_org_id, p_caller_id) then
    raise exception 'PERMISSION_DENIED: You do not have permission to add members to this organization';
  end if;

  insert into public.organization_members (
    organization_id,
    user_id,
    position,
    position_title,
    is_officer,
    is_adviser
  )
  values (
    p_org_id,
    p_user_id,
    coalesce(nullif(trim(p_position), ''), 'Member'),
    coalesce(nullif(trim(p_position), ''), 'Member'),
    p_is_officer,
    p_is_adviser
  )
  on conflict (organization_id, user_id) do update set
    position = excluded.position,
    position_title = excluded.position_title,
    is_officer = excluded.is_officer,
    is_adviser = excluded.is_adviser
  returning id into v_new_id;

  return jsonb_build_object(
    'success', true,
    'member_id', v_new_id
  );
end;
$$;

grant execute on function public.add_organization_member to authenticated;

-- 4.3 Remove Organization Member
create or replace function public.remove_organization_member(
  p_member_id uuid,
  p_caller_id uuid default auth.uid()
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member public.organization_members%rowtype;
  v_org public.organizations%rowtype;
begin
  if p_caller_id is null then
    raise exception 'AUTHENTICATION_REQUIRED: Must be logged in';
  end if;

  select * into v_member
  from public.organization_members
  where id = p_member_id;

  if not found then
    raise exception 'NOT_FOUND: Organization member not found';
  end if;

  select * into v_org
  from public.organizations
  where id = v_member.organization_id;

  if not public.can_user_update_org(v_member.organization_id, p_caller_id) then
    raise exception 'PERMISSION_DENIED: You do not have permission to remove members from this organization';
  end if;

  -- Rule: cannot remove leader directly without reassigning leader first
  if v_org.governor_id = v_member.user_id then
    raise exception 'LEADER_PROTECTED: This user is currently the Governor of the organization. Reassign the Governor before removing them from members.';
  end if;
  if v_org.adviser_id = v_member.user_id then
    raise exception 'LEADER_PROTECTED: This user is currently the Faculty Adviser of the organization. Reassign the Adviser before removing them from members.';
  end if;

  delete from public.organization_members where id = p_member_id;

  return jsonb_build_object('success', true, 'member_id', p_member_id);
end;
$$;

grant execute on function public.remove_organization_member to authenticated;

-- 4.4 Update Organization Leaders (cannot change self if current leader unless admin/change_all)
create or replace function public.update_organization_leaders(
  p_org_id uuid,
  p_governor_id uuid,
  p_adviser_id uuid,
  p_caller_id uuid default auth.uid()
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org public.organizations%rowtype;
  v_is_all_admin boolean;
begin
  if p_caller_id is null then
    raise exception 'AUTHENTICATION_REQUIRED: Must be logged in';
  end if;

  select * into v_org from public.organizations where id = p_org_id;
  if not found then
    raise exception 'NOT_FOUND: Organization not found';
  end if;

  v_is_all_admin := public.is_superuser(p_caller_id)
    or public.is_staff(p_caller_id)
    or public.has_perm('organizations.change_all', p_caller_id)
    or public.has_perm('organizations.change', p_caller_id);

  if not (v_is_all_admin or public.can_user_update_org(p_org_id, p_caller_id)) then
    raise exception 'PERMISSION_DENIED: You do not have permission to update leadership for this organization';
  end if;

  -- Business Rule: A current leader cannot change or remove self unless caller is institutional admin (change_all / superuser / staff)
  if not v_is_all_admin then
    if v_org.governor_id = p_caller_id and (p_governor_id is null or p_governor_id <> p_caller_id) then
      raise exception 'CANNOT_CHANGE_SELF: As the current Governor, you cannot change or reassign your own leadership role. Please contact Student Affairs.';
    end if;
    if v_org.adviser_id = p_caller_id and (p_adviser_id is null or p_adviser_id <> p_caller_id) then
      raise exception 'CANNOT_CHANGE_SELF: As the current Faculty Adviser, you cannot change or reassign your own leadership role. Please contact Student Affairs.';
    end if;
  end if;

  update public.organizations
  set governor_id = p_governor_id,
      adviser_id = p_adviser_id,
      updated_at = now()
  where id = p_org_id;

  -- Ensure new Governor is also an officer member
  if p_governor_id is not null then
    insert into public.organization_members (organization_id, user_id, position, position_title, is_officer, is_adviser)
    values (p_org_id, p_governor_id, 'Governor / President', 'Governor / President', true, false)
    on conflict (organization_id, user_id) do update set
      is_officer = true,
      position = case when organization_members.position is null or organization_members.position = 'Member' then 'Governor / President' else organization_members.position end;
  end if;

  -- Ensure new Adviser is also an adviser member
  if p_adviser_id is not null then
    insert into public.organization_members (organization_id, user_id, position, position_title, is_officer, is_adviser)
    values (p_org_id, p_adviser_id, 'Faculty Adviser', 'Faculty Adviser', false, true)
    on conflict (organization_id, user_id) do update set
      is_adviser = true,
      position = case when organization_members.position is null or organization_members.position = 'Member' then 'Faculty Adviser' else organization_members.position end;
  end if;

  return jsonb_build_object('success', true, 'organization_id', p_org_id);
end;
$$;

grant execute on function public.update_organization_leaders to authenticated;

-- 4.5 Update Organization Details (name, acronym, category, etc.)
create or replace function public.update_organization_info(
  p_org_id uuid,
  p_name text,
  p_acronym text,
  p_slug text,
  p_category text,
  p_description text default null,
  p_logo_url text default null,
  p_is_active boolean default true,
  p_caller_id uuid default auth.uid()
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org public.organizations%rowtype;
begin
  if p_caller_id is null then
    raise exception 'AUTHENTICATION_REQUIRED: Must be logged in';
  end if;

  select * into v_org from public.organizations where id = p_org_id;
  if not found then
    raise exception 'NOT_FOUND: Organization not found';
  end if;

  if not public.can_user_update_org(p_org_id, p_caller_id) then
    raise exception 'PERMISSION_DENIED: You do not have permission to edit this organization';
  end if;

  update public.organizations
  set name = trim(p_name),
      acronym = trim(p_acronym),
      slug = trim(lower(p_slug)),
      category = trim(p_category),
      description = nullif(trim(p_description), ''),
      logo_url = nullif(trim(p_logo_url), ''),
      is_active = p_is_active,
      updated_at = now()
  where id = p_org_id;

  return jsonb_build_object('success', true, 'organization_id', p_org_id);
end;
$$;

grant execute on function public.update_organization_info to authenticated;

-- 4.6 Create Organization
create or replace function public.create_organization(
  p_name text,
  p_acronym text,
  p_slug text,
  p_category text,
  p_description text default null,
  p_logo_url text default null,
  p_governor_id uuid default null,
  p_adviser_id uuid default null,
  p_caller_id uuid default auth.uid()
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_org_id uuid;
begin
  if p_caller_id is null then
    raise exception 'AUTHENTICATION_REQUIRED: Must be logged in';
  end if;

  if not (
    public.is_superuser(p_caller_id)
    or public.is_staff(p_caller_id)
    or public.has_perm('organizations.create', p_caller_id)
  ) then
    raise exception 'PERMISSION_DENIED: You do not have permission to create student organizations';
  end if;

  insert into public.organizations (
    name,
    acronym,
    slug,
    category,
    description,
    logo_url,
    governor_id,
    adviser_id,
    is_active
  )
  values (
    trim(p_name),
    trim(p_acronym),
    trim(lower(p_slug)),
    trim(p_category),
    nullif(trim(p_description), ''),
    nullif(trim(p_logo_url), ''),
    p_governor_id,
    p_adviser_id,
    true
  )
  returning id into v_new_org_id;

  -- Add governor to membership if specified
  if p_governor_id is not null then
    insert into public.organization_members (
      organization_id, user_id, position, position_title, is_officer, is_adviser
    )
    values (
      v_new_org_id, p_governor_id, 'Governor / President', 'Governor / President', true, false
    )
    on conflict do nothing;
  end if;

  -- Add adviser to membership if specified
  if p_adviser_id is not null then
    insert into public.organization_members (
      organization_id, user_id, position, position_title, is_officer, is_adviser
    )
    values (
      v_new_org_id, p_adviser_id, 'Faculty Adviser', 'Faculty Adviser', false, true
    )
    on conflict do nothing;
  end if;

  return jsonb_build_object('success', true, 'organization_id', v_new_org_id);
end;
$$;

grant execute on function public.create_organization to authenticated;

-- 4.7 Delete Organization
create or replace function public.delete_organization(
  p_org_id uuid,
  p_caller_id uuid default auth.uid()
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_caller_id is null then
    raise exception 'AUTHENTICATION_REQUIRED: Must be logged in';
  end if;

  if not public.can_user_delete_org(p_org_id, p_caller_id) then
    raise exception 'PERMISSION_DENIED: You do not have permission to delete organizations';
  end if;

  delete from public.organizations where id = p_org_id;

  return jsonb_build_object('success', true, 'organization_id', p_org_id);
end;
$$;

grant execute on function public.delete_organization to authenticated;

-- -----------------------------------------------------------------------------
-- 5. RLS Policy Enhancements for public.organizations & organization_members
-- -----------------------------------------------------------------------------

drop policy if exists "organizations_select" on public.organizations;
create policy "organizations_select"
  on public.organizations
  for select
  using (true);

drop policy if exists "organizations_insert" on public.organizations;
create policy "organizations_insert"
  on public.organizations
  for insert
  with check (
    public.is_superuser()
    or public.is_staff()
    or public.has_perm('organizations.create')
  );

drop policy if exists "organizations_update" on public.organizations;
create policy "organizations_update"
  on public.organizations
  for update
  using (public.can_user_update_org(id));

drop policy if exists "organizations_delete" on public.organizations;
create policy "organizations_delete"
  on public.organizations
  for delete
  using (public.can_user_delete_org(id));

drop policy if exists "org_members_select" on public.organization_members;
create policy "org_members_select"
  on public.organization_members
  for select
  using (true);

drop policy if exists "org_members_insert" on public.organization_members;
create policy "org_members_insert"
  on public.organization_members
  for insert
  with check (public.can_user_update_org(organization_id));

drop policy if exists "org_members_update" on public.organization_members;
create policy "org_members_update"
  on public.organization_members
  for update
  using (public.can_user_update_org(organization_id));

drop policy if exists "org_members_delete" on public.organization_members;
create policy "org_members_delete"
  on public.organization_members
  for delete
  using (public.can_user_update_org(organization_id));

grant select, insert, update, delete on public.organizations to authenticated;
grant select, insert, update, delete on public.organization_members to authenticated;
