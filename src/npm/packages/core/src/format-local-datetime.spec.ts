import { describe, expect, it } from "vitest";
import {
  formatFilterDisplayValue,
  formatLocalDateTime,
} from "./format-local-datetime.js";

describe("formatLocalDateTime", () => {
  it("formats Date in local timezone as dd.MM.yyyy HH:mm", () => {
    const value = new Date(2026, 5, 10, 14, 30);

    expect(formatLocalDateTime(value)).toBe("10.06.2026 14:30");
  });

  it("formats ISO strings in local timezone", () => {
    const value = new Date(2026, 5, 10, 0, 0);

    expect(formatLocalDateTime(value.toISOString())).toBe("10.06.2026 00:00");
  });

  it("returns already formatted strings unchanged", () => {
    expect(formatLocalDateTime("10.06.2026 00:00")).toBe("10.06.2026 00:00");
  });

  it("returns null for empty values", () => {
    expect(formatLocalDateTime(null)).toBeNull();
    expect(formatLocalDateTime("")).toBeNull();
  });
});

describe("formatFilterDisplayValue", () => {
  it("uses date formatting for date columns", () => {
    const value = new Date(2026, 5, 10, 9, 5);

    expect(formatFilterDisplayValue("date", value)).toBe("10.06.2026 09:05");
  });

  it("falls back to string for non-date columns", () => {
    expect(formatFilterDisplayValue("text", "hello")).toBe("hello");
  });
});
