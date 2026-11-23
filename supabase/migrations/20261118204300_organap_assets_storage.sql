-- =============================================================================
-- Migration: 20261118000000_organap_assets_storage.sql
-- Description:
--   Ensure the public 'organap-assets' storage bucket exists and add RLS
--   policies on storage.objects so authorized organization creators, officers,
--   advisers, and institutional admins can upload, update, and remove logos.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'organap-assets',
  'organap-assets',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "organap_assets_public_select" on storage.objects;
create policy "organap_assets_public_select"
  on storage.objects
  for select
  using (bucket_id = 'organap-assets');

drop policy if exists "organap_assets_org_insert" on storage.objects;
create policy "organap_assets_org_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'organap-assets'
    and (storage.foldername(name))[1] = 'organizations'
    and (
      public.is_superuser(auth.uid())
      or public.is_staff(auth.uid())
      or public.has_perm('organizations.create', auth.uid())
      or public.has_perm('organizations.change_all', auth.uid())
      or public.has_perm('organizations.change', auth.uid())
      or public.has_perm('organizations.change_own', auth.uid())
      or exists (
        select 1
        from public.organizations o
        where o.governor_id = auth.uid()
           or o.adviser_id = auth.uid()
      )
    )
  );

drop policy if exists "organap_assets_org_update" on storage.objects;
create policy "organap_assets_org_update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'organap-assets'
    and (storage.foldername(name))[1] = 'organizations'
    and (
      public.is_superuser(auth.uid())
      or public.is_staff(auth.uid())
      or public.has_perm('organizations.create', auth.uid())
      or public.has_perm('organizations.change_all', auth.uid())
      or public.has_perm('organizations.change', auth.uid())
      or public.has_perm('organizations.change_own', auth.uid())
      or exists (
        select 1
        from public.organizations o
        where o.governor_id = auth.uid()
           or o.adviser_id = auth.uid()
      )
    )
  );

drop policy if exists "organap_assets_org_delete" on storage.objects;
create policy "organap_assets_org_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'organap-assets'
    and (storage.foldername(name))[1] = 'organizations'
    and (
      public.is_superuser(auth.uid())
      or public.is_staff(auth.uid())
      or public.has_perm('organizations.change_all', auth.uid())
      or public.has_perm('organizations.change', auth.uid())
      or public.has_perm('organizations.change_own', auth.uid())
      or exists (
        select 1
        from public.organizations o
        where o.governor_id = auth.uid()
           or o.adviser_id = auth.uid()
      )
    )
  );
