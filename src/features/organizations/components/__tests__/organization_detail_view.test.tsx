import type { OrganizationDetail } from "../../types";

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { OrganizationDetailView } from "../organization_detail_view";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

const mockOrganization: OrganizationDetail = {
  id: "org-1",
  name: "Computer Science Society",
  acronym: "CSS",
  slug: "css",
  description: "The academic organization for Computer Science students.",
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
  adviser: {
    id: "adv-1",
    fullName: "Prof. Maria Santos",
    displayName: "Prof. Maria Santos",
    schoolId: "FAC-01",
    avatarUrl: null,
    email: "maria@school.edu",
  },
  members: [
    {
      id: "mem-1",
      userId: "gov-1",
      fullName: "Juan Dela Cruz",
      displayName: "Juan Dela Cruz",
      schoolId: "2026-0001",
      avatarUrl: null,
      email: "juan@school.edu",
      position: "Governor / President",
      isOfficer: true,
      isAdviser: false,
      joinedAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "mem-2",
      userId: "std-2",
      fullName: "Ana Reyes",
      displayName: "Ana Reyes",
      schoolId: "2026-0009",
      avatarUrl: null,
      email: "ana@school.edu",
      position: "Secretary",
      isOfficer: true,
      isAdviser: false,
      joinedAt: "2026-01-02T00:00:00Z",
    },
  ],
  events: [
    {
      id: "evt-1",
      title: "Code Fest 2026",
      purpose: "Annual student coding competition",
      organizationId: "org-1",
      organizationName: "Computer Science Society",
      organizationAcronym: "CSS",
      venueId: "venue-1",
      venueName: "Grand Auditorium",
      venueCapacity: 200,
      startTime: "2026-12-01T09:00:00Z",
      endTime: "2026-12-01T17:00:00Z",
      registrationDeadline: "2026-11-30T23:59:59Z",
      capacity: 150,
      status: "approved",
      cancellationReason: null,
      createdById: "gov-1",
      creatorName: "Juan Dela Cruz",
      createdAt: "2026-11-01T00:00:00Z",
      updatedAt: "2026-11-01T00:00:00Z",
    },
  ],
  canEditPositions: true,
  permissions: {
    canViewOrganizations: true,
    canUpdateOwnOrganization: true,
    canUpdateAllOrganizations: true,
    canDeleteOrganizations: true,
    canCreateOrganizations: true,
    canEditThisOrg: true,
    canEditPositions: true,
    canManageMembers: true,
    canChangeLeaders: true,
    isCurrentGovernor: false,
    isCurrentAdviser: false,
  },
};

describe("<OrganizationDetailView />", () => {
  it("renders breadcrumbs, single status chip, clean header without extra metadata, and single Settings action button", () => {
    const { container } = render(
      <OrganizationDetailView currentUserId="admin-1" organization={mockOrganization} />
    );

    const header = container.querySelector("header");

    expect(header).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Organizations" })).toHaveAttribute(
      "href",
      "/organizations"
    );
    expect(screen.getByRole("heading", { name: "Computer Science Society" })).toBeInTheDocument();

    // Only one chip inside the header
    const chipsInHeader = header?.querySelectorAll(".chip") ?? [];

    expect(chipsInHeader.length).toBe(1);
    expect(screen.getByText("Recognized & Active")).toBeInTheDocument();

    // No extra metadata line below the description inside the header
    expect(header).not.toHaveTextContent(/2 members/i);
    expect(header).not.toHaveTextContent(/1 event/i);

    // Header actions on the right expose only the Settings HeroUI button
    const settingsButton = screen.getByRole("button", { name: /^Settings$/i });

    expect(settingsButton).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Delete Org/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Edit Details/i })).not.toBeInTheDocument();

    // Opening Settings reveals Organization Settings with the Danger Zone delete action
    fireEvent.click(settingsButton);
    expect(screen.getByText("Organization Settings")).toBeInTheDocument();
    expect(screen.getByText("Danger Zone")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Delete Organization/i })).toBeInTheDocument();
  });

  it("renders leadership, non-leader members, and organization events sections", () => {
    render(<OrganizationDetailView currentUserId="admin-1" organization={mockOrganization} />);

    expect(screen.getByRole("heading", { name: "Organization Leadership" })).toBeInTheDocument();
    expect(screen.getByText("Juan Dela Cruz")).toBeInTheDocument();
    expect(screen.getByText("Prof. Maria Santos")).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "Organization Members" })).toBeInTheDocument();
    expect(screen.getByText("Ana Reyes")).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "Organization Events" })).toBeInTheDocument();
    expect(screen.getByText("Code Fest 2026")).toBeInTheDocument();
  });
});
