import type { AuthUser } from "@/types";

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { EmptyDashboard } from "../empty_dashboard";

describe("<EmptyDashboard />", () => {
  it("renders student specific dashboard controls and metrics", () => {
    const studentUser: AuthUser = {
      id: "student-1",
      email: "student@school.edu",
      role: "student",
      displayName: "Juan Dela Cruz",
      schoolId: "2026-0001",
      avatarUrl: null,
    };

    render(<EmptyDashboard user={studentUser} />);

    expect(screen.getByText("Hello, Juan Dela Cruz!")).toBeInTheDocument();
    expect(screen.getByText("STUDENT")).toBeInTheDocument();
    expect(screen.getByText("My Registrations")).toBeInTheDocument();
    expect(screen.getByText("Browse Events")).toBeInTheDocument();
  });

  it("renders officer specific proposal metrics and CTA", () => {
    const officerUser: AuthUser = {
      id: "officer-1",
      email: "officer@school.edu",
      role: "officer",
      displayName: "Maria Santos",
      schoolId: "2026-0002",
      avatarUrl: null,
    };

    render(<EmptyDashboard user={officerUser} />);

    expect(screen.getByText("Hello, Maria Santos!")).toBeInTheDocument();
    expect(screen.getByText("OFFICER")).toBeInTheDocument();
    expect(screen.getByText("Draft Proposals")).toBeInTheDocument();
    expect(screen.getByText("Draft New Proposal")).toBeInTheDocument();
  });
});
