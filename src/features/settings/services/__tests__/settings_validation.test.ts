import { describe, it, expect } from "vitest";

import { validateInstitutionSettings } from "../settings_services";

describe("validateInstitutionSettings", () => {
  const validProfile = {
    institutionName: "OrGanap University",
    studentAffairsOffice: "Office of Student Affairs",
    supportEmail: "osas@organap.edu",
  };

  const validPolicy = {
    activeSemesterId: null,
    activeSemesterName: null,
    minLeadDays: 7,
    requireAdviserEndorsement: true,
    defaultVenueCapacity: 50,
  };

  it("accepts valid institution settings", () => {
    expect(validateInstitutionSettings(validProfile, validPolicy)).toEqual({ valid: true });
  });

  it("rejects short institution name or office label", () => {
    const res = validateInstitutionSettings(
      { ...validProfile, institutionName: "A" },
      validPolicy,
    );

    expect(res.valid).toBe(false);
  });

  it("rejects invalid support email format", () => {
    const res = validateInstitutionSettings(
      { ...validProfile, supportEmail: "not-an-email" },
      validPolicy,
    );

    expect(res.valid).toBe(false);
  });

  it("rejects negative lead days or non-positive venue capacity", () => {
    expect(
      validateInstitutionSettings(validProfile, { ...validPolicy, minLeadDays: -1 }).valid,
    ).toBe(false);
    expect(
      validateInstitutionSettings(validProfile, { ...validPolicy, defaultVenueCapacity: 0 }).valid,
    ).toBe(false);
  });
});
