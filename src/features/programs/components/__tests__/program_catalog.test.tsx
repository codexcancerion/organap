import type { DepartmentSummary } from "@/types/domain";
import type { ProgramListItem } from "../../types";

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProgramCatalog } from "../program_catalog";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

const mockDepartments: DepartmentSummary[] = [
  { id: "dept-1", name: "School of Computing", code: "SCIS" },
  { id: "dept-2", name: "School of Engineering", code: "SEA" },
];

const mockPrograms: ProgramListItem[] = [
  {
    id: "prog-1",
    departmentId: "dept-1",
    name: "Bachelor of Science in Computer Science",
    code: "BSCS",
    createdAt: "2026-07-01T00:00:00Z",
    updatedAt: "2026-07-01T00:00:00Z",
    department: mockDepartments[0],
  },
  {
    id: "prog-2",
    departmentId: "dept-2",
    name: "Bachelor of Science in Civil Engineering",
    code: "BSCE",
    createdAt: "2026-07-01T00:00:00Z",
    updatedAt: "2026-07-01T00:00:00Z",
    department: mockDepartments[1],
  },
];

describe("<ProgramCatalog />", () => {
  it("renders clickable program cards, View Details links, and icon-only Settings button", () => {
    render(
      <ProgramCatalog
        departments={mockDepartments}
        permissions={{
          canView: true,
          canCreate: true,
          canChange: true,
          canDelete: true,
          canViewDepartments: true,
        }}
        programs={mockPrograms}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Academic Programs" }),
    ).toBeInTheDocument();
    expect(screen.getByText("2 Programs")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add Program/i })).toBeInTheDocument();
    expect(screen.getByText("SCIS · School of Computing")).toBeInTheDocument();
    expect(screen.getByText("SEA · School of Engineering")).toBeInTheDocument();

    const detailLinks = screen.getAllByRole("link", { name: /View Details/i });

    expect(detailLinks[0]).toHaveAttribute("href", "/programs/prog-1");
    expect(detailLinks[1]).toHaveAttribute("href", "/programs/prog-2");

    const settingsBtn = screen.getByRole("button", {
      name: "Settings for Bachelor of Science in Computer Science",
    });

    expect(settingsBtn).toBeInTheDocument();
    expect(settingsBtn.textContent?.trim()).toBe("");
    expect(
      screen.queryByRole("button", { name: /Delete Bachelor/i }),
    ).not.toBeInTheDocument();
  });

  it("opens Program Settings modal with Danger Zone Delete button", () => {
    render(
      <ProgramCatalog
        departments={mockDepartments}
        permissions={{
          canView: true,
          canCreate: true,
          canChange: true,
          canDelete: true,
          canViewDepartments: true,
        }}
        programs={mockPrograms}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Settings for Bachelor of Science in Computer Science",
      }),
    );

    expect(screen.getByText("Program Settings")).toBeInTheDocument();
    expect(screen.getByText("Danger Zone")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Delete Program/i }),
    ).toBeInTheDocument();
  });

  it("filters programs by search query", () => {
    render(
      <ProgramCatalog
        departments={mockDepartments}
        permissions={{
          canView: true,
          canCreate: false,
          canChange: false,
          canDelete: false,
          canViewDepartments: false,
        }}
        programs={mockPrograms}
      />,
    );

    const searchInput = screen.getByPlaceholderText(
      /Search by program name, code, or department/i,
    );

    fireEvent.change(searchInput, { target: { value: "Civil" } });

    expect(
      screen.queryByText("Bachelor of Science in Computer Science"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Bachelor of Science in Civil Engineering"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Settings for/i }),
    ).not.toBeInTheDocument();
  });
});
