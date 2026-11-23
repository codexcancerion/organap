import type { OrganizationListItem } from "../../types";

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OrganizationCatalog } from "../organization_catalog";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

const mockOrganizations: OrganizationListItem[] = [
  {
    id: "org-1",
    name: "Computer Science Society",
    acronym: "CSS",
    slug: "css",
    description: "Academic org for CS students",
    category: "academic",
    logoUrl: null,
    isActive: true,
    governor: {
      id: "gov-1",
      fullName: "Juan Dela Cruz",
      displayName: "Juan Dela Cruz",
      schoolId: "2026-0001",
      avatarUrl: null,
      email: "juan@school.edu",
    },
    adviser: null,
    memberCount: 15,
    eventsCount: 3,
  },
  {
    id: "org-2",
    name: "Campus Chorale",
    acronym: "CHORALE",
    slug: "chorale",
    description: "University vocal ensemble",
    category: "cultural",
    logoUrl: null,
    isActive: true,
    governor: null,
    adviser: null,
    memberCount: 22,
    eventsCount: 2,
  },
];

describe("<OrganizationCatalog />", () => {
  it("renders organization cards without member/event counts, with View Details links and icon-only Settings", () => {
    render(
      <OrganizationCatalog
        canCreate={true}
        canDelete={true}
        canUpdateAll={true}
        organizations={mockOrganizations}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Student Organizations" }),
    ).toBeInTheDocument();
    expect(screen.getByText("2 Recognized Groups")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /All Categories.*Filter organizations by category/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Register Organization/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Computer Science Society")).toBeInTheDocument();
    expect(screen.getAllByText("CSS").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("CHOR")).toBeInTheDocument();
    expect(screen.getByText("CHORALE")).toBeInTheDocument();

    expect(screen.queryByText(/15 members/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/3 events/i)).not.toBeInTheDocument();

    const detailLinks = screen.getAllByRole("link", { name: /View Details/i });

    expect(detailLinks[0]).toHaveAttribute("href", "/organizations/org-1");
    expect(detailLinks[1]).toHaveAttribute("href", "/organizations/org-2");

    const settingsBtn = screen.getByRole("button", {
      name: "Settings for Computer Science Society",
    });

    expect(settingsBtn).toBeInTheDocument();
    expect(settingsBtn.textContent?.trim()).toBe("");
  });

  it("opens Organization Settings modal with Danger Zone Delete button from card", () => {
    render(
      <OrganizationCatalog
        canDelete={true}
        canUpdateAll={true}
        organizations={mockOrganizations}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Settings for Computer Science Society",
      }),
    );

    expect(screen.getByText("Organization Settings")).toBeInTheDocument();
    expect(screen.getByText("Danger Zone")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Delete Organization/i }),
    ).toBeInTheDocument();
  });

  it("filters organizations by search query", () => {
    render(
      <OrganizationCatalog
        canCreate={false}
        organizations={mockOrganizations}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /Register Organization/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Settings for/i }),
    ).not.toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(
      /Search by name, acronym, or focus/i,
    );

    fireEvent.change(searchInput, { target: { value: "Chorale" } });

    expect(
      screen.queryByText("Computer Science Society"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Campus Chorale")).toBeInTheDocument();
  });
});
