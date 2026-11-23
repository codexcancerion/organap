import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import { ManualCheckinTable } from "../manual_checkin_table";

const mockRecordCheckIn = vi.fn();

vi.mock("../../services/attendance_services", () => ({
  recordCheckIn: (...args: unknown[]) => mockRecordCheckIn(...args),
}));

const sampleRoster = [
  {
    registrationId: "reg-1",
    studentId: "stu-1",
    schoolId: "2026-0046",
    fullName: "Daryll Daniel Cirilo",
    qrToken: "abcdef0123456789abcdef0123456789",
    status: "confirmed" as const,
    checkInAt: null,
    checkInMethod: null,
  },
  {
    registrationId: "reg-2",
    studentId: "stu-2",
    schoolId: "2026-0051",
    fullName: "Genesis Kidatan Tireng",
    qrToken: "11223344556677889900aabbccddeeff",
    status: "attended" as const,
    checkInAt: "2026-11-23T05:30:00Z",
    checkInMethod: "qr_scanner" as const,
  },
];

describe("<ManualCheckinTable />", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders roster rows, status tabs, and records manual check-in", async () => {
    const onRefresh = vi.fn();

    mockRecordCheckIn.mockResolvedValue({
      success: true,
      data: {
        studentName: "Daryll Daniel Cirilo",
        schoolId: "2026-0046",
        checkInAt: "2026-11-23T05:35:00Z",
      },
      error: null,
    });

    render(
      <ManualCheckinTable
        eventId="evt-1"
        isWindowOpen={true}
        roster={sampleRoster}
        onRefresh={onRefresh}
      />
    );

    expect(screen.getByText("Daryll Daniel Cirilo")).toBeInTheDocument();
    expect(screen.getByText("Genesis Kidatan Tireng")).toBeInTheDocument();
    expect(screen.getByText("QR Scan")).toBeInTheDocument();

    const checkInBtn = screen.getByRole("button", { name: /check in/i });

    fireEvent.click(checkInBtn);

    await waitFor(() => {
      expect(mockRecordCheckIn).toHaveBeenCalledWith("evt-1", "stu-1", "manual");
      expect(onRefresh).toHaveBeenCalled();
    });
  });

  it("disables Check In buttons when the attendance window is closed", () => {
    render(
      <ManualCheckinTable
        eventId="evt-1"
        isWindowOpen={false}
        roster={sampleRoster}
        onRefresh={() => {}}
      />
    );

    expect(screen.getByRole("button", { name: /check in/i })).toBeDisabled();
  });
});
