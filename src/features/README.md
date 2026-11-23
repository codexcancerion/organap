# `src/features/` — Self-Contained Product Verticals

Features are hermetic, domain-driven slices of the OrGanap platform.

## Layout

```
src/features/
  auth/             ← Authentication & user profiles
  dashboard/        ← Role-aware dashboards (student, officer, adviser, student affairs)
  organizations/    ← Recognized campus organizations
  venues/           ← Campus venues & facility booking schedules
  semesters/        ← Academic semesters & term date bounds
  departments/      ← Academic departments & contained programs
  programs/         ← Academic degree programs & parent department mapping
  proposals/        <- Event proposals & two-stage approval routing
  events/           <- Unified events explorer, proposals directory & calendar
  registrations/    <- Student event registration & passes
  attendance/       <- Unified attendance check-in, participation audits & CSV export
  notifications/    <- In-app workflow notification inbox & read tracking
  attachments/      <- Institutional attachment type catalog
  users/            <- User account directory & dynamic group assignments
  groups/           <- Dynamic RBAC groups & permission matrix
  settings/         <- Personal preferences & institutional system settings
```

## Hermeticity Rules

1. A file under `src/features/<a>/` may NOT import directly from `src/features/<b>/`.
2. Shared logic belongs in `src/components/`, `src/hooks/`, `src/types/`, or `src/utils/` ($\ge 2$ callers).
3. All Supabase CRUD operations must reside in `services/`, never directly in pages or components.
