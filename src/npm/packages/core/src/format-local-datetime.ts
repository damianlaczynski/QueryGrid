const DATE_TIME_PATTERN = /^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2})$/;

/** Formats a value as `dd.MM.yyyy HH:mm` in the user's local timezone. */
export function formatLocalDateTime(value: unknown): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (DATE_TIME_PATTERN.test(trimmed)) {
      return trimmed;
    }
  }

  const date =
    value instanceof Date
      ? value
      : typeof value === "string" || typeof value === "number"
        ? new Date(value)
        : null;

  if (!date || Number.isNaN(date.getTime())) {
    return null;
  }

  const dd = String(date.getDate()).padStart(2, "0");
  const MM = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = String(date.getFullYear());
  const HH = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");

  return `${dd}.${MM}.${yyyy} ${HH}:${mm}`;
}

/** Formats a filter value for display, using local date-time for date columns. */
export function formatFilterDisplayValue(
  columnType: string | undefined,
  value: unknown,
): string {
  if (columnType === "date") {
    return formatLocalDateTime(value) ?? String(value ?? "");
  }

  return String(value ?? "");
}
