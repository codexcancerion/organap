import type { OrganizationDetail } from "../../types";

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { EditOrganizationModal } from "../edit_organization_modal";

const mockOrg: OrganizationDetail = {
  id: "org-1",
  name: "Computer Science Society",
  acronym: "CSS",
  slug: "css",
  description: "Academic org for CS students.",
  category: "academic",
  logoUrl: null,
  isActive: true,
  governor: null,
  adviser: null,
  members: [],
  events: [],
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

describe("<EditOrganizationModal />", () => {
  it("renders Organization Settings with HeroUI fields, Danger Zone delete action, and omits URL Slug", () => {
    const onRequestDelete = vi.fn();

    render(
      <EditOrganizationModal
        canDelete={true}
        canEdit={true}
        isOpen={true}
        organization={mockOrg}
        onClose={vi.fn()}
        onRequestDelete={onRequestDelete}
        onUpdated={vi.fn()}
      />
    );

    expect(screen.getByText("Organization Settings")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Computer Science Society")).toBeInTheDocument();
    expect(screen.getByDisplayValue("CSS")).toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.getByText("Upload Organization Logo")).toBeInTheDocument();
    expect(screen.getByRole("switch")).toBeInTheDocument();
    expect(screen.queryByText(/URL Slug/i)).not.toBeInTheDocument();

    expect(screen.getByText("Danger Zone")).toBeInTheDocument();
    const deleteBtn = screen.getByRole("button", { name: /Delete Organization/i });

    expect(deleteBtn).toBeInTheDocument();
    fireEvent.click(deleteBtn);
    expect(onRequestDelete).toHaveBeenCalledTimes(1);
  });

  it("renders only the Danger Zone when user can delete but cannot edit", () => {
    render(
      <EditOrganizationModal
        canDelete={true}
        canEdit={false}
        isOpen={true}
        organization={mockOrg}
        onClose={vi.fn()}
        onRequestDelete={vi.fn()}
        onUpdated={vi.fn()}
      />
    );

    expect(screen.getByText("Organization Settings")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("Computer Science Society")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Save Changes/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Delete Organization/i })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Close$/i }).length).toBeGreaterThanOrEqual(1);
  });
});
