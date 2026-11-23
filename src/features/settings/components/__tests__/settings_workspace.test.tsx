import type { SettingsPageData } from "../../types";

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { SettingsWorkspace } from "../settings_workspace";

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

vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "dark",
    resolvedTheme: "dark",
    setTheme: vi.fn(),
  }),
}));

const baseData: SettingsPageData = {
  preferences: {
    proposalAlerts: true,
    eventReminders: true,
    emailNotifications: true,
    compactSidebarDefault: false,
  },
  unreadCount: 3,
  institutionProfile: {
    institutionName: "OrGanap University",
    studentAffairsOffice: "Office of Student Affairs & Services",
    supportEmail: "osas@organap.edu",
  },
  proposalPolicy: {
    activeSemesterId: "sem-1",
    activeSemesterName: "1st Semester SY 2026-2027",
    minLeadDays: 7,
    requireAdviserEndorsement: true,
    defaultVenueCapacity: 80,
  },
  policyUpdatedAt: "2026-11-18T08:00:00Z",
  semesters: [
    {
      id: "sem-1",
      name: "1st Semester SY 2026-2027",
      startDate: "2026-08-10",
      endDate: "2026-12-20",
    },
  ],
  canManageSystemSettings: true,
};

describe("<SettingsWorkspace />", () => {
  it("renders theme options, notifications tab, and editable institutional settings for authorized managers", () => {
    render(<SettingsWorkspace data={baseData} userId="user-1" />);

    expect(screen.getByRole("heading", { name: "Settings & Preferences" })).toBeInTheDocument();
    expect(screen.getByText("Dark Mode")).toBeInTheDocument();
    expect(screen.getByText("Light Mode")).toBeInTheDocument();
    expect(screen.getByText("System Match")).toBeInTheDocument();
    expect(screen.getByText("Collapse Sidebar by Default")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /Notifications/i }));
    expect(screen.getByText("Proposal & Review Updates")).toBeInTheDocument();
    expect(screen.getByText("3 unread")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /Institutional/i }));
    expect(screen.getByDisplayValue("OrGanap University")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Save Institutional Settings/i })).toBeInTheDocument();
  });

  it("shows read-only institutional alert and hides save button when settings.manage is absent", () => {
    render(
      <SettingsWorkspace
        data={{ ...baseData, canManageSystemSettings: false }}
        userId="user-2"
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: /Institutional/i }));
    expect(screen.getByText("Read-Only Institutional Policy")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Save Institutional Settings/i }),
    ).not.toBeInTheDocument();
  });
});
