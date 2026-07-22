import { describe, expect, it } from "vitest";
import {
  areAllPageRowsSelected,
  isSomePageRowsSelected,
  replacePageRowSelection,
  resolveRowKey,
  togglePageRowSelection,
  toggleRowSelection,
} from "./grid-row-selection.js";

describe("grid-row-selection", () => {
  it("resolves row keys from dataKey", () => {
    expect(resolveRowKey({ id: 42, label: "A" }, "id")).toBe("42");
    expect(resolveRowKey({ id: 42, label: "A" }, "missing")).toBeNull();
  });

  it("toggles keys in single and multiple mode", () => {
    expect(toggleRowSelection(new Set(), "a", "single")).toEqual(new Set(["a"]));
    expect(toggleRowSelection(new Set(["a"]), "a", "single")).toEqual(new Set());
    expect(toggleRowSelection(new Set(["a"]), "b", "multiple")).toEqual(new Set(["a", "b"]));
    expect(toggleRowSelection(new Set(["a", "b"]), "a", "multiple")).toEqual(new Set(["b"]));
  });

  it("toggles page selection in multiple mode", () => {
    expect(togglePageRowSelection(new Set(["x"]), ["a", "b"], "multiple")).toEqual(
      new Set(["x", "a", "b"]),
    );
    expect(togglePageRowSelection(new Set(["x", "a", "b"]), ["a", "b"], "multiple")).toEqual(
      new Set(["x"]),
    );
  });

  it("replaces page selection while keeping other pages selected", () => {
    expect(replacePageRowSelection(new Set(["x", "a"]), ["a", "b"], ["b"], "multiple")).toEqual(
      new Set(["x", "b"]),
    );
  });

  it("detects page selection state", () => {
    expect(areAllPageRowsSelected(new Set(["a", "b"]), ["a", "b"])).toBe(true);
    expect(isSomePageRowsSelected(new Set(["a"]), ["a", "b"])).toBe(true);
    expect(isSomePageRowsSelected(new Set(["a", "b"]), ["a", "b"])).toBe(false);
  });
});
