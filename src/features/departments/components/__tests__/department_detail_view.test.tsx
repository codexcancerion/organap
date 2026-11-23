import type { DepartmentDetail } from "../../types";

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DepartmentDetailView } from "../department_detail_view";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

const mockDepartment: DepartmentDetail = {
  id: "dept-1",
  name: "School of Engineering and Architecture",
  code: "SEA",
  createdAt: "2026-07-01T00:00:00Z",
  updatedAt: "2026-07-01T00:00:00Z",
  programs: [
    {
      id: "prog-1",
      departmentId: "dept-1",
      name: "Bachelor of Science in Civil Engineering",
      code: "BSCE",
      createdAt: "2026-07-01T00:00:00Z",
      updatedAt: "2026-07-01T00:00:00Z",
    },
    {
      id: "prog-2",
      departmentId: "dept-1",
      name: "Bachelor of Science in Architecture",
      code: "BSARCH",
      createdAt: "2026-07-01T00:00:00Z",
      updatedAt: "2026-07-01T00:00:00Z",
    },
  ],
};

describe("<DepartmentDetailView />", () => {
  it("renders breadcrumbs, single header chip, Settings button, and contained programs", () => {
    const { container } = render(
      <DepartmentDetailView
        department={mockDepartment}
        permissions={{
          canView: true,
          canCreate: true,
          canChange: true,
          canDelete: true,
          canViewPrograms: true,
        }}
      />,
    );

    const header = container.querySelector("header");

    expect(header).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to Departments" }),
    ).toHaveAttribute("href", "/departments");
    expect(header?.querySelectorAll(".chip").length).toBe(1);
    expect(
      screen.getByRole("heading", { name: "School of Engineering and Architecture" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Settings/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Delete Department/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Bachelor of Science in Civil Engineering")).toBeInTheDocument();
    expect(screen.getByText("Bachelor of Science in Architecture")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Settings/i }));

    expect(screen.getByText("Department Settings")).toBeInTheDocument();
    expect(screen.getByText("Danger Zone")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Delete Department/i }),
    ).toBeInTheDocument();
  });
});
