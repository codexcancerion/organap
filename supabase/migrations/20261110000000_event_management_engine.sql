-- =============================================================================
-- OrGanap: Event Proposals, Reviews, Registrations, Attendance & Notifications
-- Migration: 20261110000000_event_management_engine.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Tables
-- -----------------------------------------------------------------------------

-- 1.1 Event Proposals
create table if not exists public.event_proposals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  title text not null,
  purpose text not null,
  activities_desc text not null,
  venue_id uuid not null references public.venues(id) on delete restrict,
  start_time timestamptz not null,
  end_time timestamptz not null,
  registration_deadline timestamptz not null,
  capacity integer not null check (capacity > 0),
  status text not null default 'draft' check (
    status in (
      'draft',
      'pending_adviser',
      'returned_by_adviser',
      'rejected_by_adviser',
      'pending_student_affairs',
      'returned_by_student_affairs',
      'rejected_by_student_affairs',
      'approved',
      'cancelled'
    )
  ),
  cancellation_reason text,
  cancelled_at timestamptz,
  cancelled_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint check_event_times check (end_time > start_time),
  constraint check_registration_deadline check (registration_deadline <= start_time)
);

create index if not exists idx_event_proposals_org on public.event_proposals(organization_id);
create index if not exists idx_event_proposals_venue on public.event_proposals(venue_id);
create index if not exists idx_event_proposals_status on public.event_proposals(status);
create index if not exists idx_event_proposals_dates on public.event_proposals(start_time, end_time);

-- 1.2 Proposal Reviews (Immutable Chronological Audit Log)
create table if not exists public.proposal_reviews (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.event_proposals(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  stage text not null check (stage in ('adviser', 'student_affairs')),
  decision text not null check (
    decision in (
      'endorsed',
      'approved',
      'returned_for_revision',
      'rejected'
    )
  ),
  remarks text,
  created_at timestamptz not null default now()
);

create index if not exists idx_proposal_reviews_proposal on public.proposal_reviews(proposal_id, created_at asc);

-- 1.3 Event Registrations
create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.event_proposals(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  qr_token text not null unique,
  status text not null default 'confirmed' check (status in ('confirmed', 'withdrawn', 'attended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Partial unique index: A student can only have 1 active (confirmed) registration per event (FR-12)
create unique index if not exists idx_unique_active_registration 
  on public.event_registrations(proposal_id, student_id) 
  where status = 'confirmed';

create index if not exists idx_event_registrations_student on public.event_registrations(student_id);
create index if not exists idx_event_registrations_token on public.event_registrations(qr_token);

-- 1.4 Attendance Records
create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.event_proposals(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  registration_id uuid not null references public.event_registrations(id) on delete cascade,
  verified_by uuid not null references public.profiles(id) on delete cascade,
  check_in_method text not null default 'manual' check (check_in_method in ('manual', 'qr_scanner')),
  check_in_at timestamptz not null default now(),
  constraint uq_attendance_student_event unique (proposal_id, student_id)
);

create index if not exists idx_attendance_records_event on public.attendance_records(proposal_id);
create index if not exists idx_attendance_records_student on public.attendance_records(student_id);

-- 1.5 In-App Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on public.notifications(user_id, is_read, created_at desc);

-- -----------------------------------------------------------------------------
-- 2. Row Level Security Policies
-- -----------------------------------------------------------------------------

alter table public.event_proposals enable row level security;
alter table public.proposal_reviews enable row level security;
alter table public.event_registrations enable row level security;
alter table public.attendance_records enable row level security;
alter table public.notifications enable row level security;

-- 2.1 Event Proposals Policies
create policy "event_proposals_select" on public.event_proposals for select using (
  status in ('approved', 'cancelled')
  or public.is_org_officer(organization_id)
  or public.is_org_adviser(organization_id)
  or public.is_staff()
);

create policy "event_proposals_insert" on public.event_proposals for insert with check (
  public.is_org_officer(organization_id)
);

create policy "event_proposals_update" on public.event_proposals for update using (
  (public.is_org_officer(organization_id) and status in ('draft', 'returned_by_adviser', 'returned_by_student_affairs'))
  or public.is_org_adviser(organization_id)
  or public.is_staff()
);

create policy "event_proposals_delete" on public.event_proposals for delete using (
  (public.is_org_officer(organization_id) and status = 'draft')
  or public.is_staff()
);

-- 2.2 Proposal Reviews Policies
create policy "proposal_reviews_select" on public.proposal_reviews for select using (
  public.is_org_officer((select organization_id from public.event_proposals where id = proposal_id))
  or public.is_org_adviser((select organization_id from public.event_proposals where id = proposal_id))
  or public.is_staff()
);

create policy "proposal_reviews_insert" on public.proposal_reviews for insert with check (
  public.is_org_adviser((select organization_id from public.event_proposals where id = proposal_id))
  or public.is_staff()
);

-- 2.3 Event Registrations Policies
create policy "event_registrations_select" on public.event_registrations for select using (
  student_id = auth.uid()
  or public.is_org_officer((select organization_id from public.event_proposals where id = proposal_id))
  or public.is_staff()
);

create policy "event_registrations_insert" on public.event_registrations for insert with check (
  student_id = auth.uid()
);

create policy "event_registrations_update" on public.event_registrations for update using (
  student_id = auth.uid()
  or public.is_org_officer((select organization_id from public.event_proposals where id = proposal_id))
  or public.is_staff()
);

-- 2.4 Attendance Records Policies
create policy "attendance_records_select" on public.attendance_records for select using (
  student_id = auth.uid()
  or public.is_org_officer((select organization_id from public.event_proposals where id = proposal_id))
  or public.is_staff()
);

create policy "attendance_records_insert" on public.attendance_records for insert with check (
  public.is_org_officer((select organization_id from public.event_proposals where id = proposal_id))
  or public.is_staff()
);

-- 2.5 Notifications Policies
create policy "notifications_user_isolated" on public.notifications for all using (
  user_id = auth.uid()
);

-- -----------------------------------------------------------------------------
-- 3. Stored Procedures (NFR-08 Concurrency & Venue Conflict Prevention)
-- -----------------------------------------------------------------------------

-- 3.1 Mathematical Venue Overlap Checker (FR-07)
create or replace function public.check_venue_conflict(
  p_venue_id uuid,
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_exclude_proposal_id uuid default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.event_proposals
    where venue_id = p_venue_id
      and status = 'approved'
      and (p_exclude_proposal_id is null or id != p_exclude_proposal_id)
      and (p_start_time < end_time and p_end_time > start_time)
  );
end;
$$;

-- 3.2 Approve Event Proposal with Venue Row Locking (FR-06, FR-07)
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

  -- 6. Notify submitting officer
  if v_proposal.created_by is not null then
    insert into public.notifications (
      user_id,
      title,
      message,
      link
    ) values (
      v_proposal.created_by,
      'Proposal Approved! 🎉',
      format('Your event "%s" has been approved by Student Affairs and is now live on the campus calendar.', v_proposal.title),
      format('/proposals/%s', v_proposal.id)
    );
  end if;

  return jsonb_build_object(
    'success', true,
    'proposal_id', p_proposal_id,
    'status', 'approved'
  );
end;
$$;

-- 3.3 Atomic Event Registration with Quota Protection (FR-12, FR-17)
create or replace function public.register_for_event(
  p_proposal_id uuid,
  p_student_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_proposal public.event_proposals%rowtype;
  v_current_count integer;
  v_qr_token text;
  v_reg_id uuid;
begin
  -- 1. Lock the proposal row
  select * into v_proposal
  from public.event_proposals
  where id = p_proposal_id
  for update;

  if not found then
    raise exception 'NOT_FOUND: Event does not exist';
  end if;

  if v_proposal.status != 'approved' then
    raise exception 'EVENT_NOT_ACTIVE: Only approved events accept registrations';
  end if;

  -- 2. Validate registration deadline
  if now() > v_proposal.registration_deadline then
    raise exception 'DEADLINE_PASSED: Registration closed at %', v_proposal.registration_deadline;
  end if;

  -- 3. Check duplicate active registration
  if exists (
    select 1 from public.event_registrations
    where proposal_id = p_proposal_id
      and student_id = p_student_id
      and status = 'confirmed'
  ) then
    raise exception 'ALREADY_REGISTERED: You already have a confirmed registration for this event';
  end if;

  -- 4. Count active registrations against capacity
  select count(*) into v_current_count
  from public.event_registrations
  where proposal_id = p_proposal_id
    and status = 'confirmed';

  if v_current_count >= v_proposal.capacity then
    raise exception 'CAPACITY_REACHED: All % places for this event are fully booked', v_proposal.capacity;
  end if;

  -- 5. Generate secure unique QR token
  v_qr_token := encode(gen_random_bytes(16), 'hex');

  -- 6. Insert registration
  insert into public.event_registrations (
    proposal_id,
    student_id,
    qr_token,
    status
  ) values (
    p_proposal_id,
    p_student_id,
    v_qr_token,
    'confirmed'
  )
  returning id into v_reg_id;

  -- 7. Notify student
  insert into public.notifications (
    user_id,
    title,
    message,
    link
  ) values (
    p_student_id,
    'Registration Confirmed 🎟️',
    format('You have confirmed a pass for "%s". Access your digital ticket and QR code anytime.', v_proposal.title),
    '/registrations'
  );

  return jsonb_build_object(
    'success', true,
    'registration_id', v_reg_id,
    'qr_token', v_qr_token,
    'status', 'confirmed'
  );
end;
$$;

-- 3.4 Withdraw from Event (FR-12)
create or replace function public.withdraw_from_event(
  p_registration_id uuid,
  p_student_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reg public.event_registrations%rowtype;
  v_proposal public.event_proposals%rowtype;
begin
  select * into v_reg
  from public.event_registrations
  where id = p_registration_id and student_id = p_student_id
  for update;

  if not found then
    raise exception 'NOT_FOUND: Registration not found or unauthorized';
  end if;

  if v_reg.status != 'confirmed' then
    raise exception 'INVALID_STATE: Registration is already %', v_reg.status;
  end if;

  select * into v_proposal
  from public.event_proposals
  where id = v_reg.proposal_id;

  if now() > v_proposal.registration_deadline then
    raise exception 'DEADLINE_PASSED: Cannot withdraw after registration deadline has passed';
  end if;

  update public.event_registrations
  set status = 'withdrawn',
      updated_at = now()
  where id = p_registration_id;

  return jsonb_build_object(
    'success', true,
    'registration_id', p_registration_id,
    'status', 'withdrawn'
  );
end;
$$;

-- 3.5 Record Verified Attendance Entry (FR-13, FR-17)
create or replace function public.record_attendance_entry(
  p_proposal_id uuid,
  p_token_or_student_id text,
  p_verified_by uuid,
  p_method text default 'manual'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_proposal public.event_proposals%rowtype;
  v_reg public.event_registrations%rowtype;
  v_student public.profiles%rowtype;
  v_att_id uuid;
  v_check_in_at timestamptz := now();
begin
  -- 1. Fetch proposal
  select * into v_proposal
  from public.event_proposals
  where id = p_proposal_id;

  if not found then
    raise exception 'NOT_FOUND: Event not found';
  end if;

  if v_proposal.status != 'approved' then
    raise exception 'EVENT_NOT_ACTIVE: Attendance can only be recorded for approved events';
  end if;

  -- 2. Assert verifier is an authorized officer or staff
  if not (
    public.is_org_officer(v_proposal.organization_id, p_verified_by)
    or public.has_perm('attendance.verify', p_verified_by)
    or public.is_staff(p_verified_by)
    or public.is_superuser(p_verified_by)
  ) then
    raise exception 'PERMISSION_DENIED: Caller is not authorized to record attendance for this organization';
  end if;

  -- 3. Verify event scheduled window (+30 min early check-in buffer)
  if now() < (v_proposal.start_time - interval '30 minutes') then
    raise exception 'WINDOW_NOT_OPEN: Attendance check-in opens 30 minutes before event start (% )', v_proposal.start_time;
  end if;

  if now() > v_proposal.end_time then
    raise exception 'WINDOW_CLOSED: Event ended at %', v_proposal.end_time;
  end if;

  -- 4. Locate registration by QR token OR student UUID OR school_id
  select * into v_reg
  from public.event_registrations
  where proposal_id = p_proposal_id
    and (
      qr_token = p_token_or_student_id
      or student_id::text = p_token_or_student_id
      or student_id in (
        select id from public.profiles where school_id = p_token_or_student_id
      )
    );

  if not found then
    raise exception 'NO_REGISTRATION: No confirmed registration found matching the token or ID';
  end if;

  -- 5. Fetch student profile
  select * into v_student from public.profiles where id = v_reg.student_id;

  -- 6. Check duplicate check-in (FR-13)
  if exists (
    select 1 from public.attendance_records
    where proposal_id = p_proposal_id and student_id = v_reg.student_id
  ) then
    raise exception 'ALREADY_CHECKED_IN: Student % (% ) is already marked present', v_student.full_name, v_student.school_id;
  end if;

  -- 7. Insert attendance record
  insert into public.attendance_records (
    proposal_id,
    student_id,
    registration_id,
    verified_by,
    check_in_method,
    check_in_at
  ) values (
    p_proposal_id,
    v_reg.student_id,
    v_reg.id,
    p_verified_by,
    p_method,
    v_check_in_at
  )
  returning id into v_att_id;

  -- 8. Update registration status
  update public.event_registrations
  set status = 'attended',
      updated_at = now()
  where id = v_reg.id;

  return jsonb_build_object(
    'success', true,
    'attendance_id', v_att_id,
    'student_id', v_student.id,
    'student_name', v_student.full_name,
    'school_id', v_student.school_id,
    'check_in_at', v_check_in_at
  );
end;
$$;

-- 3.6 Cancel Approved Event with Venue Release & Notifications (FR-15)
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
    '/events'
  from public.event_registrations
  where proposal_id = p_proposal_id and status in ('confirmed', 'attended');

  -- Also notify the submitting officer
  if v_proposal.created_by is not null then
    insert into public.notifications (user_id, title, message, link)
    values (
      v_proposal.created_by,
      format('Event Cancelled: %s', v_proposal.title),
      format('Your event "%s" was cancelled by Student Affairs. Reason: %s', v_proposal.title, p_reason),
      format('/proposals/%s', p_proposal_id)
    );
  end if;

  return jsonb_build_object(
    'success', true,
    'proposal_id', p_proposal_id,
    'status', 'cancelled'
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- 4. Initial Seed Data: Events, Proposals & Notifications
-- -----------------------------------------------------------------------------

do $$
declare
  v_org_cs uuid;
  v_org_eng uuid;
  v_venue_auditorium uuid;
  v_venue_gym uuid;
  v_venue_hall uuid;
  v_admin_profile uuid;
  v_prop_1 uuid;
  v_prop_2 uuid;
  v_prop_draft uuid;
  v_prop_pending uuid;
begin
  select id into v_org_cs from public.organizations where slug = 'css' limit 1;
  if v_org_cs is null then select id into v_org_cs from public.organizations limit 1; end if;

  select id into v_org_eng from public.organizations where slug = 'ssc' limit 1;
  if v_org_eng is null then select id into v_org_eng from public.organizations offset 1 limit 1; end if;

  select id into v_venue_auditorium from public.venues where name = 'University Main Auditorium' limit 1;
  if v_venue_auditorium is null then select id into v_venue_auditorium from public.venues limit 1; end if;

  select id into v_venue_gym from public.venues where name = 'University Gymnasium' limit 1;
  if v_venue_gym is null then select id into v_venue_gym from public.venues offset 1 limit 1; end if;

  select id into v_venue_hall from public.venues where name = 'Multi-Purpose Hall (MPH)' limit 1;
  if v_venue_hall is null then select id into v_venue_hall from public.venues offset 2 limit 1; end if;

  select id into v_admin_profile from public.profiles order by created_at asc limit 1;

  if v_org_cs is not null and v_venue_auditorium is not null then
    -- Approved Event 1: Tech Summit 2026
    insert into public.event_proposals (
      organization_id, created_by, title, purpose, activities_desc, venue_id,
      start_time, end_time, registration_deadline, capacity, status
    ) values (
      v_org_cs, v_admin_profile,
      'Annual University Tech Summit 2026',
      'To expose students to modern cloud architecture, cybersecurity, and open source development.',
      'Keynote addresses, lightning tech talks, live demonstrations, and student networking sessions.',
      v_venue_auditorium,
      now() + interval '5 days',
      now() + interval '5 days' + interval '4 hours',
      now() + interval '4 days',
      250,
      'approved'
    )
    returning id into v_prop_1;

    -- Add review audit log
    insert into public.proposal_reviews (proposal_id, reviewer_id, stage, decision, remarks)
    values (v_prop_1, v_admin_profile, 'student_affairs', 'approved', 'Approved. Facilities and AV logistics confirmed.');

    -- Approved Event 2: Hackathon Kickoff
    insert into public.event_proposals (
      organization_id, created_by, title, purpose, activities_desc, venue_id,
      start_time, end_time, registration_deadline, capacity, status
    ) values (
      v_org_cs, v_admin_profile,
      'Inter-College Hackathon 2026',
      'Encourage multi-disciplinary problem solving and competitive student software engineering.',
      'Team check-in, problem statement release, mentoring rounds, and prototype presentations.',
      v_venue_hall,
      now() + interval '12 days',
      now() + interval '12 days' + interval '8 hours',
      now() + interval '10 days',
      120,
      'approved'
    )
    returning id into v_prop_2;

    insert into public.proposal_reviews (proposal_id, reviewer_id, stage, decision, remarks)
    values (v_prop_2, v_admin_profile, 'student_affairs', 'approved', 'Approved. Internet bandwidth provisioned.');

    -- Pending Adviser Proposal
    insert into public.event_proposals (
      organization_id, created_by, title, purpose, activities_desc, venue_id,
      start_time, end_time, registration_deadline, capacity, status
    ) values (
      v_org_eng, v_admin_profile,
      'Robotics & Automation Workshop',
      'Provide hands-on laboratory experience with microcontrollers and automated sensor systems.',
      'Introductory workshop, component distribution, hardware assembly, and obstacle course testing.',
      v_venue_gym,
      now() + interval '18 days',
      now() + interval '18 days' + interval '5 hours',
      now() + interval '16 days',
      80,
      'pending_adviser'
    )
    returning id into v_prop_pending;

    -- Draft Proposal
    insert into public.event_proposals (
      organization_id, created_by, title, purpose, activities_desc, venue_id,
      start_time, end_time, registration_deadline, capacity, status
    ) values (
      v_org_eng, v_admin_profile,
      'Civil Engineering Bridge Building Competition (Draft)',
      'Fostering structural engineering fundamentals among first and second year engineering students.',
      'Material distribution, structural testing, and failure analysis.',
      v_venue_hall,
      now() + interval '25 days',
      now() + interval '25 days' + interval '4 hours',
      now() + interval '23 days',
      60,
      'draft'
    )
    returning id into v_prop_draft;

    -- Seed sample registration for superadmin/first user on Tech Summit
    if v_admin_profile is not null then
      insert into public.event_registrations (proposal_id, student_id, qr_token, status)
      values (v_prop_1, v_admin_profile, encode(gen_random_bytes(16), 'hex'), 'confirmed')
      on conflict do nothing;

      -- Seed sample welcome notification
      insert into public.notifications (user_id, title, message, link)
      values (
        v_admin_profile,
        'Welcome to OrGanap v0.1.0 🚀',
        'Your campus organization event and attendance management system is ready. Browse upcoming events or create a new proposal.',
        '/events'
      );
    end if;
  end if;
end;
$$;
