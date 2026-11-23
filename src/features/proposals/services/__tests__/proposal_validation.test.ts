import { describe, it, expect } from "vitest";

import { validateProposalForm } from "../proposal_services";

describe("validateProposalForm", () => {
  const baseValidData = {
    title: "Tech Summit 2026",
    organizationId: "org-1",
    venueId: "venue-1",
    purpose: "Annual tech conference with keynotes, workshops, coding challenges, and networking.",
    activitiesDesc: "",
    activityType: "seminar",
    semesterId: "sem-1",
    capacity: 150,
    startTime: "2026-12-01T09:00:00Z",
    endTime: "2026-12-01T17:00:00Z",
    registrationDeadline: "2026-11-25T23:59:59Z",
  };

  it("rejects proposal when title is empty", () => {
    const res = validateProposalForm({
      ...baseValidData,
      title: "",
    });

    expect(res.isValid).toBe(false);
    expect(res.error).toBe("Event title is required.");
  });

  it("rejects proposal when activity type is missing", () => {
    const res = validateProposalForm({
      ...baseValidData,
      activityType: "",
    });

    expect(res.isValid).toBe(false);
    expect(res.error).toBe("Please select an activity type.");
  });

  it("rejects proposal when rationale is empty", () => {
    const res = validateProposalForm({
      ...baseValidData,
      purpose: "   ",
    });

    expect(res.isValid).toBe(false);
    expect(res.error).toBe("Event rationale is required.");
  });

  it("rejects proposal when end time is before start time", () => {
    const res = validateProposalForm({
      ...baseValidData,
      startTime: "2026-12-01T14:00:00Z",
      endTime: "2026-12-01T10:00:00Z",
    });

    expect(res.isValid).toBe(false);
    expect(res.error).toBe("Event end time must follow the start time.");
  });

  it("rejects proposal when capacity is zero or negative", () => {
    const res = validateProposalForm({
      ...baseValidData,
      capacity: 0,
    });

    expect(res.isValid).toBe(false);
    expect(res.error).toBe("Participant capacity must be greater than zero.");
  });

  it("rejects proposal when registration deadline exceeds start time", () => {
    const res = validateProposalForm({
      ...baseValidData,
      registrationDeadline: "2026-12-02T10:00:00Z",
    });

    expect(res.isValid).toBe(false);
    expect(res.error).toBe("Registration deadline cannot be after the event start time.");
  });

  it("accepts valid proposal form data", () => {
    const res = validateProposalForm(baseValidData);

    expect(res.isValid).toBe(true);
    expect(res.error).toBeUndefined();
  });
});
