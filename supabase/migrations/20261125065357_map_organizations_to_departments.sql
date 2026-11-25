-- =============================================================================
-- Migration: map_organizations_to_departments
-- Adds a nullable department_id foreign key on public.organizations so academic
-- student organizations map directly to their governing academic department,
-- enabling event and participation KPIs across Departments and Programs pages.
-- Campus-wide organizations (SSC, Gabay, The Loquitur, TRC) remain NULL.
-- =============================================================================

alter table public.organizations
  add column if not exists department_id uuid references public.departments(id) on delete set null;

create index if not exists idx_organizations_department_id
  on public.organizations(department_id);

-- Map KCP departmental organizations to their corresponding academic departments
update public.organizations o
set department_id = d.id
from public.departments d
where o.department_id is null
  and (
    (o.slug = 'cabm-sbo'     and d.code = 'CABM')
    or (o.slug = 'ccje-sbo'  and d.code = 'CCJE')
    or (o.slug = 'cit-sbo'   and d.code = 'CIT')
    or (o.slug = 'ctela-sbo' and d.code = 'CTELA')
    or (o.slug = 'psych-club' and d.code = 'CTELA')
    or (o.slug = 'theology-sbo' and d.code = 'COT')
  );
