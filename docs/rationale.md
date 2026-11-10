# Project Rationale & Problem Analysis

**OrGanap v0.1.0**

---

## 1. Context and Problem Statement

In academic institutions, student organization events are crucial for campus life, leadership development, and co-curricular enrichment. However, existing institutional processes are frequently fragmented across disparate channels:

1. **Fragmented Proposal Workflows**: Proposals are drafted in documents, emailed to faculty advisers, printed for signatures, or submitted via ad-hoc messaging channels. Tracking the current revision or review state is difficult and error-prone.
2. **Venue Conflicts & Double Booking**: Without a centralized calendar and real-time scheduling engine, overlapping events frequently reserve the same physical facility (auditoriums, multi-purpose halls, AVRs), leading to last-minute cancellations or administrative friction.
3. **Disjointed Attendance Tracking**: Event registrations and actual attendance are rarely synchronized. Manual sign-in sheets or disconnected Google Forms lead to missing records, inaccurate headcounts, and privacy concerns.
4. **Lack of Institutional Visibility**: Student Affairs offices lack an aggregated, real-time overview of organization activities, venue utilization, and genuine student engagement telemetry.

---

## 2. The OrGanap Solution

OrGanap centralizes the entire lifecycle of a student organization event:

- **End-to-End Proposal Routing**: Standardized submission, transparent adviser endorsement, and Student Affairs final approval.
- **Automated Conflict Prevention**: Real-time venue availability verification that mathematically blocks overlapping reservations.
- **Integrated Registration & Capacity Management**: First-come, first-served student registration with automatic quota tracking and deadline enforcement.
- **Digital Attendance Verification**: Secure digital check-in during the active event window (manual student ID lookup or event-specific QR code validation).
- **Institutional Reporting**: Instant CSV export and dashboard metrics for organization compliance and university accreditation.

---

## 3. Measurable Outcomes

- **Zero double bookings** across institution-managed venues.
- **100% auditable history** of all proposal submissions, adviser endorsements, and review remarks.
- **Fast registration and attendance**: Students register within 3 minutes; check-in takes seconds per student without manual paper transcription.
- **Accurate distinction** between registered attendees and confirmed attendees.

---

## 4. Architectural & Concurrency Foundations

### 4.1. Mathematical Venue Overlap Invariant
To eliminate false negatives where one event completely engulfs another, OrGanap applies the universal interval intersection theorem:
$$\text{Conflict} \iff \text{venue}_A = \text{venue}_B \land \text{start}_A < \text{end}_B \land \text{end}_A > \text{start}_B$$

### 4.2. Concurrency Control & Row Locks
Database race conditions during simultaneous user clicks are serialized via PostgreSQL row-level locks (`SELECT ... FOR UPDATE`):
- `approve_event_proposal`: Locks the venue row before approving to prevent double-booking.
- `register_for_event`: Locks the proposal row before incrementing registrations to eliminate over-subscription.
- `record_attendance_entry`: Validates check-in eligibility within $[\text{start} - 30\text{min}, \text{end}]$ and updates attendance atomically.

### 4.3. RFC 4180 Standardized Audit Exports
Attendance export strictly implements RFC 4180:
- Double quote wrapping for fields with commas, quotes, or newlines.
- Internal double quote doubling (`""`).
- Platform-independent `\r\n` CRLF record terminators.
- Prepended UTF-8 Byte Order Mark (`\uFEFF`) ensuring Microsoft Excel automatically detects UTF-8 characters on Windows.

---

## 5. UI/UX Decision Log

- **Cardless PageHeader Standard**: All feature routes render standard cardless `<PageHeader />` components (`title`, `description`, `actions`) to establish uniform typography and hierarchy.
- **HeroUI v3 Pure Standard**: Zero v2 components or providers; all interactive controls utilize `@heroui/react` and `@heroui/styles`.
- **Toast Notifications for Mutation Outcomes**: User feedback uses transient `<Toast>` notifications (`toast.success()`, `toast.danger()`, `toast.info()`) mounted at root to keep view state clean.
- **Feature Hermeticity**: Features never import directly across feature boundaries (`src/features/<a>` into `src/features/<b>`); composition occurs exclusively via slot props (`actionSlot`) at the App Router page level.
