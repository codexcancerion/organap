# Proposals Feature (`src/features/proposals`)

Manages student organization event proposals, mathematical venue collision prevention, and the two-stage approval workflow (FR-03 through FR-09).

---

## 1. Domain Rationale & Business Rules

1. **Two-Stage Approval Funnel**:
   - Academic institutions require academic vetting prior to administrative resource commitment.
   - **Stage 1 (Faculty Adviser)**: The assigned organization adviser verifies academic suitability, student safety, and co-curricular alignment before an event enters the university-wide pipeline.
   - **Stage 2 (Student Affairs)**: Administrative authority performs the final institutional compliance check and officially reserves the physical campus venue.
2. **Revision & Resubmission Cycle (FR-08)**:
   - When either reviewer requests changes (`returned_by_adviser` or `returned_by_student_affairs`), the proposal does not terminate. It reverts to an editable state for the submitting officer, preserving its identity and audit history while resetting approval progress.
3. **Full Chronological Audit Trail (FR-09)**:
   - Every status transition creates an immutable record in `proposal_reviews` with the reviewer's user ID, timestamp, and review remarks, preventing disputes regarding submission dates and decision accountability.

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
2. **HeroUI v3 Alert Primitive**:
   - Overlap warnings utilize HeroUI v3 `<Alert status="danger">` with compound subcomponents (`Alert.Indicator`, `Alert.Content`, `Alert.Title`, `Alert.Description`).
3. **Unified Review Decision Modal**:
   - A single, polymorphic modal handles Endorsement, Approval, Return for Revision, and Rejection, dynamically altering tone, required remarks (mandatory for return/reject), and button variant.
4. **Toast Feedback**:
   - Action outcomes are reported exclusively via transient `<Toast>` notifications (`toast.success()`, `toast.danger()`, `toast.info()`) mounted at the root provider, keeping layout states stable.

---

## 4. Non-Obvious Edge Cases & Invariants

- **Volatile `now()` Check Constraints**:
  - PostgreSQL forbids check constraints comparing against `now()` because `now()` is volatile. Date bounds (`start_time > now()`) are enforced at the stored procedure and TypeScript validation layers rather than table-level `CHECK` constraints.
- **Feature Hermeticity**:
  - `src/features/proposals` never imports from other feature directories. Cross-feature types reside in `src/types/domain.ts`.
