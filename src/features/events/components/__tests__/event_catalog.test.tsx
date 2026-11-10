import type { EventListItem } from "../../types";

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { EventCatalog } from "../event_catalog";

describe("<EventCatalog />", () => {
  const mockEvents: EventListItem[] = [
    {
      id: "evt-1",
      title: "Hackathon 2026",
      organizationId: "org-1",
      organizationName: "CS Society",
      organizationAcronym: "CSS",
      venueId: "venue-1",
      venueName: "University Gym",
      venueLocation: "North Campus",
      venueCapacity: 200,
      status: "approved",
      startTime: "2026-12-10T08:00:00Z",
      endTime: "2026-12-10T18:00:00Z",
      registrationDeadline: "2026-12-05T23:59:59Z",
      capacity: 100,
      registeredCount: 45,
      purpose: "Campus hackathon for coders",
      isRegistered: false,
    },
    {
      id: "evt-2",
      title: "Leadership Workshop",
      organizationId: "org-2",
      organizationName: "Supreme Student Council",
      organizationAcronym: "SSC",
      venueId: "venue-2",
      venueName: "Audio Visual Room",
      venueLocation: "Main Building 3F",
      venueCapacity: 60,
      status: "approved",
      startTime: "2026-12-15T09:00:00Z",
      endTime: "2026-12-15T12:00:00Z",
      registrationDeadline: "2026-12-12T23:59:59Z",
      capacity: 50,
      registeredCount: 50,
      purpose: "Student leadership development",
      isRegistered: true,
    },
  ];

  it("renders catalog cards with titles and organization acronyms", () => {
    render(<EventCatalog events={mockEvents} />);

    expect(screen.getByText("Hackathon 2026")).toBeInTheDocument();
    expect(screen.getByText("Leadership Workshop")).toBeInTheDocument();
    expect(screen.getByText("CSS")).toBeInTheDocument();
    expect(screen.getByText("SSC")).toBeInTheDocument();
    expect(screen.getByText("Pass Confirmed")).toBeInTheDocument();
  });

  it("renders empty state message when no events exist", () => {
    render(<EventCatalog events={[]} />);

    expect(screen.getByText("No Approved Events Found")).toBeInTheDocument();
  });
});
