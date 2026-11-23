# `src/features/programs/` — Academic Programs

Manages degree programs (`programs`) with `name`, `code` (acronym), and a required single parent `department_id` (`N:1` with `departments`).

## Permissions
- `programs.view` — Route access (`/programs`, `/programs/[id]`) and read queries.
- `programs.create` — Create new academic programs under a department.
- `programs.change` — Edit program names, codes, and department assignments.
- `programs.delete` — Delete academic programs.

By default, only `is_superuser` accounts hold these permissions unless explicitly provisioned to a group or user.
