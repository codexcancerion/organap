# `src/features/departments/` — Academic Departments

Manages institutional academic departments (`departments`) with `name` and `code` (acronym). A department may contain many `programs` (`1:N`).

## Permissions
- `departments.view` — Route access (`/departments`, `/departments/[id]`) and read queries.
- `departments.create` — Create new departments.
- `departments.change` — Edit department names and acronym codes.
- `departments.delete` — Delete departments (blocked if programs remain linked).

By default, only `is_superuser` accounts hold these permissions unless explicitly provisioned to a group or user.
