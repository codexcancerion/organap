import { describe, expect, it } from "vitest";

import {
  normalizeAttachmentCode,
  validateAttachmentTypeInput,
} from "../attachment_services";

describe("attachment validation helpers", () => {
  it("normalizes attachment codes to uppercase underscore format", () => {
    expect(normalizeAttachmentCode(" budget proposal ")).toBe("BUDGET_PROPOSAL");
    expect(normalizeAttachmentCode("waiver-form")).toBe("WAIVER-FORM");
  });

  it("rejects short names and invalid codes", () => {
    expect(
      validateAttachmentTypeInput({
        name: "A",
        code: "VALID",
        description: null,
        isRequired: true,
        isActive: true,
      }),
    ).toEqual({
      isValid: false,
      error: "Attachment type name must be at least 2 characters.",
    });

    expect(
      validateAttachmentTypeInput({
        name: "Budget Proposal",
        code: "BAD@CODE!",
        description: null,
        isRequired: true,
        isActive: true,
      }),
    ).toEqual({
      isValid: false,
      error:
        "Attachment code can only contain letters, numbers, underscores, and hyphens.",
    });
  });

  it("accepts valid attachment type input", () => {
    expect(
      validateAttachmentTypeInput({
        name: "Budget Proposal",
        code: "BUDGET_PROPOSAL",
        description: "Itemized event expense sheet",
        isRequired: true,
        isActive: true,
      }),
    ).toEqual({ isValid: true, error: null });
  });
});
