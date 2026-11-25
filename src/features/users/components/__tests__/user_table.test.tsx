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
  { id: "g1", name: "Student", description: "All students" },
  { id: "g2", name: "Student Affairs", description: "Admin body" },
];

const mockUsers: AdminUserListItem[] = [
  {
    id: "u1",
    displayName: "Juan Dela Cruz",
    email: "juan.delacruz@kcp.edu.ph",
    schoolId: "2026-0001",
    avatarUrl: null,
    isActive: true,
    isStaff: false,
    isSuperuser: false,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    groups: [mockGroups[0]],
    organizations: [
      {
        id: "org-1",
        name: "College of IT SBO",
        acronym: "CIT SBO",
        position: "Member",
        isOfficer: false,
      },
    ],
  },
  {
    id: "u2",
    displayName: "Maria Santos",
    email: "maria.santos@kcp.edu.ph",
    schoolId: "2026-0002",
    avatarUrl: null,
    isActive: false,
    isStaff: true,
    isSuperuser: true,
    createdAt: "2026-01-02T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
    groups: [mockGroups[1]],
    organizations: [],
  },
];

describe("<UserTable />", () => {
  it("renders user roster rows with name, ID, email, status chips, groups, and organizations", () => {
    render(<UserTable allGroups={mockGroups} users={mockUsers} />);

    expect(screen.getByText("Juan Dela Cruz")).toBeInTheDocument();
    expect(screen.getByText(/ID: 2026-0001/)).toBeInTheDocument();
    expect(screen.getByText(/juan\.delacruz@kcp\.edu\.ph/)).toBeInTheDocument();
    expect(screen.getByText(/CIT SBO/)).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getAllByText("Student").length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText("Maria Santos")).toBeInTheDocument();
    expect(screen.getByText(/ID: 2026-0002/)).toBeInTheDocument();
    expect(screen.getByText("Inactive")).toBeInTheDocument();
    expect(screen.getByText("SUPERUSER")).toBeInTheDocument();
    expect(screen.getAllByText("Student Affairs").length).toBeGreaterThanOrEqual(1);
  });

  it("filters users dynamically by name, ID, email, or organization", () => {
    render(<UserTable allGroups={mockGroups} users={mockUsers} />);

    const searchInput = screen.getByPlaceholderText(/Search by name, ID, email, or org/i);

    fireEvent.change(searchInput, { target: { value: "juan.delacruz" } });
    expect(screen.getByText("Juan Dela Cruz")).toBeInTheDocument();
    expect(screen.queryByText("Maria Santos")).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "2026-0002" } });
    expect(screen.queryByText("Juan Dela Cruz")).not.toBeInTheDocument();
    expect(screen.getByText("Maria Santos")).toBeInTheDocument();
  });
});
