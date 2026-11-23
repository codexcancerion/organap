# TECHNICAL SPECIFICATIONS

**OrGanap v0.1.0** | November 2026  
*A Student Organization Event Approval and Attendance Management System*

---

## Contents

1. **System Requirements Specification**
   - 1.1 Functional Requirements (FR-01 to FR-18)
   - 1.2 Non-Functional Requirements (NFR-01 to NFR-08)
2. **System Design Specifications**
   - 2.1 Users, Stakeholders, and Dynamic RBAC Matrix
   - 2.2 Venue Conflict Detection Logic
3. **Development Specifications**
   - 3.1 UI/UX & Design System (HeroUI v3 + Tailwind v4)
   - 3.2 Development Technologies & Tooling
   - 3.3 Folder Layout, Routes, Components, and Services Architecture

---

# I. System Requirements Specification

## 1.1 Functional Requirements (Implemented Baseline)

| ID | Requirement Statement | Implemented Baseline Behavior | Priority |
| :--- | :--- | :--- | :--- |
| **FR-01** | Account Authentication | Authenticate active users via school credentials (`@supabase/ssr` + Next.js 16 Proxy). Invalid credentials and inactive accounts are denied access. | Must Have |
| **FR-02** | Account & Role Governance | Student Affairs and superusers manage account activation, dynamic groups (`groups`, `permissions`, `user_groups`), and organization assignments via `/admin/users` and `/admin/groups`. | Must Have |
| **FR-03** | Collaborative Proposal Drafting | Authorized org members and officers create and edit draft proposals with title, activity type, academic semester, rationale, activities, venue, schedule, capacity, deadline, and file attachments (`/events/new`, `/events/[id]/edit`). | Must Have |
| **FR-04** | Proposal Validation & Routing | Validates required fields, positive capacity, end after start, deadline at or before start, and mandatory institutional `attachment_types` before transitioning to `pending_adviser`. | Must Have |
| **FR-05** | Faculty Adviser Review | Assigned organization adviser endorses to Student Affairs or returns/rejects with mandatory remarks. | Must Have |
| **FR-06** | Student Affairs Final Review | Authorized Student Affairs personnel approve, return, or reject endorsed proposals. Approval requires passing venue conflict check. | Must Have |
| **FR-07** | Venue Conflict Prevention | Blocks approval when an overlapping approved event occupies the same venue (`startA < endB AND endA > startB`), serialized with a PostgreSQL row lock on `venues`. Cancelled events release venues. | Must Have |
| **FR-08** | Revision & Resubmission | Returned proposals stay editable by the submitting organization. Resubmission restarts adviser review while retaining full chronological review history. | Must Have |
| **FR-09** | Chronological Review History | Displays status and immutable `proposal_reviews` trail (decision, reviewer, timestamp, remarks) at `/events/[id]?view=review`. | Must Have |
| **FR-10** | Unified Events & Proposal Explorer | `/events` merges approved/cancelled events with RLS-visible in-workflow proposals for authorized roles; students see only approved/cancelled events. Legacy `/proposals/*` redirects to `/events/*`. | Must Have |
| **FR-11** | In-App Notifications | Database trigger (`trg_notify_proposal_workflow`) and stored procedures dispatch alerts for submissions, endorsements, returns, rejections, approvals, registrations, and cancellations, surfaced on `/notifications` with unread badges. | Should Have |
| **FR-12** | Event Registration & Withdrawal | Active students register (`register_for_event`) or withdraw (`withdraw_from_event` via HeroUI `AlertDialog`) before deadline while capacity remains. Checked-in registrations cannot be withdrawn. | Must Have |
| **FR-13** | Digital Attendance Verification | Authorized officers of the organizing group or Student Affairs staff record attendance within `[start_time - 30 min, end_time]`. Cross-organization officers are blocked; duplicate check-ins are rejected. | Must Have |
| **FR-14** | Unified Attendance & CSV Audit Export | `/attendance/[id]` combines live check-in verification with turnout, capacity utilization, attendee email/ID roster, and RFC 4180 UTF-8 BOM CSV export (`src/utils/attendance_csv.ts`). `/reports/*` redirects to `/attendance/*`. | Must Have |
| **FR-15** | Event Cancellation | Student Affairs cancels approved events before start time with official reason, releasing the venue, halting registrations/check-ins, and notifying registrants. | Must Have |
| **FR-16** | Event Calendar View | Interactive calendar tab inside `/events` organizing events by date with direct detail links. | Should Have |
| **FR-17** | QR Pass & Passcode Check-In | Generates a 32-character crypto hex token (`extensions.gen_random_bytes`) and 16-character hyphenated passcode (`XXXX-XXXX-XXXX-XXXX`) rendered as SVG QR passes on `/registrations` and event modals, rejecting withdrawn or wrong-event tokens. | Could Have |
| **FR-18** | Role-Scoped Overview Dashboard | `/dashboard` renders 4 role-adapted KPI cards, scoped registration and attendance counts, live review/pass action queues, and upcoming approved events. | Could Have |

## 1.2 Non-Functional Requirements

- **NFR-01 (Performance)**: Server queries leverage React `cache()` and parallel `Promise.all` aggregations (`head: true` count queries and `get_event_registration_counts` RPC) for fast page loads.
- **NFR-02 (Security & Access Control)**: Enforces role, dynamic permission, and organization-scoped access in Next.js routes, Sidebar navigation, stored procedures, and PostgreSQL RLS policies.
- **NFR-03 (Credential Security)**: HTTPS transport enforcement; credentials hashed by Supabase Auth with HTTP-only SSR session cookies refreshed per request by `src/proxy.ts`.
- **NFR-04 (Usability)**: One-click event registration immediately opens the Digital Entry Pass modal with QR SVG and copyable passcode, while withdrawal confirms cleanly via HeroUI `AlertDialog`.
- **NFR-05 (Accessibility)**: HeroUI v3 React Aria primitives ensure keyboard navigation, visible focus rings, descriptive labels, and accessible form/dialog states.
- **NFR-06 (Reliability & Backups)**: Forward-only PostgreSQL migrations in `supabase/migrations/` preserve schema history and audit logs.
- **NFR-07 (Data Privacy & Legal Transparency)**: Public `/privacy` and `/terms` pages document institutional data boundaries; `get_event_registration_counts` supplies live seat availability totals without exposing student rosters in UI views.
- **NFR-08 (Concurrency & Data Integrity)**: PostgreSQL `FOR UPDATE` locks serialize concurrent venue approvals (`approve_event_proposal`) and seat claims (`register_for_event`), while partial unique indexes enforce single active registrations and attendance records.

---

# II. System Design Specifications

## 2.1 Users and Dynamic RBAC Matrix

Access combines `profiles.is_superuser`, `profiles.is_staff`, dynamic `groups`/`permissions`, and `organizations`/`organization_members` assignments:

1. **Student**: Browse `/events` and calendar, register/withdraw before deadline, present QR passes on `/registrations`, manage profile/preferences.
2. **Organization Officer / Governor**: Draft, edit, attach files, and resubmit organization proposals; monitor review history; verify attendance and export CSV reports exclusively for their assigned organization via `/attendance`.
3. **Faculty Adviser**: Review and endorse, return, or reject proposals for assigned organizations (`organizations.adviser_id`).
4. **Student Affairs Personnel**: Perform final proposal reviews with venue conflict checking, cancel approved events, manage organizations, venues, users, and dynamic groups, and oversee institutional attendance.
5. **Superadmin**: Unrestricted system administration, including academic semesters, departments, programs, institutional settings, and attachment type definitions.

## 2.2 Venue Conflict Detection Logic

To prevent double booking (FR-07), `public.check_venue_conflict` evaluates:

$$\text{Conflict} \iff \text{venue\_id}_A = \text{venue\_id}_B \land \text{start}_A < \text{end}_B \land \text{end}_A > \text{start}_B \land \text{status}_B = \text{'approved'}$$

Events ending exactly when another starts do not conflict ($\text{end}_A = \text{start}_B$).

---

# III. Development Specifications

## 3.1 UI/UX & Design System

- **HeroUI v3 Only**: Exclusive use of `@heroui/react` and `@heroui/styles` with compound anatomies (`Card.Header`/`Content`/`Footer`, `Modal.Backdrop` > `Modal.Container` > `Modal.Dialog`, `AlertDialog`, `Alert`, `ProgressBar`, `SearchField`, `Tabs`, `EmptyState`, `Table`, `Avatar`, `Chip`).
- **Tailwind CSS v4 & Variants**: Layout utilities and `tailwind-variants`; no raw CSS files outside `src/styles/globals.css`.
- **Feedback**: Transient HeroUI `toast` notifications (`toast.success()`, `toast.danger()`, `toast.info()`) via root `<Toast.Provider />`.
- **Consistent Layout Primitives**: Cardless `<PageHeader />`, `<Section />`, and `<LegalDocumentShell />` across public and authenticated routes.

## 3.2 Development Technologies & Tooling

- **Framework**: Next.js 16 (App Router) with `src/proxy.ts`
- **Runtime**: React 19 + TypeScript (`strict: true`)
- **Database**: Supabase PostgreSQL + Storage (`organap-assets`) + RLS
- **Auth**: `@supabase/ssr`
- **Icons**: Lucide React
- **QR & Export**: `qrcode` SVG generator (`src/utils/qr.ts`) and RFC 4180 CSV exporter (`src/utils/attendance_csv.ts`)
- **Testing & Quality**: Vitest + React Testing Library, ESLint flat config, `npm run rules:check`

## 3.3 Folder Layout, Routes, Components, and Services Architecture

- **`src/app/`**:
  - Public routes: `/`, `/login`, `/register`, `/forgotpassword`, `/reset-password`, `/privacy`, `/terms`.
  - Authenticated routes under `(auth)/`: `/dashboard`, `/notifications`, `/events`, `/events/new`, `/events/[id]`, `/events/[id]/edit`, `/registrations`, `/attendance`, `/attendance/[id]`, `/organizations`, `/organizations/[id]`, `/venues`, `/venues/[id]`, `/attachments`, `/semesters`, `/departments`, `/departments/[id]`, `/programs`, `/programs/[id]`, `/profile`, `/settings`, `/admin/users`, `/admin/groups`.
  - Compatibility redirects: `/proposals/*` -> `/events/*`, `/reports/*` -> `/attendance/*`, `/admin/venues` -> `/venues`.
- **`src/features/`**: Hermetic slices for `auth`, `dashboard`, `notifications`, `events`, `proposals`, `registrations`, `attendance`, `organizations`, `venues`, `attachments`, `semesters`, `departments`, `programs`, `users`, `groups`, and `settings`.
- **`src/components/`**: Shared `layout/` (`page_header.tsx`, `section.tsx`, `legal_document_shell.tsx`), `navigation/` (`navbar.tsx`, `sidebar.tsx`, `auth_shell.tsx`), and `ui/` primitives.
- **`src/utils/`**: Shared utilities including `attendance_csv.ts`, `qr.ts`, `formatters.ts`, `image_crop.ts`, `user_preferences.ts`, and `supabase/` clients.
