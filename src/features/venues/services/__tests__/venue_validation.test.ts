import { describe, expect, it } from "vitest";

import {
  isHexVenueColor,
  isValidVenueColor,
  resolveVenueBadgePresentation,
} from "../../constants";
import { validateVenueInput } from "../venue_services";

describe("validateVenueInput & appearance helpers", () => {
  it("accepts valid venue payloads with preset colors and custom hex colors", () => {
    expect(
      validateVenueInput({
        name: "University Main Auditorium",
        location: "Main Building 4F",
        capacity: 500,
        isActive: true,
        icon: "theater",
        color: "blue",
      }),
    ).toEqual({ isValid: true });

    expect(
      validateVenueInput({
        name: "Innovation Hub",
        location: null,
        capacity: 40,
        isActive: true,
        icon: "flask-conical",
        color: "#1e40af",
      }),
    ).toEqual({ isValid: true });
  });

  it("rejects short venue names, non-positive capacity, missing icon, and invalid color values", () => {
    expect(
      validateVenueInput({
        name: "A",
        capacity: 50,
        isActive: true,
        icon: "building-2",
        color: "accent",
      }).isValid,
    ).toBe(false);

    expect(
      validateVenueInput({
        name: "Valid Hall",
        capacity: 0,
        isActive: true,
        icon: "building-2",
        color: "accent",
      }).isValid,
    ).toBe(false);

    expect(
      validateVenueInput({
        name: "Valid Hall",
        capacity: 25.5,
        isActive: true,
        icon: "building-2",
        color: "accent",
      }).isValid,
    ).toBe(false);

    expect(
      validateVenueInput({
        name: "Valid Hall",
        capacity: 25,
        isActive: true,
        icon: "   ",
        color: "accent",
      }).isValid,
    ).toBe(false);

    expect(
      validateVenueInput({
        name: "Valid Hall",
        capacity: 25,
        isActive: true,
        icon: "building-2",
        color: "invalid-color",
      }).isValid,
    ).toBe(false);
  });

  it("resolves semantic palette classes vs dynamic custom hex badge presentation", () => {
    expect(isValidVenueColor("emerald")).toBe(true);
    expect(isValidVenueColor("#2563EB")).toBe(true);
    expect(isValidVenueColor("#123")).toBe(false);
    expect(isHexVenueColor("#2563EB")).toBe(true);
    expect(isHexVenueColor("blue")).toBe(false);

    const preset = resolveVenueBadgePresentation("emerald");

    expect(preset.style).toBeUndefined();
    expect(preset.className).toContain("text-emerald");

    const custom = resolveVenueBadgePresentation("#2563eb");

    expect(custom.style?.color).toBe("#2563eb");
    expect(custom.style?.backgroundColor).toBe("#2563eb1f");
  });
});
