-- =============================================================================
-- Migration: 20261125032137_singularize_group_names.sql
-- Renames plural role group names to singular form ("Student",
-- "Student Organization Officer", "Faculty Adviser") while preserving
-- "Student Affairs", and updates handle_new_user() to assign "Student".
-- =============================================================================

update public.groups
set
  name = 'Faculty Adviser',
  description = 'Academic or organization adviser responsible for vetting and endorsing event proposals.',
  updated_at = now()
where name = 'Faculty Advisers'
  and not exists (select 1 from public.groups where name = 'Faculty Adviser');

update public.groups
set
  name = 'Student Organization Officer',
  description = 'Designated organization leader responsible for drafting event proposals, managing rosters, and verifying attendance.',
  updated_at = now()
where name = 'Student Organization Officers'
  and not exists (select 1 from public.groups where name = 'Student Organization Officer');

update public.groups
set
  name = 'Student',
  description = 'Enrolled student eligible to browse campus events, register, and receive digital entry passes.',
  updated_at = now()
where name = 'Students'
  and not exists (select 1 from public.groups where name = 'Student');

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
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  v_school_id := new.raw_user_meta_data->>'school_id';

  insert into public.profiles (id, display_name, school_id, is_superuser, is_staff, email)
  values (new.id, v_name, v_school_id, v_is_superuser, v_is_staff, new.email)
  on conflict (id) do update
  set
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    school_id = coalesce(excluded.school_id, public.profiles.school_id),
    email = coalesce(excluded.email, public.profiles.email);

  -- Assign newly registered non-superusers to the default "Student" group
  if not v_is_superuser then
    select id into v_default_group_id
    from public.groups
    where name = 'Student'
    limit 1;

    if v_default_group_id is not null then
      insert into public.user_groups (user_id, group_id)
      values (new.id, v_default_group_id)
      on conflict do nothing;
    end if;
  end if;

  return new;
end;
$$;
