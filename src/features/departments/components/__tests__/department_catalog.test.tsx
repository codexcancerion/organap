import type { DepartmentListItem } from "../../types";

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DepartmentCatalog } from "../department_catalog";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

const mockDepartments: DepartmentListItem[] = [
  {
    id: "dept-1",
    name: "College of Information Technology",
    code: "CIT",
    createdAt: "2026-07-01T00:00:00Z",
    updatedAt: "2026-07-01T00:00:00Z",
    programsCount: 6,
    programs: [
      { id: "prog-1", name: "BS Computer Science", code: "BSCS" },
      { id: "prog-2", name: "BS Information Technology", code: "BSIT" },
      { id: "prog-3", name: "BS Information Systems", code: "BSIS" },
      { id: "prog-4", name: "BS Cybersecurity", code: "BSCY" },
      { id: "prog-5", name: "BS Data Science", code: "BSDS" },
      { id: "prog-6", name: "BS Entertainment Computing", code: "BSEC" },
    ],
  },
  {
    id: "dept-2",
    name: "School of Engineering and Architecture",
    code: "SEA",
    createdAt: "2026-07-01T00:00:00Z",
    updatedAt: "2026-07-01T00:00:00Z",
    programsCount: 0,
    programs: [],
  },
];

describe("<DepartmentCatalog />", () => {
  it("renders top 5 program chips with ellipsis for 5+ programs, dead chip for empty, and hides program count label", () => {
    render(
      <DepartmentCatalog
        departments={mockDepartments}
        permissions={{
          canView: true,
          canCreate: true,
          canChange: true,
          canDelete: true,
          canViewPrograms: true,
        }}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Academic Departments" }),
    ).toBeInTheDocument();
    expect(screen.getByText("2 Departments")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add Department/i })).toBeInTheDocument();

    // No "6 Programs" or "1 Program" label
    expect(screen.queryByText(/6\s*Programs/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/0\s*Programs/i)).not.toBeInTheDocument();

    // Top 5 programs + "..." ellipsis chip, 6th omitted
    expect(screen.getByText("BSCS")).toBeInTheDocument();
    expect(screen.getByText("BSIT")).toBeInTheDocument();
    expect(screen.getByText("BSIS")).toBeInTheDocument();
    expect(screen.getByText("BSCY")).toBeInTheDocument();
    expect(screen.getByText("BSDS")).toBeInTheDocument();
    expect(screen.queryByText("BSEC")).not.toBeInTheDocument();
    expect(screen.getByText("...")).toBeInTheDocument();

    // Empty department displays "No programs yet" dead chip
    expect(screen.getByText("No programs yet")).toBeInTheDocument();

    // Stretched card links & Settings button (no direct card Delete button)
    const detailLinks = screen.getAllByRole("link", { name: /View Details/i });

    expect(detailLinks[0]).toHaveAttribute("href", "/departments/dept-1");
    expect(detailLinks[1]).toHaveAttribute("href", "/departments/dept-2");

    const settingsBtn = screen.getByRole("button", {
      name: "Settings for College of Information Technology",
    });

    expect(settingsBtn).toBeInTheDocument();
    expect(settingsBtn.textContent?.trim()).toBe("");
    expect(
      screen.queryByRole("button", { name: /Delete College/i }),
    ).not.toBeInTheDocument();
  });

  it("opens Department Settings modal with Danger Zone Delete button", () => {
    render(
      <DepartmentCatalog
        departments={mockDepartments}
        permissions={{
          canView: true,
          canCreate: true,
          canChange: true,
          canDelete: true,
          canViewPrograms: true,
        }}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Settings for School of Engineering and Architecture",
      }),
    );

    expect(screen.getByText("Department Settings")).toBeInTheDocument();
    expect(screen.getByText("Danger Zone")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Delete Department/i }),
    ).toBeInTheDocument();
  });

  it("filters departments by search query including program code", () => {
    render(
      <DepartmentCatalog
        departments={mockDepartments}
        permissions={{
          canView: true,
          canCreate: false,
          canChange: false,
          canDelete: false,
          canViewPrograms: true,
        }}
      />,
    );

    const searchInput = screen.getByPlaceholderText(
      /Search by department name, code, or program/i,
    );

    fireEvent.change(searchInput, { target: { value: "Engineering" } });

    expect(
      screen.queryByText("College of Information Technology"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("School of Engineering and Architecture"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Settings for/i }),
    ).not.toBeInTheDocument();
  });
});
