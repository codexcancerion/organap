# Architecture & System Design

**OrGanap v0.1.0** | Event Proposal, Approval Routing & Attendance Platform

---

## Architectural Principles

OrGanap is structured around **domain-driven vertical feature slices** with strict separation of concerns, zero cross-feature imports, and Supabase Row Level Security (RLS) guaranteeing data privacy and integrity at the database layer.

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 16 Presentation                  │
│   (App Router `src/app/`, Server Components, HeroUI v3)     │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
┌──────────────────────────────┐┌──────────────────────────────┐
│       Feature Services       ││       Feature Contexts       │
│  (`src/features/*/services`) ││      (`src/contexts/*`)      │
└──────────────┬───────────────┘└──────────────┬───────────────┘
               │                               │
               ▼                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  Data Access & Proxy Layer                  │
│       (`@/utils/supabase/server`, `@/utils/supabase/client`) │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Supabase PostgreSQL + RLS                   │
│   (Role Policies, Triggers, Locks, Atomic Stored Procs)     │
└─────────────────────────────────────────────────────────────┘
```

---

## Security & Access Control Model

Every request is verified through multi-tier authentication and authorization:

1. **Next.js 16 Proxy (`src/proxy.ts`)**: Runs ahead of requests, refreshing Supabase JWT auth sessions via `@supabase/ssr`.
2. **Server-Side Current User Cache (`auth_queries.getCurrentUser()`)**: Per-request cached lookup hydrating profile identity, `isStaff`, `isSuperuser`, dynamic groups, and effective permission codes.
3. **App Route Guards (`src/app/(auth)/layout.tsx` & page gates)**: Redirects unauthenticated visitors to `/login` and gates privileged routes such as `/attendance`, `/admin/users`, and `/admin/groups`.
4. **PostgreSQL Row Level Security & `SECURITY DEFINER` RPCs**: Enforces organization and role boundaries directly in PostgreSQL:
   - Students read only approved or cancelled events in `/events`, and use `get_event_registration_counts` for aggregate seat availability.
   - Organization members and officers can collaborate on draft/returned proposals for their assigned organization.
   - Faculty advisers endorse, return, or reject proposals assigned to their organization.
   - Attendance verification (`record_attendance_entry`) restricts check-ins to officers of the organizing group, Student Affairs staff, or superusers.

---

## Unified Route & Navigation Topology

- **Events & Proposals Unified (`/events`)**: Approved campus events, the monthly calendar view, and RLS-visible in-workflow proposals share `/events`, `/events/new`, `/events/[id]`, and `/events/[id]/edit`. Legacy `/proposals/*` routes redirect to `/events/*`.
- **Attendance & Audit Reports Unified (`/attendance`)**: Live check-in desks, manual roster verification, QR/passcode scanning, capacity utilization KPIs, and RFC 4180 CSV export (`src/utils/attendance_csv.ts`) live together under `/attendance` and `/attendance/[id]`. Legacy `/reports/*` routes redirect to `/attendance/*`.
- **Student Passes (`/registrations`)**: Dedicated digital ticket wallet displaying SVG QR codes, hyphenated 16-character passcodes, check-in timestamps, and pre-deadline withdrawal confirmations.
- **Public Legal Routes (`/privacy`, `/terms`)**: Accessible unauthenticated or authenticated via the root footer.

---

## Feature Vertical Slices

Each feature slice under `src/features/` is hermetic and self-contained:

```
src/features/<feature>/
  components/       <- UI components for this feature
  services/         <- Typed Supabase queries & mutations
  types.ts          <- Co-located feature types
  README.md         <- Behavioral rationale, invariants & UI/UX choices
```

No file in `src/features/featureA/` may import directly from `src/features/featureB/`. Cross-feature UI composition happens at the App Router page level via slot props such as `actionSlot`, while shared logic lives in `src/components/`, `src/hooks/`, `src/types/`, or `src/utils/`.
