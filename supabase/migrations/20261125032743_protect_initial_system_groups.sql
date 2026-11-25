-- =============================================================================
-- Migration: 20261125032743_protect_initial_system_groups.sql
-- Restricts deletion and name tampering of the 4 initial system groups
-- ("Student", "Student Organization Officer", "Faculty Adviser",
-- "Student Affairs") via an is_system flag and BEFORE DELETE/UPDATE trigger.
-- =============================================================================

alter table public.groups
  add column if not exists is_system boolean not null default false;

update public.groups
set
  is_system = true,
  updated_at = now()
where name in (
  'Student',
  'Student Organization Officer',
  'Faculty Adviser',
  'Student Affairs',
  'Students',
  'Student Organization Officers',
  'Faculty Advisers'
);

create or replace function public.trg_protect_system_groups()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    if old.is_system then
      raise exception 'System group "%" is essential to OrGanap and cannot be deleted.', old.name;
    end if;
    return old;
  end if;

  if tg_op = 'UPDATE' then
    if old.is_system and not coalesce(new.is_system, false) then
      raise exception 'System protection cannot be removed from group "%".', old.name;
    end if;
    return new;
  end if;

  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'protect_system_groups'
      and tgrelid = 'public.groups'::regclass
  ) then
    create trigger protect_system_groups
      before delete or update on public.groups
      for each row
      execute function public.trg_protect_system_groups();
  end if;
end;
$$;
