# `src/features/` — Self-Contained Product Verticals

Features are hermetic, domain-driven slices of the OrGanap platform.

## Layout

```
src/features/
  auth/             ← Authentication & user profiles
  dashboard/        ← Role-aware dashboards (student, officer, adviser, student affairs)
  organizations/    ← Recognized campus organizations
  proposals/        ← Event proposals & two-stage approval routing
  events/           ← Approved events browsing & calendar
  registrations/    ← Student event registration & passes
  attendance/       ← Attendance check-in & verification
  reports/          ← Participation reports & CSV exports
```

## Hermeticity Rules

1. A file under `src/features/<a>/` may NOT import directly from `src/features/<b>/`.
2. Shared logic belongs in `src/components/`, `src/hooks/`, `src/types/`, or `src/utils/` ($\ge 2$ callers).
3. All Supabase CRUD operations must reside in `services/`, never directly in pages or components.
