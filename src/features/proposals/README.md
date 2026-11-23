# Proposals Feature (`src/features/proposals`)

Manages student organization event proposals, mathematical venue collision prevention, and the two-stage approval workflow (FR-03 through FR-09).

---

## 1. Domain Rationale & Business Rules

1. **Two-Stage Approval Funnel**:
   - Academic institutions require academic vetting prior to administrative resource commitment.
   - **Stage 1: Faculty Adviser**: The assigned organization adviser verifies academic suitability, student safety, and co-curricular alignment before an event enters the university-wide pipeline.
   - **Stage 2: Student Affairs**: Administrative authority performs the final institutional compliance audit against venue capacity and curfew standards and officially reserves the physical campus venue via `approve_event_proposal`.
2. **Collaborative Organization Editing & Member Uploads**:
   - `is_org_member` and `is_org_officer` PostgreSQL RLS policies authorize any active member of the proposing organization to upload attachments and edit proposal fields while the proposal sits in `draft`, `returned_by_adviser`, or `returned_by_student_affairs` status.
   - Why extend edit and upload access beyond `created_by`? Student council event packets divide work across governors, secretaries, treasurers, and year representatives; locking drafts to one creator stalls revisions if officers split program papers, venue forms, and purchase requests.
3. **Revision Cycle & Mandatory Adviser Re-Endorsement**:
   - When either reviewer requests changes with `returned_by_adviser` or `returned_by_student_affairs`, the proposal returns to an editable state preserving its identity and chronological review history.
   - Why do proposals returned by OSAS (`returned_by_student_affairs`) route back through `pending_adviser` upon resubmission instead of jumping straight back to Student Affairs? Adjustments made for OSAS, such as lowering capacity below `venues.capacity` or adding curfew and faculty marshal protocols, materially change event supervision, so the Faculty Adviser must re-verify and re-endorse the revised packet first.
4. **Full Chronological Audit Trail (FR-09)**:
   - Every status transition creates an immutable record in `proposal_reviews` with the reviewer user ID, timestamp, and remarks, preventing disputes over submission dates and decision accountability.

---

## 2. Thresholds, Regimes & Mathematical Overlap Engine

### Venue Conflict Detection Formula (FR-07)
A proposal $A$ conflicts with an approved event $B$ if and only if they reserve the exact same venue and their schedules intersect:
$$\text{Conflict} \iff \text{venue}_A = \text{venue}_B \land \text{start}_A < \text{end}_B \land \text{end}_A > \text{start}_B$$

- **Why this formula?** Standard disjoint comparisons (e.g., checking if start falls between times) miss events that completely subsume another event. The condition `startA < endB AND endA > startB` is mathematically necessary and sufficient to detect any temporal intersection, including partial overlaps and full encapsulations.
- **Pre-Submission Conflict Alert**: Executed client-side and via server queries before submission to save officers from submitting doomed proposals.
- **Race Condition Prevention at Final Approval**: Even if a conflict check passes initially, two administrators approving proposals concurrently could cause a double-booking. To prevent this, the database stored procedure `approve_event_proposal` acquires an exclusive row lock (`SELECT 1 FROM public.venues WHERE id = v_proposal.venue_id FOR UPDATE`), serializing approvals for that venue.

---

## 3. UI/UX Architecture & Technical Choices

1. **Cardless PageHeader Standard**:
   - Per design system guidelines, header regions use the lightweight `<PageHeader />` primitive (`title`, `description`, `actions`) without heavy card borders or backdrop boxes.
2. **HeroUI v3 Alert & Popover Constraints**:
   - Overlap warnings use HeroUI v3 `<Alert status="danger">` with compound subcomponents (`Alert.Indicator`, `Alert.Content`, `Alert.Title`, `Alert.Description`).
   - `<DateRangePicker.Popover>` and `<DatePicker.Popover>` in `<ProposalForm />` enforce `className="flex !min-w-0 w-fit max-w-72 flex-col gap-3 p-3"`. Why override the popover width? Because `<DateRangePicker>` spans two grid columns (`md:col-span-2`), HeroUI's default `min-w-[--trigger-width]` stretches the calendar popover awkwardly across the form instead of compactly hugging the calendar grid and clock inputs.
3. **Unified Review Decision Modal**:
   - A single polymorphic modal handles Endorsement, Approval, Return for Revision, and Rejection, dynamically altering tone, mandatory remarks for return or rejection, and button variant.
4. **Toast Feedback**:
   - Action outcomes report exclusively via transient `<Toast>` notifications (`toast.success()`, `toast.danger()`, `toast.info()`) mounted at the root provider, keeping layout states stable.

---

## 4. Non-Obvious Edge Cases & Invariants

- **In-Place Revision vs. Resubmission RLS (`WITH CHECK` Invariant)**:
  - The `event_proposals_update` RLS policy `WITH CHECK` clause explicitly allows organization collaborators to write statuses `('draft', 'pending_adviser', 'returned_by_adviser', 'returned_by_student_affairs')`. Saving edits while returned must preserve `returned_by_adviser` or `returned_by_student_affairs` so a collaborator such as the Treasurer or Secretary can update fields in place without failing RLS or prematurely advancing the proposal before the lead officer clicks resubmit.
- **SSR Hydration Guard on Locale Date Pickers**:
  - `<DateRangePicker>` and `<DatePicker>` inside `src/features/proposals/components/proposal_form.tsx` render skeleton placeholders until `isMounted` becomes `true`, preventing React Aria locale date-segment whitespace mismatches during Next.js SSR hydration.
- **Volatile `now()` Check Constraints**:
  - PostgreSQL forbids check constraints comparing against `now()` because `now()` is volatile. Date bounds (`start_time > now()`) are enforced at the stored procedure and TypeScript validation layers rather than table-level `CHECK` constraints.
- **Feature Hermeticity**:
  - `src/features/proposals` never imports from other feature directories. Cross-feature types reside in `src/types/domain.ts`.
