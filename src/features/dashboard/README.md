# Dashboard Feature (`src/features/dashboard`)

Dynamic role-adaptive operational overview dashboard for OrGanap (FR-18).

---

## 1. Domain Rationale & Business Rules

1. **Role-Scoped KPIs & Telemetry (FR-18)**:
   - Rather than exposing identical metrics to every stakeholder, `getDashboardMetrics` inspects `isSuperuser`, `isStaff`, permissions, `organization_members` (`is_officer = true`), `organizations.governor_id`, and `organizations.adviser_id`:
     - **Student Affairs / Superusers**: Institutional `Pending Approvals`, `Active Events`, campus-wide `Total Registrations`, and `Recorded Attendees`, paired with the Student Affairs review queue.
     - **Faculty Advisers**: Adviser-org scoped `Awaiting Endorsement`, `Active Events`, `Recognized Orgs`, and `Campus Venues`, paired with proposals awaiting adviser endorsement.
     - **Organization Officers**: Organization-scoped `My Draft Proposals` (drafts and returned items), `Active Events`, `Org Registrations`, and `Verified Attendees`, paired with the organization proposal pipeline.
     - **Students**: Personal `My Registrations`, `Events Attended`, `Active Events`, and `Recognized Orgs`, paired with active passes.

---

## 2. Server-Side Metric Queries (`services/dashboard_queries.ts`)

1. **Parallel Head Counts & Aggregate Seat RPC**:
   - `getDashboardMetrics` executes count-only `head: true` queries alongside compact top-4/top-5 list queries in `Promise.all`, plus `get_event_registration_counts` for upcoming approved event capacity badges.
2. **React Cache Optimization**:
   - Wrapped in React `cache()` for single-request deduplication across Server Component renders.

---

## 3. UI/UX Architecture & Technical Choices

1. **Live Action Panels Replacing Static Empty Shells**:
   - Below the 4 role-adapted KPI cards, `<EmptyDashboard />` renders a two-column live workspace: a role-appropriate **Action / Pass Queue** on the left and **Upcoming Approved Events** on the right.
   - HeroUI `EmptyState` renders only when an actual queue or event list has zero entries, ensuring active users always see actionable links immediately upon sign-in.
2. **Cardless PageHeader Standard**:
   - Uses `<PageHeader />` with a single role `Chip` and role-specific quick actions (`Draft New Proposal`, `Review Proposals`, `Attendance Desk`, or `Browse Events`).
