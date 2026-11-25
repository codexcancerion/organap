import type { VenueListItem, VenuePermissions } from "../../types";

import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { VenueCatalog } from "../venue_catalog";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const mockVenues: VenueListItem[] = [
  {
    id: "venue-1",
    name: "University Main Auditorium",
    location: "Main Academic Building, 4th Floor",
    capacity: 500,
    isActive: true,
    icon: "theater",
    color: "blue",
    eventsCount: 4,
    upcomingEventsCount: 2,
  },
  {
    id: "venue-2",
    name: "Audio-Visual Room 1",
    location: "Library Wing, 3rd Floor",
    capacity: 100,
    isActive: false,
    icon: "monitor-play",
    color: "violet",
    eventsCount: 0,
    upcomingEventsCount: 0,
  },
];

const managerPermissions: VenuePermissions = {
  canViewInactive: true,
  canCreate: true,
  canChange: true,
  canDelete: true,
};

describe("<VenueCatalog />", () => {
  it("renders venue cards following the card standard with View Details links and status chips", () => {
    render(<VenueCatalog venues={mockVenues} />);

    expect(
      screen.getByRole("heading", { name: "Campus Venues" }),
    ).toBeInTheDocument();
    expect(screen.getByText("2 Campus Venues")).toBeInTheDocument();
    expect(screen.getByText("University Main Auditorium")).toBeInTheDocument();
    expect(screen.getByText("Available")).toBeInTheDocument();
    expect(screen.getByText("Maintenance")).toBeInTheDocument();
    expect(screen.getByText("4 bookings")).toBeInTheDocument();
    expect(screen.getByText("0 bookings")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Add Venue/i })).not.toBeInTheDocument();

    const detailLinks = screen.getAllByRole("link", { name: /View Details/i });

    expect(detailLinks[0]).toHaveAttribute("href", "/venues/venue-1");
    expect(detailLinks[1]).toHaveAttribute("href", "/venues/venue-2");
  });

  it("filters venues by facility name, location, and availability tab", () => {
    render(<VenueCatalog permissions={managerPermissions} venues={mockVenues} />);

    const searchInput = screen.getByPlaceholderText(
      /Search by facility name or location/i,
    );

    fireEvent.change(searchInput, { target: { value: "Library Wing" } });

    expect(
      screen.queryByText("University Main Auditorium"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Audio-Visual Room 1")).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "" } });
    fireEvent.click(
      screen.getByRole("button", { name: /Filter venues by availability/i }),
    );
    fireEvent.click(screen.getByRole("option", { name: /Available \(1\)/i }));
    expect(screen.getByText("University Main Auditorium")).toBeInTheDocument();
    expect(screen.queryByText("Audio-Visual Room 1")).not.toBeInTheDocument();
  });

  it("opens Add Venue modal with icon and color pickers after basic info, without suggested presets or color input", () => {
    render(<VenueCatalog permissions={managerPermissions} venues={mockVenues} />);

    fireEvent.click(screen.getByRole("button", { name: /Add Venue/i }));

    expect(screen.queryByText("Suggested Colored Icons")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Custom venue color")).not.toBeInTheDocument();

    const venueNameInput = screen.getByLabelText(/Venue Name/i);
    const chooseIconHeading = screen.getByText("Choose Icon");
    const chooseColorHeading = screen.getByText("Choose Color");

    expect(chooseIconHeading).toBeInTheDocument();
    expect(chooseColorHeading).toBeInTheDocument();
    expect(
      venueNameInput.compareDocumentPosition(chooseIconHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    const gymIconButton = screen.getByRole("button", { name: "Gymnasium / Arena" });
    const emeraldSwatch = screen.getByRole("button", { name: "Color Emerald" });

    fireEvent.click(gymIconButton);
    fireEvent.click(emeraldSwatch);

    expect(gymIconButton).toHaveAttribute("aria-pressed", "true");
    expect(emeraldSwatch).toHaveAttribute("aria-pressed", "true");
  });

  it("opens Venue Settings modal and routes Danger Zone Delete to ConfirmDeleteModal", () => {
    render(<VenueCatalog permissions={managerPermissions} venues={mockVenues} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Settings for University Main Auditorium" }),
    );
    expect(screen.getByText("Venue Settings")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Delete Venue/i }));
    const confirmDialog = screen.getByRole("dialog", { name: "Delete Venue" });

    expect(within(confirmDialog).getByRole("button", { name: "Delete Venue" })).toBeDisabled();
  });
});
