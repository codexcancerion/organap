# `src/features/semesters/` — Academic Semesters

Manages institutional academic terms (`semesters`) with `name`, `description`, `start_date`, and `end_date`.

## Permissions
- `semesters.view` — Route access (`/semesters`) and read queries.
- `semesters.create` — Create new academic semesters.
- `semesters.change` — Edit existing semester details and date ranges.
- `semesters.delete` — Delete academic semesters.

By default, only `is_superuser` accounts hold these permissions unless explicitly provisioned to a group or user.
