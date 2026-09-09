/* =====================================================================
   Insights formatting
   ---------------------------------------------------------------------
   The API buckets activity in the viewer's own timezone and returns the
   keys as plain "YYYY-MM-DD" / "YYYY-MM-DD HH:00" strings — deliberately
   without a "Z", because they are already local. Parsing them with
   `new Date(string)` would shift them back by the offset, so they are
   taken apart by hand here instead.
   ===================================================================== */

/** "2026-08-15 14:00" → a local Date. */
export function parseBucket(bucket) {
  if (!bucket) return null;

  const [datePart, timePart] = String(bucket).split(" ");
  const [year, month, day] = datePart.split("-").map(Number);
  const hour = timePart ? Number(timePart.split(":")[0]) : 0;

  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day, hour);
}

/** The x-axis label for one bucket. */
export function bucketLabel(bucket, type = "day") {
  const date = parseBucket(bucket);
  if (!date) return bucket;

  if (type === "hour")
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** "Mon", "Tue"… from the ISO weekday numbers the API groups by. */
export const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function weekdayLabel(day, short = true) {
  const name = WEEKDAYS[(day - 1) % 7] || "";
  return short ? name.slice(0, 3) : name;
}

/** "14:00" for an hour-of-day number. */
export function hourLabel(hour) {
  if (hour == null) return "Unknown";
  return `${String(hour).padStart(2, "0")}:00`;
}

/**
 * Percentage change against the previous period.
 * Returns null when there is nothing to compare against, so the UI can
 * leave the arrow off rather than claim "+100%" for a first event.
 */
export function percentChange(current, previous) {
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/** "1,204 members" style numbers, spelled out rather than abbreviated. */
export function plural(count, noun, pluralNoun) {
  const value = Number(count) || 0;
  return `${value.toLocaleString()} ${
    value === 1 ? noun : pluralNoun || `${noun}s`
  }`;
}
