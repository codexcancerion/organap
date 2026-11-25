import type { EventListItem } from "../../types";

import { describe, it, expect } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { EventCatalog } from "../event_catalog";
import { EventExplorerClient } from "../event_explorer_client";

describe("<EventCatalog />", () => {
  const mockEvents: EventListItem[] = [
    {
      id: "evt-1",
      title: "Hackathon 2026",
      activityType: "cultural",
      semesterName: "2026-2027 FIRST SEMESTER",
      organizationId: "org-1",
      organizationName: "CS Society",
      organizationAcronym: "CSS",
      organizationLogoUrl: null,
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
      organizationLogoUrl: null,
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
    {
      id: "evt-3",
      title: "Robotics Showcase Proposal",
      organizationId: "org-3",
      organizationName: "Engineering Guild",
      organizationAcronym: "ENG",
      organizationLogoUrl: null,
      venueId: "venue-1",
      venueName: "University Gym",
      venueLocation: "North Campus",
      venueCapacity: 200,
      status: "pending_adviser",
      startTime: "2026-12-20T10:00:00Z",
      endTime: "2026-12-20T15:00:00Z",
      registrationDeadline: "2026-12-18T23:59:59Z",
      capacity: 80,
      registeredCount: 0,
      purpose: "Hardware robotics exhibition",
      isRegistered: false,
      creatorName: "Maria Santos",
    },
    {
      id: "evt-4",
      title: "Draft Cultural Night",
      organizationId: "org-2",
      organizationName: "Supreme Student Council",
      organizationAcronym: "SSC",
      organizationLogoUrl: null,
      venueId: "venue-2",
      venueName: "Audio Visual Room",
      venueLocation: "Main Building 3F",
      venueCapacity: 60,
      status: "draft",
      startTime: "2026-12-22T17:00:00Z",
      endTime: "2026-12-22T20:00:00Z",
      registrationDeadline: "2026-12-20T23:59:59Z",
      capacity: 60,
      registeredCount: 0,
      purpose: "Cultural showcase night",
      isRegistered: false,
      creatorName: "Juan Dela Cruz",
    },
  ];

  it("renders merged event and proposal cards with organization badges and status chips", () => {
    render(<EventCatalog events={mockEvents} />);

    expect(screen.getByText("Hackathon 2026")).toBeInTheDocument();
    expect(screen.getByText("Leadership Workshop")).toBeInTheDocument();
    expect(screen.getByText("Robotics Showcase Proposal")).toBeInTheDocument();
    expect(screen.getByText("Draft Cultural Night")).toBeInTheDocument();
    expect(screen.getAllByText("CSS").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("SSC").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("ENG").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Cultural / Arts Showcase")).toBeInTheDocument();
    expect(screen.getByText("2026-2027 FIRST SEMESTER")).toBeInTheDocument();
    expect(screen.getByText("Hosted by CSS")).toBeInTheDocument();
    expect(screen.getByText("Pass Confirmed")).toBeInTheDocument();
    expect(screen.getByText("Pending Adviser")).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByText("By Maria Santos")).toBeInTheDocument();
  });

  it("filters merged catalog via unified Filters dropdown and search query", () => {
    render(<EventCatalog events={mockEvents} />);

    fireEvent.click(screen.getByRole("button", { name: /^Filters/i }));
    fireEvent.click(screen.getByRole("button", { name: /Status/i }));
    fireEvent.click(screen.getByRole("option", { name: /In Review \(1\)/i }));
    expect(screen.getByText("Robotics Showcase Proposal")).toBeInTheDocument();
    expect(screen.queryByText("Hackathon 2026")).not.toBeInTheDocument();
    expect(screen.queryByText("Draft Cultural Night")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Reset/i }));
    const searchInput = screen.getByPlaceholderText(
      /Search by title, organization, or venue/i,
    );

    fireEvent.change(searchInput, { target: { value: "Hackathon" } });
    expect(screen.getByText("Hackathon 2026")).toBeInTheDocument();
    expect(screen.queryByText("Robotics Showcase Proposal")).not.toBeInTheDocument();
  });

  it("renders a single venue Select dropdown without status filter when only approved events are present", () => {
    render(<EventCatalog events={mockEvents.slice(0, 2)} />);

    expect(
      screen.getByRole("button", { name: /All Campus Venues.*Filter by venue/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Filters/i }),
    ).not.toBeInTheDocument();
  });

  it("renders empty state message when no events exist", () => {
    render(<EventCatalog canCreateProposal events={[]} />);

    expect(screen.getByText("No Events Found")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Draft First Proposal/i }),
    ).toBeInTheDocument();
  });
});

describe("<EventExplorerClient />", () => {
  const sampleEvents: EventListItem[] = [
    {
      id: "evt-1",
      title: "Hackathon 2026",
      activityType: "cultural",
      semesterName: "2026-2027 FIRST SEMESTER",
      organizationId: "org-1",
      organizationName: "CS Society",
      organizationAcronym: "CSS",
      organizationLogoUrl: null,
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
      title: "Draft Proposal Event",
      organizationId: "org-1",
      organizationName: "CS Society",
      organizationAcronym: "CSS",
      organizationLogoUrl: null,
      venueId: "venue-1",
      venueName: "University Gym",
      venueLocation: "North Campus",
      venueCapacity: 200,
      status: "draft",
      startTime: "2026-12-12T08:00:00Z",
      endTime: "2026-12-12T12:00:00Z",
      registrationDeadline: "2026-12-10T23:59:59Z",
      capacity: 50,
      registeredCount: 0,
      purpose: "Draft workshop",
      isRegistered: false,
      creatorName: "Alex",
    },
  ];

  it("renders exactly 2 HeroUI view tabs (Events and Calendar) without a separate Proposals tab", () => {
    render(<EventExplorerClient canCreateProposal events={sampleEvents} />);

    const viewTabList = screen.getByRole("tablist", { name: "Events view mode" });

    expect(viewTabList).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Events/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Calendar/i })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /Proposals/i })).not.toBeInTheDocument();
    expect(screen.getByText("1 Live · 1 Proposal")).toBeInTheDocument();
  });
});
