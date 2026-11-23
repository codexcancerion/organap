-- =============================================================================
-- Migration: 20261123170000_create_and_assign_org_advisers.sql
-- Creates and assigns one anonymized Faculty Adviser account per recognized
-- student organization across all 10 organizations (password: Password123!).
-- =============================================================================

do $$
declare
  v_password_hash text;
  v_group_advisers uuid;
  v_group_students uuid;
  v_org_id uuid;
  v_meta jsonb;
  v_rec record;
begin
  v_password_hash := extensions.crypt('Password123!', extensions.gen_salt('bf'));

  select id into v_group_advisers
  from public.groups
  where name = 'Faculty Advisers'
  limit 1;

  select id into v_group_students
  from public.groups
  where name = 'Students'
  limit 1;

  for v_rec in
    select *
    from (
      values
        ('a1b2c3d4-e5f6-4a7b-8c9d-000000000101'::uuid, 'adviser01@organap.edu', 'Prof. Avery Castellanos', 'ORG-FAC-001', 'cit-sbo'),
        ('a1b2c3d4-e5f6-4a7b-8c9d-000000000102'::uuid, 'adviser02@organap.edu', 'Prof. Quinn Alcaraz',     'ORG-FAC-002', 'cabm-sbo'),
        ('a1b2c3d4-e5f6-4a7b-8c9d-000000000103'::uuid, 'adviser03@organap.edu', 'Prof. Rowan Ferrer',      'ORG-FAC-003', 'ccje-sbo'),
        ('a1b2c3d4-e5f6-4a7b-8c9d-000000000104'::uuid, 'adviser04@organap.edu', 'Prof. Ellis Soriano',     'ORG-FAC-004', 'theology-sbo'),
        ('a1b2c3d4-e5f6-4a7b-8c9d-000000000105'::uuid, 'adviser05@organap.edu', 'Prof. Blair Mendoza',     'ORG-FAC-005', 'ctela-sbo'),
        ('a1b2c3d4-e5f6-4a7b-8c9d-000000000106'::uuid, 'adviser06@organap.edu', 'Prof. Sage Villareal',    'ORG-FAC-006', 'gabay'),
        ('a1b2c3d4-e5f6-4a7b-8c9d-000000000107'::uuid, 'adviser07@organap.edu', 'Prof. Drew Villanueva',   'ORG-FAC-007', 'psych-club'),
        ('a1b2c3d4-e5f6-4a7b-8c9d-000000000108'::uuid, 'adviser08@organap.edu', 'Prof. Reese Tolentino',   'ORG-FAC-008', 'ssc'),
        ('a1b2c3d4-e5f6-4a7b-8c9d-000000000109'::uuid, 'adviser09@organap.edu', 'Prof. Kai Evangelista',   'ORG-FAC-009', 'loquitor'),
        ('a1b2c3d4-e5f6-4a7b-8c9d-000000000110'::uuid, 'adviser10@organap.edu', 'Prof. Cameron Morales',   'ORG-FAC-010', 'ruling-conquerors')
    ) as t(id, email, display_name, school_id, org_slug)
  loop
    v_meta := jsonb_build_object(
      'sub', v_rec.id::text,
      'email', v_rec.email,
      'display_name', v_rec.display_name,
      'full_name', v_rec.display_name,
      'school_id', v_rec.school_id,
      'email_verified', true,
      'phone_verified', false
    );

    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      email_change_token_current,
      phone_change,
      phone_change_token,
      reauthentication_token,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      is_sso_user,
      is_anonymous
    )
    values (
      '00000000-0000-0000-0000-000000000000'::uuid,
      v_rec.id,
      'authenticated',
      'authenticated',
      v_rec.email,
      v_password_hash,
      now(),
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      v_meta,
      now(),
      now(),
      false,
      false
    )
    on conflict (id) do update set
      email = excluded.email,
      encrypted_password = excluded.encrypted_password,
      email_confirmed_at = coalesce(auth.users.email_confirmed_at, now()),
      raw_user_meta_data = excluded.raw_user_meta_data,
      updated_at = now();

    insert into auth.identities (
      id,
      provider_id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    )
    values (
      gen_random_uuid(),
      v_rec.id::text,
      v_rec.id,
      v_meta,
      'email',
      now(),
      now(),
      now()
    )
    on conflict (provider_id, provider) do update set
      identity_data = excluded.identity_data,
      updated_at = now();

    -- full_name is generated from display_name on public.profiles.
    insert into public.profiles (
      id,
      display_name,
      school_id,
      avatar_url,
      is_staff,
      is_superuser,
      is_active,
      email
    )
    values (
      v_rec.id,
      v_rec.display_name,
      v_rec.school_id,
      null,
      false,
      false,
      true,
      v_rec.email
    )
    on conflict (id) do update set
      display_name = excluded.display_name,
      school_id = excluded.school_id,
      avatar_url = null,
      email = excluded.email,
      is_active = true,
      updated_at = now();

    if v_group_students is not null then
      delete from public.user_groups
      where user_id = v_rec.id and group_id = v_group_students;
    end if;

    if v_group_advisers is not null then
      insert into public.user_groups (user_id, group_id)
      values (v_rec.id, v_group_advisers)
      on conflict do nothing;
    end if;

    select id into v_org_id
    from public.organizations
    where slug = v_rec.org_slug
    limit 1;

    if v_org_id is not null then
      insert into public.organization_members (
        organization_id,
        user_id,
        position,
        position_title,
        is_officer,
        is_adviser
      )
      values (
        v_org_id,
        v_rec.id,
        'Faculty Adviser',
        'Faculty Adviser',
        false,
        true
      )
      on conflict (organization_id, user_id) do update set
        position = excluded.position,
        position_title = excluded.position_title,
        is_officer = false,
        is_adviser = true;

      update public.organizations
      set
        adviser_id = v_rec.id,
        updated_at = now()
      where id = v_org_id;
    end if;
  end loop;
end
$$;
