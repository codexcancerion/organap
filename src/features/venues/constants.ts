import type { CSSProperties } from "react";

export type VenueIconKey =
  | "building-2"
  | "landmark"
  | "theater"
  | "monitor-play"
  | "presentation"
  | "mic"
  | "trophy"
  | "trees"
  | "flask-conical"
  | "book-open"
  | "music"
  | "compass";

export type VenueColorKey =
  | "accent"
  | "blue"
  | "indigo"
  | "violet"
  | "emerald"
  | "teal"
  | "amber"
  | "orange"
  | "rose";

export type VenueIconOption = {
  id: VenueIconKey;
  label: string;
};

export type VenueColorOption = {
  id: VenueColorKey;
  label: string;
  hex: string;
  badgeClass: string;
  swatchClass: string;
};

export const VENUE_ICON_OPTIONS: VenueIconOption[] = [
  { id: "building-2", label: "Academic Building" },
  { id: "landmark", label: "Multi-Purpose Hall" },
  { id: "theater", label: "Auditorium / Stage" },
  { id: "monitor-play", label: "Audio-Visual Room" },
  { id: "presentation", label: "Lecture / Seminar Room" },
  { id: "mic", label: "Conference / Podium" },
  { id: "trophy", label: "Gymnasium / Arena" },
  { id: "trees", label: "Courtyard / Grounds" },
  { id: "flask-conical", label: "Innovation / Science Lab" },
  { id: "book-open", label: "Library / Study Hall" },
  { id: "music", label: "Performing Arts / Chapel" },
  { id: "compass", label: "Amphitheater / Plaza" },
];

export const VENUE_COLOR_OPTIONS: VenueColorOption[] = [
  {
    id: "accent",
    label: "Theme Accent",
    hex: "#3b82f6",
    badgeClass: "bg-accent/10 text-accent",
    swatchClass: "bg-accent",
  },
  {
    id: "blue",
    label: "Royal Blue",
    hex: "#2563eb",
    badgeClass: "bg-blue-500/12 text-blue-600 dark:text-blue-400",
    swatchClass: "bg-blue-600",
  },
  {
    id: "indigo",
    label: "Indigo",
    hex: "#4f46e5",
    badgeClass: "bg-indigo-500/12 text-indigo-600 dark:text-indigo-400",
    swatchClass: "bg-indigo-600",
  },
  {
    id: "violet",
    label: "Violet",
    hex: "#7c3aed",
    badgeClass: "bg-violet-500/12 text-violet-600 dark:text-violet-400",
    swatchClass: "bg-violet-600",
  },
  {
    id: "emerald",
    label: "Emerald",
    hex: "#059669",
    badgeClass: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
    swatchClass: "bg-emerald-600",
  },
  {
    id: "teal",
    label: "Teal",
    hex: "#0d9488",
    badgeClass: "bg-teal-500/12 text-teal-600 dark:text-teal-400",
    swatchClass: "bg-teal-600",
  },
  {
    id: "amber",
    label: "Amber",
    hex: "#d97706",
    badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    swatchClass: "bg-amber-500",
  },
  {
    id: "orange",
    label: "Orange",
    hex: "#ea580c",
    badgeClass: "bg-orange-500/12 text-orange-600 dark:text-orange-400",
    swatchClass: "bg-orange-600",
  },
  {
    id: "rose",
    label: "Rose",
    hex: "#e11d48",
    badgeClass: "bg-rose-500/12 text-rose-600 dark:text-rose-400",
    swatchClass: "bg-rose-600",
  },
];

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

const COLOR_MAP = new Map<string, VenueColorOption>(
  VENUE_COLOR_OPTIONS.map((item) => [item.id, item]),
);

export function isValidVenueColor(color: string | null | undefined): boolean {
  if (!color) return false;
  const trimmed = color.trim();

  return COLOR_MAP.has(trimmed) || HEX_COLOR_PATTERN.test(trimmed);
}

export function isHexVenueColor(color: string | null | undefined): boolean {
  return Boolean(color && HEX_COLOR_PATTERN.test(color.trim()));
}

export function resolveVenueBadgePresentation(
  color: string | null | undefined,
): { className: string; style?: CSSProperties } {
  const trimmed = color?.trim() || "accent";
  const preset = COLOR_MAP.get(trimmed);

  if (preset) {
    return { className: preset.badgeClass };
  }

  if (HEX_COLOR_PATTERN.test(trimmed)) {
    return {
      className: "border",
      style: {
        backgroundColor: `${trimmed}1f`,
        color: trimmed,
        borderColor: `${trimmed}33`,
      },
    };
  }

  return { className: "bg-accent/10 text-accent" };
}
