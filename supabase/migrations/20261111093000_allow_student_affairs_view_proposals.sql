-- =============================================================================
-- Migration: 20261111093000_allow_student_affairs_view_proposals.sql
-- Allow Student Affairs, Advisers, and Permission Holders to View & Manage Proposals
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Ensure is_staff Recognizes Student Affairs Personnel
-- -----------------------------------------------------------------------------

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

  -- 1. Direct flag on profiles
  select (is_staff or is_superuser) into v_res
  from public.profiles
  where id = p_user_id and is_active = true;

  if coalesce(v_res, false) then
    return true;
  end if;

  -- 2. Member of Student Affairs group or has approval authority
  if exists (
    select 1
    from public.user_groups ug
    join public.groups g on g.id = ug.group_id
    where ug.user_id = p_user_id
      and g.name = 'Student Affairs'
  ) then
    return true;
  end if;

  return false;
end;
$$;

-- Backfill is_staff on profiles for all Student Affairs group members
update public.profiles p
set is_staff = true
from public.user_groups ug
join public.groups g on g.id = ug.group_id
where ug.user_id = p.id
  and g.name = 'Student Affairs'
  and p.is_staff = false;

-- -----------------------------------------------------------------------------
-- 2. Align Event Proposals RLS Policies with Granular Permissions
-- -----------------------------------------------------------------------------

drop policy if exists "event_proposals_select" on public.event_proposals;
create policy "event_proposals_select" on public.event_proposals for select using (
  status in ('approved', 'cancelled')
  or created_by = auth.uid()
  or public.is_org_officer(organization_id)
  or public.is_org_adviser(organization_id)
  or public.is_staff()
  or public.has_perm('proposals.view')
  or public.has_perm('proposals.approve')
  or public.has_perm('proposals.endorse')
);

drop policy if exists "event_proposals_update" on public.event_proposals;
create policy "event_proposals_update" on public.event_proposals for update using (
  (public.is_org_officer(organization_id) and status in ('draft', 'returned_by_adviser', 'returned_by_student_affairs'))
  or public.is_org_adviser(organization_id)
  or public.is_staff()
  or public.has_perm('proposals.approve')
  or public.has_perm('proposals.endorse')
);

-- -----------------------------------------------------------------------------
-- 3. Align Proposal Reviews RLS Policies
-- -----------------------------------------------------------------------------

drop policy if exists "proposal_reviews_select" on public.proposal_reviews;
create policy "proposal_reviews_select" on public.proposal_reviews for select using (
  public.is_org_officer((select organization_id from public.event_proposals where id = proposal_id))
  or public.is_org_adviser((select organization_id from public.event_proposals where id = proposal_id))
  or public.is_staff()
  or public.has_perm('proposals.view')
  or public.has_perm('proposals.approve')
  or public.has_perm('proposals.endorse')
  or exists (
    select 1 from public.event_proposals ep
    where ep.id = proposal_id and ep.created_by = auth.uid()
  )
);

drop policy if exists "proposal_reviews_insert" on public.proposal_reviews;
create policy "proposal_reviews_insert" on public.proposal_reviews for insert with check (
  public.is_org_adviser((select organization_id from public.event_proposals where id = proposal_id))
  or public.is_staff()
  or public.has_perm('proposals.approve')
  or public.has_perm('proposals.endorse')
);

-- -----------------------------------------------------------------------------
-- 4. Align Attendance & Registration RLS Policies
-- -----------------------------------------------------------------------------

drop policy if exists "event_registrations_select" on public.event_registrations;
create policy "event_registrations_select" on public.event_registrations for select using (
  student_id = auth.uid()
  or public.is_org_officer((select organization_id from public.event_proposals where id = proposal_id))
  or public.is_staff()
  or public.has_perm('proposals.view')
  or public.has_perm('proposals.approve')
  or public.has_perm('events.view')
  or exists (
    select 1 from public.event_proposals ep
    where ep.id = proposal_id and ep.status in ('approved', 'cancelled')
  )
);

drop policy if exists "attendance_records_select" on public.attendance_records;
create policy "attendance_records_select" on public.attendance_records for select using (
  student_id = auth.uid()
  or public.is_org_officer((select organization_id from public.event_proposals where id = proposal_id))
  or public.is_staff()
  or public.has_perm('attendance.view')
  or exists (
    select 1 from public.event_proposals ep
    where ep.id = proposal_id and ep.status in ('approved', 'cancelled')
  )
);
