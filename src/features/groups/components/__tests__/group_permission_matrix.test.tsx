import type { Permission } from "@/types";

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { GroupPermissionMatrix } from "../group_permission_matrix";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

const mockPermissions: Permission[] = [
  { id: "p1", code: "proposals.create", name: "Create Proposals", module: "proposals", description: "Can draft" },
  { id: "p2", code: "proposals.approve", name: "Approve Proposals", module: "proposals", description: "Can approve" },
  { id: "p3", code: "venues.view", name: "View Venues", module: "venues", description: "Can browse" },
];

describe("<GroupPermissionMatrix />", () => {
  it("renders module groupings and initial permission counts", () => {
    render(
      <GroupPermissionMatrix
        allPermissions={mockPermissions}
        groupId="g1"
        groupName="Test Group"
        initialPermissionIds={["p1"]}
      />,
    );

    expect(screen.getByText("1 of 3 permissions granted")).toBeInTheDocument();
    expect(screen.getByText("Event Proposals & Workflow")).toBeInTheDocument();
    expect(screen.getByText("Campus Venues")).toBeInTheDocument();
  });

  it("renders reset and save buttons in active editable mode", () => {
    render(
      <GroupPermissionMatrix
        allPermissions={mockPermissions}
        groupId="g1"
        groupName="Test Group"
        initialPermissionIds={["p1"]}
      />,
    );

    expect(screen.getByText("Reset")).toBeInTheDocument();
    expect(screen.getByText("Save Matrix")).toBeInTheDocument();
  });
});
