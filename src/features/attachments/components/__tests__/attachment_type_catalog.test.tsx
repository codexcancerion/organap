import type { AttachmentPermissions, AttachmentTypeItem } from "../../types";

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AttachmentTypeCatalog } from "../attachment_type_catalog";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const fullPermissions: AttachmentPermissions = {
  canView: true,
  canCreate: true,
  canChange: true,
  canDelete: true,
};

const sampleItems: AttachmentTypeItem[] = [
  {
    id: "att-1",
    name: "Budget Proposal",
    code: "BUDGET",
    category: "For Student Organizations",
    description: "Itemized budget breakdown signed by treasurer.",
    isRequired: true,
    isActive: true,
    templateFileName: "budget-template.pdf",
    templateFilePath: "events/templates/budget-template.pdf",
    templateFileUrl: "https://example.com/budget-template.pdf",
    submissionsCount: 3,
    createdAt: "2026-11-01T00:00:00Z",
    updatedAt: "2026-11-01T00:00:00Z",
  },
  {
    id: "att-2",
    name: "Event Poster",
    code: "POSTER",
    category: null,
    description: "Promotional graphic for campus bulletin.",
    isRequired: false,
    isActive: true,
    templateFileName: null,
    templateFilePath: null,
    templateFileUrl: null,
    submissionsCount: 1,
    createdAt: "2026-11-01T00:00:00Z",
    updatedAt: "2026-11-01T00:00:00Z",
  },
];

describe("<AttachmentTypeCatalog />", () => {
  it("renders dynamic attachment cards and filters by requirement tabs and search", () => {
    render(
      <AttachmentTypeCatalog
        attachmentTypes={sampleItems}
        permissions={fullPermissions}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Event Attachment Types" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Budget Proposal")).toBeInTheDocument();
    expect(screen.getByText("Event Poster")).toBeInTheDocument();
    expect(screen.getByText("For Student Organizations")).toBeInTheDocument();
    expect(screen.getByText("Others")).toBeInTheDocument();
    expect(screen.getByText("3 files attached")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Template: budget-template\.pdf/i }),
    ).toHaveAttribute("href", "https://example.com/budget-template.pdf");

    fireEvent.click(screen.getByRole("button", { name: /^Filters/i }));
    fireEvent.click(screen.getByRole("button", { name: /Requirement/i }));
    fireEvent.click(screen.getByRole("option", { name: /Required \(1\)/i }));
    expect(screen.getByText("Budget Proposal")).toBeInTheDocument();
    expect(screen.queryByText("Event Poster")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Reset/i }));
    const searchInput = screen.getByPlaceholderText(
      /Search by name, code, or guideline/i,
    );

    fireEvent.change(searchInput, { target: { value: "Poster" } });
    expect(screen.getByText("Event Poster")).toBeInTheDocument();
    expect(screen.queryByText("Budget Proposal")).not.toBeInTheDocument();
  });

  it("renders empty state with add button when no attachment types exist", () => {
    render(
      <AttachmentTypeCatalog
        attachmentTypes={[]}
        permissions={fullPermissions}
      />,
    );

    expect(
      screen.getByText("No Event Attachment Types Configured"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Add First Attachment Type/i }),
    ).toBeInTheDocument();
  });
});
