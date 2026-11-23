import { describe, expect, it } from "vitest";

import { validateProgramInput } from "../program_services";

describe("program_services validation", () => {
  it("enforces program name, code, and required single department", () => {
    expect(
      validateProgramInput({ name: "B", code: "BSCS", departmentId: "dept-1" })
        .isValid,
    ).toBe(false);

    expect(
      validateProgramInput({
        name: "BS Computer Science",
        code: "",
        departmentId: "dept-1",
      }).isValid,
    ).toBe(false);

    expect(
      validateProgramInput({
        name: "BS Computer Science",
        code: "BSCS",
        departmentId: "",
      }),
    ).toEqual({
      isValid: false,
      error: "Each program must belong to a single department.",
    });

    expect(
      validateProgramInput({
        name: "BS Computer Science",
        code: "BSCS",
        departmentId: "dept-1",
      }),
    ).toEqual({ isValid: true, error: null });
  });
});
