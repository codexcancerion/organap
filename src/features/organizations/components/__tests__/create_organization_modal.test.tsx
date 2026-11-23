import type { CandidateProfile } from "../../types";

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { CreateOrganizationModal } from "../create_organization_modal";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

const mockCandidates: CandidateProfile[] = [
  {
    id: "user-1",
    fullName: "Juan Dela Cruz",
    displayName: "Juan Dela Cruz",
    schoolId: "2026-0001",
    email: "juan@school.edu",
    avatarUrl: null,
  },
  {
    id: "user-2",
    fullName: "Prof. Maria Santos",
    displayName: "Prof. Maria Santos",
    schoolId: "FAC-101",
    email: "maria@school.edu",
    avatarUrl: null,
  },
];

describe("<CreateOrganizationModal />", () => {
  it("renders a 3-step wizard without URL Slug and advances through Steps 1, 2, and 3", () => {
    render(
      <CreateOrganizationModal
        candidates={mockCandidates}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    // Step 1: Identity (no URL slug)
    expect(screen.getByText(/Step 1 of 3 — Identity/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Identity" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Leadership" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Logo" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Organization Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Acronym/i)).toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.getByLabelText(/Mission & Description/i)).toBeInTheDocument();
    expect(screen.queryByText(/URL Slug/i)).not.toBeInTheDocument();

    const nextButton = screen.getByRole("button", { name: /^Next$/i });

    expect(nextButton).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText(/Computer Science Society/i), {
      target: { value: "Robotics Club" },
    });
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. CSS/i), {
      target: { value: "ROBO" },
    });

    expect(nextButton).not.toBeDisabled();
    fireEvent.click(nextButton);

    // Step 2: Leadership (concise labels, no field descriptions)
    expect(screen.getByText(/Step 2 of 3 — Leadership/i)).toBeInTheDocument();
    expect(screen.getByText("Governor")).toBeInTheDocument();
    expect(screen.getByText("Adviser")).toBeInTheDocument();
    expect(screen.queryByText(/Primary student signatory/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Faculty reviewer responsible/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Next$/i }));

    // Step 3: Logo uploader & review summary (without redundant compressed preview card)
    expect(screen.getByText(/Step 3 of 3 — Logo/i)).toBeInTheDocument();
    expect(screen.getByText("Upload Organization Logo")).toBeInTheDocument();
    expect(screen.queryByText("Final Compressed Preview")).not.toBeInTheDocument();
    expect(screen.getByText(/Robotics Club \(ROBO\)/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create Organization/i })).toBeInTheDocument();
  });
});
