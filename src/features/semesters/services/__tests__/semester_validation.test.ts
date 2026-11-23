import { describe, expect, it } from "vitest";

import {
  getSemesterStatus,
  validateSemesterInput,
} from "../semester_services";

describe("semester_services validation & status", () => {
  it("rejects short names, missing dates, and inverted date ranges", () => {
    expect(
      validateSemesterInput({
        name: "A",
        description: "",
        startDate: "2026-08-01",
        endDate: "2026-12-15",
      }).isValid,
    ).toBe(false);

    expect(
      validateSemesterInput({
        name: "1st Semester AY 2026-2027",
        description: null,
        startDate: "2026-12-15",
        endDate: "2026-08-01",
      }),
    ).toEqual({
      isValid: false,
      error: "End date must be after the start date.",
    });

    expect(
      validateSemesterInput({
        name: "1st Semester AY 2026-2027",
        description: null,
        startDate: "2026-08-01",
        endDate: "2026-08-01",
      }).isValid,
    ).toBe(false);
  });

  it("accepts valid semester input and computes status correctly", () => {
    expect(
      validateSemesterInput({
        name: "1st Semester AY 2026-2027",
        description: "Fall academic term",
        startDate: "2026-08-01",
        endDate: "2026-12-15",
      }),
    ).toEqual({ isValid: true, error: null });

    expect(getSemesterStatus("2026-08-01", "2026-12-15", "2026-07-15")).toBe("upcoming");
    expect(getSemesterStatus("2026-08-01", "2026-12-15", "2026-10-01")).toBe("active");
    expect(getSemesterStatus("2026-08-01", "2026-12-15", "2027-01-10")).toBe("completed");
  });
});
