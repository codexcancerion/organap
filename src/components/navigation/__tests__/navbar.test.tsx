import type { AuthUser } from "@/types";

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import { Navbar } from "../navbar";
import {
  extractCleanDocumentTitle,
  resolveNavBreadcrumbs,
} from "../nav_breadcrumbs";

const mockPush = vi.fn();
let mockPathname = "/dashboard";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "dark", setTheme: vi.fn() }),
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

const superuserAccount: AuthUser = {
  id: "admin-1",
  email: "admin@organap.edu",
  displayName: "Melbert Marafo",
  schoolId: "2023-01-0001",
  avatarUrl: null,
  isSuperuser: true,
  isStaff: true,
  isActive: true,
  groups: ["Student Affairs"],
  permissions: ["proposals.create", "attendance.verify", "users.view", "groups.view"],
};

const studentAccount: AuthUser = {
  id: "student-1",
  email: "student@organap.edu",
  displayName: "Jane Student",
  schoolId: "2026-0002",
  avatarUrl: null,
  isSuperuser: false,
  isStaff: false,
  isActive: true,
  groups: ["Student"],
  permissions: ["events.register"],
};

describe("NavBreadcrumbs helpers", () => {
  it("strips OrGanap and section suffixes while ignoring generic fallback titles", () => {
    expect(extractCleanDocumentTitle("CIT Socialization 2026 | Campus Events · OrGanap")).toBe(
      "CIT Socialization 2026",
    );
    expect(extractCleanDocumentTitle("Attendance Desk: Byte & Bond | OrGanap · OrGanap")).toBe(
      "Byte & Bond",
    );
    expect(extractCleanDocumentTitle("College of IT (CIT) | Organizations · OrGanap")).toBe(
      "College of IT (CIT)",
    );
    expect(extractCleanDocumentTitle("Campus Event | Campus Events · OrGanap")).toBeNull();
    expect(extractCleanDocumentTitle("Edit Proposal | OrGanap · OrGanap")).toBeNull();
    expect(extractCleanDocumentTitle("OrGanap")).toBeNull();
  });

  it("resolves static, admin, and dynamic detail routes consistently", () => {
    expect(resolveNavBreadcrumbs("/dashboard")).toEqual([{ label: "Dashboard" }]);
    expect(resolveNavBreadcrumbs("/admin/users")).toEqual([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Administration" },
      { label: "Users" },
    ]);
    expect(resolveNavBreadcrumbs("/events/evt-123", "General Assembly")).toEqual([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Events", href: "/events" },
      { label: "General Assembly" },
    ]);
    expect(resolveNavBreadcrumbs("/events/evt-123/edit")).toEqual([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Events", href: "/events" },
      { label: "Event Details", href: "/events/evt-123" },
      { label: "Edit Proposal" },
    ]);
    expect(resolveNavBreadcrumbs("/attendance/evt-123")).toEqual([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Attendance", href: "/attendance" },
      { label: "Check-In Desk" },
    ]);
  });
});

describe("<Navbar /> left breadcrumbs & right command search", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    mockPathname = "/events/evt-1";
    document.title = "CIT Socialization 2026 | Campus Events · OrGanap";
    mockPush.mockReset();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        events: [
          {
            id: "evt-99",
            title: "CIT Robotics Expo",
            status: "approved",
            subtitle: "CIT SBO · University Auditorium",
            href: "/events/evt-99",
          },
        ],
        organizations: [
          {
            id: "org-1",
            title: "CIT SBO - College of IT SBO",
            subtitle: "student_government",
            href: "/organizations/org-1",
          },
        ],
        venues: [
          {
            id: "ven-1",
            title: "CIT Laboratory Hall",
            subtitle: "Building B, 2nd Floor",
            href: "/venues/ven-1",
          },
        ],
      }),
    }) as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("hides breadcrumbs and command search when signed out", () => {
    render(<Navbar user={null} />);

    expect(screen.queryByRole("navigation", { name: "Breadcrumb navigation" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open command search" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign In" })).toBeInTheDocument();
  });

  it("renders left contextual breadcrumbs and right command search trigger when authenticated", async () => {
    render(<Navbar unreadCount={3} user={superuserAccount} />);

    const breadcrumbNav = screen.getByRole("navigation", { name: "Breadcrumb navigation" });

    expect(breadcrumbNav).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("CIT Socialization 2026")).toBeInTheDocument();
    });

    const eventsCrumb = screen.getByRole("link", { name: "Events" });

    fireEvent.click(eventsCrumb);
    expect(mockPush).toHaveBeenCalledWith("/events");

    const searchButtons = screen.getAllByRole("button", { name: "Open command search" });

    expect(searchButtons.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("link", { name: "Notifications (3 unread)" })).toBeInTheDocument();
  });

  it("filters permission-gated commands for students and shows full commands for superusers", async () => {
    const { rerender } = render(<Navbar user={studentAccount} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Open command search" })[0]);

    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: "Command Search" })).toBeInTheDocument();
    });

    expect(screen.getByRole("option", { name: /Dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /My Passes/i })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Draft New Proposal/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /^Attendance\b/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /^Users\b/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /^Groups\b/i })).not.toBeInTheDocument();

    // Toggle closed via Ctrl+K, switch user to superuser, and reopen via Ctrl+K.
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Command Search" })).not.toBeInTheDocument();
    });

    rerender(<Navbar user={superuserAccount} />);
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });

    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: "Command Search" })).toBeInTheDocument();
    });

    expect(screen.getByRole("option", { name: /Draft New Proposal/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Attendance/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Users/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Groups/i })).toBeInTheDocument();
  });

  it("fetches RLS-scoped /api/search results and navigates on Enter or selection", async () => {
    render(<Navbar user={superuserAccount} />);

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });

    const input = await screen.findByPlaceholderText(
      "Search routes, events, orgs, or venues...",
    );

    fireEvent.change(input, { target: { value: "CIT" } });

    await waitFor(
      () => {
        expect(globalThis.fetch).toHaveBeenCalledWith(
          "/api/search?q=CIT",
          expect.objectContaining({ signal: expect.any(AbortSignal) }),
        );
      },
      { timeout: 1500 },
    );

    await waitFor(() => {
      expect(screen.getByRole("option", { name: /CIT Robotics Expo/i })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(screen.getByRole("option", { name: /CIT SBO - College of IT SBO/i })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /CIT Laboratory Hall/i })).toBeInTheDocument();
    });

    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(screen.getByRole("option", { name: /CIT SBO - College of IT SBO/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    fireEvent.keyDown(input, { key: "Enter" });
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/organizations/org-1");

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Command Search" })).not.toBeInTheDocument();
    });

    // Reopen and verify direct click selection on static Navigation item.
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    const eventsOption = await screen.findByRole("option", { name: /^Events\b/i });

    fireEvent.click(eventsOption);
    expect(mockPush).toHaveBeenCalledTimes(2);
    expect(mockPush).toHaveBeenLastCalledWith("/events");
  });
});
