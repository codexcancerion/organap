import type { Permission } from "@/types";
import type { AdminGroupListItem } from "@/features/groups/types";

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

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
    name: "Student",
    description: "Default student body",
    isSystem: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    memberCount: 42,
    permissionIds: ["p1"],
  },
  {
    id: "g2",
    name: "Student Organization Officer",
    description: "Organization leaders",
    isSystem: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    memberCount: 57,
    permissionIds: ["p1", "p3"],
  },
  {
    id: "g3",
    name: "Faculty Adviser",
    description: "Organization advisers",
    isSystem: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    memberCount: 10,
    permissionIds: ["p3"],
  },
  {
    id: "g4",
    name: "Student Affairs",
    description: "Institutional administrators",
    isSystem: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    memberCount: 3,
    permissionIds: ["p1", "p2", "p3"],
  },
  {
    id: "g5",
    name: "Campus Security",
    description: "Facility monitoring and crowd control",
    isSystem: false,
    createdAt: "2026-01-02T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
    memberCount: 5,
    permissionIds: ["p3"],
  },
];

describe("<GroupList />", () => {
  it("renders group cards with names, member counts, and permission counts", () => {
    render(<GroupList allPermissions={mockPermissions} groups={mockGroups} />);

    expect(screen.getByText("Student")).toBeInTheDocument();
    expect(screen.getByText("42 Members")).toBeInTheDocument();
    expect(screen.getByText("Campus Security")).toBeInTheDocument();
    expect(screen.getByText("5 Members")).toBeInTheDocument();
    expect(screen.getByText("Create Group")).toBeInTheDocument();
  });

  it("renders 'System Group' lock badge and hides delete for all 4 initial groups", () => {
    render(<GroupList allPermissions={mockPermissions} groups={mockGroups} />);

    expect(screen.getAllByText("System Group")).toHaveLength(4);
    expect(screen.queryByLabelText("Delete Student")).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Delete Student Organization Officer"),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Delete Faculty Adviser")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Delete Student Affairs")).not.toBeInTheDocument();

    const deleteBtn = screen.getByLabelText("Delete Campus Security");

    expect(deleteBtn).toBeInTheDocument();
    fireEvent.click(deleteBtn);
    expect(screen.getByText("Delete Dynamic Group?")).toBeInTheDocument();
  });
});
