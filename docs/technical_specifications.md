# TECHNICAL SPECIFICATIONS

**OrGanap v0.1.0** | November 2026  
*A Student Organization Event Approval and Attendance Management System*

---

## Contents

1. **System Requirements Specification (SRS)**
   - 1.1 Functional Requirements (FR-01 to FR-18)
   - 1.2 Non-Functional Requirements (NFR-01 to NFR-08)
2. **System Design Specifications**
   - 2.1 Users, Stakeholders, and Role Matrix
   - 2.2 End-to-End Workflows & Decision Logic
   - 2.3 Venue Conflict Detection Engine
   - 2.4 Entity Relationship Diagram (ERD) & Schemas
3. **Development Specifications**
   - 3.1 UI/UX & Design System (HeroUI v3 + Tailwind v4)
   - 3.2 Development Technologies & Tooling
   - 3.3 Folder Layout, Pages, Components, and Services Architecture

---

# I. System Requirements Specification (SRS)

## 1.1 Functional Requirements

| ID | Requirement Statement | Description | Priority |
| :--- | :--- | :--- | :--- |
| **FR-01** | Account Authentication | Authenticate active users via school credentials. Invalid credentials and inactive accounts are denied access. | Must Have |
| **FR-02** | Account & Role Governance | Designated Student Affairs personnel manage account activation, roles, and organization associations. | Must Have |
| **FR-03** | Proposal Drafting | Organization officers create and save draft event proposals (title, purpose, activities, venue, times, capacity, registration deadline). | Must Have |
| **FR-04** | Proposal Validation & Routing | Validate proposal rules before routing to assigned adviser (future dates, capacity > 0, deadline ≤ start time). Status: `Pending Adviser Review`. | Must Have |
| **FR-05** | Faculty Adviser Review | Assigned adviser can endorse (routes to Student Affairs), return for revision, or reject. Returns and rejections require remarks. | Must Have |
| **FR-06** | Student Affairs Final Review | Authorized Student Affairs personnel approve, return, or reject. Approval requires successful venue conflict check. Returns/rejections require remarks. | Must Have |
| **FR-07** | Venue Conflict Prevention | Prevent approval when an overlapping approved event occupies the same venue. Overlap condition: `startA < endB AND endA > startB`. Cancelled events do not reserve venues. | Must Have |
| **FR-08** | Revision & Resubmission | Submitting officer can revise and resubmit proposals marked `Returned for Revision`. Resubmission restarts adviser review while retaining decision history. | Must Have |
| **FR-09** | Chronological Review History | Display proposal status and immutable history (decision, reviewer, timestamp, remarks) to submitting org and reviewers. | Must Have |
| **FR-10** | Student Event Exploration | Active students view approved event details (org, purpose, venue, schedule, capacity, registration deadline). Unapproved proposals excluded. | Must Have |
| **FR-11** | In-App Notifications | Automated in-app alerts for pending reviews, review outcomes, and event cancellations. | Should Have |
| **FR-12** | Event Registration & Withdrawal | Active students register or withdraw before the deadline. Registration requires capacity > 0 and no existing registration. Withdrawal releases place. | Must Have |
| **FR-13** | Digital Attendance Verification | Authorized organizing officer records verified student attendance during the event's scheduled window. Exactly one check-in timestamp per student. | Must Have |
| **FR-14** | Attendance Report & CSV Export | Export detailed attendance reports (registered vs attended, timestamps, totals) for officers (own org) and Student Affairs (institutional). | Must Have |
| **FR-15** | Event Cancellation | Student Affairs can cancel approved events with stated reason. Releases venue, halts registrations/check-ins, notifies registrants. | Must Have |
| **FR-16** | Event Calendar View | Interactive calendar organizing approved events by date with drill-down modals. | Should Have |
| **FR-17** | QR Code Attendance Check-In | Event-specific QR ticket per registration. Officer scans or validates QR codes, enforcing FR-13 rules. | Could Have |
| **FR-18** | Analytics & Participation Counters | Dashboard summary counts (approved events, registrations, attendees) scoped to organization or institution. | Could Have |

## 1.2 Non-Functional Requirements

- **NFR-01 (Performance)**: 95% of event listings, proposal status queries, and registrations respond within 3 seconds under 100 concurrent users.
- **NFR-02 (Security & Access Control)**: Enforce role and organization permissions on every protected screen, API route, and database request via Postgres Row Level Security (RLS).
- **NFR-03 (Credential Security)**: HTTPS transport enforcement; passwords hashed with PBKDF2/Argon2 via Supabase Auth; no plain-text credential leaks.
- **NFR-04 (Usability)**: First-time student users can locate an approved event and register within 3 minutes without assistance.
- **NFR-05 (Accessibility)**: Full keyboard operability, visible focus rings, descriptive labels, and non-color-exclusive error feedback.
- **NFR-06 (Reliability & Backups)**: Automated daily database backups with recovery within 4 hours.
- **NFR-07 (Data Privacy)**: Restrict student profiles to School ID, Name, School Email, and Role. Student attendees cannot inspect other attendees' registrations.
- **NFR-08 (Concurrency & Data Integrity)**: Atomic transactions for venue booking (preventing double booking) and registration capacity decrements (preventing overbooking).

---

# II. System Design Specifications

## 2.1 Users and Role Matrix

1. **Student (`student`)**:
   - Browse approved public events and calendar.
   - Register for events and withdraw before deadline.
   - Access personal registration passes and QR codes.
2. **Organization Officer (`officer`)**:
   - Manage assigned organization profile and roster.
   - Create, edit, draft, and resubmit event proposals.
   - Monitor real-time proposal approval progression and remarks.
   - Conduct event check-in (manual ID lookup & QR scanner).
   - Generate and download CSV attendance reports for their organization.
3. **Faculty Adviser (`adviser`)**:
   - Review submitted proposals for assigned organizations.
   - Endorse to Student Affairs or return/reject with remarks.
   - Review historical endorsements and proposal decisions.
4. **Student Affairs Personnel (`student_affairs`)**:
   - Perform final review of endorsed proposals with venue conflict engine.
   - Cancel approved events with official reason.
   - Manage institutional venues, organizations, and officer/adviser assignments.
   - Access institution-wide analytics and cross-organizational attendance records.
5. **Superadmin / IT Admin (`superadmin`)**:
   - Full system administration, account role overrides, audit logging, system health.

## 2.2 Venue Conflict Detection Logic

To prevent double booking (FR-07), any proposal approval at the Student Affairs stage evaluates the query:

$$\text{Conflict} \iff \text{venue\_id}_A = \text{venue\_id}_B \land \text{start}_A < \text{end}_B \land \text{end}_A > \text{start}_B \land \text{status}_B = \text{'approved'}$$

Events ending exactly when another starts do not conflict ($\text{end}_A = \text{start}_B$).

---

# III. Development Specifications

## 3.1 Design System & UI/UX

- **HeroUI v3**: Exclusive use of `@heroui/react` and `@heroui/styles` with compound components (`Card.Header`, `Card.Content`, `Form`, `TextField`, `Modal`, `Drawer`).
- **Tailwind CSS v4**: Theme tokens defined in `src/styles/globals.css`.
- **Feedback**: HeroUI Toast notifications (`toast.success()`, `toast.danger()`).

## 3.2 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Runtime**: React 19 + TypeScript (strict)
- **Database**: Supabase PostgreSQL with RLS
- **Auth**: `@supabase/ssr` with Next.js 16 Proxy
- **Testing**: Vitest + React Testing Library
