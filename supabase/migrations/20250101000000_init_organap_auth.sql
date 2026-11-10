-- =============================================================================
-- OrGanap — Dynamic Django-Style Groups & Permissions Architecture
--
-- Features:
-- 1. Institutional-agnostic design (no hardcoded school domains or static roles).
-- 2. Fully dynamic Django-style Permission & Group model:
--    - permissions (code, name, module, description)
--    - groups (name, description)
--    - group_permissions (group_id, permission_id)
--    - user_groups (user_id, group_id)
--    - user_permissions (user_id, permission_id) for direct user perms
--    - profiles (is_superuser, is_staff, is_active, display_name, school_id)
-- 3. High-performance Security Definer helper functions:
--    - has_perm(perm_code, [user_id])
--    - has_any_perm(perm_codes[], [user_id])
--    - is_superuser([user_id])
--    - is_staff([user_id])
--    - get_user_permissions([user_id])
--    - get_user_groups([user_id])
-- 4. Automated first-user superuser promotion + default "Students" group assignment.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------------

do $$
begin
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
-- 2. Permissions Table (Django auth_permission equivalent)
-- ---------------------------------------------------------------------------

create table if not exists public.permissions (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  name        text not null,
  module      text not null,
  description text,
  created_at  timestamptz not null default now()
);

create index if not exists permissions_module_idx on public.permissions (module);
create index if not exists permissions_code_idx on public.permissions (code);

alter table public.permissions enable row level security;
grant select on public.permissions to anon, authenticated;
grant insert, update, delete on public.permissions to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Groups Table (Django auth_group equivalent)
-- ---------------------------------------------------------------------------

create table if not exists public.groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists groups_name_idx on public.groups (name);

alter table public.groups enable row level security;
grant select on public.groups to anon, authenticated;
grant insert, update, delete on public.groups to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Group Permissions (Django auth_group_permissions equivalent)
-- ---------------------------------------------------------------------------

create table if not exists public.group_permissions (
  group_id      uuid not null references public.groups(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (group_id, permission_id)
);

alter table public.group_permissions enable row level security;
grant select on public.group_permissions to anon, authenticated;
grant insert, update, delete on public.group_permissions to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Profiles Table (Django User model attributes)
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  school_id    text,
  avatar_url   text,
  is_superuser boolean not null default false,
  is_staff     boolean not null default false,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create unique index if not exists profiles_school_id_idx
  on public.profiles (lower(school_id))
  where school_id is not null;

create index if not exists profiles_is_superuser_idx on public.profiles (is_superuser);
create index if not exists profiles_is_staff_idx on public.profiles (is_staff);

alter table public.profiles enable row level security;
grant select, insert, update on public.profiles to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. User Groups (Django auth_user_groups equivalent)
-- ---------------------------------------------------------------------------

create table if not exists public.user_groups (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  group_id   uuid not null references public.groups(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, group_id)
);

create index if not exists user_groups_user_id_idx on public.user_groups (user_id);
create index if not exists user_groups_group_id_idx on public.user_groups (group_id);

alter table public.user_groups enable row level security;
grant select on public.user_groups to anon, authenticated;
grant insert, update, delete on public.user_groups to authenticated;

-- ---------------------------------------------------------------------------
-- 7. User Direct Permissions (Django auth_user_user_permissions equivalent)
-- ---------------------------------------------------------------------------

create table if not exists public.user_permissions (
  user_id       uuid not null references public.profiles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (user_id, permission_id)
);

create index if not exists user_permissions_user_id_idx on public.user_permissions (user_id);

alter table public.user_permissions enable row level security;
grant select on public.user_permissions to anon, authenticated;
grant insert, update, delete on public.user_permissions to authenticated;

-- ---------------------------------------------------------------------------
-- 8. Organizations Table
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
-- 9. Organization Memberships Table
-- ---------------------------------------------------------------------------

create table if not exists public.organization_members (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  position_title  text,
  is_officer      boolean not null default false,
  is_adviser      boolean not null default false,
  created_at      timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index if not exists org_members_user_id_idx on public.organization_members (user_id);
create index if not exists org_members_org_id_idx on public.organization_members (organization_id);

alter table public.organization_members enable row level security;
grant select on public.organization_members to anon, authenticated;
grant insert, update, delete on public.organization_members to authenticated;

-- ---------------------------------------------------------------------------
-- 10. Venues Table
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
-- 11. Dynamic System Settings (Institution-Agnostic)
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

-- ---------------------------------------------------------------------------
-- 12. Security Definer Helper Functions (Django RBAC Logic)
-- ---------------------------------------------------------------------------

-- Check if user is superuser (bypasses all permission checks)
create or replace function public.is_superuser(p_user_id uuid default auth.uid())
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select is_superuser from public.profiles where id = p_user_id and is_active = true),
    false
  );
$$;

-- Check if user is staff (can access administrative areas)
create or replace function public.is_staff(p_user_id uuid default auth.uid())
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select (is_staff or is_superuser) from public.profiles where id = p_user_id and is_active = true),
    false
  );
$$;

-- Core Django-style permission check: user.has_perm(codename)
create or replace function public.has_perm(p_code text, p_user_id uuid default auth.uid())
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  -- 1. Superusers hold all permissions
  select exists (
    select 1 from public.profiles
    where id = p_user_id and is_superuser = true and is_active = true
  )
  -- 2. Direct user permissions
  or exists (
    select 1
    from public.user_permissions up
    join public.permissions p on p.id = up.permission_id
    join public.profiles prof on prof.id = up.user_id
    where up.user_id = p_user_id
      and p.code = p_code
      and prof.is_active = true
  )
  -- 3. Group permissions
  or exists (
    select 1
    from public.user_groups ug
    join public.group_permissions gp on gp.group_id = ug.group_id
    join public.permissions p on p.id = gp.permission_id
    join public.profiles prof on prof.id = ug.user_id
    where ug.user_id = p_user_id
      and p.code = p_code
      and prof.is_active = true
  );
$$;

-- Check if user has ANY of the specified permissions
create or replace function public.has_any_perm(p_codes text[], p_user_id uuid default auth.uid())
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from unnest(p_codes) as c where public.has_perm(c, p_user_id)
  );
$$;

-- Retrieve list of effective permissions for a user
create or replace function public.get_user_permissions(p_user_id uuid default auth.uid())
returns table (permission_code text)
language sql
security definer
stable
set search_path = public
as $$
  -- If superuser, return all active permission codes
  select code from public.permissions
  where exists (
    select 1 from public.profiles where id = p_user_id and is_superuser = true and is_active = true
  )
  union
  -- Direct user permissions
  select p.code
  from public.user_permissions up
  join public.permissions p on p.id = up.permission_id
  where up.user_id = p_user_id
  union
  -- Group permissions
  select p.code
  from public.user_groups ug
  join public.group_permissions gp on gp.group_id = ug.group_id
  join public.permissions p on p.id = gp.permission_id
  where ug.user_id = p_user_id;
$$;

-- Retrieve list of groups for a user
create or replace function public.get_user_groups(p_user_id uuid default auth.uid())
returns table (group_id uuid, group_name text)
language sql
security definer
stable
set search_path = public
as $$
  select g.id as group_id, g.name as group_name
  from public.user_groups ug
  join public.groups g on g.id = ug.group_id
  where ug.user_id = p_user_id;
$$;

-- Organization officer check
create or replace function public.is_org_officer(p_org_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.is_superuser(p_user_id)
  or public.has_perm('organizations.manage_all', p_user_id)
  or exists (
    select 1 from public.organization_members om
    where om.organization_id = p_org_id
      and om.user_id = p_user_id
      and om.is_officer = true
  );
$$;

-- Organization adviser check
create or replace function public.is_org_adviser(p_org_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.is_superuser(p_user_id)
  or exists (
    select 1 from public.organization_members om
    where om.organization_id = p_org_id
      and om.user_id = p_user_id
      and om.is_adviser = true
  );
$$;

-- ---------------------------------------------------------------------------
-- 13. Row Level Security Policies
-- ---------------------------------------------------------------------------

-- System Settings
drop policy if exists "settings_select" on public.system_settings;
create policy "settings_select"
  on public.system_settings
  for select
  using (true);

drop policy if exists "settings_manage" on public.system_settings;
create policy "settings_manage"
  on public.system_settings
  for all
  using (public.has_perm('settings.manage'))
  with check (public.has_perm('settings.manage'));

-- Permissions
drop policy if exists "permissions_select" on public.permissions;
create policy "permissions_select"
  on public.permissions
  for select
  using (true);

drop policy if exists "permissions_manage" on public.permissions;
create policy "permissions_manage"
  on public.permissions
  for all
  using (public.is_superuser())
  with check (public.is_superuser());

-- Groups
drop policy if exists "groups_select" on public.groups;
create policy "groups_select"
  on public.groups
  for select
  using (true);

drop policy if exists "groups_manage" on public.groups;
create policy "groups_manage"
  on public.groups
  for all
  using (public.has_perm('groups.manage'))
  with check (public.has_perm('groups.manage'));

-- Group Permissions
drop policy if exists "group_permissions_select" on public.group_permissions;
create policy "group_permissions_select"
  on public.group_permissions
  for select
  using (true);

drop policy if exists "group_permissions_manage" on public.group_permissions;
create policy "group_permissions_manage"
  on public.group_permissions
  for all
  using (public.has_perm('groups.manage'))
  with check (public.has_perm('groups.manage'));

-- User Groups
drop policy if exists "user_groups_select" on public.user_groups;
create policy "user_groups_select"
  on public.user_groups
  for select
  using (auth.uid() = user_id or public.has_perm('users.manage') or public.is_staff());

drop policy if exists "user_groups_manage" on public.user_groups;
create policy "user_groups_manage"
  on public.user_groups
  for all
  using (public.has_perm('users.manage'))
  with check (public.has_perm('users.manage'));

-- User Permissions
drop policy if exists "user_permissions_select" on public.user_permissions;
create policy "user_permissions_select"
  on public.user_permissions
  for select
  using (auth.uid() = user_id or public.has_perm('users.manage') or public.is_staff());

drop policy if exists "user_permissions_manage" on public.user_permissions;
create policy "user_permissions_manage"
  on public.user_permissions
  for all
  using (public.has_perm('users.manage'))
  with check (public.has_perm('users.manage'));

-- Profiles
drop policy if exists "profiles_select_policy" on public.profiles;
create policy "profiles_select_policy"
  on public.profiles
  for select
  using (
    auth.uid() = id
    or public.is_staff()
    or public.has_perm('users.view')
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
  using (auth.uid() = id or public.has_perm('users.manage'))
  with check (
    public.is_superuser() or (
      -- Normal users cannot elevate themselves to is_superuser or is_staff
      auth.uid() = id
      and is_superuser = (select p.is_superuser from public.profiles p where p.id = auth.uid())
      and is_staff = (select p.is_staff from public.profiles p where p.id = auth.uid())
    ) or (
      -- Staff with users.manage can edit users but cannot create superusers unless they are superusers themselves
      public.has_perm('users.manage')
      and (not is_superuser or public.is_superuser())
    )
  );

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
  on public.profiles
  for insert
  with check (auth.uid() = id or public.has_perm('users.manage'));

-- Organizations
drop policy if exists "organizations_select" on public.organizations;
create policy "organizations_select"
  on public.organizations
  for select
  using (is_active = true or public.has_perm('organizations.view'));

drop policy if exists "organizations_insert" on public.organizations;
create policy "organizations_insert"
  on public.organizations
  for insert
  with check (public.has_perm('organizations.create'));

drop policy if exists "organizations_update" on public.organizations;
create policy "organizations_update"
  on public.organizations
  for update
  using (public.has_perm('organizations.change') or public.is_org_officer(id))
  with check (public.has_perm('organizations.change') or public.is_org_officer(id));

drop policy if exists "organizations_delete" on public.organizations;
create policy "organizations_delete"
  on public.organizations
  for delete
  using (public.has_perm('organizations.delete'));

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
    public.has_perm('organizations.manage_members') or public.is_org_officer(organization_id)
  );

drop policy if exists "org_members_update" on public.organization_members;
create policy "org_members_update"
  on public.organization_members
  for update
  using (
    public.has_perm('organizations.manage_members') or public.is_org_officer(organization_id)
  )
  with check (
    public.has_perm('organizations.manage_members') or public.is_org_officer(organization_id)
  );

drop policy if exists "org_members_delete" on public.organization_members;
create policy "org_members_delete"
  on public.organization_members
  for delete
  using (
    public.has_perm('organizations.manage_members') or public.is_org_officer(organization_id) or auth.uid() = user_id
  );

-- Venues
drop policy if exists "venues_select" on public.venues;
create policy "venues_select"
  on public.venues
  for select
  using (is_active = true or public.has_perm('venues.view'));

drop policy if exists "venues_insert" on public.venues;
create policy "venues_insert"
  on public.venues
  for insert
  with check (public.has_perm('venues.create'));

drop policy if exists "venues_update" on public.venues;
create policy "venues_update"
  on public.venues
  for update
  using (public.has_perm('venues.change'))
  with check (public.has_perm('venues.change'));

drop policy if exists "venues_delete" on public.venues;
create policy "venues_delete"
  on public.venues
  for delete
  using (public.has_perm('venues.delete'));

-- ---------------------------------------------------------------------------
-- 14. Trigger for Auto-Creating Profiles on Signup
-- ---------------------------------------------------------------------------

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
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  v_school_id := new.raw_user_meta_data->>'school_id';

  insert into public.profiles (id, display_name, school_id, is_superuser, is_staff)
  values (new.id, v_name, v_school_id, v_is_superuser, v_is_staff)
  on conflict (id) do update
  set
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    school_id = coalesce(excluded.school_id, public.profiles.school_id);

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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 15. Standard Permissions & Default Dynamic Groups Seed
-- ---------------------------------------------------------------------------

-- Insert Granular Django-style Permissions
insert into public.permissions (code, name, module, description)
values
  -- Organizations
  ('organizations.view', 'Can view organizations', 'organizations', 'Browse recognized campus student organizations'),
  ('organizations.create', 'Can create organizations', 'organizations', 'Register new student organizations'),
  ('organizations.change', 'Can edit organizations', 'organizations', 'Update organization details, logos, and descriptions'),
  ('organizations.delete', 'Can delete organizations', 'organizations', 'De-recognize or remove student organizations'),
  ('organizations.manage_members', 'Can manage roster', 'organizations', 'Assign, update, or remove members and officers'),

  -- Venues
  ('venues.view', 'Can view campus venues', 'venues', 'Browse facilities and capacity requirements'),
  ('venues.create', 'Can create venues', 'venues', 'Register new campus event spaces'),
  ('venues.change', 'Can edit venues', 'venues', 'Update venue availability and capacity'),
  ('venues.delete', 'Can delete venues', 'venues', 'Archive or delete campus event venues'),

  -- Event Proposals
  ('proposals.view', 'Can view proposals', 'proposals', 'Inspect event proposal submissions and status history'),
  ('proposals.create', 'Can draft event proposals', 'proposals', 'Draft and submit new event proposal documents'),
  ('proposals.change', 'Can edit event proposals', 'proposals', 'Modify draft and returned event proposals'),
  ('proposals.endorse', 'Can endorse proposals', 'proposals', 'Review and provide adviser stage endorsement'),
  ('proposals.approve', 'Can approve proposals', 'proposals', 'Final Student Affairs review and venue reservation approval'),
  ('proposals.delete', 'Can cancel proposals', 'proposals', 'Cancel or archive event proposal submissions'),

  -- Campus Events & Registrations
  ('events.view', 'Can browse approved events', 'events', 'Browse approved public campus event listings'),
  ('events.register', 'Can register for events', 'events', 'Sign up and generate digital tickets for approved events'),
  ('events.cancel_registration', 'Can cancel event registration', 'events', 'Withdraw from event participation'),

  -- Digital Attendance & Verification
  ('attendance.view', 'Can view attendance logs', 'attendance', 'View attendee lists and attendance percentages'),
  ('attendance.verify', 'Can scan and verify attendance', 'attendance', 'Scan attendee QR codes and log verified check-ins'),

  -- Reports & Analytics
  ('reports.view', 'Can view reports', 'reports', 'Access participation analytics and summary dashboards'),
  ('reports.export', 'Can export reports', 'reports', 'Generate CSV/PDF participation and attendance extracts'),

  -- User & Group Administration
  ('users.view', 'Can view user directory', 'users', 'Search and review campus user profiles'),
  ('users.manage', 'Can manage users and memberships', 'users', 'Assign groups, activate/deactivate accounts, and edit profiles'),
  ('groups.view', 'Can view permission groups', 'groups', 'Review group definitions and permission matrices'),
  ('groups.manage', 'Can configure groups and permissions', 'groups', 'Create new groups and grant/revoke permissions'),

  -- System Configuration
  ('settings.manage', 'Can manage system settings', 'settings', 'Configure institutional term parameters and policies')
on conflict (code) do update set
  name = excluded.name,
  module = excluded.module,
  description = excluded.description;

-- Insert Standard Dynamic Groups
insert into public.groups (name, description)
values
  ('Student Affairs', 'Institutional administrators responsible for organization recognition, venue oversight, and final proposal approval.'),
  ('Faculty Advisers', 'Academic or organization advisers responsible for vetting and endorsing event proposals.'),
  ('Student Organization Officers', 'Designated organization leaders responsible for drafting event proposals, managing rosters, and verifying attendance.'),
  ('Students', 'Enrolled students eligible to browse campus events, register, and receive digital entry passes.')
on conflict (name) do update set
  description = excluded.description;

-- Wire Permissions to Groups:
-- 1. "Student Affairs" Group Permissions
insert into public.group_permissions (group_id, permission_id)
select g.id, p.id
from public.groups g, public.permissions p
where g.name = 'Student Affairs'
  and p.code in (
    'organizations.view', 'organizations.create', 'organizations.change', 'organizations.delete', 'organizations.manage_members',
    'venues.view', 'venues.create', 'venues.change', 'venues.delete',
    'proposals.view', 'proposals.approve',
    'events.view',
    'attendance.view',
    'reports.view', 'reports.export',
    'users.view', 'users.manage',
    'groups.view',
    'settings.manage'
  )
on conflict do nothing;

-- 2. "Faculty Advisers" Group Permissions
insert into public.group_permissions (group_id, permission_id)
select g.id, p.id
from public.groups g, public.permissions p
where g.name = 'Faculty Advisers'
  and p.code in (
    'organizations.view',
    'proposals.view', 'proposals.endorse',
    'events.view',
    'attendance.view',
    'reports.view'
  )
on conflict do nothing;

-- 3. "Student Organization Officers" Group Permissions
insert into public.group_permissions (group_id, permission_id)
select g.id, p.id
from public.groups g, public.permissions p
where g.name = 'Student Organization Officers'
  and p.code in (
    'organizations.view', 'organizations.manage_members',
    'venues.view',
    'proposals.view', 'proposals.create', 'proposals.change', 'proposals.delete',
    'events.view',
    'attendance.view', 'attendance.verify',
    'reports.view', 'reports.export'
  )
on conflict do nothing;

-- 4. "Students" Group Permissions
insert into public.group_permissions (group_id, permission_id)
select g.id, p.id
from public.groups g, public.permissions p
where g.name = 'Students'
  and p.code in (
    'organizations.view',
    'events.view', 'events.register', 'events.cancel_registration'
  )
on conflict do nothing;
