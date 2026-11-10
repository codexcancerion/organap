# Registrations Feature (`src/features/registrations`)

Student event registration, atomic capacity quota management, and digital entry pass generation (FR-12, FR-17).

---

## 1. Domain Rationale & Business Rules

1. **Strict Capacity Protection (Zero Over-Subscription)**:
   - Physical venues carry strict fire code and safety limits. Registrations must never exceed `event_proposals.capacity`.
   - **Concurrency Safe Quota Decrement**: The stored procedure `register_for_event` executes `SELECT capacity FROM public.event_proposals WHERE id = p_proposal_id FOR UPDATE`, ensuring that concurrent student clicks at registration opening time cannot over-subscribe the quota.
2. **Registration Deadline Invariant**:
   - Students cannot register after `registration_deadline` or once the event start time has elapsed.
3. **Voluntary Withdrawal**:
   - Students can withdraw their registration (`withdraw_from_event`), which immediately sets their pass status to `withdrawn` and reopens a slot for fellow students.

---

## 2. Digital Entry Pass & Security Architecture (FR-17)

1. **Dynamic QR Token Generation**:
   - At the instant of registration, a secure unique token is generated:
     `PASS-<uuid_substr>-<crypto_hash>`
2. **Vector SVG Rendering (`utils/qr.ts`)**:
   - Digital passes use the lightweight `qrcode` engine to render pure scalable vector graphics (`SVG`), avoiding raster artifacting on mobile screens and eliminating external CDN tracking dependencies.
3. **16-Character Formatted Passcode Fallback**:
   - Below the QR code, the pass renders a human-readable 16-character passcode formatted in four 4-character blocks (`XXXX-XXXX-XXXX-XXXX`). This enables rapid manual desk entry if a student's camera lens is cracked or their device screen is dim.

---

## 3. UI/UX Architecture & Technical Choices

1. **Digital Ticket Modal**:
   - Displays the event name, venue, schedule, student name, student ID number, high-contrast QR code, and "Present at entrance" guidance.
   - Includes a one-click "Print / Save" button (`window.print()`).
2. **One-Click Action Button**:
   - `<RegistrationActionButton />` reacts to current state dynamically:
     - Not registered & seats available: "Register for Event" (Primary)
     - Not registered & full: "Event Full" (Disabled)
     - Already registered: "View Ticket Pass" + "Withdraw" (Secondary)
