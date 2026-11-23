import type { Semester } from "../../types";

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SemesterCatalog } from "../semester_catalog";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

const mockSemesters: Semester[] = [
  {
    id: "sem-1",
    name: "1st Semester AY 2026-2027",
    description: "Primary fall term",
    startDate: "2026-08-01",
    endDate: "2026-12-20",
    createdAt: "2026-07-01T00:00:00Z",
    updatedAt: "2026-07-01T00:00:00Z",
  },
  {
    id: "sem-2",
    name: "2nd Semester AY 2026-2027",
    description: "Spring term",
    startDate: "2027-01-15",
    endDate: "2027-05-30",
    createdAt: "2026-07-01T00:00:00Z",
    updatedAt: "2026-07-01T00:00:00Z",
  },
];

describe("<SemesterCatalog />", () => {
  it("renders semesters with duration metadata and icon-only Settings button gated by permissions", () => {
    const { rerender } = render(
      <SemesterCatalog
        permissions={{
          canView: true,
          canCreate: false,
          canChange: false,
          canDelete: false,
        }}
        semesters={mockSemesters}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Academic Semesters" }),
    ).toBeInTheDocument();
    expect(screen.getByText("2 Semesters")).toBeInTheDocument();
    expect(screen.getByText("141 days")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Create Semester/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Settings for/i }),
    ).not.toBeInTheDocument();

    rerender(
      <SemesterCatalog
        permissions={{
          canView: true,
          canCreate: true,
          canChange: true,
          canDelete: true,
        }}
        semesters={mockSemesters}
      />,
    );

    expect(
      screen.getByRole("button", { name: /Create Semester/i }),
    ).toBeInTheDocument();

    const settingsBtn = screen.getByRole("button", {
      name: "Settings for 1st Semester AY 2026-2027",
    });

    expect(settingsBtn).toBeInTheDocument();
    expect(settingsBtn.textContent?.trim()).toBe("");
    expect(
      screen.queryByRole("button", { name: /Delete 1st Semester/i }),
    ).not.toBeInTheDocument();
  });

  it("opens Semester Settings modal with Danger Zone Delete button", () => {
    render(
      <SemesterCatalog
        permissions={{
          canView: true,
          canCreate: true,
          canChange: true,
          canDelete: true,
        }}
        semesters={mockSemesters}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Settings for 1st Semester AY 2026-2027",
      }),
    );

    expect(screen.getByText("Semester Settings")).toBeInTheDocument();
    expect(screen.getByText("Danger Zone")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Delete Semester/i }),
    ).toBeInTheDocument();
  });

  it("filters semesters by search query", () => {
    render(
      <SemesterCatalog
        permissions={{
          canView: true,
          canCreate: true,
          canChange: true,
          canDelete: true,
        }}
        semesters={mockSemesters}
      />,
    );

    const searchInput = screen.getByPlaceholderText(
      /Search semesters by name or description/i,
    );

    fireEvent.change(searchInput, { target: { value: "Spring" } });

    expect(
      screen.queryByText("1st Semester AY 2026-2027"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("2nd Semester AY 2026-2027")).toBeInTheDocument();
  });
});
