# Reports Feature (`src/features/reports`)

Institutional participation reports, attendance auditing, and RFC 4180 compliant CSV export engine (FR-14).

---

## 1. Domain Rationale & Business Rules

1. **Accreditation & Co-Curricular Verification**:
   - Academic institutions require verifiable student attendance records for co-curricular transcripts, student organization re-accreditation, and university resource auditing.
2. **Distinction Between Registered vs. Attended**:
   - A critical institutional pain point is "phantom registrations" (students reserving seats but failing to show up). The reporting engine explicitly separates:
     - `totalRegistered`: Students who signed up prior to deadline.
     - `totalAttended`: Students physically verified at the entrance.
     - `attendanceRate`: Verified Turnout percentage $\frac{\text{Attended}}{\text{Registered}} \times 100\%$.
     - `capacityUtilization`: Facility efficiency $\frac{\text{Registered}}{\text{Venue Capacity}} \times 100\%$.

---

## 2. RFC 4180 CSV Export Engine (`services/report_export_services.ts`)

1. **Strict Standard Compliance**:
   - Standard spreadsheet software (Microsoft Excel, Apple Numbers, Google Sheets) frequently mangles CSV files containing commas in student names, multiline text, or non-ASCII characters.
2. **Escaping Rules Enforced**:
   - Any field containing commas, double quotes (`"`), or newlines is wrapped in double quotes.
   - Any internal double quote is escaped by doubling it (`""`).
3. **CRLF Row Delimiters**:
   - Enforces `\r\n` line breaks across all platforms as mandated by RFC 4180.
4. **UTF-8 Byte Order Mark (`\uFEFF`)**:
   - The export prepends the UTF-8 BOM byte sequence. Without this, Microsoft Excel on Windows defaults to ANSI or Windows-1252 encoding, corrupting student names containing accented characters or ñ.

---

## 3. UI/UX Architecture & Technical Choices

1. **Audit Report Drill-Down (`/reports/[id]`)**:
   - Displays event schedule, venue, summary metric cards, and a searchable attendee table.
   - Filter pills allow instant toggle between "All Attendees", "Attended", and "Absent".
2. **One-Click Export Button**:
   - `<ReportExportButton />` triggers pure client-side CSV assembly and automated download without round-tripping heavy file payloads through server memory.
