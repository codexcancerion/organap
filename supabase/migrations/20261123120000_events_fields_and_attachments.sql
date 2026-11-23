-- =============================================================================
-- OrGanap — Events Rationale Consolidation, Activity Type, Semester Link,
-- and Dynamic Event Attachments Feature
-- Migration: 20261123120000_events_fields_and_attachments.sql
--
-- 1. Updates `public.event_proposals`:
--    - Consolidates `purpose` & `activities_desc` (makes `activities_desc` nullable with default '')
--    - Adds `activity_type` (`text` with default 'seminar')
--    - Adds `semester_id` (`uuid` FK to `public.semesters(id)` on delete set null)
-- 2. Allows authenticated users to read `public.semesters` for event/proposal forms & displays
-- 3. Creates `public.attachment_types` & seeds initial SOAMS reference types (dynamically managed via UI)
-- 4. Creates `public.event_attachments` linked to `event_proposals` and `attachment_types`
-- 5. Updates `organap-assets` storage bucket & RLS policies for `events/` uploads
-- 6. Seeds granular `attachments.*` permissions and initial SOAMS attachment types
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Event Proposals Schema Enhancements
-- -----------------------------------------------------------------------------

alter table public.event_proposals
  alter column activities_desc set default '';

alter table public.event_proposals
  alter column activities_desc drop not null;

alter table public.event_proposals
  add column if not exists activity_type text not null default 'seminar',
  add column if not exists semester_id uuid references public.semesters(id) on delete set null;

create index if not exists idx_event_proposals_semester
  on public.event_proposals(semester_id);

create index if not exists idx_event_proposals_activity_type
  on public.event_proposals(activity_type);

-- Merge distinct legacy activities_desc text into purpose so unified rationale preserves all existing notes
update public.event_proposals
set purpose = case
  when trim(coalesce(activities_desc, '')) != ''
       and position(trim(activities_desc) in purpose) = 0
    then purpose || E'\n\n' || trim(activities_desc)
  else purpose
end
where trim(coalesce(activities_desc, '')) != '';

-- Allow authenticated users to resolve semester metadata on event proposals & forms
drop policy if exists "semesters_select" on public.semesters;
create policy "semesters_select"
  on public.semesters
  for select
  using (
    auth.uid() is not null
    or public.has_perm('semesters.view')
    or public.has_perm('proposals.create')
  );

-- -----------------------------------------------------------------------------
-- 2. Dynamic Event Attachment Requirement Types (`public.attachment_types`)
-- -----------------------------------------------------------------------------

create table if not exists public.attachment_types (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  code        text not null,
  category    text,
  description text,
  is_required boolean not null default false,
  is_active   boolean not null default true,
  template_file_name text,
  template_file_path text,
  template_file_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.attachment_types
  add column if not exists category text,
  add column if not exists template_file_name text,
  add column if not exists template_file_path text,
  add column if not exists template_file_url text;

create unique index if not exists attachment_types_code_idx
  on public.attachment_types (lower(trim(code)));

create unique index if not exists attachment_types_name_idx
  on public.attachment_types (lower(trim(name)));

alter table public.attachment_types enable row level security;
grant select, insert, update, delete on public.attachment_types to authenticated, service_role;

drop policy if exists "attachment_types_select" on public.attachment_types;
create policy "attachment_types_select"
  on public.attachment_types
  for select
  using (
    (auth.uid() is not null and is_active = true)
    or public.has_perm('attachments.view')
    or public.has_perm('attachments.create')
    or public.has_perm('attachments.change')
    or public.has_perm('attachments.delete')
    or public.is_staff()
    or public.is_superuser()
  );

drop policy if exists "attachment_types_insert" on public.attachment_types;
create policy "attachment_types_insert"
  on public.attachment_types
  for insert
  with check (
    public.has_perm('attachments.create')
    or public.is_superuser()
  );

drop policy if exists "attachment_types_update" on public.attachment_types;
create policy "attachment_types_update"
  on public.attachment_types
  for update
  using (
    public.has_perm('attachments.change')
    or public.is_superuser()
  )
  with check (
    public.has_perm('attachments.change')
    or public.is_superuser()
  );

drop policy if exists "attachment_types_delete" on public.attachment_types;
create policy "attachment_types_delete"
  on public.attachment_types
  for delete
  using (
    public.has_perm('attachments.delete')
    or public.is_superuser()
  );

-- -----------------------------------------------------------------------------
-- 3. Per-Event Uploaded Attachments (`public.event_attachments`)
-- -----------------------------------------------------------------------------

create table if not exists public.event_attachments (
  id                 uuid primary key default gen_random_uuid(),
  proposal_id        uuid not null references public.event_proposals(id) on delete cascade,
  attachment_type_id uuid references public.attachment_types(id) on delete set null,
  file_name          text not null,
  file_path          text not null,
  file_url           text not null,
  mime_type          text,
  size_bytes         bigint,
  uploaded_by        uuid references public.profiles(id) on delete set null,
  created_at         timestamptz not null default now()
);

create index if not exists idx_event_attachments_proposal
  on public.event_attachments(proposal_id);

create index if not exists idx_event_attachments_type
  on public.event_attachments(attachment_type_id);

alter table public.event_attachments enable row level security;
grant select, insert, update, delete on public.event_attachments to authenticated, service_role;

drop policy if exists "event_attachments_select" on public.event_attachments;
create policy "event_attachments_select"
  on public.event_attachments
  for select
  using (
    exists (
      select 1
      from public.event_proposals ep
      where ep.id = event_attachments.proposal_id
        and (
          ep.status in ('approved', 'cancelled')
          or ep.created_by = auth.uid()
          or public.is_org_officer(ep.organization_id)
          or public.is_org_adviser(ep.organization_id)
          or public.is_staff()
          or public.is_superuser()
          or public.has_perm('proposals.view')
          or public.has_perm('proposals.approve')
          or public.has_perm('proposals.endorse')
          or public.has_perm('attachments.view')
        )
    )
  );

drop policy if exists "event_attachments_insert" on public.event_attachments;
create policy "event_attachments_insert"
  on public.event_attachments
  for insert
  with check (
    exists (
      select 1
      from public.event_proposals ep
      where ep.id = event_attachments.proposal_id
        and (
          (
            (
              ep.created_by = auth.uid()
              or public.is_org_officer(ep.organization_id)
              or public.has_perm('proposals.create')
            )
            and ep.status in ('draft', 'returned_by_adviser', 'returned_by_student_affairs')
          )
          or public.is_staff()
          or public.is_superuser()
          or public.has_perm('attachments.change')
        )
    )
  );

drop policy if exists "event_attachments_update" on public.event_attachments;
create policy "event_attachments_update"
  on public.event_attachments
  for update
  using (
    exists (
      select 1
      from public.event_proposals ep
      where ep.id = event_attachments.proposal_id
        and (
          (
            (
              ep.created_by = auth.uid()
              or public.is_org_officer(ep.organization_id)
              or public.has_perm('proposals.create')
            )
            and ep.status in ('draft', 'returned_by_adviser', 'returned_by_student_affairs')
          )
          or public.is_staff()
          or public.is_superuser()
          or public.has_perm('attachments.change')
        )
    )
  );

drop policy if exists "event_attachments_delete" on public.event_attachments;
create policy "event_attachments_delete"
  on public.event_attachments
  for delete
  using (
    exists (
      select 1
      from public.event_proposals ep
      where ep.id = event_attachments.proposal_id
        and (
          (
            (
              ep.created_by = auth.uid()
              or public.is_org_officer(ep.organization_id)
              or public.has_perm('proposals.create')
            )
            and ep.status in ('draft', 'returned_by_adviser', 'returned_by_student_affairs')
          )
          or public.is_staff()
          or public.is_superuser()
          or public.has_perm('attachments.change')
        )
    )
  );

-- -----------------------------------------------------------------------------
-- 4. Storage Bucket & Event Attachments Policies (`organap-assets`)
-- -----------------------------------------------------------------------------

update storage.buckets
set
  file_size_limit = 10485760,
  allowed_mime_types = array[
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
where id = 'organap-assets';

drop policy if exists "organap_assets_events_insert" on storage.objects;
create policy "organap_assets_events_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'organap-assets'
    and (storage.foldername(name))[1] = 'events'
    and (
      public.is_superuser(auth.uid())
      or public.is_staff(auth.uid())
      or public.has_perm('proposals.create', auth.uid())
      or public.has_perm('attachments.create', auth.uid())
      or public.has_perm('attachments.change', auth.uid())
      or exists (
        select 1
        from public.organization_members om
        where om.user_id = auth.uid()
          and om.is_officer = true
      )
      or exists (
        select 1
        from public.organizations o
        where o.governor_id = auth.uid()
      )
    )
  );

drop policy if exists "organap_assets_events_update" on storage.objects;
create policy "organap_assets_events_update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'organap-assets'
    and (storage.foldername(name))[1] = 'events'
    and (
      public.is_superuser(auth.uid())
      or public.is_staff(auth.uid())
      or public.has_perm('proposals.create', auth.uid())
      or public.has_perm('attachments.create', auth.uid())
      or public.has_perm('attachments.change', auth.uid())
      or exists (
        select 1
        from public.organization_members om
        where om.user_id = auth.uid()
          and om.is_officer = true
      )
      or exists (
        select 1
        from public.organizations o
        where o.governor_id = auth.uid()
      )
    )
  );

drop policy if exists "organap_assets_events_delete" on storage.objects;
create policy "organap_assets_events_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'organap-assets'
    and (storage.foldername(name))[1] = 'events'
    and (
      public.is_superuser(auth.uid())
      or public.is_staff(auth.uid())
      or public.has_perm('proposals.create', auth.uid())
      or public.has_perm('attachments.create', auth.uid())
      or public.has_perm('attachments.change', auth.uid())
      or exists (
        select 1
        from public.organization_members om
        where om.user_id = auth.uid()
          and om.is_officer = true
      )
      or exists (
        select 1
        from public.organizations o
        where o.governor_id = auth.uid()
      )
    )
  );

-- -----------------------------------------------------------------------------
-- 5. Granular Permissions Seed (`attachments.*`)
-- -----------------------------------------------------------------------------

insert into public.permissions (code, name, module, description)
values
  ('attachments.view',   'Can view event attachments',   'attachments', 'Browse and configure event attachment requirement types'),
  ('attachments.create', 'Can create event attachments', 'attachments', 'Define new event attachment requirement types'),
  ('attachments.change', 'Can edit event attachments',   'attachments', 'Update event attachment requirement types and mandatory rules'),
  ('attachments.delete', 'Can delete event attachments', 'attachments', 'Remove event attachment requirement types')
on conflict (code) do update set
  name = excluded.name,
  module = excluded.module,
  description = excluded.description;

-- -----------------------------------------------------------------------------
-- 6. Initial Activity Attachment Types Seed (`soams-kcp` Reference Inventory)
-- -----------------------------------------------------------------------------

insert into public.attachment_types (name, code, category, description, is_required, is_active)
values
  -- Documents (soams-kcp/data/DocumentsData.tsx -> documentsData.documents)
  (
    'Activity Poster',
    'ACTIVITY_POSTER',
    'Documents',
    'Poster showcasing details of the activity in landscape 16:9 image format.',
    true,
    true
  ),
  (
    'Program Paper',
    'PROGRAM_PAPER',
    'Documents',
    'Detailed outline of the program''s activities in PDF format.',
    true,
    true
  ),
  (
    'Venue Reservation Form',
    'VENUE_RESERVATION_FORM',
    'Documents',
    'Form for reserving the campus venue for the activity in PDF format.',
    true,
    true
  ),

  -- For Student Organizations (documentsData.forStudentOrganizations)
  (
    'Minutes of Meeting',
    'MINUTES_OF_MEETING',
    'For Student Organizations',
    'Record of discussions and decisions made during the organization meeting in PDF format.',
    false,
    true
  ),
  (
    'Purchase Request',
    'PURCHASE_REQUEST',
    'For Student Organizations',
    'Student Development Fund (SDF) cash advance or purchase request form in PDF format.',
    false,
    true
  ),

  -- For Activities with Invited Guests (documentsData.forActivitiesWithInvitedGuests)
  (
    'Invitation Letter to Guests',
    'INVITATION_LETTER_TO_GUESTS',
    'For Activities with Invited Guests',
    'Official letter inviting external guests or speakers to the activity in PDF format.',
    false,
    true
  ),
  (
    'Curriculum Vitae / Bionote of Guests',
    'GUEST_CV_BIONOTE',
    'For Activities with Invited Guests',
    'Short biography or Curriculum Vitae of invited guests or speakers in PDF format.',
    false,
    true
  ),

  -- For Off-Campus Activities (documentsData.forOffCampusActivities)
  (
    'Certificate of Issuance of First Aid Kit',
    'FIRST_AID_KIT_CERTIFICATE',
    'For Off-Campus Activities',
    'Certification for the provision of a first aid kit for off-campus activities in PDF format.',
    false,
    true
  ),
  (
    'Insurance',
    'INSURANCE',
    'For Off-Campus Activities',
    'Proof of insurance coverage for participants in off-campus activities in PDF format.',
    false,
    true
  ),
  (
    'Mobility and Transport Arrangements',
    'MOBILITY_AND_TRANSPORT',
    'For Off-Campus Activities',
    'Details of transportation and mobility arrangements for off-campus activities in PDF format.',
    false,
    true
  ),
  (
    'Parent''s / Guardian''s Consent Form',
    'PARENTS_CONSENT_FORM',
    'For Off-Campus Activities',
    'Consent form signed by parents or guardians for off-campus participation in PDF format.',
    false,
    true
  ),
  (
    'Certificate of Appointment of Personnel-in-Charge',
    'PERSONNEL_IN_CHARGE_CERTIFICATE',
    'For Off-Campus Activities',
    'Appointment letter for faculty or personnel responsible for the off-campus activity in PDF format.',
    false,
    true
  ),
  (
    'Invitation Letters / Letters to LGUs',
    'LETTERS_TO_LGUS',
    'For Off-Campus Activities',
    'Coordination or invitation letters sent to local government units (LGUs) or partner agencies in PDF format.',
    false,
    true
  )
on conflict (lower(trim(code))) do update set
  name = excluded.name,
  code = excluded.code,
  category = excluded.category,
  description = excluded.description,
  is_required = excluded.is_required,
  is_active = excluded.is_active,
  updated_at = now();

delete from public.attachment_types
where lower(trim(code)) = 'accomplishment_report';

-- -----------------------------------------------------------------------------
-- 7. Collaborative Organization Lifecycle Helpers & RLS Policies
-- -----------------------------------------------------------------------------

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
    select 1 from public.organizations o
    where o.id = p_org_id
      and o.governor_id = p_user_id
  )
  or exists (
    select 1 from public.organization_members om
    where om.organization_id = p_org_id
      and om.user_id = p_user_id
      and om.is_officer = true
  );
$$;

create or replace function public.is_org_adviser(p_org_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.is_superuser(p_user_id)
  or exists (
    select 1 from public.organizations o
    where o.id = p_org_id
      and o.adviser_id = p_user_id
  )
  or exists (
    select 1 from public.organization_members om
    where om.organization_id = p_org_id
      and om.user_id = p_user_id
      and om.is_adviser = true
  );
$$;

create or replace function public.is_org_member(p_org_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select p_user_id is not null and (
    public.is_superuser(p_user_id)
    or exists (
      select 1 from public.organizations o
      where o.id = p_org_id
        and (o.governor_id = p_user_id or o.adviser_id = p_user_id)
    )
    or exists (
      select 1 from public.organization_members om
      where om.organization_id = p_org_id
        and om.user_id = p_user_id
    )
  );
$$;

grant execute on function public.is_org_member to authenticated, service_role;

drop policy if exists "event_proposals_select" on public.event_proposals;
create policy "event_proposals_select"
  on public.event_proposals
  for select
  using (
    status in ('approved', 'cancelled')
    or created_by = auth.uid()
    or public.is_org_member(organization_id)
    or public.is_org_officer(organization_id)
    or public.is_org_adviser(organization_id)
    or public.is_staff()
    or public.is_superuser()
    or public.has_perm('proposals.view')
    or public.has_perm('proposals.approve')
    or public.has_perm('proposals.endorse')
  );

drop policy if exists "event_proposals_insert" on public.event_proposals;
create policy "event_proposals_insert"
  on public.event_proposals
  for insert
  with check (
    public.is_org_member(organization_id)
    or public.is_org_officer(organization_id)
    or public.is_staff()
    or public.is_superuser()
    or public.has_perm('proposals.create')
  );

drop policy if exists "event_proposals_update" on public.event_proposals;
create policy "event_proposals_update"
  on public.event_proposals
  for update
  using (
    (
      (
        created_by = auth.uid()
        or public.is_org_member(organization_id)
        or public.is_org_officer(organization_id)
        or public.has_perm('proposals.create')
      )
      and status in ('draft', 'returned_by_adviser', 'returned_by_student_affairs')
    )
    or public.is_org_adviser(organization_id)
    or public.is_staff()
    or public.is_superuser()
    or public.has_perm('proposals.approve')
    or public.has_perm('proposals.endorse')
  )
  with check (
    (
      (
        created_by = auth.uid()
        or public.is_org_member(organization_id)
        or public.is_org_officer(organization_id)
        or public.has_perm('proposals.create')
      )
      and status in ('draft', 'pending_adviser', 'returned_by_adviser', 'returned_by_student_affairs')
    )
    or (
      (public.is_org_adviser(organization_id) or public.has_perm('proposals.endorse'))
      and status in ('pending_student_affairs', 'returned_by_adviser', 'rejected_by_adviser')
    )
    or public.is_staff()
    or public.is_superuser()
    or public.has_perm('proposals.approve')
  );

drop policy if exists "event_proposals_delete" on public.event_proposals;
create policy "event_proposals_delete"
  on public.event_proposals
  for delete
  using (
    (
      (
        created_by = auth.uid()
        or public.is_org_member(organization_id)
        or public.is_org_officer(organization_id)
      )
      and status = 'draft'
    )
    or public.is_staff()
    or public.is_superuser()
  );

drop policy if exists "proposal_reviews_select" on public.proposal_reviews;
create policy "proposal_reviews_select"
  on public.proposal_reviews
  for select
  using (
    public.is_org_member((select organization_id from public.event_proposals where id = proposal_id))
    or public.is_org_officer((select organization_id from public.event_proposals where id = proposal_id))
    or public.is_org_adviser((select organization_id from public.event_proposals where id = proposal_id))
    or public.is_staff()
    or public.is_superuser()
    or public.has_perm('proposals.view')
    or public.has_perm('proposals.approve')
    or public.has_perm('proposals.endorse')
    or exists (
      select 1 from public.event_proposals ep
      where ep.id = proposal_id and ep.created_by = auth.uid()
    )
  );

drop policy if exists "event_attachments_select" on public.event_attachments;
create policy "event_attachments_select"
  on public.event_attachments
  for select
  using (
    exists (
      select 1
      from public.event_proposals ep
      where ep.id = event_attachments.proposal_id
        and (
          ep.status in ('approved', 'cancelled')
          or ep.created_by = auth.uid()
          or public.is_org_member(ep.organization_id)
          or public.is_org_officer(ep.organization_id)
          or public.is_org_adviser(ep.organization_id)
          or public.is_staff()
          or public.is_superuser()
          or public.has_perm('proposals.view')
          or public.has_perm('proposals.approve')
          or public.has_perm('proposals.endorse')
          or public.has_perm('attachments.view')
        )
    )
  );

drop policy if exists "event_attachments_insert" on public.event_attachments;
create policy "event_attachments_insert"
  on public.event_attachments
  for insert
  with check (
    exists (
      select 1
      from public.event_proposals ep
      where ep.id = event_attachments.proposal_id
        and (
          (
            (
              ep.created_by = auth.uid()
              or public.is_org_member(ep.organization_id)
              or public.is_org_officer(ep.organization_id)
              or public.has_perm('proposals.create')
            )
            and ep.status in ('draft', 'returned_by_adviser', 'returned_by_student_affairs')
          )
          or public.is_staff()
          or public.is_superuser()
          or public.has_perm('attachments.change')
        )
    )
  );

drop policy if exists "event_attachments_update" on public.event_attachments;
create policy "event_attachments_update"
  on public.event_attachments
  for update
  using (
    exists (
      select 1
      from public.event_proposals ep
      where ep.id = event_attachments.proposal_id
        and (
          (
            (
              ep.created_by = auth.uid()
              or public.is_org_member(ep.organization_id)
              or public.is_org_officer(ep.organization_id)
              or public.has_perm('proposals.create')
            )
            and ep.status in ('draft', 'returned_by_adviser', 'returned_by_student_affairs')
          )
          or public.is_staff()
          or public.is_superuser()
          or public.has_perm('attachments.change')
        )
    )
  );

drop policy if exists "event_attachments_delete" on public.event_attachments;
create policy "event_attachments_delete"
  on public.event_attachments
  for delete
  using (
    exists (
      select 1
      from public.event_proposals ep
      where ep.id = event_attachments.proposal_id
        and (
          (
            (
              ep.created_by = auth.uid()
              or public.is_org_member(ep.organization_id)
              or public.is_org_officer(ep.organization_id)
              or public.has_perm('proposals.create')
            )
            and ep.status in ('draft', 'returned_by_adviser', 'returned_by_student_affairs')
          )
          or public.is_staff()
          or public.is_superuser()
          or public.has_perm('attachments.change')
        )
    )
  );

drop policy if exists "organap_assets_events_insert" on storage.objects;
create policy "organap_assets_events_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'organap-assets'
    and (storage.foldername(name))[1] = 'events'
    and (
      public.is_superuser(auth.uid())
      or public.is_staff(auth.uid())
      or public.has_perm('proposals.create', auth.uid())
      or public.has_perm('attachments.create', auth.uid())
      or public.has_perm('attachments.change', auth.uid())
      or exists (
        select 1
        from public.organization_members om
        where om.user_id = auth.uid()
      )
      or exists (
        select 1
        from public.organizations o
        where o.governor_id = auth.uid()
          or o.adviser_id = auth.uid()
      )
    )
  );

drop policy if exists "organap_assets_events_update" on storage.objects;
create policy "organap_assets_events_update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'organap-assets'
    and (storage.foldername(name))[1] = 'events'
    and (
      public.is_superuser(auth.uid())
      or public.is_staff(auth.uid())
      or public.has_perm('proposals.create', auth.uid())
      or public.has_perm('attachments.create', auth.uid())
      or public.has_perm('attachments.change', auth.uid())
      or exists (
        select 1
        from public.organization_members om
        where om.user_id = auth.uid()
      )
      or exists (
        select 1
        from public.organizations o
        where o.governor_id = auth.uid()
          or o.adviser_id = auth.uid()
      )
    )
  );

drop policy if exists "organap_assets_events_delete" on storage.objects;
create policy "organap_assets_events_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'organap-assets'
    and (storage.foldername(name))[1] = 'events'
    and (
      public.is_superuser(auth.uid())
      or public.is_staff(auth.uid())
      or public.has_perm('proposals.create', auth.uid())
      or public.has_perm('attachments.create', auth.uid())
      or public.has_perm('attachments.change', auth.uid())
      or exists (
        select 1
        from public.organization_members om
        where om.user_id = auth.uid()
      )
      or exists (
        select 1
        from public.organizations o
        where o.governor_id = auth.uid()
          or o.adviser_id = auth.uid()
      )
    )
  );
