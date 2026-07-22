import { describe, expect, it, vi } from "vitest";
import { createGridColumnLayoutControls } from "./grid-column-layout-controls.js";

describe("grid-column-layout-controls", () => {
  it("persists order, widths, and pins in extra state", () => {
    const controls = createGridColumnLayoutControls();
    controls.setAvailableColumnFields(["Id", "Label", "Price"]);
    controls.setColumnWidth("Label", 220);
    controls.setColumnPin("Id", "left");
    controls.setColumnOrder(["Price", "Id", "Label"]);

    expect(controls.getExtraState()).toEqual({
      columnLayout: {
        order: ["Price", "Id", "Label"],
        widths: { Label: 220 },
        pins: { Id: "left" },
      },
    });
  });

  it("resets layout to defaults", () => {
    const onStateChange = vi.fn();
    const controls = createGridColumnLayoutControls({ onStateChange });
    controls.setAvailableColumnFields(["Id", "Label"]);
    controls.setColumnWidth("Id", 120);
    controls.resetColumnLayout();

    expect(controls.columnWidths()).toEqual({});
    expect(controls.columnOrder()).toEqual(["Id", "Label"]);
    expect(onStateChange).toHaveBeenCalled();
  });

  it("restores extra state applied before columns are available", () => {
    const controls = createGridColumnLayoutControls();

    controls.applyExtraState({
      columnLayout: {
        order: ["Price", "Id", "Label"],
        widths: { Label: 220 },
        pins: { Id: "left", Price: "right" },
      },
    });

    controls.setAvailableColumnFields(["Id", "Label", "Price"]);

    expect(controls.columnOrder()).toEqual(["Price", "Id", "Label"]);
    expect(controls.columnWidths()).toEqual({ Label: 220 });
    expect(controls.columnPins()).toEqual({ Id: "left", Price: "right" });
  });

  it("returns pending layout in extra state before columns are available", () => {
    const controls = createGridColumnLayoutControls();

    controls.applyExtraState({
      columnLayout: {
        order: ["Label", "Id"],
        pins: { Id: "left" },
      },
    });

    expect(controls.getExtraState()).toEqual({
      columnLayout: {
        order: ["Label", "Id"],
        pins: { Id: "left" },
      },
    });
  });

  it("replaces widths when a different extra state is applied", () => {
    const controls = createGridColumnLayoutControls();
    controls.setAvailableColumnFields(["Id", "Label"]);
    controls.setColumnWidth("Label", 320);

    controls.applyExtraState({ columnLayout: { widths: { Id: 140 } } });

    expect(controls.columnWidths()).toEqual({ Id: 140 });
  });
});
