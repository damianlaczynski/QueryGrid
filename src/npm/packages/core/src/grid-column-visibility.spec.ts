import { describe, expect, it } from "vitest";
import {
  filterColumnsByVisibility,
  mergeExtraState,
  normalizeHiddenFields,
  pickColumnVisibilityExtra,
  readColumnVisibilityExtra,
} from "./grid-column-visibility.js";

describe("grid-column-visibility", () => {
  it("normalizes hidden fields", () => {
    expect(normalizeHiddenFields(["a", "a", "", "b"])).toEqual(["a", "b"]);
  });

  it("round-trips extra state", () => {
    const extra = pickColumnVisibilityExtra(["Label", "Price"]);
    expect(readColumnVisibilityExtra(extra)).toEqual(["Label", "Price"]);
    expect(pickColumnVisibilityExtra([])).toBeUndefined();
  });

  it("filters columns by visibility", () => {
    const columns = [
      { field: "Id", header: "Id" },
      { field: "Label", header: "Label" },
      { field: "Price", header: "Price" },
    ];

    expect(filterColumnsByVisibility(columns, ["Label"])).toEqual([
      { field: "Id", header: "Id" },
      { field: "Price", header: "Price" },
    ]);
  });

  it("merges extra state objects", () => {
    expect(mergeExtraState({ a: 1 }, undefined, { b: 2 })).toEqual({ a: 1, b: 2 });
    expect(mergeExtraState()).toBeUndefined();
  });
});
