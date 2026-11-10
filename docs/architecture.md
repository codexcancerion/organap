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
│   (Role Policies, Foreign Keys, Atomic Check Constraints)   │
└─────────────────────────────────────────────────────────────┘
```

---

## Security & Access Control Model

Every request is verified through multi-tier authentication and authorization:

1. **Next.js 16 Proxy (`src/proxy.ts`)**: Runs ahead of all requests, automatically refreshing Supabase JWT auth sessions.
2. **Server-Side Current User Cache (`auth_queries.getCurrentUser()`)**: Per-request cached lookup that hydrates user role, school ID, and org associations.
3. **App Route Guards (`src/app/(auth)/layout.tsx`)**: Re-routes unauthenticated users to `/login?redirectTo=...`.
4. **PostgreSQL Row Level Security (RLS)**: Enforces access policies even if API requests are made directly:
   - Students cannot read proposal review remarks or unapproved drafts.
   - Officers can only mutate proposals belonging to their assigned organization.
   - Advisers can only endorse/return proposals from their assigned organizations.
   - Student Affairs personnel have institutional review scope.
   - Student attendees cannot view attendance logs of other students (NFR-07).

---

## Feature Vertical Slices

Each feature slice under `src/features/` is hermetic and self-contained:

```
src/features/<feature>/
  components/       ← UI components for this feature
  services/         ← Typed Supabase CRUD queries & mutations
  hooks/            ← Feature-specific React hooks (if needed)
  types.ts          ← Co-located feature types
  README.md         ← Invariants and boundary rules
```

No file in `src/features/featureA/` may import directly from `src/features/featureB/`. If an abstraction is needed by ≥ 2 features, it is promoted to `src/components/`, `src/hooks/`, `src/types/`, or `src/utils/`.
