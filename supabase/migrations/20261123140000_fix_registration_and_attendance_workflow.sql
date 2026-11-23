-- =============================================================================
-- Migration: 20261123140000_fix_registration_and_attendance_workflow.sql
-- Fixes pgcrypto schema qualification (gen_random_bytes), active registration
-- uniqueness/capacity counting, cross-organization attendance verification
-- authorization, QR/passcode token matching & diagnostics, and privacy-safe
-- aggregate registration counts for student event browsing.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Ensure pgcrypto extension is installed in extensions schema
-- -----------------------------------------------------------------------------
create extension if not exists pgcrypto with schema extensions;

-- -----------------------------------------------------------------------------
-- 2. Partial unique index covering both confirmed and attended registrations
-- -----------------------------------------------------------------------------
drop index if exists public.idx_unique_active_registration;

create unique index idx_unique_active_registration
  on public.event_registrations(proposal_id, student_id)
  where status in ('confirmed', 'attended');

-- -----------------------------------------------------------------------------
-- 3. Replace register_for_event with extensions search_path & identity guard
-- -----------------------------------------------------------------------------
create or replace function public.register_for_event(
  p_proposal_id uuid,
  p_student_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_proposal public.event_proposals%rowtype;
  v_current_count integer;
  v_qr_token text;
  v_reg_id uuid;
begin
  if auth.uid() is not null
     and auth.uid() != p_student_id
     and not public.is_superuser(auth.uid()) then
    raise exception 'PERMISSION_DENIED: Cannot register on behalf of another user';
  end if;

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

  -- 3. Check duplicate active registration (confirmed or already attended)
  if exists (
    select 1 from public.event_registrations
    where proposal_id = p_proposal_id
      and student_id = p_student_id
      and status in ('confirmed', 'attended')
  ) then
    raise exception 'ALREADY_REGISTERED: You already have an active registration for this event';
  end if;

  -- 4. Count active registrations against capacity
  select count(*) into v_current_count
  from public.event_registrations
  where proposal_id = p_proposal_id
    and status in ('confirmed', 'attended');

  if v_current_count >= v_proposal.capacity then
    raise exception 'CAPACITY_REACHED: All % places for this event are fully booked', v_proposal.capacity;
  end if;

  -- 5. Generate secure unique QR token via extensions.gen_random_bytes
  v_qr_token := encode(extensions.gen_random_bytes(16), 'hex');

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
    'Registration Confirmed',
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

-- -----------------------------------------------------------------------------
-- 4. Replace withdraw_from_event with caller identity & approved-status check
-- -----------------------------------------------------------------------------
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
  if auth.uid() is not null
     and auth.uid() != p_student_id
     and not public.is_superuser(auth.uid()) then
    raise exception 'PERMISSION_DENIED: Cannot withdraw on behalf of another user';
  end if;

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

  if not found or v_proposal.status != 'approved' then
    raise exception 'EVENT_NOT_ACTIVE: Cannot withdraw from an inactive or cancelled event';
  end if;

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

-- -----------------------------------------------------------------------------
-- 5. Replace record_attendance_entry with org-scoped auth & diagnostics
-- -----------------------------------------------------------------------------
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
  v_raw text;
  v_norm_token text;
  v_is_hex_prefix boolean := false;
begin
  if auth.uid() is not null
     and auth.uid() != p_verified_by
     and not public.is_superuser(auth.uid()) then
    raise exception 'PERMISSION_DENIED: Verifier identity mismatch';
  end if;

  v_raw := trim(coalesce(p_token_or_student_id, ''));
  if v_raw = '' then
    raise exception 'INVALID_INPUT: Passcode or Student ID is required';
  end if;

  v_norm_token := lower(regexp_replace(v_raw, '-', '', 'g'));
  v_is_hex_prefix := (length(v_norm_token) >= 16 and v_norm_token ~ '^[0-9a-f]+$');

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

  -- 2. Assert verifier is an officer of the organizing group, Student Affairs staff, or Superuser (FR-13, NFR-02)
  if not (
    public.is_org_officer(v_proposal.organization_id, p_verified_by)
    or public.is_staff(p_verified_by)
    or public.is_superuser(p_verified_by)
  ) then
    raise exception 'PERMISSION_DENIED: Caller is not authorized to record attendance for this organization';
  end if;

  -- 3. Verify event scheduled window (+30 min early check-in buffer)
  if now() < (v_proposal.start_time - interval '30 minutes') then
    raise exception 'WINDOW_NOT_OPEN: Attendance check-in opens 30 minutes before event start (%)', v_proposal.start_time;
  end if;

  if now() > v_proposal.end_time then
    raise exception 'WINDOW_CLOSED: Event ended at %', v_proposal.end_time;
  end if;

  -- 4. Locate active registration (ignore withdrawn rows)
  select * into v_reg
  from public.event_registrations
  where proposal_id = p_proposal_id
    and status in ('confirmed', 'attended')
    and (
      lower(qr_token) = v_norm_token
      or (v_is_hex_prefix and lower(qr_token) like v_norm_token || '%')
      or student_id::text = v_raw
      or student_id in (
        select id from public.profiles where lower(school_id) = lower(v_raw)
      )
    )
  order by case when status = 'confirmed' then 0 else 1 end, created_at desc
  limit 1;

  if not found then
    if exists (
      select 1 from public.event_registrations
      where proposal_id = p_proposal_id
        and status = 'withdrawn'
        and (
          lower(qr_token) = v_norm_token
          or (v_is_hex_prefix and lower(qr_token) like v_norm_token || '%')
          or student_id::text = v_raw
          or student_id in (
            select id from public.profiles where lower(school_id) = lower(v_raw)
          )
        )
    ) then
      raise exception 'REGISTRATION_WITHDRAWN: This registration was withdrawn and is no longer valid';
    end if;

    if exists (
      select 1 from public.event_registrations
      where proposal_id != p_proposal_id
        and status in ('confirmed', 'attended')
        and (
          lower(qr_token) = v_norm_token
          or (v_is_hex_prefix and lower(qr_token) like v_norm_token || '%')
        )
    ) then
      raise exception 'WRONG_EVENT: This QR pass belongs to a different event';
    end if;

    raise exception 'NO_REGISTRATION: No confirmed registration found matching the token or ID';
  end if;

  -- 5. Fetch student profile
  select * into v_student from public.profiles where id = v_reg.student_id;

  -- 6. Check duplicate check-in (FR-13)
  if exists (
    select 1 from public.attendance_records
    where proposal_id = p_proposal_id and student_id = v_reg.student_id
  ) then
    raise exception 'ALREADY_CHECKED_IN: Student % (%) is already marked present', v_student.full_name, v_student.school_id;
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
    case when p_method = 'qr_scanner' then 'qr_scanner' else 'manual' end,
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

-- -----------------------------------------------------------------------------
-- 6. Privacy-safe aggregate registration counts RPC (NFR-07)
-- -----------------------------------------------------------------------------
create or replace function public.get_event_registration_counts(
  p_proposal_ids uuid[]
)
returns table (
  proposal_id uuid,
  registered_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    er.proposal_id,
    count(*)::bigint as registered_count
  from public.event_registrations er
  where er.proposal_id = any(p_proposal_ids)
    and er.status in ('confirmed', 'attended')
  group by er.proposal_id;
$$;

grant execute on function public.register_for_event(uuid, uuid) to authenticated;
grant execute on function public.withdraw_from_event(uuid, uuid) to authenticated;
grant execute on function public.record_attendance_entry(uuid, text, uuid, text) to authenticated;
grant execute on function public.get_event_registration_counts(uuid[]) to authenticated;
