/**
 * Pure date and time formatters across OrGanap.
 */

export function formatDate(isoString: string): string {
  if (!isoString) return "";
  const d = new Date(isoString);

  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime(isoString: string): string {
  if (!isoString) return "";
  const d = new Date(isoString);

  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(isoString: string): string {
  if (!isoString) return "";

  return `${formatDate(isoString)} at ${formatTime(isoString)}`;
}

/**
 * Format an ISO calendar date (`YYYY-MM-DD`) without UTC timezone day-shift.
 */
export function formatCalendarDate(dateString: string): string {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-").map(Number);

  if (!year || !month || !day) return dateString;
  const d = new Date(year, month - 1, day);

  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format byte size into a compact human-readable string.
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Merge legacy purpose and activities_desc into a single event rationale string
 * without duplicating content already merged at the database layer.
 */
export function mergeEventRationale(
  purpose?: string | null,
  activitiesDesc?: string | null,
): string {
  const base = (purpose ?? "").trim();
  const extra = (activitiesDesc ?? "").trim();

  if (!extra) return base;
  if (!base) return extra;
  if (base.includes(extra)) return base;

  return `${base}\n\n${extra}`;
}

/**
 * Group attachment slots or uploaded files by optional category label,
 * defaulting unset categories to "Others" and placing "Others" last.
 */
export function groupByAttachmentCategory<T>(
  items: T[],
  getCategory: (item: T) => string | null | undefined,
): { category: string; items: T[] }[] {
  const buckets = new Map<string, T[]>();

  for (const item of items) {
    const label = getCategory(item)?.trim() || "Others";
    const group = buckets.get(label);

    if (group) {
      group.push(item);
    } else {
      buckets.set(label, [item]);
    }
  }

  const ordered: { category: string; items: T[] }[] = [];
  let othersGroup: { category: string; items: T[] } | null = null;

  for (const [category, groupItems] of buckets.entries()) {
    if (category.toLowerCase() === "others") {
      if (othersGroup) {
        othersGroup.items.push(...groupItems);
      } else {
        othersGroup = { category: "Others", items: groupItems };
      }
    } else {
      ordered.push({ category, items: groupItems });
    }
  }

  if (othersGroup) {
    ordered.push(othersGroup);
  }

  return ordered;
}
