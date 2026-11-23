import type { ProfileOverview } from "../../types";

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { ProfileView } from "../profile_view";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const mockUser = {
  id: "u-1",
  email: "jane.doe@organap.edu",
  displayName: "Jane Doe",
  schoolId: "2026-10492",
  avatarUrl: null,
  isSuperuser: false,
  isStaff: false,
  isActive: true,
  groups: ["Student Organization Officers"],
  permissions: ["proposals.create", "events.view"],
};

vi.mock("@/contexts/auth_context", () => ({
  useAuth: () => ({
    user: mockUser,
    updateProfile: vi.fn().mockResolvedValue(null),
    updatePassword: vi.fn().mockResolvedValue(null),
    requestPasswordReset: vi.fn().mockResolvedValue(null),
  }),
}));

const mockOverview: ProfileOverview = {
  user: mockUser,
  createdAt: "2026-08-01T08:00:00Z",
  updatedAt: "2026-11-18T08:00:00Z",
  organizations: [
    {
      organizationId: "org-1",
      name: "Computer Science Society",
      acronym: "CSS",
      category: "academic",
      logoUrl: null,
      isActive: true,
      position: "President",
      positionTitle: "President",
      isOfficer: true,
      isAdviser: false,
    },
  ],
  stats: {
    registeredCount: 4,
    attendedCount: 2,
    proposalsCount: 3,
  },
  permissionDetails: [
    { code: "proposals.create", name: "Can create proposals", module: "proposals" },
    { code: "events.view", name: "Can view events", module: "events" },
  ],
};

describe("<ProfileView />", () => {
  it("renders identity form, avatar uploader, security card, organizations, and access details", () => {
    render(<ProfileView overview={mockOverview} />);

    expect(screen.getByRole("heading", { name: "Jane Doe" })).toBeInTheDocument();
    expect(screen.getAllByText("jane.doe@organap.edu").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("2026-10492")).toBeInTheDocument();
    expect(screen.getByLabelText("Upload profile photo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Save Profile/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Update Password/i })).toBeInTheDocument();

    // Campus activity counters
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();

    // Organizations & RBAC
    expect(screen.getByText("Computer Science Society")).toBeInTheDocument();
    expect(screen.getByText("CSS")).toBeInTheDocument();
    expect(screen.getByText("President")).toBeInTheDocument();
    expect(screen.getByText("Student Organization Officers")).toBeInTheDocument();
    expect(screen.getByText("proposals.create")).toBeInTheDocument();
  });
});
