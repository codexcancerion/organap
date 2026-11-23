# Registrations Feature (`src/features/registrations`)

Student event registration, atomic capacity quota management, withdrawal protection, and digital entry pass generation (FR-12, FR-17).

---

## 1. Domain Rationale & Business Rules

1. **Strict Capacity Protection & Attended Seat Accounting**:
   - Physical venues carry strict fire code and seating limits. Registrations must never exceed `event_proposals.capacity`.
   - `register_for_event` locks the proposal row via `SELECT ... FOR UPDATE`, preventing concurrent student requests from oversubscribing the final available spot.
   - Both `confirmed` and `attended` registrations occupy capacity and are protected by the partial unique index `idx_unique_active_registration` (`where status in ('confirmed', 'attended')`). Why include `attended`? If only `confirmed` rows counted, checking a student in would free a seat and let another student register or let the checked-in student register a second time.
2. **Schema-Qualified Token Generation**:
   - `register_for_event` uses `set search_path = public, extensions` and calls `extensions.gen_random_bytes(16)` because Supabase installs `pgcrypto` under the `extensions` schema. Calling unqualified `gen_random_bytes(16)` inside a `public`-only search path fails with `function gen_random_bytes(integer) does not exist`.
3. **Withdrawal Boundaries**:
   - `withdraw_from_event` permits withdrawal only while registration status is `confirmed`, the event remains `approved`, and `now() <= registration_deadline`.
   - Once attendance has been verified (`status = 'attended'`), withdrawal is blocked (`INVALID_STATE`) so co-curricular attendance records cannot be erased retroactively.

---

## 2. Digital Entry Pass & Security Architecture (FR-17)

1. **32-Character Hex Token + 16-Character Passcode**:
   - Each registration receives a unique 32-character hexadecimal `qr_token`.
   - The modal encodes the full 32-character token into a vector SVG QR code via `src/utils/qr.ts` and displays the first 16 uppercase characters grouped in fours (`XXXX-XXXX-XXXX-XXXX`) alongside a one-click Copy button for the full token.
2. **Caller Identity Verification**:
   - Both `register_for_event` and `withdraw_from_event` reject calls where `auth.uid() != p_student_id` unless the caller is a superuser, preventing cross-account spoofing even if invoked directly over RPC.

---

## 3. UI/UX Architecture & Technical Choices

1. **Derived Optimistic Pass State (`registration_action_button.tsx`)**:
   - Registering immediately transitions the button into `"View Digital Pass"` and opens `<DigitalTicketPass />` with the newly generated `qrToken` before `router.refresh()` finishes revalidating the Server Component.
   - Instead of synchronizing props via `useEffect` (which triggers React 19 cascading-render lint errors), optimistic actions are derived purely with `useMemo` from an `optimistic` override paired with incoming props.
2. **Confirmation via HeroUI v3 `AlertDialog`**:
   - Withdrawing from either the event detail page or `/registrations` requires confirmation inside a HeroUI `AlertDialog` because withdrawal permanently invalidates the current QR pass token.
3. **HeroUI v3 Pass Wallet (`/registrations`)**:
   - `<StudentRegistrationsList />` provides HeroUI `SearchField`, status `Tabs` (`All`, `Upcoming`, `Attended`, `Past & Cancelled`), `EmptyState`, organization `Avatar` badges, check-in timestamps, and inline `DigitalTicketPass` previews using `Modal.Backdrop > Modal.Container > Modal.Dialog`.
