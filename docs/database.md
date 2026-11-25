# Database Design & Schema Specification

**OrGanap v0.1.0** | PostgreSQL + Supabase RLS (Django-Style Dynamic Groups & Permissions)

---

## ERD & Entity Relationships

```
auth.users (Supabase Auth)
  │ (1:1)
  ▼
public.profiles ──────────────────────────┬────────────────────────┐
  │                                       │                        │
  │ (1:N)                                 │ (M:N via user_groups)  │ (M:N via user_permissions)
  ▼                                       ▼                        ▼
public.organization_members ◄─── public.organizations   public.groups ◄── public.permissions
  │                                                        │                  ▲
  │ (M:N)                                                  └──────────────────┘
  ▼                                                       (M:N via group_permissions)
public.venues ◄───────────────── public.event_proposals
                                          │
                   ┌──────────────────────┼──────────────────────┐
                   │ (1:N)                │ (1:N)                │ (1:N)
                   ▼                      ▼                      ▼
        public.proposal_reviews  public.event_registrations  public.attendance_records
```

---

## Authorization Architecture (Django RBAC Model)

OrGanap enforces **dynamic, fine-grained access control** governed by groups and permissions rather than rigid, hardcoded static database role enums:

1. **`permissions`**: Standardized granular permissions (e.g. `proposals.create`, `proposals.endorse`, `proposals.approve`, `organizations.manage_members`, `venues.create`, `attendance.verify`).
2. **`groups`**: Dynamic user groups (e.g. *Student Affairs*, *Faculty Adviser*, *Student Organization Officer*, *Student*, or any custom committee created by administrators).
3. **`group_permissions`**: Maps permissions to groups.
4. **`user_groups`**: Assigns users to one or multiple groups.
5. **`user_permissions`**: Allows direct permission grants to individual users.
6. **`profiles.is_superuser`**: Unrestricted superuser flag that implicitly satisfies all permission checks (`has_perm` returns `true`).
7. **`profiles.is_staff`**: Administrative flag enabling access to management modules.

---

## Tables

### 1. `public.profiles`
Mirrors `auth.users` 1:1 and stores application identity, superuser/staff flags, and school metadata (NFR-07).

| Column | Type | Constraints / Defaults | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, references `auth.users(id)` on delete cascade | User ID |
| `display_name` | `text` | NOT NULL | Full name of user |
| `school_id` | `text` | UNIQUE, nullable | Student/Employee identification number |
| `avatar_url` | `text` | nullable | Profile avatar URL |
| `is_superuser` | `boolean` | NOT NULL, default `false` | Global bypass flag (all permissions granted) |
| `is_staff` | `boolean` | NOT NULL, default `false` | Administrative access flag |
| `is_active` | `boolean` | NOT NULL, default `true` | Account active status (FR-01, FR-02) |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Creation timestamp |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | Last update timestamp |

### 2. `public.permissions`
Granular authorization capabilities.

| Column | Type | Constraints / Defaults | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | Permission ID |
| `code` | `text` | UNIQUE, NOT NULL | E.g. `proposals.approve`, `venues.create` |
| `name` | `text` | NOT NULL | Human readable permission name |
| `module` | `text` | NOT NULL | Feature scope (`proposals`, `organizations`, etc.) |
| `description` | `text` | nullable | Operational explanation |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Seed / creation timestamp |

### 3. `public.groups`
Dynamic collections of permissions.

| Column | Type | Constraints / Defaults | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | Group ID |
| `name` | `text` | UNIQUE, NOT NULL | E.g. `Student Affairs`, `Faculty Adviser`, `Student` |
| `description` | `text` | nullable | Group scope description |
| `is_system` | `boolean` | NOT NULL, default `false` | Locks the 4 initial groups from deletion via `protect_system_groups` trigger |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Creation timestamp |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | Last update timestamp |

### 4. `public.group_permissions`
Cross-reference mapping permissions granted to groups.

| Column | Type | Constraints / Defaults | Notes |
| :--- | :--- | :--- | :--- |
| `group_id` | `uuid` | FK → `groups(id)` on delete cascade | Target group |
| `permission_id` | `uuid` | FK → `permissions(id)` on delete cascade | Assigned permission |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Creation timestamp |

### 5. `public.user_groups`
Assigns campus users to one or more dynamic groups.

| Column | Type | Constraints / Defaults | Notes |
| :--- | :--- | :--- | :--- |
| `user_id` | `uuid` | FK → `profiles(id)` on delete cascade | Target user |
| `group_id` | `uuid` | FK → `groups(id)` on delete cascade | Associated group |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Assignment timestamp |

### 6. `public.user_permissions`
Direct permission grants per user (Django-style `user.user_permissions`).

| Column | Type | Constraints / Defaults | Notes |
| :--- | :--- | :--- | :--- |
| `user_id` | `uuid` | FK → `profiles(id)` on delete cascade | Target user |
| `permission_id` | `uuid` | FK → `permissions(id)` on delete cascade | Granted permission |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Grant timestamp |

### 7. `public.organizations`
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

### 8. `public.organization_members`
Association linking users to organizations with specific assignments (officer, adviser, member).

| Column | Type | Constraints / Defaults | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | Membership ID |
| `organization_id` | `uuid` | FK → `organizations(id)` on delete cascade | Target organization |
| `user_id` | `uuid` | FK → `profiles(id)` on delete cascade | Member user ID |
| `position_title` | `text` | nullable | E.g. "President", "Secretary", "Adviser" |
| `is_officer` | `boolean` | NOT NULL, default `false` | Org-level officer privileges |
| `is_adviser` | `boolean` | NOT NULL, default `false` | Org-level adviser endorsement flag |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Assignment date |

### 9. `public.venues`
Campus facilities available for booking.

| Column | Type | Constraints / Defaults | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | Venue ID |
| `name` | `text` | NOT NULL | Facility name |
| `location` | `text` | nullable | Building, floor, room number |
| `capacity` | `integer` | NOT NULL, default `50` | Maximum attendee threshold |
| `is_active` | `boolean` | NOT NULL, default `true` | Availability toggle |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Date added |

### 10. `public.system_settings`
Dynamic key-value settings making the platform institution-agnostic.

| Column | Type | Constraints / Defaults | Notes |
| :--- | :--- | :--- | :--- |
| `key` | `text` | PK | E.g. `'institution'`, `'proposals'` |
| `value` | `jsonb` | NOT NULL, default `'{}'` | JSON config payload |
| `description` | `text` | nullable | Human explanation of setting |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | Last modification |
| `updated_by` | `uuid` | FK → `profiles(id)` | User who updated setting |

### 11. `public.semesters`
Institutional academic terms and date ranges (`semesters.*` permissions; superadmin only by default).

| Column | Type | Constraints / Defaults | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | Semester ID |
| `name` | `text` | NOT NULL, unique (`lower(trim(name))`) | Term name (e.g. `1st Semester AY 2026–2027`) |
| `description` | `text` | nullable | Optional notes on term schedule |
| `start_date` | `date` | NOT NULL | Term start date |
| `end_date` | `date` | NOT NULL, `check (end_date > start_date)` | Term end date |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Creation timestamp |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | Last update timestamp |

### 12. `public.departments`
Institutional schools and academic departments (`departments.*` permissions; superadmin only by default). One department may contain many programs (`1:N`).

| Column | Type | Constraints / Defaults | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | Department ID |
| `name` | `text` | NOT NULL, unique (`lower(trim(name))`) | Full department name |
| `code` | `text` | NOT NULL, unique (`lower(trim(code))`) | Department acronym/code (e.g. `SAMCIS`) |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Creation timestamp |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | Last update timestamp |

### 13. `public.programs`
Academic degree programs (`programs.*` permissions; superadmin only by default). Each program belongs to exactly 1 parent department (`N:1`).

| Column | Type | Constraints / Defaults | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | Program ID |
| `department_id` | `uuid` | NOT NULL, FK → `departments(id)` on delete restrict | Single parent department |
| `name` | `text` | NOT NULL, unique (`lower(trim(name))`) | Full degree program name |
| `code` | `text` | NOT NULL, unique (`lower(trim(code))`) | Program acronym/code (e.g. `BSCS`) |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Creation timestamp |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | Last update timestamp |

---

### 14. `public.event_proposals`
Core proposal and approved campus event entity (`activity_type`, optional `semester_id`, `venue_id`, `capacity`, `registration_deadline`, `status`, cancellation metadata).

### 15. `public.proposal_reviews`
Immutable audit trail recording every adviser and Student Affairs decision (`stage`, `decision`, `remarks`, `reviewer_id`, `created_at`).

### 16. `public.attachment_types` & `public.event_attachments`
Configurable institutional document categories (`is_required`, `is_active`, optional template URL) and uploaded file metadata linked to `organap-assets` Storage.

### 17. `public.event_registrations`
Student seat reservations (`proposal_id`, `student_id`, unique `qr_token`, `status` in `confirmed`, `withdrawn`, `attended`). Partial unique index `idx_unique_active_registration` enforces at most one active (`confirmed` or `attended`) registration per `(proposal_id, student_id)`.

### 18. `public.attendance_records`
Verified entrance check-ins (`proposal_id`, `student_id`, `registration_id`, `verified_by`, `check_in_method` in `manual` or `qr_scanner`, `check_in_at`). Unique constraint `uq_attendance_student_event` prevents duplicate check-ins per `(proposal_id, student_id)`.

### 19. `public.notifications`
Per-user in-app notifications (`user_id`, `title`, `message`, `link`, `is_read`, `created_at`) isolated by `notifications_user_isolated` RLS policy.

---

## Security Helper Functions (Security Definer)

- `public.is_superuser(p_user_id uuid default auth.uid()) -> boolean`: Returns true if user has `is_superuser = true`.
- `public.is_staff(p_user_id uuid default auth.uid()) -> boolean`: Returns true if user has `is_staff = true` or `is_superuser = true`.
- `public.has_perm(p_code text, p_user_id uuid default auth.uid()) -> boolean`: Core Django-style permission evaluation (evaluates superuser status, direct user permissions, and group permissions).
- `public.has_any_perm(p_codes text[], p_user_id uuid default auth.uid()) -> boolean`: Evaluates whether user holds at least one permission in array.
- `public.get_user_permissions(p_user_id uuid default auth.uid()) -> table(permission_code text)`: Returns effective permissions table.
- `public.get_user_groups(p_user_id uuid default auth.uid()) -> table(group_id uuid, group_name text)`: Returns active user group memberships.
- `public.is_org_officer(p_org_id uuid, p_user_id uuid default auth.uid()) -> boolean`: Checks if user is governor or officer of the specified organization or has global permissions.
- `public.is_org_adviser(p_org_id uuid, p_user_id uuid default auth.uid()) -> boolean`: Checks if user is assigned as adviser for the specified organization.
- `public.is_org_member(p_org_id uuid, p_user_id uuid default auth.uid()) -> boolean`: Checks active organization membership for collaborative proposal drafting.

---

## Workflow Stored Procedures & Triggers

- `public.check_venue_conflict(p_venue_id, p_start_time, p_end_time, p_exclude_proposal_id)`: Evaluates interval intersection across `approved` events.
- `public.approve_event_proposal(p_proposal_id, p_reviewer_id, p_remarks)`: Locks proposal and venue rows (`FOR UPDATE`), checks venue overlap, transitions to `approved`, writes `proposal_reviews`, and notifies creator at `/events/<id>`.
- `public.cancel_approved_event(p_proposal_id, p_cancelled_by, p_reason)`: Cancels upcoming approved event, preserves records, releases venue, and notifies registrants and officer.
- `public.register_for_event(p_proposal_id, p_student_id)`: Verifies caller identity, locks proposal row, validates deadline and capacity across `confirmed` and `attended` rows, generates 32-char token via `extensions.gen_random_bytes(16)`, inserts registration, and notifies student.
- `public.withdraw_from_event(p_registration_id, p_student_id)`: Verifies caller identity, ensures `confirmed` state and open deadline on an approved event, and transitions to `withdrawn` to release the seat.
- `public.record_attendance_entry(p_proposal_id, p_token_or_student_id, p_verified_by, p_method)`: Verifies caller identity and organization officer/staff authority, enforces `[start_time - 30 min, end_time]`, normalizes full QR tokens, 16-char hyphenated passcodes, UUIDs, or school IDs, rejects withdrawn/wrong-event/duplicate attempts, inserts `attendance_records`, and sets registration status to `attended`.
- `public.get_event_registration_counts(p_proposal_ids uuid[])`: Privacy-safe aggregate count query returning active (`confirmed` + `attended`) totals per event.
- `public.trg_notify_proposal_workflow()`: `AFTER UPDATE OF status` trigger on `event_proposals` dispatching notifications for `pending_adviser`, `pending_student_affairs`, `returned_*`, and `rejected_*` transitions with `/events/<id>?view=review` links.
