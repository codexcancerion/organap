import type { Metadata } from "next";

import {
  LegalDocumentShell,
  type LegalSection,
} from "@/components/layout/legal_document_shell";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Institutional rules and acceptable use terms governing OrGanap event proposals, registrations, and digital attendance verification.",
};

const TERMS_SECTIONS: LegalSection[] = [
  {
    id: "eligibility",
    title: "1. Institutional Eligibility & Accounts",
    paragraphs: [
      "Access to OrGanap is restricted to active students, recognized student organization officers, assigned faculty advisers, and authorized Student Affairs or IT personnel within the participating institution.",
      "Users must authenticate with their registered institutional credentials and keep account information accurate. Account activation, deactivation, and role group assignments are governed by Student Affairs personnel.",
    ],
  },
  {
    id: "proposals-and-approvals",
    title: "2. Event Proposals & Two-Stage Approval Rules",
    paragraphs: [
      "Organization officers are responsible for submitting truthful event purposes, accurate venue capacities, valid schedules, and required institutional attachments before submission.",
    ],
    bullets: [
      "Submitted proposals route sequentially through the assigned faculty adviser for endorsement and Student Affairs for final approval and venue reservation.",
      "Approved events cannot be edited directly. Any proposal returned for revision restarts adviser review upon resubmission to preserve audit integrity.",
      "Student Affairs reserves the right to cancel an approved event prior to its scheduled start time by recording an official cancellation reason.",
    ],
  },
  {
    id: "registrations-and-passes",
    title: "3. Student Registrations & Non-Transferable Passes",
    paragraphs: [
      "Active students may register for approved events prior to the published registration deadline while capacity remains available. Confirmed digital passes and QR passcodes are strictly personal and non-transferable.",
      "If you are unable to attend, you must withdraw prior to the registration deadline so your reserved seat is released for fellow students. Once attendance has been verified at the venue, registrations cannot be withdrawn.",
    ],
  },
  {
    id: "attendance-integrity",
    title: "4. Digital Attendance Verification Integrity",
    paragraphs: [
      "Attendance check-in opens 30 minutes prior to the scheduled event start time and closes at the scheduled end time. Only authorized officers of the organizing group or Student Affairs staff may record attendance.",
      "Attempting to spoof check-ins, share QR tokens across students, bypass organizational boundaries, or tamper with verification logs violates institutional conduct policy and may result in immediate account suspension.",
    ],
  },
  {
    id: "system-boundaries",
    title: "5. Platform Scope & Availability",
    paragraphs: [
      "OrGanap manages internal campus event proposals, venue conflict prevention, registrations, and attendance tracking without processing payments, ticket sales, or academic grading. For policy questions or technical support, contact Student Affairs or email support@organap.edu.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalDocumentShell
      badgeLabel="Institutional Usage Policy"
      description="Acceptable use standards and operational rules for OrGanap users, student organizations, advisers, and Student Affairs."
      effectiveDate="November 23, 2026"
      noticeDescription="By signing in or submitting event proposals, registrations, or attendance verifications through OrGanap, you agree to follow institutional Student Affairs governance policies."
      noticeTitle="Campus Governance Agreement"
      sections={TERMS_SECTIONS}
      siblingHref="/privacy"
      siblingLabel="Privacy Policy"
      title="Terms of Service"
    />
  );
}
