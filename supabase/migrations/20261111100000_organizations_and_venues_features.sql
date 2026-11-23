-- =============================================================================
-- Migration: 20261111100000_organizations_and_venues_features.sql
-- Link Governor, Adviser, and Members with editable positions to Organizations
-- Provide Stored Procedures and RLS for Organization & Venue Management
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Schema Alterations on public.organizations
-- -----------------------------------------------------------------------------

alter table public.organizations
  add column if not exists governor_id uuid references public.profiles(id) on delete set null,
  add column if not exists adviser_id uuid references public.profiles(id) on delete set null;

create index if not exists idx_organizations_governor on public.organizations(governor_id);
create index if not exists idx_organizations_adviser on public.organizations(adviser_id);

-- -----------------------------------------------------------------------------
-- 2. Schema Alterations on public.organization_members
-- -----------------------------------------------------------------------------

alter table public.organization_members
  add column if not exists position text;

-- Sync position with position_title
update public.organization_members
set position = coalesce(position_title, 'Member')
where position is null;

update public.organization_members
set position_title = position
where position_title is null and position is not null;

-- -----------------------------------------------------------------------------
-- 3. Stored Procedure: update_member_position (Governor & Adviser Only)
-- -----------------------------------------------------------------------------

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
  v_org public.organizations%rowtype;
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

  select * into v_org
  from public.organizations
  where id = v_member.organization_id;

  if not found then
    raise exception 'NOT_FOUND: Organization not found';
  end if;

  -- Only Governor, Adviser, or Staff/Superuser may edit positions
  if not (
    p_user_id = v_org.governor_id
    or p_user_id = v_org.adviser_id
    or public.is_org_adviser(v_org.id, p_user_id)
    or public.is_org_officer(v_org.id, p_user_id)
    or public.is_staff(p_user_id)
    or public.is_superuser(p_user_id)
    or public.has_perm('organizations.manage_members', p_user_id)
  ) then
    raise exception 'PERMISSION_DENIED: Only the organization Governor or Adviser may edit member positions';
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

grant execute on function public.update_member_position to authenticated;

-- -----------------------------------------------------------------------------
-- 4. RLS Policies on Organizations & Members
-- -----------------------------------------------------------------------------

drop policy if exists "organizations_select" on public.organizations;
create policy "organizations_select"
  on public.organizations
  for select
  using (true);

drop policy if exists "organizations_update" on public.organizations;
create policy "organizations_update"
  on public.organizations
  for update
  using (
    governor_id = auth.uid()
    or adviser_id = auth.uid()
    or public.is_org_officer(id)
    or public.is_org_adviser(id)
    or public.is_staff()
    or public.has_perm('organizations.change')
  );

drop policy if exists "org_members_select" on public.organization_members;
create policy "org_members_select"
  on public.organization_members
  for select
  using (true);

drop policy if exists "org_members_update" on public.organization_members;
create policy "org_members_update"
  on public.organization_members
  for update
  using (
    exists (
      select 1 from public.organizations o
      where o.id = organization_id
        and (
          o.governor_id = auth.uid()
          or o.adviser_id = auth.uid()
          or public.is_org_officer(o.id)
          or public.is_org_adviser(o.id)
          or public.is_staff()
          or public.has_perm('organizations.manage_members')
        )
    )
  );

drop policy if exists "org_members_insert" on public.organization_members;
create policy "org_members_insert"
  on public.organization_members
  for insert
  with check (
    exists (
      select 1 from public.organizations o
      where o.id = organization_id
        and (
          o.governor_id = auth.uid()
          or o.adviser_id = auth.uid()
          or public.is_org_officer(o.id)
          or public.is_org_adviser(o.id)
          or public.is_staff()
          or public.has_perm('organizations.manage_members')
        )
    )
  );

-- -----------------------------------------------------------------------------
-- 5. Seed Sample Leadership & Roster for Existing Organizations
-- -----------------------------------------------------------------------------

do $$
declare
  v_admin_id uuid;
  v_osas_id uuid;
  v_css_id uuid;
  v_jpia_id uuid;
  v_ssc_id uuid;
  v_ucg_id uuid;
  v_rcy_id uuid;
begin
  select id into v_admin_id from public.profiles where is_superuser = true limit 1;
  select id into v_osas_id from public.profiles where display_name ilike '%OSAS%' limit 1;

  select id into v_css_id from public.organizations where acronym = 'CSS' limit 1;
  select id into v_jpia_id from public.organizations where acronym = 'JPIA' limit 1;
  select id into v_ssc_id from public.organizations where acronym = 'SSC' limit 1;
  select id into v_ucg_id from public.organizations where acronym = 'UCG' limit 1;
  select id into v_rcy_id from public.organizations where acronym = 'RCY' limit 1;

  -- Link CSS Governor and Adviser
  if v_css_id is not null and v_admin_id is not null then
    update public.organizations
    set governor_id = v_admin_id,
        adviser_id = coalesce(v_osas_id, v_admin_id)
    where id = v_css_id;

    -- Add Governor as member
    insert into public.organization_members (organization_id, user_id, position, position_title, is_officer, is_adviser)
    values (v_css_id, v_admin_id, 'Governor / President', 'Governor / President', true, false)
    on conflict (organization_id, user_id) do update set
      position = excluded.position,
      position_title = excluded.position_title,
      is_officer = true;

    -- Add Adviser as member
    if v_osas_id is not null and v_osas_id <> v_admin_id then
      insert into public.organization_members (organization_id, user_id, position, position_title, is_officer, is_adviser)
      values (v_css_id, v_osas_id, 'Faculty Adviser', 'Faculty Adviser', false, true)
      on conflict (organization_id, user_id) do update set
        position = excluded.position,
        position_title = excluded.position_title,
        is_adviser = true;
    end if;
  end if;

  -- Link SSC
  if v_ssc_id is not null and v_admin_id is not null then
    update public.organizations
    set governor_id = v_admin_id,
        adviser_id = coalesce(v_osas_id, v_admin_id)
    where id = v_ssc_id;

    insert into public.organization_members (organization_id, user_id, position, position_title, is_officer, is_adviser)
    values (v_ssc_id, v_admin_id, 'SSC President', 'SSC President', true, false)
    on conflict (organization_id, user_id) do update set
      position = excluded.position,
      position_title = excluded.position_title,
      is_officer = true;
  end if;

  -- Link JPIA, UCG, RCY
  if v_jpia_id is not null and v_osas_id is not null then
    update public.organizations set adviser_id = v_osas_id where id = v_jpia_id;
  end if;
  if v_ucg_id is not null and v_osas_id is not null then
    update public.organizations set adviser_id = v_osas_id where id = v_ucg_id;
  end if;
  if v_rcy_id is not null and v_osas_id is not null then
    update public.organizations set adviser_id = v_osas_id where id = v_rcy_id;
  end if;
end;
$$;
