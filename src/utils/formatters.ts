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
