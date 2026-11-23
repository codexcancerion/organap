import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { Sidebar } from "../sidebar";

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
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

const mockAuthState = {
  user: {
    id: "user-1",
    email: "admin@organap.edu",
    displayName: "Admin User",
    schoolId: "2026-0001",
    avatarUrl: null,
    isSuperuser: true,
    isStaff: true,
    isActive: true,
    groups: ["Student Affairs"],
    permissions: ["settings.manage", "users.view", "groups.view", "reports.view"],
  },
  signOut: vi.fn(),
  isStaff: true,
  isSuperuser: true,
  hasPermission: () => true,
};

vi.mock("@/contexts/auth_context", () => ({
  useAuth: () => mockAuthState,
}));

describe("<Sidebar />", () => {
  beforeEach(() => {
    localStorage.clear();
    mockAuthState.isStaff = true;
    mockAuthState.isSuperuser = true;
    mockAuthState.hasPermission = () => true;
  });

  it("renders a single Settings nav link even for superusers and staff", () => {
    render(<Sidebar />);

    const settingsLinks = screen
      .getAllByRole("link", { name: /settings/i })
      .filter((el) => el.getAttribute("href") === "/settings");

    expect(settingsLinks).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Users" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Groups" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Attendance" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Reports" })).not.toBeInTheDocument();
  });

  it("hides Attendance nav link for regular student users", () => {
    mockAuthState.isStaff = false;
    mockAuthState.isSuperuser = false;
    mockAuthState.hasPermission = () => false;

    render(<Sidebar />);

    expect(screen.getByRole("link", { name: "Events" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "My Passes" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Attendance" })).not.toBeInTheDocument();
  });

  it("toggles compact collapsed state and persists it to localStorage", () => {
    render(<Sidebar />);

    const collapseBtn = screen.getByRole("button", { name: "Collapse sidebar" });

    fireEvent.click(collapseBtn);
    expect(localStorage.getItem("organap-sidebar-collapsed")).toBe("true");
    expect(screen.getByRole("button", { name: "Expand sidebar" })).toBeInTheDocument();
  });
});
