# Database Design & Schema Specification

**OrGanap v0.1.0** | PostgreSQL + Supabase RLS

---

## ERD & Entity Relationships

```
auth.users (Supabase Auth)
  │ (1:1)
  ▼
public.profiles ──────────────────────────┐
  │                                       │
  │ (1:N)                                 │ (1:N)
  ▼                                       ▼
public.organization_members ◄─── public.organizations
                                          │
                                          │ (1:N)
                                          ▼
public.venues ◄───────────────── public.event_proposals
                                          │
                   ┌──────────────────────┼──────────────────────┐
                   │ (1:N)                │ (1:N)                │ (1:N)
                   ▼                      ▼                      ▼
        public.proposal_reviews  public.event_registrations  public.attendance_records
```

---

## Tables

### 1. `public.profiles`
Mirrors `auth.users` 1:1 and stores application role and school metadata (NFR-07).

| Column | Type | Constraints / Defaults | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, references `auth.users(id)` on delete cascade | User ID |
| `role` | `public.user_role` | NOT NULL, default `'student'` | Enum: `superadmin`, `student_affairs`, `adviser`, `officer`, `student` |
| `school_id` | `text` | UNIQUE, nullable | Student/Employee identification number |
| `display_name` | `text` | NOT NULL | Full name of user |
| `avatar_url` | `text` | nullable | Profile avatar URL |
| `is_active` | `boolean` | NOT NULL, default `true` | Account active status (FR-01, FR-02) |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Creation timestamp |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | Last update timestamp |

### 2. `public.organizations`
Recognized student organizations within the institution.

| Column | Type | Constraints / Defaults | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | Org ID |
| `name` | `text` | NOT NULL | Full organization name |
| `acronym` | `text` | NOT NULL | e.g. "CSS", "JPIA" |
| `slug` | `text` | UNIQUE, NOT NULL | URL-friendly slug |
| `description` | `text` | nullable | Mission, vision, statement |
| `category` | `text` | NOT NULL, default `'academic'` | `'academic'`, `'cultural'`, `'special_interest'`, etc. |
| `logo_url` | `text` | nullable | Organization seal / logo |
| `is_active` | `boolean` | NOT NULL, default `true` | Active recognition status |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Created date |

### 3. `public.organization_members`
Association linking users to organizations with specific assignments (officer, adviser, member).

| Column | Type | Constraints / Defaults | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | Membership ID |
| `organization_id` | `uuid` | FK → `organizations(id)` on delete cascade | Target organization |
| `user_id` | `uuid` | FK → `profiles(id)` on delete cascade | Member user ID |
| `org_role` | `text` | NOT NULL, default `'member'` | `'officer'`, `'adviser'`, `'member'` |
| `position_title` | `text` | nullable | e.g. "President", "Lead Adviser" |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Creation timestamp |

*Constraint*: `UNIQUE (organization_id, user_id)`

### 4. `public.venues`
Institutional event venues available for reservation.

| Column | Type | Constraints / Defaults | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | Venue ID |
| `name` | `text` | NOT NULL | e.g. "University Auditorium" |
| `location` | `text` | nullable | Building / floor |
| `capacity` | `integer` | NOT NULL | Maximum seating capacity |
| `is_active` | `boolean` | NOT NULL, default `true` | Active for booking |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Creation timestamp |

### 5. `public.event_proposals`
Event proposals submitted by organization officers (FR-03, FR-04).

| Column | Type | Constraints / Defaults | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | Proposal ID |
| `organization_id` | `uuid` | FK → `organizations(id)` | Proposing organization |
| `created_by` | `uuid` | FK → `profiles(id)` | Submitting officer |
| `title` | `text` | NOT NULL | Event title |
| `purpose` | `text` | NOT NULL | Objectives and purpose |
| `activities_desc`| `text` | NOT NULL | Proposed program/activities |
| `venue_id` | `uuid` | FK → `venues(id)` | Requested venue |
| `start_time` | `timestamptz` | NOT NULL | Event start datetime |
| `end_time` | `timestamptz` | NOT NULL | Event end datetime |
| `registration_deadline` | `timestamptz`| NOT NULL | Registration deadline |
| `capacity` | `integer` | NOT NULL | Max attendee quota (> 0) |
| `status` | `public.proposal_status` | default `'draft'` | Status enum |
| `cancellation_reason` | `text` | nullable | Reason if cancelled by SA |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Created date |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | Updated date |

*Status Enum (`proposal_status`)*:
- `draft` (FR-03)
- `pending_adviser` (FR-04)
- `returned_by_adviser` (FR-05)
- `rejected_by_adviser` (FR-05)
- `pending_student_affairs` (FR-05, FR-06)
- `returned_by_student_affairs` (FR-06)
- `rejected_by_student_affairs` (FR-06)
- `approved` (FR-06, FR-07)
- `cancelled` (FR-15)

### 6. `public.proposal_reviews`
Immutable audit log of all decisions and remarks throughout the review workflow (FR-09).

| Column | Type | Constraints / Defaults | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | Review ID |
| `proposal_id` | `uuid` | FK → `event_proposals(id)` on delete cascade | Target proposal |
| `reviewer_id` | `uuid` | FK → `profiles(id)` | Reviewer profile ID |
| `decision` | `text` | NOT NULL | `'endorsed'`, `'returned'`, `'rejected'`, `'approved'`, `'cancelled'` |
| `remarks` | `text` | nullable | Required for returns/rejections |
| `stage` | `text` | NOT NULL | `'adviser'`, `'student_affairs'` |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Timestamp |

### 7. `public.event_registrations`
Student event registrations (FR-12).

| Column | Type | Constraints / Defaults | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | Registration ID |
| `proposal_id` | `uuid` | FK → `event_proposals(id)` | Target approved event |
| `student_id` | `uuid` | FK → `profiles(id)` | Registered student |
| `status` | `text` | NOT NULL, default `'confirmed'` | `'confirmed'`, `'withdrawn'` |
| `registered_at`| `timestamptz` | NOT NULL, default `now()` | Registration timestamp |
| `withdrawn_at` | `timestamptz` | nullable | Withdrawal timestamp |

*Constraint*: Partial unique index on `(proposal_id, student_id)` where `status = 'confirmed'`.

### 8. `public.attendance_records`
Digital attendance records captured during the event window (FR-13).

| Column | Type | Constraints / Defaults | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | Attendance ID |
| `proposal_id` | `uuid` | FK → `event_proposals(id)` | Target event |
| `registration_id`| `uuid` | FK → `event_registrations(id)` | Linked registration |
| `student_id` | `uuid` | FK → `profiles(id)` | Attending student |
| `verified_by` | `uuid` | FK → `profiles(id)` | Officer who conducted check-in |
| `method` | `text` | NOT NULL, default `'manual'` | `'manual'` or `'qr'` |
| `checked_in_at`| `timestamptz` | NOT NULL, default `now()` | Check-in timestamp |

*Constraint*: `UNIQUE (proposal_id, student_id)` (FR-13: exactly one check-in per student).
