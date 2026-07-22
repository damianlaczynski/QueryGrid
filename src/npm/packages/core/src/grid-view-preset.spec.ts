import { describe, expect, it } from "vitest";
import {
  areExtrasEqual,
  createGridViewPreset,
  isGridViewPresetDirty,
  mergeGridViewPresets,
  trimUserGridViewPresets,
} from "./grid-view-preset.js";

describe("grid-view-preset", () => {
  it("merges builtins with custom presets", () => {
    const builtins = [
      {
        id: "builtin-1",
        name: "All",
        builtin: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        query: { sort: [] },
      },
    ];
    const userPresets = [
      {
        id: "user-1",
        name: "Mine",
        createdAt: "2026-01-02T00:00:00.000Z",
        query: { sort: [], search: "x" },
      },
    ];

    expect(mergeGridViewPresets(builtins, userPresets)).toHaveLength(2);
    expect(mergeGridViewPresets(builtins, [...userPresets, ...builtins])).toHaveLength(2);
  });

  it("detects dirty presets", () => {
    const preset = createGridViewPreset("Open", {
      sort: [{ field: "Id", desc: false }],
      search: "open",
    });

    expect(
      isGridViewPresetDirty(preset, {
        sort: [{ field: "Id", desc: false }],
        search: "open",
      }),
    ).toBe(false);
    expect(
      isGridViewPresetDirty(preset, {
        sort: [{ field: "Id", desc: false }],
        search: "closed",
      }),
    ).toBe(true);
  });

  it("compares extras", () => {
    expect(areExtrasEqual({ a: 1 }, { a: 1 })).toBe(true);
    expect(areExtrasEqual({ a: 1 }, { a: 2 })).toBe(false);
  });

  it("trims oldest user presets", () => {
    const presets = [
      {
        id: "1",
        name: "Oldest",
        createdAt: "2026-01-01T00:00:00.000Z",
        query: { sort: [] },
      },
      {
        id: "2",
        name: "Middle",
        createdAt: "2026-01-02T00:00:00.000Z",
        query: { sort: [] },
      },
      {
        id: "3",
        name: "Newest",
        createdAt: "2026-01-03T00:00:00.000Z",
        query: { sort: [] },
      },
    ];

    expect(trimUserGridViewPresets(presets, 2).map((preset) => preset.id)).toEqual([
      "2",
      "3",
    ]);
  });
});
