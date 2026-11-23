import type { AuthUser } from "@/types";
import type { DashboardMetrics } from "../../types";

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { EmptyDashboard } from "../empty_dashboard";

describe("<EmptyDashboard />", () => {
  it("renders student specific dashboard controls, metrics, passes, and upcoming events", () => {
    const studentUser: AuthUser = {
      id: "student-1",
      email: "student@school.edu",
      displayName: "Juan Dela Cruz",
      schoolId: "2026-0001",
      avatarUrl: null,
      isSuperuser: false,
      isStaff: false,
      isActive: true,
      groups: ["Students"],
      permissions: ["events.view", "events.register"],
    };

    const metrics: DashboardMetrics = {
      pendingApprovals: 0,
      awaitingEndorsement: 0,
      myDraftProposals: 0,
      myRegistrations: 2,
      myAttended: 1,
      activeEvents: 3,
      recognizedOrgs: 10,
      campusVenues: 5,
      recentPasses: [
        {
          registrationId: "reg-1",
          eventId: "evt-1",
          eventTitle: "CIT Tech Summit",
          venueName: "Main Auditorium",
          startTime: "2026-12-01T09:00:00Z",
          status: "confirmed",
        },
      ],
      upcomingEvents: [
        {
          id: "evt-1",
          title: "CIT Tech Summit",
          organizationAcronym: "CIT SBO",
          venueName: "Main Auditorium",
          startTime: "2026-12-01T09:00:00Z",
          registeredCount: 45,
          capacity: 200,
        },
      ],
    };

    render(<EmptyDashboard metrics={metrics} user={studentUser} />);

    expect(screen.getByText("Hello, Juan Dela Cruz!")).toBeInTheDocument();
    expect(screen.getByText("Students")).toBeInTheDocument();
    expect(screen.getByText("My Registrations")).toBeInTheDocument();
    expect(screen.getByText("Browse Events")).toBeInTheDocument();
    expect(screen.getAllByText("CIT Tech Summit").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("45/200")).toBeInTheDocument();
  });

  it("renders officer specific proposal metrics, action queue, and CTA", () => {
    const officerUser: AuthUser = {
      id: "officer-1",
      email: "officer@school.edu",
      displayName: "Maria Santos",
      schoolId: "2026-0002",
      avatarUrl: null,
      isSuperuser: false,
      isStaff: false,
      isActive: true,
      groups: ["Student Organization Officers"],
      permissions: ["proposals.view", "proposals.create", "proposals.change"],
    };

    const metrics: DashboardMetrics = {
      pendingApprovals: 0,
      awaitingEndorsement: 0,
      myDraftProposals: 1,
      myRegistrations: 0,
      myAttended: 0,
      activeEvents: 2,
      recognizedOrgs: 10,
      campusVenues: 5,
      totalRegistrations: 64,
      totalAttended: 32,
      actionQueue: [
        {
          id: "prop-1",
          title: "Byte & Bond General Assembly",
          organizationAcronym: "CIT SBO",
          status: "pending_adviser",
          updatedAt: "2026-11-22T10:00:00Z",
        },
      ],
    };

    render(<EmptyDashboard metrics={metrics} user={officerUser} />);

    expect(screen.getByText("Hello, Maria Santos!")).toBeInTheDocument();
    expect(screen.getByText("Student Organization Officers")).toBeInTheDocument();
    expect(screen.getByText("My Draft Proposals")).toBeInTheDocument();
    expect(screen.getByText("Org Registrations")).toBeInTheDocument();
    expect(screen.getByText("Draft New Proposal")).toBeInTheDocument();
    expect(screen.getByText("Byte & Bond General Assembly")).toBeInTheDocument();
  });
});
