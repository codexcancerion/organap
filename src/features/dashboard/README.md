# Dashboard Feature (`src/features/dashboard`)

Dynamic role-adaptive institutional dashboard for OrGanap (FR-18).

---

## 1. Domain Rationale & Business Rules

1. **Role-Adaptive Operational Views**:
   - Rather than overwhelming users with irrelevant university data or forcing a single generic layout, the dashboard adapts its primary KPIs and actions to the authenticated user's active permissions:
     - **Students**: Active digital tickets/passes, attended event history, upcoming approved activities.
     - **Officers**: Draft/returned proposal counters, pending reviews, active venue bookings.
     - **Faculty Advisers**: Proposals awaiting academic endorsement.
     - **Student Affairs / Superadmins**: Pending final administrative review queue, active campus events, venue availability.

---

## 2. Server-Side Metric Queries (`services/dashboard_queries.ts`)

1. **Server-Side Parallel Aggregation**:
   - `getDashboardMetrics` executes parallel `count: "exact", head: true` Supabase queries via `Promise.all`.
   - By querying with `{ head: true }`, PostgreSQL counts rows on indexed columns without retrieving actual row payloads, ensuring millisecond dashboard load times.
2. **React Cache Optimization**:
   - Wrapped in React `cache()`, memoizing results across Server Component rendering passes for the duration of the HTTP request.

---

## 3. UI/UX Architecture & Technical Choices

1. **Cardless PageHeader Standard**:
   - Welcome banner displays the user's name, role badges (Superuser, Staff, Groups), and contextual primary action buttons.
2. **Primary Metric Cards**:
   - 3 high-contrast KPI cards showcasing the most critical operational numbers for that user's session with Lucide iconography and tinted badge backgrounds.
3. **Empty State Guidance**:
   - When a queue is empty (e.g., all proposals approved or no registrations), the dashboard renders helpful, encouraging contextual text and quick navigation links rather than a blank canvas.
