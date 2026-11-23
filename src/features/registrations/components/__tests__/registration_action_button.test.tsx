import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import { RegistrationActionButton } from "../registration_action_button";

const mockRefresh = vi.fn();
const mockRegisterForEvent = vi.fn();
const mockWithdrawFromEvent = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock("@/utils/qr", () => ({
  generateQrSvg: vi.fn().mockResolvedValue("<svg data-testid='qr-svg'></svg>"),
}));

vi.mock("../../services/registration_services", () => ({
  registerForEvent: (...args: unknown[]) => mockRegisterForEvent(...args),
  withdrawFromEvent: (...args: unknown[]) => mockWithdrawFromEvent(...args),
}));

describe("<RegistrationActionButton />", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers the student and immediately opens the digital pass modal with the new token", async () => {
    mockRegisterForEvent.mockResolvedValue({
      success: true,
      data: {
        registrationId: "reg-1",
        qrToken: "abcdef0123456789abcdef0123456789",
      },
      error: null,
    });

    render(
      <RegistrationActionButton
        capacity={50}
        endTime="2026-12-01T17:00:00Z"
        eventId="evt-1"
        eventTitle="Campus Tech Day"
        organizationName="CIT SBO"
        registeredCount={10}
        registrationDeadline="2026-11-30T17:00:00Z"
        schoolId="2026-0046"
        startTime="2026-12-01T09:00:00Z"
        studentName="Daryll Cirilo"
        venueName="Main Auditorium"
      />
    );

    const registerBtn = screen.getByRole("button", { name: /register for event/i });

    fireEvent.click(registerBtn);

    await waitFor(() => {
      expect(mockRegisterForEvent).toHaveBeenCalledWith("evt-1");
    });

    await waitFor(() => {
      expect(screen.getByText("Official Entry Pass")).toBeInTheDocument();
      expect(screen.getByText("ABCDEF0123456789".match(/.{1,4}/g)!.join("-"))).toBeInTheDocument();
    });
  });

  it("shows Checked In state and hides Withdraw when registrationStatus is attended", () => {
    render(
      <RegistrationActionButton
        capacity={50}
        checkInAt="2026-12-01T09:05:00Z"
        endTime="2026-12-01T17:00:00Z"
        eventId="evt-1"
        eventTitle="Campus Tech Day"
        isRegistered={true}
        qrToken="abcdef0123456789abcdef0123456789"
        registeredCount={10}
        registrationDeadline="2026-11-30T17:00:00Z"
        registrationId="reg-1"
        registrationStatus="attended"
        schoolId="2026-0046"
        startTime="2026-12-01T09:00:00Z"
        studentName="Daryll Cirilo"
        venueName="Main Auditorium"
      />
    );

    expect(screen.getByText("Checked In")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /view digital pass/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /withdraw/i })).not.toBeInTheDocument();
  });
});
