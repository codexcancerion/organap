"use client";

import React from "react";
import {
  Alert,
  Avatar,
  Button,
  Slider,
  Surface,
  toast,
} from "@heroui/react";
import {
  ImagePlus,
  Move,
  RotateCcw,
  Trash2,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import {
  clampCropOffset,
  computeCoverDimensions,
  cropAndCompressImage,
  type CropOffset,
} from "@/utils/image_crop";

const CROP_FRAME_SIZE = 208;
const OUTPUT_DIMENSION = 512;
const MAX_INPUT_BYTES = 10 * 1024 * 1024; // 10 MiB before client compression
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export type CompressedImageValue = {
  blob: Blob;
  previewUrl: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
  mimeType: string;
};

export type ImageCropUploaderProps = {
  fallbackText: string;
  subjectName?: string;
  existingImageUrl?: string | null;
  value: CompressedImageValue | null;
  isCleared?: boolean;
  onChange: (value: CompressedImageValue | null) => void;
  onClearExisting?: () => void;
  inputAriaLabel?: string;
  existingTitle?: string;
  emptyTitle?: string;
  helperDescription?: string;
  replaceButtonLabel?: string;
  chooseButtonLabel?: string;
  avatarVariant?: "rounded" | "circle";
};

/**
 * Shared interactive square image uploader with drag-to-pan, HeroUI Slider zoom cropping,
 * and offscreen WebP/JPEG compression before Supabase Storage upload.
 */
export function ImageCropUploader({
  fallbackText,
  subjectName,
  existingImageUrl,
  value,
  isCleared = false,
  onChange,
  onClearExisting,
  inputAriaLabel = "Upload image",
  existingTitle = "Current Image",
  emptyTitle = "Upload Image",
  helperDescription = "Drop a PNG, JPG, or WebP image here, or choose a file to crop and compress to a crisp 512×512 square badge.",
  replaceButtonLabel = "Upload & Crop New Image",
  chooseButtonLabel = "Choose Image",
  avatarVariant = "rounded",
}: ImageCropUploaderProps) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const imageRef = React.useRef<HTMLImageElement | null>(null);
  const dragStateRef = React.useRef<{
    active: boolean;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  }>({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 });

  const [sourceUrl, setSourceUrl] = React.useState<string | null>(null);
  const [originalSize, setOriginalSize] = React.useState<number>(0);
  const [naturalSize, setNaturalSize] = React.useState<{ width: number; height: number } | null>(null);
  const [zoom, setZoom] = React.useState<number>(1);
  const [offset, setOffset] = React.useState<CropOffset>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState<boolean>(false);
  const [isDraggingOverZone, setIsDraggingOverZone] = React.useState<boolean>(false);
  const [cropError, setCropError] = React.useState<string | null>(null);
  const onChangeRef = React.useRef(onChange);

  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  React.useEffect(() => {
    return () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    };
  }, [sourceUrl]);

  React.useEffect(() => {
    const previewToRevoke = value?.previewUrl;

    return () => {
      if (previewToRevoke) URL.revokeObjectURL(previewToRevoke);
    };
  }, [value?.previewUrl]);

  const baseDimensions = React.useMemo(() => {
    if (!naturalSize) {
      return { width: CROP_FRAME_SIZE, height: CROP_FRAME_SIZE };
    }

    return computeCoverDimensions(naturalSize.width, naturalSize.height, CROP_FRAME_SIZE);
  }, [naturalSize]);

  const renderedWidth = baseDimensions.width * zoom;
  const renderedHeight = baseDimensions.height * zoom;

  const applyClampedOffset = React.useCallback(
    (nextOffset: CropOffset, nextZoom: number): CropOffset => {
      const nextW = baseDimensions.width * nextZoom;
      const nextH = baseDimensions.height * nextZoom;

      return {
        x: clampCropOffset(nextOffset.x, nextW, CROP_FRAME_SIZE),
        y: clampCropOffset(nextOffset.y, nextH, CROP_FRAME_SIZE),
      };
    },
    [baseDimensions.height, baseDimensions.width],
  );

  // WHY: Debounce offscreen canvas compression (80ms) while panning or zooming so
  // interactive gestures stay smooth without blocking the main thread on every frame.
  React.useEffect(() => {
    const img = imageRef.current;

    if (!sourceUrl || !naturalSize || !img) return;

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const result = await cropAndCompressImage(img, {
          frameSize: CROP_FRAME_SIZE,
          outputSize: OUTPUT_DIMENSION,
          zoom,
          offset,
          mimeType: "image/webp",
          quality: 0.82,
        });

        if (cancelled) return;

        const previewUrl = URL.createObjectURL(result.blob);

        onChangeRef.current({
          blob: result.blob,
          previewUrl,
          originalSize,
          compressedSize: result.blob.size,
          width: result.width,
          height: result.height,
          mimeType: result.mimeType,
        });
        setCropError(null);
      } catch (err: unknown) {
        if (!cancelled) {
          setCropError(
            err instanceof Error ? err.message : "Could not process image in this browser.",
          );
        }
      }
    }, 80);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [naturalSize, offset, originalSize, sourceUrl, zoom]);

  const handleFileSelected = (file: File | undefined) => {
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.danger("Unsupported image format", {
        description: "Please choose a PNG, JPG, or WebP image.",
      });

      return;
    }

    if (file.size > MAX_INPUT_BYTES) {
      toast.danger("File too large", {
        description: "Please choose an image smaller than 10 MB.",
      });

      return;
    }

    const objectUrl = URL.createObjectURL(file);

    setSourceUrl(objectUrl);
    setOriginalSize(file.size);
    setNaturalSize(null);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setCropError(null);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!naturalSize) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStateRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      originX: offset.x,
      originY: offset.y,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current.active) return;

    const dx = e.clientX - dragStateRef.current.startX;
    const dy = e.clientY - dragStateRef.current.startY;

    setOffset(
      applyClampedOffset(
        {
          x: dragStateRef.current.originX + dx,
          y: dragStateRef.current.originY + dy,
        },
        zoom,
      ),
    );
  };

  const handlePointerUp = () => {
    dragStateRef.current.active = false;
    setIsDragging(false);
  };

  const handleZoomChange = (val: number | number[]) => {
    const nextZoom = Array.isArray(val) ? val[0] : val;

    setZoom(nextZoom);
    setOffset((prev) => applyClampedOffset(prev, nextZoom));
  };

  const handleClear = () => {
    setSourceUrl(null);
    setNaturalSize(null);
    setOriginalSize(0);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setCropError(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (existingImageUrl && !isCleared && onClearExisting) {
      onClearExisting();
    }
  };

  const activePreviewUrl = value?.previewUrl ?? (!isCleared ? existingImageUrl : null);
  const savingsPercent =
    value && value.originalSize > 0
      ? Math.max(0, Math.round((1 - value.compressedSize / value.originalSize) * 100))
      : null;

  const avatarShapeClass = avatarVariant === "circle" ? "rounded-full" : "rounded-3xl";

  return (
    <div className="flex flex-col gap-4 w-full">
      <input
        ref={fileInputRef}
        accept="image/png,image/jpeg,image/webp"
        aria-label={inputAriaLabel}
        className="hidden"
        type="file"
        onChange={(e) => handleFileSelected(e.target.files?.[0])}
      />

      {!sourceUrl ? (
        <Surface
          className={`rounded-2xl border border-dashed p-5 transition-colors flex flex-col sm:flex-row items-center gap-4 ${
            isDraggingOverZone
              ? "border-accent bg-accent/10"
              : "border-border bg-surface-secondary/50"
          }`}
          onDragLeave={() => setIsDraggingOverZone(false)}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingOverZone(true);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDraggingOverZone(false);
            handleFileSelected(e.dataTransfer.files?.[0]);
          }}
        >
          <Avatar
            className={`w-18 h-18 text-lg font-bold ${avatarShapeClass} bg-accent/15 text-accent border border-accent/25 shrink-0`}
          >
            {activePreviewUrl ? (
              <Avatar.Image
                alt={subjectName || fallbackText || "Uploaded image"}
                className="object-cover"
                src={activePreviewUrl}
              />
            ) : null}
            <Avatar.Fallback className="font-black">
              {fallbackText}
            </Avatar.Fallback>
          </Avatar>

          <div className="flex flex-col gap-1.5 flex-1 text-center sm:text-left min-w-0">
            <span className="text-sm font-semibold text-foreground">
              {activePreviewUrl ? existingTitle : emptyTitle}
            </span>
            <p className="text-xs text-muted leading-relaxed">
              {helperDescription}
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <Button
                size="sm"
                type="button"
                variant="secondary"
                onPress={() => fileInputRef.current?.click()}
              >
                <Upload size={14} />
                {activePreviewUrl ? replaceButtonLabel : chooseButtonLabel}
              </Button>
              {activePreviewUrl ? (
                <Button
                  size="sm"
                  type="button"
                  variant="danger-soft"
                  onPress={handleClear}
                >
                  <Trash2 size={14} />
                  Remove
                </Button>
              ) : null}
            </div>
          </div>
        </Surface>
      ) : (
        <Surface className="rounded-2xl border border-border/50 bg-surface-secondary/40 p-4 flex flex-col sm:flex-row items-center gap-5 w-full">
          <div className="flex flex-col items-center gap-2.5 shrink-0">
            <div
              className={`relative overflow-hidden ${avatarShapeClass} border-2 border-accent/40 bg-background select-none touch-none ${
                isDragging ? "cursor-grabbing" : "cursor-grab"
              }`}
              style={{ width: CROP_FRAME_SIZE, height: CROP_FRAME_SIZE }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imageRef}
                alt="Crop preview source"
                className="pointer-events-none max-w-none absolute left-1/2 top-1/2"
                draggable={false}
                src={sourceUrl}
                style={{
                  width: renderedWidth,
                  height: renderedHeight,
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                }}
                onLoad={(e) => {
                  const img = e.currentTarget;

                  setNaturalSize({
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                  });
                }}
              />

              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3"
              >
                <div className="border-r border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-b border-white/20" />
                <div className="border-r border-white/20" />
                <div className="border-r border-white/20" />
                <div />
              </div>
            </div>

            <div className="w-52 flex items-center gap-1.5">
              <Button
                isIconOnly
                aria-label="Zoom out"
                isDisabled={zoom <= 1}
                size="sm"
                type="button"
                variant="ghost"
                onPress={() => handleZoomChange(Math.max(1, Number((zoom - 0.15).toFixed(2))))}
              >
                <ZoomOut size={14} />
              </Button>

              <Slider
                aria-label="Zoom level"
                className="flex-1"
                maxValue={3}
                minValue={1}
                step={0.05}
                value={zoom}
                onChange={handleZoomChange}
              >
                <Slider.Track>
                  <Slider.Fill />
                  <Slider.Thumb />
                </Slider.Track>
              </Slider>

              <Button
                isIconOnly
                aria-label="Zoom in"
                isDisabled={zoom >= 3}
                size="sm"
                type="button"
                variant="ghost"
                onPress={() => handleZoomChange(Math.min(3, Number((zoom + 0.15).toFixed(2))))}
              >
                <ZoomIn size={14} />
              </Button>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-3.5 flex-1 w-full min-w-0">
            <div className="flex items-center justify-between gap-2 w-full">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Move size={13} />
                Drag to reposition crop
              </span>
              <Button
                isIconOnly
                aria-label="Reset crop"
                size="sm"
                type="button"
                variant="danger-soft"
                onPress={() => {
                  setZoom(1);
                  setOffset({ x: 0, y: 0 });
                }}
              >
                <RotateCcw size={14} />
              </Button>
            </div>

            {value && savingsPercent !== null ? (
              <p className="text-xs font-medium text-success">
                {savingsPercent}% smaller
              </p>
            ) : !value ? (
              <p className="text-xs text-muted">Optimizing…</p>
            ) : null}

            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <Button
                size="sm"
                type="button"
                variant="secondary"
                onPress={() => fileInputRef.current?.click()}
              >
                <ImagePlus size={14} />
                Change Image
              </Button>
              <Button
                size="sm"
                type="button"
                variant="danger-soft"
                onPress={handleClear}
              >
                <Trash2 size={14} />
                Remove
              </Button>
            </div>
          </div>
        </Surface>
      )}

      {cropError ? (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{cropError}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}
    </div>
  );
}
