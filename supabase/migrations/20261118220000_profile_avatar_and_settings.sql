-- =============================================================================
-- OrGanap — User Profile Preferences, Avatar Storage RLS & System Settings Seed
-- Migration: 20261118220000_profile_avatar_and_settings.sql
--
-- 1. Adds persisted `preferences jsonb` column on `public.profiles`
-- 2. Adds scoped Storage RLS policies on `organap-assets` for `avatars/<uid>/*`
-- 3. Seeds default institutional rows in `public.system_settings`
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. User Preferences Column on public.profiles
-- -----------------------------------------------------------------------------

alter table public.profiles
  add column if not exists preferences jsonb not null default '{}'::jsonb;

-- -----------------------------------------------------------------------------
-- 2. User Avatar Storage Policies (organap-assets/avatars/<user_id>/*)
-- -----------------------------------------------------------------------------

drop policy if exists "organap_assets_avatar_insert" on storage.objects;
create policy "organap_assets_avatar_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'organap-assets'
    and (storage.foldername(name))[1] = 'avatars'
    and (
      (storage.foldername(name))[2] = auth.uid()::text
      or public.is_superuser(auth.uid())
      or public.has_perm('users.manage', auth.uid())
    )
  );

drop policy if exists "organap_assets_avatar_update" on storage.objects;
create policy "organap_assets_avatar_update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'organap-assets'
    and (storage.foldername(name))[1] = 'avatars'
    and (
      (storage.foldername(name))[2] = auth.uid()::text
      or public.is_superuser(auth.uid())
      or public.has_perm('users.manage', auth.uid())
    )
  );

drop policy if exists "organap_assets_avatar_delete" on storage.objects;
create policy "organap_assets_avatar_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'organap-assets'
    and (storage.foldername(name))[1] = 'avatars'
    and (
      (storage.foldername(name))[2] = auth.uid()::text
      or public.is_superuser(auth.uid())
      or public.has_perm('users.manage', auth.uid())
    )
  );

-- -----------------------------------------------------------------------------
-- 3. Seed Institutional System Settings Defaults
-- -----------------------------------------------------------------------------

insert into public.system_settings (key, value, description)
values
  (
    'institution_profile',
    jsonb_build_object(
      'institutionName', 'OrGanap University',
      'studentAffairsOffice', 'Office of Student Affairs & Services',
      'supportEmail', 'osas@organap.edu'
    ),
    'Institutional branding and official Student Affairs contact metadata displayed across portals.'
  ),
  (
    'proposal_policy',
    jsonb_build_object(
      'activeSemesterId', null,
      'minLeadDays', 7,
      'requireAdviserEndorsement', true,
      'defaultVenueCapacity', 50
    ),
    'Campus event proposal lead-time rules, adviser endorsement requirement, active semester, and default venue parameters.'
  )
on conflict (key) do nothing;
