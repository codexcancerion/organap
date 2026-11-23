-- =============================================================================
-- Migration: 20261123150000_proposal_workflow_notifications.sql
-- Updates legacy /proposals/%s notification deep links to /events/%s and adds
-- an AFTER UPDATE OF status trigger on event_proposals so adviser submissions,
-- endorsements, returns, and rejections create notifications automatically.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Update approve_event_proposal link to /events/%s
-- -----------------------------------------------------------------------------
create or replace function public.approve_event_proposal(
  p_proposal_id uuid,
  p_reviewer_id uuid,
  p_remarks text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_proposal public.event_proposals%rowtype;
  v_conflict boolean;
begin
  -- Assert caller is Student Affairs or Superuser
  if not (public.has_perm('proposals.approve', p_reviewer_id) or public.is_staff(p_reviewer_id) or public.is_superuser(p_reviewer_id)) then
    raise exception 'PERMISSION_DENIED: Only Student Affairs personnel may approve proposals';
  end if;

  -- 1. Lock the proposal row
  select * into v_proposal
  from public.event_proposals
  where id = p_proposal_id
  for update;

  if not found then
    raise exception 'NOT_FOUND: Proposal % does not exist', p_proposal_id;
  end if;

  if v_proposal.status != 'pending_student_affairs' then
    raise exception 'INVALID_STATE: Proposal is not awaiting Student Affairs approval (status: %)', v_proposal.status;
  end if;

  -- 2. Lock the venue row to serialize concurrent approvals for this venue
  perform 1 from public.venues where id = v_proposal.venue_id for update;

  -- 3. Check for overlapping approved events (FR-07)
  v_conflict := public.check_venue_conflict(
    v_proposal.venue_id,
    v_proposal.start_time,
    v_proposal.end_time,
    v_proposal.id
  );

  if v_conflict then
    raise exception 'VENUE_CONFLICT: This venue is already booked for an approved event during this time window';
  end if;

  -- 4. Transition status to approved
  update public.event_proposals
  set status = 'approved',
      updated_at = now()
  where id = p_proposal_id;

  -- 5. Append immutable review record
  insert into public.proposal_reviews (
    proposal_id,
    reviewer_id,
    stage,
    decision,
    remarks
  ) values (
    p_proposal_id,
    p_reviewer_id,
    'student_affairs',
    'approved',
    p_remarks
  );

  -- 6. Notify submitting officer using unified /events route
  if v_proposal.created_by is not null then
    insert into public.notifications (
      user_id,
      title,
      message,
      link
    ) values (
      v_proposal.created_by,
      'Proposal Approved!',
      format('Your event "%s" has been approved by Student Affairs and is now live on the campus calendar.', v_proposal.title),
      format('/events/%s', v_proposal.id)
    );
  end if;

  return jsonb_build_object(
    'success', true,
    'proposal_id', p_proposal_id,
    'status', 'approved'
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- 2. Update cancel_approved_event officer link to /events/%s?view=review
-- -----------------------------------------------------------------------------
create or replace function public.cancel_approved_event(
  p_proposal_id uuid,
  p_cancelled_by uuid,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_proposal public.event_proposals%rowtype;
begin
  -- Assert caller is Student Affairs or Superuser
  if not (
    public.has_perm('events.cancel', p_cancelled_by)
    or public.is_staff(p_cancelled_by)
    or public.is_superuser(p_cancelled_by)
  ) then
    raise exception 'PERMISSION_DENIED: Only Student Affairs personnel may cancel approved events';
  end if;

  if trim(coalesce(p_reason, '')) = '' then
    raise exception 'REASON_REQUIRED: A valid cancellation reason must be provided';
  end if;

  select * into v_proposal
  from public.event_proposals
  where id = p_proposal_id
  for update;

  if not found then
    raise exception 'NOT_FOUND: Event not found';
  end if;

  if v_proposal.status != 'approved' then
    raise exception 'INVALID_STATE: Only approved events can be cancelled (current status: %)', v_proposal.status;
  end if;

  if now() >= v_proposal.start_time then
    raise exception 'EVENT_ALREADY_STARTED: Events that have already commenced cannot be cancelled';
  end if;

  -- Transition status to cancelled
  update public.event_proposals
  set status = 'cancelled',
      cancellation_reason = p_reason,
      cancelled_at = now(),
      cancelled_by = p_cancelled_by,
      updated_at = now()
  where id = p_proposal_id;

  -- Fan-out cancellation notifications to all confirmed registrants (FR-11)
  insert into public.notifications (user_id, title, message, link)
  select
    student_id,
    format('Event Cancelled: %s', v_proposal.title),
    format('The event "%s" scheduled for %s has been cancelled by Student Affairs. Reason: %s', v_proposal.title, to_char(v_proposal.start_time, 'Mon DD, YYYY HH:MI AM'), p_reason),
    format('/events/%s', p_proposal_id)
  from public.event_registrations
  where proposal_id = p_proposal_id and status in ('confirmed', 'attended');

  -- Also notify the submitting officer
  if v_proposal.created_by is not null then
    insert into public.notifications (user_id, title, message, link)
    values (
      v_proposal.created_by,
      format('Event Cancelled: %s', v_proposal.title),
      format('Your event "%s" was cancelled by Student Affairs. Reason: %s', v_proposal.title, p_reason),
      format('/events/%s?view=review', p_proposal_id)
    );
  end if;

  return jsonb_build_object(
    'success', true,
    'proposal_id', p_proposal_id,
    'status', 'cancelled'
  );
end;
$$;

grant execute on function public.approve_event_proposal(uuid, uuid, text) to authenticated;
grant execute on function public.cancel_approved_event(uuid, uuid, text) to authenticated;

-- -----------------------------------------------------------------------------
-- 3. Trigger function for proposal submission, endorsement, return, & rejection
-- -----------------------------------------------------------------------------
create or replace function public.trg_notify_proposal_workflow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_adviser_id uuid;
  v_org_acronym text;
  v_review_link text;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  v_review_link := format('/events/%s?view=review', new.id);

  select o.adviser_id, o.acronym
  into v_adviser_id, v_org_acronym
  from public.organizations o
  where o.id = new.organization_id;

  -- A. Submitted or resubmitted for adviser review
  if new.status = 'pending_adviser' then
    if v_adviser_id is not null and v_adviser_id is distinct from new.created_by then
      insert into public.notifications (user_id, title, message, link)
      values (
        v_adviser_id,
        'Proposal Awaiting Endorsement',
        format('%s submitted "%s" for faculty adviser review.', coalesce(v_org_acronym, 'An organization'), new.title),
        v_review_link
      );
    end if;

  -- B. Adviser endorsed -> notify Student Affairs staff and submitting officer
  elsif new.status = 'pending_student_affairs' and old.status = 'pending_adviser' then
    insert into public.notifications (user_id, title, message, link)
    select distinct
      p.id,
      'Proposal Endorsed for Final Review',
      format('"%s" (%s) was endorsed by its faculty adviser and awaits Student Affairs approval.', new.title, coalesce(v_org_acronym, 'Organization')),
      v_review_link
    from public.profiles p
    where p.is_active = true
      and p.id is distinct from new.created_by
      and (
        p.is_staff = true
        or exists (
          select 1
          from public.user_groups ug
          join public.groups g on g.id = ug.group_id
          where ug.user_id = p.id
            and g.name = 'Student Affairs'
        )
      );

    if new.created_by is not null then
      insert into public.notifications (user_id, title, message, link)
      values (
        new.created_by,
        'Proposal Endorsed by Adviser',
        format('Your proposal "%s" was endorsed by your faculty adviser and routed to Student Affairs.', new.title),
        v_review_link
      );
    end if;

  -- C. Returned for revision by adviser or Student Affairs
  elsif new.status in ('returned_by_adviser', 'returned_by_student_affairs') then
    if new.created_by is not null then
      insert into public.notifications (user_id, title, message, link)
      values (
        new.created_by,
        'Revision Requested on Proposal',
        format(
          '"%s" was returned for revision by %s. Review the remarks and update your submission.',
          new.title,
          case when new.status = 'returned_by_adviser' then 'your faculty adviser' else 'Student Affairs' end
        ),
        v_review_link
      );
    end if;

  -- D. Rejected by adviser or Student Affairs
  elsif new.status in ('rejected_by_adviser', 'rejected_by_student_affairs') then
    if new.created_by is not null then
      insert into public.notifications (user_id, title, message, link)
      values (
        new.created_by,
        'Proposal Not Approved',
        format(
          '"%s" was rejected by %s. Open the proposal record to review remarks.',
          new.title,
          case when new.status = 'rejected_by_adviser' then 'your faculty adviser' else 'Student Affairs' end
        ),
        v_review_link
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_event_proposals_workflow_notifications on public.event_proposals;

create trigger trg_event_proposals_workflow_notifications
  after update of status on public.event_proposals
  for each row
  execute function public.trg_notify_proposal_workflow();
