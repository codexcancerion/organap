import type { Metadata } from "next";

import {
  LegalDocumentShell,
  type LegalSection,
} from "@/components/layout/legal_document_shell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How OrGanap collects, protects, and governs institutional student, officer, event, and attendance records.",
};

const PRIVACY_SECTIONS: LegalSection[] = [
  {
    id: "data-collected",
    title: "1. Institutional Information We Collect",
    paragraphs: [
      "OrGanap collects only the campus account and participation details required to administer recognized student organization events within one academic institution.",
    ],
    bullets: [
      "Account identity: full display name, school or employee ID, institutional email address, profile avatar, and account status flags.",
      "Organizational governance: student organization memberships, officer positions, governor assignments, and faculty adviser assignments.",
      "Event proposals and attachments: activity titles, rationales, venue bookings, schedules, capacities, review remarks, and uploaded proposal documents.",
      "Registration and attendance logs: confirmed or withdrawn registration timestamps, unique pass QR tokens, entrance check-in timestamps, verification method, and verifying officer identity.",
    ],
  },
  {
    id: "how-data-is-used",
    title: "2. How Your Data Is Used",
    paragraphs: [
      "Collected information is used strictly to operate campus event approval, registration, attendance verification, and institutional reporting workflows.",
    ],
    bullets: [
      "Authenticating active school accounts and enforcing role-based and organization-scoped access permissions.",
      "Routing event proposals from organization officers to faculty advisers and Student Affairs personnel while preventing venue scheduling conflicts.",
      "Managing student event seats, issuing QR entry passes, recording physical attendance, and generating RFC 4180 CSV attendance audits.",
      "Delivering in-application notifications for proposal decisions, registration confirmations, and event cancellations.",
    ],
  },
  {
    id: "access-and-privacy-boundaries",
    title: "3. Access Controls & Data Privacy Boundaries",
    paragraphs: [
      "OrGanap enforces PostgreSQL Row Level Security across all protected tables and exposes aggregate event registration counts without leaking participant identities to unauthorized peers.",
    ],
    bullets: [
      "Students can view approved campus events and access only their own registration records, QR passes, and attendance timestamps.",
      "Organization officers can inspect registration rosters, verify attendance, and export attendance CSVs exclusively for events belonging to their assigned organization.",
      "Faculty advisers and Student Affairs personnel can review proposals, view audit histories, and oversee campus-wide compliance within their authorized institutional scope.",
      "OrGanap never sells, shares, or transfers student records to third-party advertising networks or external event marketplaces.",
    ],
  },
  {
    id: "cookies-and-sessions",
    title: "4. Essential Cookies & Local Storage",
    paragraphs: [
      "OrGanap uses strictly necessary HTTP-only session cookies via Supabase Auth to maintain authenticated sessions, alongside local browser storage for UI preferences such as dark or light theme selection, sidebar collapse state, and cookie banner acknowledgment.",
    ],
  },
  {
    id: "retention-and-contact",
    title: "5. Record Retention & Institutional Contact",
    paragraphs: [
      "Proposal review histories, cancellation reasons, and verified attendance logs are retained as immutable institutional records for co-curricular auditing and organization accreditation. To request profile corrections, account deactivation, or data review, contact the Office of Student Affairs and Services or email support@organap.edu.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalDocumentShell
      badgeLabel="Institutional Privacy Standard"
      description="How OrGanap collects, governs, and protects campus account, registration, and attendance records."
      effectiveDate="November 23, 2026"
      noticeDescription="OrGanap is built for single-institution student organization governance. Student registration and attendance records are accessible only to you, authorized officers of the organizing group, and Student Affairs personnel."
      noticeTitle="Scoped Institutional Data Handling"
      sections={PRIVACY_SECTIONS}
      siblingHref="/terms"
      siblingLabel="Terms of Service"
      title="Privacy Policy"
    />
  );
}
