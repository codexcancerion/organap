# Events Feature (`src/features/events`)

Unified campus events and visible proposal directory, interactive calendar grid, and institutional event cancellation (FR-10, FR-15, FR-16).

---

## 1. Domain Rationale & Business Rules

1. **RLS-Governed Visibility Invariant (FR-10)**:
   - `getEventsCatalog` queries `event_proposals` under PostgreSQL Row-Level Security (`event_proposals_select`).
   - Regular students only receive events with status `approved` or `cancelled`, preventing attendance at unsanctioned activities.
   - Organization officers, faculty advisers, Student Affairs staff, and permission holders automatically receive their visible drafts, pending, returned, and rejected proposals merged directly into the Events catalog alongside approved events.
2. **Administrative Cancellation & Fan-Out Notification (FR-15)**:
   - Only Student Affairs administrators and superusers have the institutional privilege to cancel an approved event (`cancel_approved_event`).
   - When an event is cancelled, two automated side-effects execute atomically inside PostgreSQL:
     1. The reserved venue is immediately released, freeing the physical slot for other student organizations.
     2. An in-app cancellation notification with the administrative reason is fanned out to every student who holds an active registration pass.

---

## 2. Interaction Flows & Navigation Topology

1. **Two-Tab HeroUI Explorer (Events vs. Calendar)**:
   - `<EventExplorerClient />` provides two HeroUI v3 `<Tabs>` in the `<PageHeader />`: **Events** (unified card catalog of events and visible proposals) and **Calendar** (monthly schedule grid, FR-16).
   - View mode state is maintained client-side to eliminate unnecessary full-page reloads.
   - When proposals are present in the catalog, `<EventCatalog />` renders secondary HeroUI status filter `<Tabs>` (`All`, `Approved`, `In Review`, `Drafts & Returned`) alongside HeroUI `<SearchField>` and a venue `<Select>`.
2. **Hermetic Slot Pattern on Detail Page**:
   - The `<EventDetailCard />` component exposes an `actionSlot?: React.ReactNode` prop.
   - At the route level (`src/app/(auth)/events/[id]/page.tsx`), the page mounts `<RegistrationActionButton />` from `src/features/registrations` into this slot, strictly adhering to the zero cross-feature import architectural boundary.

---

## 3. UI/UX Architecture & Technical Choices

1. **Two-Tier Event Card Header**:
   - Event and proposal cards in `<EventCatalog />` split `<Card.Header>` into two vertical rows instead of placing `<Card.Title>` beside the status chip:
     - **Top row**: Organization `w-9 h-9` avatar or acronym tile paired with stacked `organizationAcronym` and `organizationName` on the left, and the single status `<Chip>` on the right.
     - **Second row**: Full-width `<Card.Title className="line-clamp-2">` paired with compact soft `<Chip>` tags for `activityType` and `semesterName`.
   - Why avoid the single-row header layout used by simpler entity cards? Wide registration chips such as `Open for Registration` leave too little horizontal space for multi-word event names next to a square logo, crushing titles like `CIT Socialization 2026: Byte & Bond` down to `CIT...`. Giving the title full card width preserves legibility across desktop and tablet grids.
2. **Grouped Metadata Panel & Non-Wrapping Footer**:
   - Venue, formatted start date/time, and deadline or target spot quota sit inside a subtle inset box (`rounded-xl bg-default/5 p-3 border border-border/30 mt-auto`) above the registration progress bar so cards align at the bottom even when proposal descriptions vary in length.
   - `<Card.Footer>` displays a concise `Hosted by {organizationAcronym}` attribution on approved events or `By {creatorName}` on in-workflow proposals, paired with `shrink-0 whitespace-nowrap` on the stretched `<NextLink>` (`after:absolute after:inset-0`). Repeating the full organization name at the footer previously squeezed `View Details` onto two lines and duplicated header identity.
3. **Capacity Quota Telemetry**:
   - Approved event cards render color-coded quota progress bars:
     - Blue (`< 80%` filled)
     - Amber/Warning (`80%` to `99%` filled)
     - Red/Danger (`100%` filled / Full Capacity)
4. **Status Chips & Pass Confirmation Badges**:
   - If the viewing student is already registered for an approved event, the card displays a `"Pass Confirmed"` green chip, preventing duplicate registration attempts.
   - In-workflow proposals render `<ProposalStatusChip />` from `@/components/ui/proposal_status_chip`.
5. **HeroUI v3 Modals**:
   - The Cancellation Modal requires an explicit justification input to ensure institutional accountability before triggering mass notifications.
