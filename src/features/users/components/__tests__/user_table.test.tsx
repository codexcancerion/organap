import type { UserGroup } from "@/types";
import type { AdminUserListItem } from "@/features/users/types";

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { UserTable } from "../user_table";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/contexts/auth_context", () => ({
  useAuth: () => ({
    user: { id: "admin-1", isSuperuser: true, isStaff: true },
    isSuperuser: true,
    isStaff: true,
  }),
}));

const mockGroups: UserGroup[] = [
  { id: "g1", name: "Students", description: "All students" },
  { id: "g2", name: "Student Affairs", description: "Admin body" },
];

const mockUsers: AdminUserListItem[] = [
  {
    id: "u1",
    displayName: "Juan Dela Cruz",
    schoolId: "2026-0001",
    avatarUrl: null,
    isActive: true,
    isStaff: false,
    isSuperuser: false,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    groups: [mockGroups[0]],
  },
  {
    id: "u2",
    displayName: "Maria Santos",
    schoolId: "2026-0002",
    avatarUrl: null,
    isActive: false,
    isStaff: true,
    isSuperuser: true,
    createdAt: "2026-01-02T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
    groups: [mockGroups[1]],
  },
];

describe("<UserTable />", () => {
  it("renders user roster rows with name, ID, status chips, and group tags", () => {
    render(<UserTable allGroups={mockGroups} users={mockUsers} />);

    expect(screen.getByText("Juan Dela Cruz")).toBeInTheDocument();
    expect(screen.getByText("ID: 2026-0001")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getAllByText("Students").length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText("Maria Santos")).toBeInTheDocument();
    expect(screen.getByText("ID: 2026-0002")).toBeInTheDocument();
    expect(screen.getByText("Inactive")).toBeInTheDocument();
    expect(screen.getByText("SUPERUSER")).toBeInTheDocument();
    expect(screen.getAllByText("Student Affairs").length).toBeGreaterThanOrEqual(1);
  });

  it("filters users dynamically based on search input query", () => {
    render(<UserTable allGroups={mockGroups} users={mockUsers} />);

    const searchInput = screen.getByPlaceholderText(/Search by name or Student\/Staff ID/i);

    fireEvent.change(searchInput, { target: { value: "Juan" } });

    expect(screen.getByText("Juan Dela Cruz")).toBeInTheDocument();
    expect(screen.queryByText("Maria Santos")).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "2026-0002" } });
    expect(screen.queryByText("Juan Dela Cruz")).not.toBeInTheDocument();
    expect(screen.getByText("Maria Santos")).toBeInTheDocument();
  });
});
