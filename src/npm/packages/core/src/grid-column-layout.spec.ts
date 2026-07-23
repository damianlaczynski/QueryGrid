import { describe, expect, it } from "vitest";
import {
  computePinnedColumnOffsets,
  normalizeColumnOrder,
  orderColumns,
  parseColumnWidthPx,
  partitionColumnsByPin,
  pickColumnLayoutExtra,
  readColumnLayoutExtra,
  reorderDisplayedColumnFields,
  reorderVisibleColumnFields,
  resolveColumnPin,
  resolveColumnWidthPx,
} from "./grid-column-layout.js";

describe("grid-column-layout", () => {
  const columns = [
    { field: "Id", header: "Id", width: "80px" },
    { field: "Label", header: "Label" },
    { field: "Price", header: "Price", pin: "right" as const },
  ];

  it("orders columns by persisted field list", () => {
    expect(orderColumns(columns, ["Price", "Id", "Label"]).map((column) => column.field)).toEqual([
      "Price",
      "Id",
      "Label",
    ]);
  });

  it("normalizes order with missing and unknown fields", () => {
    expect(
      normalizeColumnOrder(["Label", "Label", "Missing", "Id"], ["Id", "Label", "Price"]),
    ).toEqual(["Label", "Id", "Price"]);
  });

  it("reorders visible fields while keeping hidden ones in place", () => {
    const hidden = new Set(["Notes"]);
    const fullOrder = ["Id", "Notes", "Label", "Price"];

    expect(reorderVisibleColumnFields(fullOrder, hidden, 0, 2)).toEqual([
      "Label",
      "Notes",
      "Price",
      "Id",
    ]);
  });

  it("round-trips layout extra state", () => {
    const extra = pickColumnLayoutExtra({
      order: ["Label", "Id"],
      widths: { Label: 220 },
      pins: { Id: "left" },
    });

    expect(readColumnLayoutExtra(extra)).toEqual({
      order: ["Label", "Id"],
      widths: { Label: 220 },
      pins: { Id: "left" },
    });
  });

  it("resolves width and pin with defaults", () => {
    expect(parseColumnWidthPx("120px")).toBe(120);
    expect(resolveColumnWidthPx(columns[0], {})).toBe(80);
    expect(resolveColumnPin(columns[2], {})).toBe("right");
    expect(resolveColumnPin(columns[1], { Label: "left" })).toBe("left");
  });

  it("computes pinned offsets", () => {
    const offsets = computePinnedColumnOffsets(columns, { Id: 80, Price: 100 }, { Id: "left" });

    expect(offsets.get("Id")).toEqual({ pin: "left", left: 0 });
    expect(offsets.get("Price")).toEqual({ pin: "right", right: 0 });
  });

  it("uses measured widths for pinned offsets when stored widths are missing", () => {
    const offsets = computePinnedColumnOffsets(
      columns,
      {},
      { Id: "left", Label: "left" },
      { Id: 140, Label: 164 },
    );

    expect(offsets.get("Id")).toEqual({ pin: "left", left: 0 });
    expect(offsets.get("Label")).toEqual({ pin: "left", left: 140 });
  });

  it("prefers measured widths over stored widths for pinned offsets", () => {
    const offsets = computePinnedColumnOffsets(
      columns,
      { Price: 90, Label: 100 },
      { Price: "right", Label: "right" },
      { Price: 102, Label: 118 },
    );

    expect(offsets.get("Price")).toEqual({ pin: "right", right: 0 });
    expect(offsets.get("Label")).toEqual({ pin: "right", right: 102 });
  });

  it("partitions columns into left, center, and right pin groups", () => {
    const partitioned = partitionColumnsByPin(columns, { Id: "left", Price: "right" });

    expect(partitioned.map((column) => column.field)).toEqual(["Id", "Label", "Price"]);
  });

  it("reorders by displayed field order while keeping hidden fields in place", () => {
    const hidden = new Set(["Notes"]);
    const fullOrder = ["Label", "Notes", "Id", "Price"];
    const displayed = ["Id", "Label", "Price"];

    expect(reorderDisplayedColumnFields(fullOrder, hidden, displayed, 2, 0)).toEqual([
      "Price",
      "Notes",
      "Id",
      "Label",
    ]);
  });
});
