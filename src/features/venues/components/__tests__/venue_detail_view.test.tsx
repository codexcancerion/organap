import type { VenueDetail, VenuePermissions } from "../../types";

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { VenueDetailView } from "../venue_detail_view";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const mockVenue: VenueDetail = {
  id: "venue-1",
  name: "Grand Auditorium",
  location: "Main Building 2F",
  capacity: 250,
  isActive: true,
  icon: "theater",
  color: "blue",
  events: [],
};

const managerPermissions: VenuePermissions = {
  canViewInactive: true,
  canCreate: true,
  canChange: true,
  canDelete: true,
};

describe("<VenueDetailView />", () => {
  it("renders PageHeader with breadcrumbs, single status chip, and KPI cards outside the header", () => {
    const { container } = render(<VenueDetailView venue={mockVenue} />);

    const header = container.querySelector("header");

    expect(header).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Venues" })).toHaveAttribute(
      "href",
      "/venues"
    );
    expect(screen.getByRole("heading", { name: "Grand Auditorium" })).toBeInTheDocument();

    const chipsInHeader = header?.querySelectorAll(".chip") ?? [];

    expect(chipsInHeader.length).toBe(1);
    expect(screen.getByText("Authorized Facility")).toBeInTheDocument();
    expect(header?.textContent).not.toContain("Max Capacity");
    expect(screen.getByText("Max Capacity")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Linked Event Schedule" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Settings/i })).not.toBeInTheDocument();
  });

  it("renders Settings action button and opens Venue Settings modal when permitted", () => {
    render(<VenueDetailView permissions={managerPermissions} venue={mockVenue} />);

    fireEvent.click(screen.getByRole("button", { name: /Settings/i }));
    expect(screen.getByText("Venue Settings")).toBeInTheDocument();
    expect(screen.getByText("Choose Icon")).toBeInTheDocument();
    expect(screen.getByText("Choose Color")).toBeInTheDocument();
    expect(screen.queryByText("Suggested Colored Icons")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Custom venue color")).not.toBeInTheDocument();
  });
});
