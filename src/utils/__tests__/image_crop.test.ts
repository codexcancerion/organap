import { describe, it, expect } from "vitest";

import {
  clampCropOffset,
  computeCoverDimensions,
  computeSourceCropRect,
  formatFileSize,
} from "../image_crop";

describe("image_crop utilities", () => {
  it("computes cover dimensions preserving aspect ratio so the square frame is filled", () => {
    // Landscape 1600x800 in 200x200 frame -> scale = 200/800 = 0.25 -> 400x200
    expect(computeCoverDimensions(1600, 800, 200)).toEqual({
      width: 400,
      height: 200,
    });

    // Portrait 600x1200 in 200x200 frame -> scale = 200/600 = 1/3 -> 200x400
    expect(computeCoverDimensions(600, 1200, 200)).toEqual({
      width: 200,
      height: 400,
    });
  });

  it("clamps pan offset within rendered image bounds", () => {
    expect(clampCropOffset(150, 400, 200)).toBe(100);
    expect(clampCropOffset(-150, 400, 200)).toBe(-100);
    expect(clampCropOffset(45, 400, 200)).toBe(45);
    expect(clampCropOffset(20, 200, 200)).toBe(0);
  });

  it("computes centered and panned source crop rectangles in natural pixels", () => {
    // 1000x1000 image in 200x200 frame at zoom 1, offset 0 -> full 1000x1000
    expect(computeSourceCropRect(1000, 1000, 200, 1, { x: 0, y: 0 })).toEqual({
      sx: 0,
      sy: 0,
      sw: 1000,
      sh: 1000,
    });

    // At zoom 2, rendered is 400x400 -> center crop is 500x500 starting at (250, 250)
    expect(computeSourceCropRect(1000, 1000, 200, 2, { x: 0, y: 0 })).toEqual({
      sx: 250,
      sy: 250,
      sw: 500,
      sh: 500,
    });
  });

  it("formats byte sizes cleanly", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(2048)).toBe("2.0 KB");
    expect(formatFileSize(1.5 * 1024 * 1024)).toBe("1.50 MB");
  });
});
