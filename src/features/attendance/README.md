# Attendance Feature (`src/features/attendance`)

Real-time campus event check-in desk, digital QR pass validation, and student attendance roster management (FR-13, FR-17).

---

## 1. Domain Rationale & Business Rules

1. **Check-In Window Rule (FR-13)**:
   - Attendance verification is strictly permitted within the temporal window:
     $$[\text{start\_time} - 30\text{ minutes},\; \text{end\_time}]$$
   - **Why a 30-minute advance buffer?** Academic events require entrance queue processing before the keynote or proceedings begin. Checking in hours or days in advance is blocked to prevent fraudulent attendance records.
2. **Authorized Verification Authority**:
   - Only officers of the hosting organization, Student Affairs staff, and superusers may operate the check-in desk.
3. **Idempotent Check-In Records**:
   - Scanning a student's pass multiple times does not create duplicate attendance records. The database stored procedure `record_attendance_entry` checks for existing verification and updates the record safely.

---

## 2. Check-In Console & Verification Modalities

1. **Dual Verification Channels**:
   - **Camera / QR Scanner**: Fast optical scanning using device camera with real-time feedback toast (`"Check-In Verified: Student Name (ID) 🎉"`).
   - **Manual Roster Search & Verification**: Searchable table displaying student name, school ID, email, and one-click "Mark Present" trigger for students without smartphones.
2. **Real-Time Desk KPIs**:
   - The top banner provides live operational statistics:
     - Total Confirmed Registrations
     - Verified Attended Count
     - Real-Time Turnout Rate (%)
     - Window Status (`Live Now` pulsating badge vs. `Scheduled` vs. `Closed`)

---

## 3. UI/UX Architecture & Technical Choices

1. **Event Desk Picker (`/attendance`)**:
   - Shows active and upcoming events for authorized officers, highlighting events currently in the check-in window with green pulse chips.
2. **High-Contrast Modal Scanner**:
   - Dedicated dialog with manual token entry fallback input if the device webcam has permissions blocked by browser policy.
