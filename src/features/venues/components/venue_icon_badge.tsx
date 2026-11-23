import type { CSSProperties } from "react";

import {
  BookOpen,
  Building2,
  Compass,
  FlaskConical,
  Landmark,
  Mic,
  MonitorPlay,
  Music,
  Presentation,
  Theater,
  Trees,
  Trophy,
} from "lucide-react";
import clsx from "clsx";

import { resolveVenueBadgePresentation } from "../constants";

export type VenueIconBadgeProps = {
  icon?: string | null;
  color?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZE_CLASSES: Record<"sm" | "md" | "lg", { container: string; iconSize: number }> = {
  sm: { container: "w-7 h-7 rounded-lg", iconSize: 14 },
  md: { container: "w-10 h-10 rounded-xl", iconSize: 18 },
  lg: { container: "w-16 h-16 rounded-3xl", iconSize: 30 },
};

export function renderVenueGlyph(iconKey: string | null | undefined, size: number) {
  switch (iconKey) {
    case "landmark":
      return <Landmark aria-hidden="true" size={size} />;
    case "theater":
      return <Theater aria-hidden="true" size={size} />;
    case "monitor-play":
      return <MonitorPlay aria-hidden="true" size={size} />;
    case "presentation":
      return <Presentation aria-hidden="true" size={size} />;
    case "mic":
      return <Mic aria-hidden="true" size={size} />;
    case "trophy":
      return <Trophy aria-hidden="true" size={size} />;
    case "trees":
      return <Trees aria-hidden="true" size={size} />;
    case "flask-conical":
      return <FlaskConical aria-hidden="true" size={size} />;
    case "book-open":
      return <BookOpen aria-hidden="true" size={size} />;
    case "music":
      return <Music aria-hidden="true" size={size} />;
    case "compass":
      return <Compass aria-hidden="true" size={size} />;
    case "building-2":
    default:
      return <Building2 aria-hidden="true" size={size} />;
  }
}

/**
 * Renders a campus venue's selected Lucide icon inside its tinted color badge.
 */
export function VenueIconBadge({
  icon,
  color,
  size = "md",
  className,
}: VenueIconBadgeProps) {
  const { className: badgeClassName, style } = resolveVenueBadgePresentation(color);
  const { container, iconSize } = SIZE_CLASSES[size];

  return (
    <div
      className={clsx(
        "flex items-center justify-center shrink-0",
        container,
        badgeClassName,
        className,
      )}
      style={style as CSSProperties | undefined}
    >
      {renderVenueGlyph(icon, iconSize)}
    </div>
  );
}
