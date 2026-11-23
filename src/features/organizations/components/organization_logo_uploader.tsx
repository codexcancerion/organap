"use client";

import {
  ImageCropUploader,
  type CompressedImageValue,
} from "@/components/ui/image_crop_uploader";

export type CompressedLogoValue = CompressedImageValue;

export type OrganizationLogoUploaderProps = {
  acronym: string;
  organizationName?: string;
  existingLogoUrl?: string | null;
  value: CompressedLogoValue | null;
  isLogoCleared?: boolean;
  onChange: (value: CompressedLogoValue | null) => void;
  onClearExisting?: () => void;
};

/**
 * Interactive organization logo uploader delegating square crop & compression to ImageCropUploader.
 */
export function OrganizationLogoUploader({
  acronym,
  organizationName,
  existingLogoUrl,
  value,
  isLogoCleared = false,
  onChange,
  onClearExisting,
}: OrganizationLogoUploaderProps) {
  return (
    <ImageCropUploader
      chooseButtonLabel="Choose Image"
      emptyTitle="Upload Organization Logo"
      existingImageUrl={existingLogoUrl}
      existingTitle="Current Organization Logo"
      fallbackText={(acronym || "ORG").slice(0, 3).toUpperCase()}
      helperDescription="Drop a PNG, JPG, or WebP image here, or choose a file to crop and compress to a crisp 512×512 square badge."
      inputAriaLabel="Upload organization logo"
      isCleared={isLogoCleared}
      replaceButtonLabel="Upload & Crop New Logo"
      subjectName={organizationName || acronym}
      value={value}
      onChange={onChange}
      onClearExisting={onClearExisting}
    />
  );
}
