-- =============================================================================
-- OrGanap — Institution Entities: Semesters, Departments & Programs
-- Migration: 20261118000000_institution_entities.sql
--
-- Entities:
--   1. public.semesters   (name, description, start_date, end_date)
--   2. public.departments (name, code; 1:N with programs)
--   3. public.programs    (name, code, department_id; N:1 with departments)
--
-- Permissions:
--   create, view, change, delete for each entity (12 granular permissions).
--   By default, NO groups are granted these permissions — only superusers
--   hold them until explicitly provisioned to groups or users.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Tables & Relational Constraints
-- -----------------------------------------------------------------------------

-- 1.1 Semesters
create table if not exists public.semesters (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  start_date  date not null,
  end_date    date not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint check_semester_dates check (end_date > start_date)
);

create unique index if not exists semesters_name_idx
  on public.semesters (lower(trim(name)));

create index if not exists semesters_dates_idx
  on public.semesters (start_date desc, end_date desc);

-- 1.2 Departments (1 Department may contain Many Programs)
create table if not exists public.departments (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  code       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists departments_code_idx
  on public.departments (lower(trim(code)));

create unique index if not exists departments_name_idx
  on public.departments (lower(trim(name)));

-- 1.3 Programs (Each Program belongs to exactly 1 Department)
create table if not exists public.programs (
  id            uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments(id) on delete restrict,
  name          text not null,
  code          text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists programs_department_id_idx
  on public.programs (department_id);

create unique index if not exists programs_code_idx
  on public.programs (lower(trim(code)));

create unique index if not exists programs_name_idx
  on public.programs (lower(trim(name)));

-- -----------------------------------------------------------------------------
-- 2. Grants & Row Level Security
-- -----------------------------------------------------------------------------

alter table public.semesters enable row level security;
alter table public.departments enable row level security;
alter table public.programs enable row level security;

grant select, insert, update, delete on public.semesters to authenticated, service_role;
grant select, insert, update, delete on public.departments to authenticated, service_role;
grant select, insert, update, delete on public.programs to authenticated, service_role;

-- 2.1 Semesters Policies (Strictly governed by semesters.* permissions)
drop policy if exists "semesters_select" on public.semesters;
create policy "semesters_select"
  on public.semesters
  for select
  using (public.has_perm('semesters.view'));

drop policy if exists "semesters_insert" on public.semesters;
create policy "semesters_insert"
  on public.semesters
  for insert
  with check (public.has_perm('semesters.create'));

drop policy if exists "semesters_update" on public.semesters;
create policy "semesters_update"
  on public.semesters
  for update
  using (public.has_perm('semesters.change'))
  with check (public.has_perm('semesters.change'));

drop policy if exists "semesters_delete" on public.semesters;
create policy "semesters_delete"
  on public.semesters
  for delete
  using (public.has_perm('semesters.delete'));

-- 2.2 Departments Policies
-- Note: Program readers/editors may resolve the required parent department FK metadata.
drop policy if exists "departments_select" on public.departments;
create policy "departments_select"
  on public.departments
  for select
  using (
    public.has_perm('departments.view')
    or public.has_perm('programs.view')
    or public.has_perm('programs.create')
    or public.has_perm('programs.change')
  );

drop policy if exists "departments_insert" on public.departments;
create policy "departments_insert"
  on public.departments
  for insert
  with check (public.has_perm('departments.create'));

drop policy if exists "departments_update" on public.departments;
create policy "departments_update"
  on public.departments
  for update
  using (public.has_perm('departments.change'))
  with check (public.has_perm('departments.change'));

drop policy if exists "departments_delete" on public.departments;
create policy "departments_delete"
  on public.departments
  for delete
  using (public.has_perm('departments.delete'));

-- 2.3 Programs Policies (Strictly governed by programs.* permissions)
drop policy if exists "programs_select" on public.programs;
create policy "programs_select"
  on public.programs
  for select
  using (public.has_perm('programs.view'));

drop policy if exists "programs_insert" on public.programs;
create policy "programs_insert"
  on public.programs
  for insert
  with check (public.has_perm('programs.create'));

drop policy if exists "programs_update" on public.programs;
create policy "programs_update"
  on public.programs
  for update
  using (public.has_perm('programs.change'))
  with check (public.has_perm('programs.change'));

drop policy if exists "programs_delete" on public.programs;
create policy "programs_delete"
  on public.programs
  for delete
  using (public.has_perm('programs.delete'));

-- -----------------------------------------------------------------------------
-- 3. Granular Permissions Seed (Superadmins only by default; provisionable to groups)
-- -----------------------------------------------------------------------------

insert into public.permissions (code, name, module, description)
values
  -- Semesters
  ('semesters.view',   'Can view semesters',   'semesters', 'Browse academic semesters and term date ranges'),
  ('semesters.create', 'Can create semesters', 'semesters', 'Create new academic semesters and term schedules'),
  ('semesters.change', 'Can edit semesters',   'semesters', 'Update semester names, descriptions, and date ranges'),
  ('semesters.delete', 'Can delete semesters', 'semesters', 'Remove academic semester records'),

  -- Departments
  ('departments.view',   'Can view departments',   'departments', 'Browse academic departments and their acronym codes'),
  ('departments.create', 'Can create departments', 'departments', 'Register new academic departments and codes'),
  ('departments.change', 'Can edit departments',   'departments', 'Update academic department names and acronym codes'),
  ('departments.delete', 'Can delete departments', 'departments', 'Remove academic department records'),

  -- Programs
  ('programs.view',   'Can view programs',   'programs', 'Browse academic programs and their assigned departments'),
  ('programs.create', 'Can create programs', 'programs', 'Register new academic programs under a department'),
  ('programs.change', 'Can edit programs',   'programs', 'Update program names, acronym codes, and department assignments'),
  ('programs.delete', 'Can delete programs', 'programs', 'Remove academic program records')
on conflict (code) do update set
  name = excluded.name,
  module = excluded.module,
  description = excluded.description;
