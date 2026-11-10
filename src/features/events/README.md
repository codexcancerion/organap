# Events Feature (`src/features/events`)

Public approved campus events directory, interactive calendar grid, and institutional event cancellation (FR-10, FR-15, FR-16).

---

## 1. Domain Rationale & Business Rules

1. **Approved Visibility Invariant (FR-10)**:
   - Students and general campus visitors may ONLY browse events whose status is strictly `approved`. Draft, pending, returned, and rejected proposals are strictly filtered out to prevent student confusion or attendance at unsanctioned activities.
2. **Administrative Cancellation & Fan-Out Notification (FR-15)**:
   - Only Student Affairs administrators and superusers have the institutional privilege to cancel an approved event (`cancel_approved_event`).
   - When an event is cancelled, two automated side-effects execute atomically inside PostgreSQL:
     1. The reserved venue is immediately released, freeing the physical slot for other student organizations.
     2. An in-app cancellation notification with the administrative reason is fanned out to every student who holds an active registration pass.

---

## 2. Interaction Flows & Navigation Topology

1. **Dual-View Explorer (Catalog vs. Calendar)**:
   - Students can toggle between a card catalog view (ideal for quick registration and quota inspection) and a monthly calendar view (FR-16) (ideal for finding weekend or schedule conflicts).
   - View mode state is maintained client-side in `<EventExplorerClient />` to eliminate unnecessary full-page reloads.
2. **Hermetic Slot Pattern on Detail Page**:
   - The `<EventDetailCard />` component exposes an `actionSlot?: React.ReactNode` prop.
   - At the route level (`src/app/(auth)/events/[id]/page.tsx`), the page mounts `<RegistrationActionButton />` from `src/features/registrations` into this slot, strictly adhering to the zero cross-feature import architectural boundary.

---

## 3. UI/UX Architecture & Technical Choices

1. **Capacity Quota Telemetry**:
   - Event cards render color-coded quota progress bars:
     - Blue (`< 80%` filled)
     - Amber/Warning (`80% - 99%` filled)
     - Red/Danger (`100%` filled / Full Capacity)
2. **Status Chips & Pass Confirmation Badges**:
   - If the viewing student is already registered, the event card displays a `"Pass Confirmed"` green chip instead of a standard action button, preventing duplicate registration attempts.
3. **HeroUI v3 Modals**:
   - The Cancellation Modal requires an explicit justification input to ensure institutional accountability before triggering mass notifications.
