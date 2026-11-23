# `src/utils/` — Pure Helpers and Shared Clients

Pure utility functions, formatters, image cropping/compression helpers (`image_crop.ts`), and data-layer clients shared across the project.
No UI markup or React hooks belong here.

- `image_crop.ts`: Pure cover-scale math, pan-offset clamping (preventing blank gaps inside fixed square viewports), and offscreen canvas `512×512` WebP compression with automatic JPEG fallback when browser WebP encoding is unsupported.
