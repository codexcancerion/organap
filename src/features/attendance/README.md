# Attendance Feature (`src/features/attendance`)

Unified campus event check-in desk, QR/passcode verification, participation telemetry, and RFC 4180 CSV audit export (FR-13, FR-14, FR-17).

---

## 1. Domain Rationale & Business Rules

1. **Check-In Window Rule (FR-13)**:
   - Attendance verification is permitted strictly inside `[start_time - 30 minutes, end_time]` while the event remains `approved`.
   - Why a 30-minute early buffer? Entrance queues form prior to program start, while blocking check-ins hours or days ahead prevents premature attendance fabrication.
2. **Organization-Scoped Verification Authority (NFR-02)**:
   - `record_attendance_entry` authorizes only officers/governors of the hosting organization (`is_org_officer(organization_id, verifier)`), Student Affairs staff (`is_staff`), or superusers.
   - Why avoid checking global `has_perm('attendance.verify')` alone? Officers from Organization A hold `attendance.verify` for their own events, so a global check without `organization_id` matching would let an officer check in attendees at Organization B's event.
3. **Token Normalization & Diagnostic Rejection**:
   - `record_attendance_entry` strips hyphens and lowercases incoming input so officers can verify using the full 32-character QR scan, the 16-character hyphenated passcode (`XXXX-XXXX-XXXX-XXXX`), a profile UUID, or a student `school_id`.
   - When an exact active match is missing, the procedure checks whether a `withdrawn` pass matched (`REGISTRATION_WITHDRAWN`) or whether the token belongs to another event (`WRONG_EVENT`), giving entrance staff actionable feedback.
   - Duplicate check-ins raise `ALREADY_CHECKED_IN` and preserve the original `check_in_at` timestamp.

---

## 2. Unified Attendance & Audit Reporting (FR-14)

1. **Single Route Topology (`/attendance` & `/attendance/[id]`)**:
   - Participation audit metrics (`Confirmed Registrations`, `Attendees Checked In`, `Participation Turnout`, `Capacity Utilization`) and RFC 4180 CSV export live directly inside `<AttendanceConsole />`, eliminating the redundant `/reports` UI.
   - Legacy `/reports` and `/reports/[id]` routes redirect cleanly to `/attendance` and `/attendance/[id]`.
2. **Hermetic CSV Generation (`src/utils/attendance_csv.ts`)**:
   - CSV serialization sits in `src/utils/attendance_csv.ts` so `<AttendanceConsole />` exports UTF-8 BOM (`\uFEFF`), CRLF-delimited audit files client-side without cross-feature imports.

---

## 3. UI/UX Architecture & Technical Choices

1. **Permission-Gated Navigation & Scoped Event Picker**:
   - Regular students do not see `Attendance` in the sidebar and are redirected to `/events` if visiting `/attendance`.
   - `<AttendanceEventPicker />` filters non-staff officers to their assigned organizations and uses HeroUI `SearchField`, window `Tabs` (`All`, `Live Now`, `Upcoming`, `Closed`), `ProgressBar`, and `EmptyState`.
2. **Continuous QR Scanner Dialog (`qr_scanner_dialog.tsx`)**:
   - Uses HeroUI `Modal.Backdrop > Modal.Container > Modal.Dialog` and remains open after each successful scan, displaying a green `Alert` with the verified student while clearing and refocusing the input for rapid back-to-back check-ins.
3. **Manual Check-In Table (`manual_checkin_table.tsx`)**:
   - Displays HeroUI `SearchField` (searching name, School ID, email, or passcode), `Tabs` (`All`, `Pending`, `Checked In`), check-in timestamps, and method badges (`Manual` vs `QR Scan`).
