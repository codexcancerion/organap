import { describe, expect, it } from "vitest";

import { validateDepartmentInput } from "../department_services";

describe("department_services validation", () => {
  it("requires valid department name and code", () => {
    expect(validateDepartmentInput({ name: "S", code: "SCIS" }).isValid).toBe(false);
    expect(validateDepartmentInput({ name: "School of Engineering", code: "  " }).isValid).toBe(
      false,
    );
    expect(
      validateDepartmentInput({
        name: "School of Accountancy, Management, Computing and Information Studies",
        code: "SAMCIS",
      }),
    ).toEqual({ isValid: true, error: null });
  });
});
