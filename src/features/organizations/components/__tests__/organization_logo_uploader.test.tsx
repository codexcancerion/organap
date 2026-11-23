import type { CompressedLogoValue } from "../organization_logo_uploader";

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { OrganizationLogoUploader } from "../organization_logo_uploader";

const mockCompressedValue: CompressedLogoValue = {
  blob: new Blob(["compressed"], { type: "image/webp" }),
  previewUrl: "blob:mock-preview",
  originalSize: 1_000_000,
  compressedSize: 10_000,
  width: 512,
  height: 512,
  mimeType: "image/webp",
};

describe("<OrganizationLogoUploader />", () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => "blob:mock-source");
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it("renders simplified cropper with icon-only red Reset, slider below image without Zoom labels, and percentage reduction only", () => {
    render(
      <OrganizationLogoUploader
        acronym="CSS"
        organizationName="Computer Science Society"
        value={mockCompressedValue}
        onChange={vi.fn()}
      />
    );

    const fileInput = screen.getByLabelText("Upload organization logo");
    const mockFile = new File(["png-bytes"], "logo.png", { type: "image/png" });

    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    // Icon-only red Reset button
    const resetButton = screen.getByRole("button", { name: "Reset crop" });

    expect(resetButton).toBeInTheDocument();
    expect(resetButton).toHaveClass("button--danger-soft");
    expect(resetButton.textContent).toBe("");

    // Zoom slider placed below image without "Zoom" label or numeric output
    const zoomSlider = screen.getByRole("slider", { name: "Zoom level" });

    expect(zoomSlider).toBeInTheDocument();
    expect(screen.queryByText(/^Zoom$/i)).not.toBeInTheDocument();
    expect(screen.queryByText("1.00")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zoom out" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zoom in" })).toBeInTheDocument();

    // Percentage reduction only, without dimensions/codec/byte-size fuzz
    expect(screen.getByText("99% smaller")).toBeInTheDocument();
    expect(screen.queryByText(/512×512/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/WebP/i)).not.toBeInTheDocument();

    // Change Image and Remove buttons present
    expect(screen.getByRole("button", { name: /Change Image/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Remove/i })).toBeInTheDocument();
  });
});
