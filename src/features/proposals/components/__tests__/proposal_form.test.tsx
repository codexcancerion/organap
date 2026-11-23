import type { AttachmentType } from "../../types";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProposalForm } from "../proposal_form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("<ProposalForm />", () => {
  const organizations = [
    { id: "org-1", name: "Computer Science Society", acronym: "CSS" },
  ];
  const venues = [
    {
      id: "venue-1",
      name: "University Main Auditorium",
      capacity: 250,
      location: "Main Building",
    },
  ];
  const semesters = [
    {
      id: "sem-1",
      name: "1st Semester AY 2026-2027",
      startDate: "2026-08-01",
      endDate: "2026-12-20",
    },
  ];
  const attachmentTypes: AttachmentType[] = [
    {
      id: "type-1",
      name: "Program Paper",
      code: "PROGRAM_PAPER",
      category: "Documents",
      description: "Detailed outline of activities.",
      isRequired: true,
      isActive: true,
      templateFileName: "program-paper-template.pdf",
      templateFilePath: "events/templates/program-paper-template.pdf",
      templateFileUrl: "https://example.com/program-paper-template.pdf",
      createdAt: "2026-11-01T00:00:00Z",
      updatedAt: "2026-11-01T00:00:00Z",
    },
    {
      id: "type-2",
      name: "Special Permit",
      code: "SPECIAL_PERMIT",
      category: null,
      description: "Additional clearance if applicable.",
      isRequired: false,
      isActive: true,
      templateFileName: null,
      templateFilePath: null,
      templateFileUrl: null,
      createdAt: "2026-11-01T00:00:00Z",
      updatedAt: "2026-11-01T00:00:00Z",
    },
    {
      id: "type-3",
      name: "Insurance",
      code: "INSURANCE",
      category: "For Off-Campus Activities",
      description: "Proof of insurance coverage.",
      isRequired: false,
      isActive: true,
      templateFileName: null,
      templateFilePath: null,
      templateFileUrl: null,
      createdAt: "2026-11-01T00:00:00Z",
      updatedAt: "2026-11-01T00:00:00Z",
    },
  ];

  it("renders HeroUI DateRangePicker, DatePicker, and category-grouped attachments", () => {
    render(
      <ProposalForm
        attachmentTypes={attachmentTypes}
        organizations={organizations}
        semesters={semesters}
        venues={venues}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /Event Overview & Rationale/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /Schedule & Attendance Capacity/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Event Schedule \(Start – End\)/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Student Registration Deadline/i),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Event Rationale/i),
    ).toBeInTheDocument();

    const headings = screen
      .getAllByRole("heading", { level: 3 })
      .map((el) => el.textContent);

    expect(headings).toEqual([
      "Documents",
      "For Off-Campus Activities",
      "Others",
    ]);
    expect(
      screen.getByRole("link", { name: /Download Template/i }),
    ).toHaveAttribute("href", "https://example.com/program-paper-template.pdf");
  });
});
