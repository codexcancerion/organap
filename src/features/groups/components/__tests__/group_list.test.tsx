import type { Permission } from "@/types";
import type { AdminGroupListItem } from "@/features/groups/types";

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { GroupList } from "../group_list";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

const mockPermissions: Permission[] = [
  { id: "p1", code: "proposals.create", name: "Create Proposals", module: "proposals", description: null },
  { id: "p2", code: "proposals.approve", name: "Approve Proposals", module: "proposals", description: null },
  { id: "p3", code: "venues.view", name: "View Venues", module: "venues", description: null },
];

const mockGroups: AdminGroupListItem[] = [
  {
    id: "g1",
    name: "Students",
    description: "Default student body",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    memberCount: 42,
    permissionIds: ["p1"],
  },
  {
    id: "g2",
    name: "Campus Security",
    description: "Facility monitoring and crowd control",
    createdAt: "2026-01-02T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
    memberCount: 5,
    permissionIds: ["p3"],
  },
];

describe("<GroupList />", () => {
  it("renders group cards with names, member counts, and permission counts", () => {
    render(<GroupList allPermissions={mockPermissions} groups={mockGroups} />);

    expect(screen.getByText("Students")).toBeInTheDocument();
    expect(screen.getByText("42 Members")).toBeInTheDocument();
    expect(screen.getByText("Campus Security")).toBeInTheDocument();
    expect(screen.getByText("5 Members")).toBeInTheDocument();
    expect(screen.getByText("Create Group")).toBeInTheDocument();
  });

  it("renders 'System Group' lock badge for protected system groups and hides delete", () => {
    render(<GroupList allPermissions={mockPermissions} groups={mockGroups} />);

    expect(screen.getByText("System Group")).toBeInTheDocument();
    expect(screen.queryByLabelText("Delete Students")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Delete Campus Security")).toBeInTheDocument();
  });
});
