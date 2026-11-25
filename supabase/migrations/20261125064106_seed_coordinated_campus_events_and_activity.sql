-- =============================================================================
-- Migration: seed_coordinated_campus_events_and_activity
-- Seeds 12 coordinated KCP campus events/proposals across all 10 recognized
-- organizations, 5 venues, and 2026-2027 1st Semester, complete with two-stage
-- review histories, cross-organization student registrations/passes, verified
-- attendance records (QR + manual), and in-app notifications.
-- Idempotent via deterministic UUIDs and ON CONFLICT DO NOTHING.
-- =============================================================================

do $$
declare
  v_sem_id uuid;
  v_venue_aud uuid;
  v_venue_mph uuid;
  v_venue_avr1 uuid;
  v_venue_avr2 uuid;
  v_venue_gym uuid;

  v_sa_1 uuid;
  v_sa_2 uuid;

  v_org_cit uuid;   v_gov_cit uuid;   v_adv_cit uuid;
  v_org_cabm uuid;  v_gov_cabm uuid;  v_adv_cabm uuid;
  v_org_ccje uuid;  v_gov_ccje uuid;  v_adv_ccje uuid;
  v_org_cot uuid;   v_gov_cot uuid;   v_adv_cot uuid;
  v_org_ctela uuid; v_gov_ctela uuid; v_adv_ctela uuid;
  v_org_gabay uuid; v_gov_gabay uuid; v_adv_gabay uuid;
  v_org_psych uuid; v_gov_psych uuid; v_adv_psych uuid;
  v_org_ssc uuid;   v_gov_ssc uuid;   v_adv_ssc uuid;
  v_org_tl uuid;    v_gov_tl uuid;    v_adv_tl uuid;
  v_org_trc uuid;   v_gov_trc uuid;   v_adv_trc uuid;

  v_p1  uuid := 'e0000000-0000-4000-8000-000000000001'::uuid;
  v_p2  uuid := 'e0000000-0000-4000-8000-000000000002'::uuid;
  v_p3  uuid := 'e0000000-0000-4000-8000-000000000003'::uuid;
  v_p4  uuid := 'e0000000-0000-4000-8000-000000000004'::uuid;
  v_p5  uuid := 'e0000000-0000-4000-8000-000000000005'::uuid;
  v_p6  uuid := 'e0000000-0000-4000-8000-000000000006'::uuid;
  v_p7  uuid := 'e0000000-0000-4000-8000-000000000007'::uuid;
  v_p8  uuid := 'e0000000-0000-4000-8000-000000000008'::uuid;
  v_p9  uuid := 'e0000000-0000-4000-8000-000000000009'::uuid;
  v_p10 uuid := 'e0000000-0000-4000-8000-000000000010'::uuid;
  v_p11 uuid := 'e0000000-0000-4000-8000-000000000011'::uuid;
  v_p12 uuid := 'e0000000-0000-4000-8000-000000000012'::uuid;

  v_live_start timestamptz := now() - interval '1 hour';
  v_live_end   timestamptz := now() + interval '4 hours';
  v_live_dl    timestamptz := now() - interval '2 hours';

  v_attendee_pool uuid[];
  v_superadmin_ids uuid[];
  v_uid uuid;
  v_reg_id uuid;
  v_qr text;
  v_idx int;
  v_method text;
begin
  -- Skip if already seeded
  if exists (select 1 from public.event_proposals where id = v_p1) then
    return;
  end if;

  -- Resolve active semester
  select id into v_sem_id from public.semesters order by start_date desc limit 1;

  -- Resolve venues
  select id into v_venue_aud  from public.venues where name ilike '%Main Auditorium%' limit 1;
  select id into v_venue_mph  from public.venues where name ilike '%Multi-Purpose Hall%' limit 1;
  select id into v_venue_avr1 from public.venues where name ilike '%AVR 1%' limit 1;
  select id into v_venue_avr2 from public.venues where name ilike '%AVR 2%' limit 1;
  select id into v_venue_gym  from public.venues where name ilike '%Gymnasium%' limit 1;

  -- Fallback to first venue if any specific name differs
  v_venue_aud  := coalesce(v_venue_aud,  (select id from public.venues limit 1));
  v_venue_mph  := coalesce(v_venue_mph,  v_venue_aud);
  v_venue_avr1 := coalesce(v_venue_avr1, v_venue_aud);
  v_venue_avr2 := coalesce(v_venue_avr2, v_venue_aud);
  v_venue_gym  := coalesce(v_venue_gym,  v_venue_aud);

  if v_venue_aud is null then
    return;
  end if;

  -- Resolve OSAS reviewers
  select id into v_sa_1 from public.profiles where email = 'staff01@organap.edu' limit 1;
  select id into v_sa_2 from public.profiles where email = 'staff02@organap.edu' limit 1;
  v_sa_1 := coalesce(v_sa_1, (select id from public.profiles where is_staff = true or is_superuser = true limit 1));
  v_sa_2 := coalesce(v_sa_2, v_sa_1);

  -- Resolve all 10 organizations + their governors & advisers
  select id, governor_id, adviser_id into v_org_cit,   v_gov_cit,   v_adv_cit   from public.organizations where slug = 'cit-sbo'           limit 1;
  select id, governor_id, adviser_id into v_org_cabm,  v_gov_cabm,  v_adv_cabm  from public.organizations where slug = 'cabm-sbo'          limit 1;
  select id, governor_id, adviser_id into v_org_ccje,  v_gov_ccje,  v_adv_ccje  from public.organizations where slug = 'ccje-sbo'          limit 1;
  select id, governor_id, adviser_id into v_org_cot,   v_gov_cot,   v_adv_cot   from public.organizations where slug = 'theology-sbo'      limit 1;
  select id, governor_id, adviser_id into v_org_ctela, v_gov_ctela, v_adv_ctela from public.organizations where slug = 'ctela-sbo'         limit 1;
  select id, governor_id, adviser_id into v_org_gabay, v_gov_gabay, v_adv_gabay from public.organizations where slug = 'gabay'             limit 1;
  select id, governor_id, adviser_id into v_org_psych, v_gov_psych, v_adv_psych from public.organizations where slug = 'psych-club'        limit 1;
  select id, governor_id, adviser_id into v_org_ssc,   v_gov_ssc,   v_adv_ssc   from public.organizations where slug = 'ssc'               limit 1;
  select id, governor_id, adviser_id into v_org_tl,    v_gov_tl,    v_adv_tl    from public.organizations where slug = 'loquitor'          limit 1;
  select id, governor_id, adviser_id into v_org_trc,   v_gov_trc,   v_adv_trc   from public.organizations where slug = 'ruling-conquerors' limit 1;

  if v_org_cit is null or v_org_ssc is null then
    return;
  end if;

  -- Build a deterministic pool of active student & officer attendees (plus superadmins first so demo logins see passes!)
  select array_agg(id order by is_superuser desc, school_id asc)
  into v_attendee_pool
  from (
    select p.id, p.is_superuser, p.school_id
    from public.profiles p
    where p.is_active = true
      and (
        p.is_superuser = true
        or exists (
          select 1 from public.user_groups ug
          join public.groups g on g.id = ug.group_id
          where ug.user_id = p.id
            and g.name in ('Student', 'Students', 'Student Organization Officer', 'Student Organization Officers')
        )
      )
    order by p.is_superuser desc, p.school_id asc
    limit 50
  ) sub;

  select array_agg(id) into v_superadmin_ids
  from public.profiles
  where is_active = true and (is_superuser = true or is_staff = true);

  -- ---------------------------------------------------------------------------
  -- 1. Insert 12 Coordinated Campus Events & Proposals
  -- ---------------------------------------------------------------------------
  insert into public.event_proposals (
    id, organization_id, created_by, title, purpose, activities_desc,
    activity_type, semester_id, venue_id, start_time, end_time,
    registration_deadline, capacity, status, created_at, updated_at
  ) values
    -- 1. Completed Approved Event (CIT SBO)
    (
      v_p1, v_org_cit, v_gov_cit,
      'Byte & Bond: Annual IT General Assembly & Tech Career Summit',
      'Unite College of Information Technology students with industry engineers and alumni to align on semester projects, capstone milestones, and software engineering career tracks.',
      '08:30 AM Registration & QR Check-In | 09:30 AM Opening Keynote on AI-Assisted Engineering | 11:00 AM Alumni Panel | 01:30 PM Track Breakouts (Web, Cloud, Cybersecurity) | 04:00 PM Org Oath-Taking & Raffle',
      'assembly', v_sem_id, v_venue_aud,
      '2026-11-12 08:30:00+08'::timestamptz, '2026-11-12 16:30:00+08'::timestamptz,
      '2026-11-11 23:59:00+08'::timestamptz, 250, 'approved',
      '2026-10-28 09:00:00+08'::timestamptz, '2026-11-02 14:20:00+08'::timestamptz
    ),
    -- 2. Completed Approved Event (The Loquitur)
    (
      v_p2, v_org_tl, v_gov_tl,
      'Campus Journalism & Visual Storytelling Workshop 2026',
      'Equip student writers, photojournalists, and layout editors across recognized campus organizations with ethical reporting, editorial photography, and digital publication skills.',
      '01:00 PM Check-In | 01:30 PM Investigative Campus Reporting | 02:45 PM Mobile Photojournalism Lab | 04:00 PM Peer Critique & Editorial Zine Showcase',
      'workshop', v_sem_id, v_venue_avr1,
      '2026-11-18 13:00:00+08'::timestamptz, '2026-11-18 17:00:00+08'::timestamptz,
      '2026-11-17 18:00:00+08'::timestamptz, 80, 'approved',
      '2026-11-03 10:15:00+08'::timestamptz, '2026-11-06 11:40:00+08'::timestamptz
    ),
    -- 3. LIVE NOW Approved Event (Supreme Student Council)
    (
      v_p3, v_org_ssc, v_gov_ssc,
      'KCP Student Leaders Governance Forum & Budget Townhall',
      'Bring together officers, parliament members, and student representatives from all 10 KCP organizations to review semester fund utilization, calendar coordination, and student welfare resolutions.',
      'Open QR Check-In | Mid-Semester Financial Transparency Report | Inter-Org Calendar Sync | Open Floor Policy Q&A | Signing of Joint Student Welfare Resolution',
      'seminar', v_sem_id, v_venue_mph,
      v_live_start, v_live_end, v_live_dl, 200, 'approved',
      now() - interval '14 days', now() - interval '10 days'
    ),
    -- 4. Upcoming Approved Event (CABM SBO)
    (
      v_p4, v_org_cabm, v_gov_cabm,
      'Future CFOs & Founders: Cordilleran Entrepreneurship Summit',
      'Connect accountancy and business management students with regional founders and CPA leaders to explore highland agribusiness startups, financial compliance, and sustainable enterprise.',
      '09:00 AM Doors Open | 09:30 AM Startup Pitch Fireside Chat | 11:30 AM Financial Modeling Clinic | 01:30 PM Student Venture Pitch Competition | 03:30 PM Awarding',
      'seminar', v_sem_id, v_venue_aud,
      '2026-12-02 09:00:00+08'::timestamptz, '2026-12-02 16:00:00+08'::timestamptz,
      '2026-12-01 17:00:00+08'::timestamptz, 300, 'approved',
      '2026-11-10 08:45:00+08'::timestamptz, '2026-11-14 15:10:00+08'::timestamptz
    ),
    -- 5. Upcoming Approved Event (Gabay Ensemble)
    (
      v_p5, v_org_gabay, v_gov_gabay,
      'Habi ng Kultura: Cordillera Folk Dance & Acoustic Night',
      'Celebrate Cordilleran heritage and student performing arts through traditional ensemble pieces, live acoustic collaborations, and cultural storytelling open to the entire KCP community.',
      '05:30 PM Gate & QR Verification | 06:15 PM Opening Gong Ensemble | 07:00 PM Folk Dance Suite | 08:00 PM Acoustic Open Stage | 08:45 PM Community Dance Finale',
      'cultural', v_sem_id, v_venue_gym,
      '2026-12-04 17:30:00+08'::timestamptz, '2026-12-04 21:00:00+08'::timestamptz,
      '2026-12-03 23:59:00+08'::timestamptz, 600, 'approved',
      '2026-11-11 14:00:00+08'::timestamptz, '2026-11-15 16:30:00+08'::timestamptz
    ),
    -- 6. Upcoming Approved Event (The Ruling Conquerors)
    (
      v_p6, v_org_trc, v_gov_trc,
      'KCP Inter-College Esports & Volleyball Invitational',
      'Promote sportsmanship, cross-college camaraderie, and healthy athletic competition through back-to-back exhibition volleyball matches and collegiate esports brackets.',
      '08:00 AM Athlete Check-In | 09:00 AM Men''s & Women''s Volleyball Semifinals | 01:00 PM Collegiate Esports Finals | 04:30 PM Championship Awards Ceremony',
      'sports', v_sem_id, v_venue_gym,
      '2026-12-07 08:00:00+08'::timestamptz, '2026-12-07 18:00:00+08'::timestamptz,
      '2026-12-05 18:00:00+08'::timestamptz, 500, 'approved',
      '2026-11-12 10:00:00+08'::timestamptz, '2026-11-17 10:00:00+08'::timestamptz
    ),
    -- 7. Upcoming Approved Event (KCPEEP Facilitator)
    (
      v_p7, v_org_psych, v_gov_psych,
      'Mindful Finals: Peer Stress Management & Study Lab',
      'Support students preparing for final examinations with evidence-based stress regulation exercises, guided peer circles, and sustainable study-habit coaching facilitated by psychology majors.',
      '01:30 PM Check-In & Wellness Kit | 02:00 PM Cognitive Reframing Session | 03:00 PM Small-Group Peer Circles | 04:00 PM Study Sprint Planning',
      'workshop', v_sem_id, v_venue_avr2,
      '2026-12-09 13:30:00+08'::timestamptz, '2026-12-09 16:30:00+08'::timestamptz,
      '2026-12-08 17:00:00+08'::timestamptz, 60, 'approved',
      '2026-11-14 09:30:00+08'::timestamptz, '2026-11-19 13:45:00+08'::timestamptz
    ),
    -- 8. Pending Student Affairs Review (CCJE SBO)
    (
      v_p8, v_org_ccje, v_gov_ccje,
      'Forensic Science & Campus Safety Awareness Symposium',
      'Deepen criminology students'' practical understanding of digital forensics, evidence preservation, and proactive campus emergency response protocols with invited regional practitioners.',
      '09:00 AM Assembly | 09:30 AM Crime Scene Documentation Demo | 11:30 AM Cyber-Evidence Briefing | 01:30 PM Campus Safety Simulation & Debrief',
      'seminar', v_sem_id, v_venue_mph,
      '2026-12-10 09:00:00+08'::timestamptz, '2026-12-10 15:00:00+08'::timestamptz,
      '2026-12-09 12:00:00+08'::timestamptz, 200, 'pending_student_affairs',
      '2026-11-20 10:00:00+08'::timestamptz, '2026-11-23 16:00:00+08'::timestamptz
    ),
    -- 9. Pending Student Affairs Review (CTELA SBO)
    (
      v_p9, v_org_ctela, v_gov_ctela,
      'Demo Teaching & Inclusive Classroom Innovation Expo',
      'Showcase pre-service teacher lesson designs, assistive instructional materials, and bilingual learning toolkits evaluated by cooperating basic education mentors.',
      '08:30 AM Exhibit Setup | 09:30 AM Live Micro-Teaching Rounds | 01:30 PM Inclusive Learning Booth Walk | 03:30 PM Best Instructional Kit Recognition',
      'competition', v_sem_id, v_venue_avr1,
      '2026-12-11 08:30:00+08'::timestamptz, '2026-12-11 16:00:00+08'::timestamptz,
      '2026-12-10 17:00:00+08'::timestamptz, 90, 'pending_student_affairs',
      '2026-11-21 11:20:00+08'::timestamptz, '2026-11-24 09:15:00+08'::timestamptz
    ),
    -- 10. Pending Faculty Adviser Endorsement (COT SBO)
    (
      v_p10, v_org_cot, v_gov_cot,
      'Season of Gratitude: Interfaith Community Outreach & Gift Drive',
      'Coordinate campus-wide donation sorting, reflection circles, and partner barangay outreach packages led by the College of Theology student council and volunteer orgs.',
      '08:00 AM Volunteer Briefing | 09:00 AM Gift Pack Assembly | 11:00 AM Interfaith Thanksgiving Reflection | 12:00 PM Dispatch to Partner Community',
      'outreach', v_sem_id, v_venue_mph,
      '2026-12-12 08:00:00+08'::timestamptz, '2026-12-12 13:00:00+08'::timestamptz,
      '2026-12-11 12:00:00+08'::timestamptz, 150, 'pending_adviser',
      '2026-11-24 14:00:00+08'::timestamptz, '2026-11-24 14:00:00+08'::timestamptz
    ),
    -- 11. Returned by Adviser for Revision (CIT SBO)
    (
      v_p11, v_org_cit, v_gov_cit,
      'Winter Hackathon: Campus Civic Tech Sprint',
      'Run a full-day team coding sprint building prototypes that improve campus scheduling, accessibility, and student resource discovery.',
      '08:00 AM Team Formation | 09:00 AM Hacking Sprint | 03:30 PM Live Prototype Demos | 05:00 PM Judges Deliberation & Closing',
      'competition', v_sem_id, v_venue_avr2,
      '2026-12-14 08:00:00+08'::timestamptz, '2026-12-14 18:00:00+08'::timestamptz,
      '2026-12-12 18:00:00+08'::timestamptz, 75, 'returned_by_adviser',
      '2026-11-22 15:00:00+08'::timestamptz, '2026-11-24 11:30:00+08'::timestamptz
    ),
    -- 12. Draft Proposal (Supreme Student Council)
    (
      v_p12, v_org_ssc, v_gov_ssc,
      'Year-End Student Organization Recognition & Awards Night',
      'Honor outstanding student organization initiatives, community service milestones, and top event organizers at the close of the first semester.',
      '05:00 PM Red Carpet & Check-In | 06:00 PM Semester Highlights Reel | 07:00 PM Organization Excellence Awards | 08:30 PM Fellowship Dinner',
      'cultural', v_sem_id, v_venue_aud,
      '2026-12-15 17:00:00+08'::timestamptz, '2026-12-15 21:00:00+08'::timestamptz,
      '2026-12-14 12:00:00+08'::timestamptz, 450, 'draft',
      '2026-11-25 09:00:00+08'::timestamptz, '2026-11-25 09:00:00+08'::timestamptz
    )
  on conflict (id) do nothing;

  -- ---------------------------------------------------------------------------
  -- 2. Insert Chronological Two-Stage Proposal Reviews
  -- ---------------------------------------------------------------------------
  insert into public.proposal_reviews (proposal_id, reviewer_id, stage, decision, remarks, created_at)
  select * from (
    values
      (v_p1, v_adv_cit, 'adviser', 'endorsed', 'Program objectives align well with the CIT curriculum and industry readiness goals. Endorsed for OSAS approval.', '2026-10-30 10:00:00+08'::timestamptz),
      (v_p1, v_sa_1, 'student_affairs', 'approved', 'Venue availability confirmed for Main Auditorium. Approved with standard safety marshals.', '2026-11-02 14:20:00+08'::timestamptz),

      (v_p2, v_adv_tl, 'adviser', 'endorsed', 'Editorial training syllabus and resource speakers are well vetted. Endorsed.', '2026-11-04 16:00:00+08'::timestamptz),
      (v_p2, v_sa_2, 'student_affairs', 'approved', 'AVR 1 booking confirmed with no conflicts. Approved.', '2026-11-06 11:40:00+08'::timestamptz),

      (v_p3, v_adv_ssc, 'adviser', 'endorsed', 'Timely inter-organization governance forum. Budget briefing materials reviewed.', now() - interval '12 days'),
      (v_p3, v_sa_1, 'student_affairs', 'approved', 'MPH reserved for SSC townhall. Coordinate attendance verification at the entrance.', now() - interval '10 days'),

      (v_p4, v_adv_cabm, 'adviser', 'endorsed', 'Strong regional entrepreneurship lineup and balanced budget. Endorsed to Student Affairs.', '2026-11-12 09:30:00+08'::timestamptz),
      (v_p4, v_sa_1, 'student_affairs', 'approved', 'Main Auditorium cleared for December 2. Approved for campus-wide registration.', '2026-11-14 15:10:00+08'::timestamptz),

      (v_p5, v_adv_gabay, 'adviser', 'endorsed', 'Rehearsal schedule and cultural repertoire reviewed. Endorsed.', '2026-11-13 13:15:00+08'::timestamptz),
      (v_p5, v_sa_2, 'student_affairs', 'approved', 'Gymnasium sound and lighting clearance approved for evening showcase.', '2026-11-15 16:30:00+08'::timestamptz),

      (v_p6, v_adv_trc, 'adviser', 'endorsed', 'Medical standby and tournament brackets verified. Endorsed.', '2026-11-14 17:00:00+08'::timestamptz),
      (v_p6, v_sa_1, 'student_affairs', 'approved', 'Gymnasium schedule confirmed for December 7. Approved.', '2026-11-17 10:00:00+08'::timestamptz),

      (v_p7, v_adv_psych, 'adviser', 'endorsed', 'Peer facilitation guides reviewed for student wellness compliance. Endorsed.', '2026-11-16 11:00:00+08'::timestamptz),
      (v_p7, v_sa_2, 'student_affairs', 'approved', 'AVR 2 reserved. Great pre-finals wellness initiative.', '2026-11-19 13:45:00+08'::timestamptz),

      (v_p8, v_adv_ccje, 'adviser', 'endorsed', 'Guest speaker credentials and safety demonstration plan verified. Endorsed for final OSAS approval.', '2026-11-23 16:00:00+08'::timestamptz),
      (v_p9, v_adv_ctela, 'adviser', 'endorsed', 'Cooperating school judges confirmed and rubrics attached. Endorsed to Student Affairs.', '2026-11-24 09:15:00+08'::timestamptz),
      (v_p11, v_adv_cit, 'adviser', 'returned_for_revision', 'Please attach the finalized judging rubric and confirm extension-cord load clearance with Facilities for AVR 2 before resubmitting.', '2026-11-24 11:30:00+08'::timestamptz)
  ) as r(proposal_id, reviewer_id, stage, decision, remarks, created_at)
  where r.reviewer_id is not null;

  -- ---------------------------------------------------------------------------
  -- 3. Seed Coordinated Student Registrations (Passes) & Attendance Records
  -- ---------------------------------------------------------------------------
  if v_attendee_pool is not null and array_length(v_attendee_pool, 1) > 0 then

    -- Event 1 (CIT SBO Completed Assembly): 26 registrations -> 21 attended, 3 no-show, 2 withdrawn
    for v_idx in 1..least(26, array_length(v_attendee_pool, 1)) loop
      v_uid := v_attendee_pool[v_idx];
      v_qr  := md5(v_p1::text || ':' || v_uid::text);
      v_method := case when v_idx % 3 = 0 then 'manual' else 'qr_scanner' end;

      insert into public.event_registrations (proposal_id, student_id, qr_token, status, created_at, updated_at)
      values (
        v_p1, v_uid, v_qr,
        case
          when v_idx <= 21 then 'attended'
          when v_idx <= 24 then 'confirmed'
          else 'withdrawn'
        end,
        '2026-11-05 10:00:00+08'::timestamptz + (v_idx * interval '2 hours'),
        '2026-11-12 08:30:00+08'::timestamptz + (v_idx * interval '2 minutes')
      )
      on conflict (qr_token) do nothing
      returning id into v_reg_id;

      if v_reg_id is not null and v_idx <= 21 and v_gov_cit is not null then
        insert into public.attendance_records (proposal_id, student_id, registration_id, verified_by, check_in_method, check_in_at)
        values (
          v_p1, v_uid, v_reg_id, v_gov_cit, v_method,
          '2026-11-12 08:15:00+08'::timestamptz + (v_idx * interval '3 minutes')
        )
        on conflict (proposal_id, student_id) do nothing;
      end if;
    end loop;

    -- Event 2 (The Loquitur Completed Workshop): 18 registrations -> 15 attended, 2 no-show, 1 withdrawn
    for v_idx in 1..least(18, array_length(v_attendee_pool, 1)) loop
      v_uid := v_attendee_pool[((v_idx + 4) % array_length(v_attendee_pool, 1)) + 1];
      v_qr  := md5(v_p2::text || ':' || v_uid::text);
      v_method := case when v_idx % 4 = 0 then 'manual' else 'qr_scanner' end;

      insert into public.event_registrations (proposal_id, student_id, qr_token, status, created_at, updated_at)
      values (
        v_p2, v_uid, v_qr,
        case
          when v_idx <= 15 then 'attended'
          when v_idx <= 17 then 'confirmed'
          else 'withdrawn'
        end,
        '2026-11-10 11:00:00+08'::timestamptz + (v_idx * interval '3 hours'),
        '2026-11-18 13:05:00+08'::timestamptz + (v_idx * interval '2 minutes')
      )
      on conflict (qr_token) do nothing
      returning id into v_reg_id;

      if v_reg_id is not null and v_idx <= 15 and v_gov_tl is not null then
        insert into public.attendance_records (proposal_id, student_id, registration_id, verified_by, check_in_method, check_in_at)
        values (
          v_p2, v_uid, v_reg_id, v_gov_tl, v_method,
          '2026-11-18 12:45:00+08'::timestamptz + (v_idx * interval '2 minutes')
        )
        on conflict (proposal_id, student_id) do nothing;
      end if;
    end loop;

    -- Event 3 (LIVE NOW SSC Governance Forum): 24 registrations -> 11 already checked in, 13 awaiting live check-in!
    for v_idx in 1..least(24, array_length(v_attendee_pool, 1)) loop
      v_uid := v_attendee_pool[v_idx];
      v_qr  := md5(v_p3::text || ':' || v_uid::text);
      v_method := case when v_idx % 3 = 0 then 'manual' else 'qr_scanner' end;

      insert into public.event_registrations (proposal_id, student_id, qr_token, status, created_at, updated_at)
      values (
        v_p3, v_uid, v_qr,
        case when v_idx <= 11 then 'attended' else 'confirmed' end,
        now() - interval '6 days' + (v_idx * interval '2 hours'),
        case when v_idx <= 11 then v_live_start + (v_idx * interval '3 minutes') else now() - interval '3 days' end
      )
      on conflict (qr_token) do nothing
      returning id into v_reg_id;

      if v_reg_id is not null and v_idx <= 11 and v_gov_ssc is not null then
        insert into public.attendance_records (proposal_id, student_id, registration_id, verified_by, check_in_method, check_in_at)
        values (
          v_p3, v_uid, v_reg_id, v_gov_ssc, v_method,
          v_live_start + (v_idx * interval '3 minutes')
        )
        on conflict (proposal_id, student_id) do nothing;
      end if;
    end loop;

    -- Event 4 (Upcoming CABM Entrepreneurship Summit): 20 confirmed passes + 1 withdrawn
    for v_idx in 1..least(21, array_length(v_attendee_pool, 1)) loop
      v_uid := v_attendee_pool[((v_idx + 1) % array_length(v_attendee_pool, 1)) + 1];
      v_qr  := md5(v_p4::text || ':' || v_uid::text);
      insert into public.event_registrations (proposal_id, student_id, qr_token, status, created_at, updated_at)
      values (
        v_p4, v_uid, v_qr,
        case when v_idx <= 20 then 'confirmed' else 'withdrawn' end,
        now() - interval '5 days' + (v_idx * interval '2 hours'),
        now() - interval '5 days' + (v_idx * interval '2 hours')
      )
      on conflict (qr_token) do nothing;
    end loop;

    -- Event 5 (Upcoming Gabay Cultural Night): 28 confirmed passes across all orgs
    for v_idx in 1..least(28, array_length(v_attendee_pool, 1)) loop
      v_uid := v_attendee_pool[v_idx];
      v_qr  := md5(v_p5::text || ':' || v_uid::text);
      insert into public.event_registrations (proposal_id, student_id, qr_token, status, created_at, updated_at)
      values (
        v_p5, v_uid, v_qr, 'confirmed',
        now() - interval '4 days' + (v_idx * interval '90 minutes'),
        now() - interval '4 days' + (v_idx * interval '90 minutes')
      )
      on conflict (qr_token) do nothing;
    end loop;

    -- Event 6 (Upcoming TRC Sports Invitational): 22 confirmed passes
    for v_idx in 1..least(22, array_length(v_attendee_pool, 1)) loop
      v_uid := v_attendee_pool[((v_idx + 9) % array_length(v_attendee_pool, 1)) + 1];
      v_qr  := md5(v_p6::text || ':' || v_uid::text);
      insert into public.event_registrations (proposal_id, student_id, qr_token, status, created_at, updated_at)
      values (
        v_p6, v_uid, v_qr, 'confirmed',
        now() - interval '3 days' + (v_idx * interval '1 hour'),
        now() - interval '3 days' + (v_idx * interval '1 hour')
      )
      on conflict (qr_token) do nothing;
    end loop;

    -- Event 7 (Upcoming KCPEEP Mindful Finals Workshop): 16 confirmed passes + 1 withdrawn
    for v_idx in 1..least(17, array_length(v_attendee_pool, 1)) loop
      v_uid := v_attendee_pool[((v_idx + 14) % array_length(v_attendee_pool, 1)) + 1];
      v_qr  := md5(v_p7::text || ':' || v_uid::text);
      insert into public.event_registrations (proposal_id, student_id, qr_token, status, created_at, updated_at)
      values (
        v_p7, v_uid, v_qr,
        case when v_idx <= 16 then 'confirmed' else 'withdrawn' end,
        now() - interval '2 days' + (v_idx * interval '1 hour'),
        now() - interval '2 days' + (v_idx * interval '1 hour')
      )
      on conflict (qr_token) do nothing;
    end loop;

  end if;

  -- ---------------------------------------------------------------------------
  -- 4. Seed Coordinated In-App Notifications Across Roles
  -- ---------------------------------------------------------------------------
  -- Notify OSAS & Superadmins of the 2 endorsed proposals awaiting final approval
  if v_superadmin_ids is not null then
    foreach v_uid in array v_superadmin_ids loop
      insert into public.notifications (user_id, title, message, link, is_read, created_at)
      values
        (
          v_uid,
          'Proposal Endorsed for Final Review',
          '"Forensic Science & Campus Safety Awareness Symposium" (CCJE SBO) was endorsed by its faculty adviser and awaits Student Affairs approval.',
          '/events/' || v_p8::text || '?view=review',
          false,
          '2026-11-23 16:05:00+08'::timestamptz
        ),
        (
          v_uid,
          'Proposal Endorsed for Final Review',
          '"Demo Teaching & Inclusive Classroom Innovation Expo" (CTELA SBO) was endorsed by its faculty adviser and awaits Student Affairs approval.',
          '/events/' || v_p9::text || '?view=review',
          false,
          '2026-11-24 09:20:00+08'::timestamptz
        ),
        (
          v_uid,
          'Live Check-In Window Open',
          'Attendance check-in is currently live for "KCP Student Leaders Governance Forum & Budget Townhall" (SSC) at Multi-Purpose Hall (MPH).',
          '/attendance/' || v_p3::text,
          false,
          v_live_start
        );
    end loop;
  end if;

  -- Notify COT SBO adviser of pending endorsement
  if v_adv_cot is not null then
    insert into public.notifications (user_id, title, message, link, is_read, created_at)
    values (
      v_adv_cot,
      'Proposal Awaiting Endorsement',
      'COT SBO submitted "Season of Gratitude: Interfaith Community Outreach & Gift Drive" for faculty adviser review.',
      '/events/' || v_p10::text || '?view=review',
      false,
      '2026-11-24 14:05:00+08'::timestamptz
    );
  end if;

  -- Notify CIT SBO governor of returned proposal
  if v_gov_cit is not null then
    insert into public.notifications (user_id, title, message, link, is_read, created_at)
    values (
      v_gov_cit,
      'Revision Requested on Proposal',
      '"Winter Hackathon: Campus Civic Tech Sprint" was returned for revision by your faculty adviser. Review the remarks and update your submission.',
      '/events/' || v_p11::text || '?view=review',
      false,
      '2026-11-24 11:35:00+08'::timestamptz
    );
  end if;

end
$$;
