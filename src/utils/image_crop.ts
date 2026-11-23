export type CropOffset = {
  x: number;
  y: number;
};

export type CropOptions = {
  /** Square viewport size in CSS pixels used while interactively panning/zooming */
  frameSize: number;
  /** Output square pixel dimension of the compressed image (default 512) */
  outputSize?: number;
  /** Zoom multiplier >= 1 (default 1) */
  zoom: number;
  /** Pan offset in CSS pixels relative to centered image */
  offset: CropOffset;
  /** Preferred output MIME type (default image/webp, falls back to image/jpeg) */
  mimeType?: "image/webp" | "image/jpeg" | "image/png";
  /** Compression quality 0..1 (default 0.82) */
  quality?: number;
};

export type CompressedCropResult = {
  blob: Blob;
  width: number;
  height: number;
  mimeType: string;
};

/**
 * Computes the base width and height (zoom = 1) so an image completely covers
 * a square crop frame of `frameSize × frameSize`.
 */
export function computeCoverDimensions(
  naturalWidth: number,
  naturalHeight: number,
  frameSize: number
): { width: number; height: number } {
  if (naturalWidth <= 0 || naturalHeight <= 0 || frameSize <= 0) {
    return { width: frameSize, height: frameSize };
  }

  const scale = Math.max(frameSize / naturalWidth, frameSize / naturalHeight);

  return {
    width: naturalWidth * scale,
    height: naturalHeight * scale,
  };
}

/**
 * Clamps a single-axis pan offset so the zoomed image never exposes blank space
 * inside the square crop viewport.
 */
export function clampCropOffset(
  offset: number,
  renderedSize: number,
  frameSize: number
): number {
  const maxOffset = Math.max(0, (renderedSize - frameSize) / 2);

  return Math.min(maxOffset, Math.max(-maxOffset, offset));
}

/**
 * Computes source rectangle in natural image pixels from interactive frame state.
 */
export function computeSourceCropRect(
  naturalWidth: number,
  naturalHeight: number,
  frameSize: number,
  zoom: number,
  offset: CropOffset
): { sx: number; sy: number; sw: number; sh: number } {
  const safeZoom = Math.max(1, zoom);
  const base = computeCoverDimensions(naturalWidth, naturalHeight, frameSize);
  const renderedWidth = base.width * safeZoom;
  const renderedHeight = base.height * safeZoom;

  const clampedX = clampCropOffset(offset.x, renderedWidth, frameSize);
  const clampedY = clampCropOffset(offset.y, renderedHeight, frameSize);

  const imageLeft = (frameSize - renderedWidth) / 2 + clampedX;
  const imageTop = (frameSize - renderedHeight) / 2 + clampedY;

  const scaleToNaturalX = naturalWidth / renderedWidth;
  const scaleToNaturalY = naturalHeight / renderedHeight;

  const sx = Math.max(0, -imageLeft * scaleToNaturalX);
  const sy = Math.max(0, -imageTop * scaleToNaturalY);
  const sw = Math.min(naturalWidth - sx, frameSize * scaleToNaturalX);
  const sh = Math.min(naturalHeight - sy, frameSize * scaleToNaturalY);

  return { sx, sy, sw, sh };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}

/**
 * Crops and compresses an HTMLImageElement onto an offscreen canvas.
 */
export async function cropAndCompressImage(
  image: HTMLImageElement,
  options: CropOptions
): Promise<CompressedCropResult> {
  const {
    frameSize,
    outputSize = 512,
    zoom,
    offset,
    mimeType = "image/webp",
    quality = 0.82,
  } = options;

  const canvas = document.createElement("canvas");

  canvas.width = outputSize;
  canvas.height = outputSize;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas 2D context is unavailable in this browser.");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const { sx, sy, sw, sh } = computeSourceCropRect(
    image.naturalWidth,
    image.naturalHeight,
    frameSize,
    zoom,
    offset
  );

  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, outputSize, outputSize);

  let resolvedMime: string = mimeType;
  let blob = await canvasToBlob(canvas, mimeType, quality);

  // WHY: Fall back to JPEG if the browser encodes WebP as PNG or returns null (e.g., unsupported encoder in older WebKit/headless contexts).
  if (!blob || (mimeType === "image/webp" && blob.type !== "image/webp")) {
    resolvedMime = "image/jpeg";
    blob = await canvasToBlob(canvas, "image/jpeg", quality);
  }

  if (!blob) {
    throw new Error("Failed to compress cropped image.");
  }

  return {
    blob,
    width: outputSize,
    height: outputSize,
    mimeType: blob.type || resolvedMime,
  };
}

/**
 * Formats a byte size into a compact human-readable string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
