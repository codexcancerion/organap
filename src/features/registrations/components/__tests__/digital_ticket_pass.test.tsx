import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";

import { DigitalTicketPass } from "../digital_ticket_pass";

// Mock QR SVG generator
vi.mock("@/utils/qr", () => ({
  generateQrSvg: vi.fn().mockImplementation(() => Promise.resolve("<svg data-testid='qr-svg'></svg>")),
}));

describe("<DigitalTicketPass />", () => {
  it("renders modal with event title and student pass information when open", async () => {
    await act(async () => {
      render(
        <DigitalTicketPass
          endTime="2026-11-25T14:00:00Z"
          eventTitle="Cybersecurity Symposium 2026"
          isOpen={true}
          organizationName="CS Society"
          qrToken="PASS-SECURE-TOKEN-12345"
          schoolId="2026-9999"
          startTime="2026-11-25T10:00:00Z"
          status="confirmed"
          studentName="John Doe"
          venueName="Grand Auditorium"
          onOpenChange={() => {}}
        />
      );
    });

    expect(screen.getByText("Cybersecurity Symposium 2026")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("ID: 2026-9999")).toBeInTheDocument();
    expect(screen.getByText("Grand Auditorium")).toBeInTheDocument();
    expect(screen.getByText("CS Society")).toBeInTheDocument();
  });
});
