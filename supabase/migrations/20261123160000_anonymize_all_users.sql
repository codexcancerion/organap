-- =============================================================================
-- Migration: 20261123160000_anonymize_all_users.sql
-- Anonymizes all existing user accounts across public.profiles, auth.users,
-- and auth.identities using non-identifiable synthetic names, emails, and
-- school IDs, and clears all avatar_url values while preserving passwords
-- and role/organization memberships.
-- =============================================================================

do $$
declare
  v_su_names text[] := array[
    'Alex Mercer',
    'Samira Vance',
    'Nolan Prescott'
  ];
  v_staff_names text[] := array[
    'Morgan Reyes',
    'Taylor Navarro',
    'Jordan Velasco',
    'Casey Lim',
    'Riley Mendoza'
  ];
  v_adviser_names text[] := array[
    'Prof. Avery Castellanos',
    'Prof. Quinn Alcaraz',
    'Prof. Rowan Ferrer',
    'Prof. Ellis Soriano'
  ];
  v_first_names text[] := array[
    'Avery',
    'Blake',
    'Casey',
    'Devon',
    'Ellis',
    'Finley',
    'Harper',
    'Jamie',
    'Kendall',
    'Logan',
    'Micah',
    'Noah',
    'Parker',
    'Quinn',
    'Rowan',
    'Skyler'
  ];
  v_last_names text[] := array[
    'Alvarez',
    'Bautista',
    'Castillo',
    'Delgado',
    'Estrada',
    'Ferrer',
    'Gomez',
    'Hernandez',
    'Ibarra',
    'Jimenez',
    'Ledesma',
    'Marquez',
    'Nolasco',
    'Ocampo',
    'Peralta',
    'Salazar'
  ];

  v_su_idx int := 0;
  v_staff_idx int := 0;
  v_adviser_idx int := 0;
  v_student_idx int := 0;

  v_new_name text;
  v_new_email text;
  v_new_school_id text;
  v_first text;
  v_last text;
  v_meta jsonb;
  v_rec record;
begin
  -- Clear unique school_id, avatar URLs, and auth.users emails upfront to avoid intermediate collisions.
  update public.profiles
  set
    school_id = null,
    avatar_url = null;

  update auth.users
  set email = 'anon-' || id::text || '@organap.invalid';

  for v_rec in
    select
      p.id,
      p.is_superuser,
      p.is_staff,
      (
        coalesce(bool_or(om.is_adviser), false)
        or coalesce(bool_or(g.name = 'Faculty Advisers'), false)
      ) as is_adviser
    from public.profiles p
    left join public.organization_members om on om.user_id = p.id
    left join public.user_groups ug on ug.user_id = p.id
    left join public.groups g on g.id = ug.group_id
    group by p.id, p.is_superuser, p.is_staff, p.created_at
    order by
      p.is_superuser desc,
      p.is_staff desc,
      (
        coalesce(bool_or(om.is_adviser), false)
        or coalesce(bool_or(g.name = 'Faculty Advisers'), false)
      ) desc,
      p.created_at asc,
      p.id asc
  loop
    if v_rec.is_superuser then
      v_su_idx := v_su_idx + 1;
      v_new_name := coalesce(v_su_names[v_su_idx], 'Superuser ' || v_su_idx::text);
      v_new_email := case
        when v_su_idx = 1 then 'admin@organap.edu'
        else 'admin' || lpad(v_su_idx::text, 2, '0') || '@organap.edu'
      end;
      v_new_school_id := 'ORG-ADM-' || lpad(v_su_idx::text, 3, '0');

    elsif v_rec.is_staff then
      v_staff_idx := v_staff_idx + 1;
      v_new_name := coalesce(v_staff_names[v_staff_idx], 'Staff Member ' || v_staff_idx::text);
      v_new_email := 'staff' || lpad(v_staff_idx::text, 2, '0') || '@organap.edu';
      v_new_school_id := 'ORG-OSA-' || lpad(v_staff_idx::text, 3, '0');

    elsif v_rec.is_adviser then
      v_adviser_idx := v_adviser_idx + 1;
      v_new_name := coalesce(v_adviser_names[v_adviser_idx], 'Prof. Adviser ' || v_adviser_idx::text);
      v_new_email := 'adviser' || lpad(v_adviser_idx::text, 2, '0') || '@organap.edu';
      v_new_school_id := 'ORG-FAC-' || lpad(v_adviser_idx::text, 3, '0');

    else
      v_student_idx := v_student_idx + 1;
      v_first := v_first_names[(((v_student_idx - 1) / 16) % 16) + 1];
      v_last := v_last_names[((v_student_idx - 1) % 16) + 1];

      if v_student_idx > 256 then
        v_new_name := v_first || ' ' || v_last || ' ' || ((v_student_idx - 1) / 256 + 1)::text;
        v_new_email := lower(v_first || '.' || v_last) || ((v_student_idx - 1) / 256 + 1)::text || '@organap.edu';
      else
        v_new_name := v_first || ' ' || v_last;
        v_new_email := lower(v_first || '.' || v_last) || '@organap.edu';
      end if;

      v_new_school_id := '2027-' || lpad((1000 + v_student_idx)::text, 4, '0');
    end if;

    v_meta := jsonb_build_object(
      'sub', v_rec.id::text,
      'email', v_new_email,
      'display_name', v_new_name,
      'full_name', v_new_name,
      'school_id', v_new_school_id,
      'email_verified', true,
      'phone_verified', false
    );

    -- full_name on public.profiles is generated automatically from display_name.
    update public.profiles
    set
      display_name = v_new_name,
      email = v_new_email,
      school_id = v_new_school_id,
      avatar_url = null,
      updated_at = now()
    where id = v_rec.id;

    update auth.users
    set
      email = v_new_email,
      raw_user_meta_data = v_meta,
      updated_at = now()
    where id = v_rec.id;

    -- Do not set auth.identities.email directly; it is generated from identity_data->>'email'.
    update auth.identities
    set
      identity_data = v_meta,
      updated_at = now()
    where user_id = v_rec.id;
  end loop;
end $$;
