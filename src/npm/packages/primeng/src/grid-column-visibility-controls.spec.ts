import { describe, expect, it, vi } from "vitest";
import { createGridColumnVisibilityControls } from "./grid-column-visibility-controls.js";

describe("grid-column-visibility-controls", () => {
  it("persists hidden fields in extra state", () => {
    const controls = createGridColumnVisibilityControls();
    controls.setAvailableColumnFields(["Id", "Label", "Price"]);
    controls.setColumnVisible("Label", false);

    expect(controls.hiddenColumnFields()).toEqual(["Label"]);
    expect(controls.getExtraState()).toEqual({
      columnVisibility: { hiddenFields: ["Label"] },
    });
  });

  it("prevents hiding the last visible column", () => {
    const controls = createGridColumnVisibilityControls();
    controls.setAvailableColumnFields(["Id", "Label"]);
    controls.setColumnVisible("Id", false);

    expect(controls.hiddenColumnFields()).toEqual(["Id"]);
    controls.setColumnVisible("Label", false);
    expect(controls.hiddenColumnFields()).toEqual(["Id"]);
  });

  it("notifies on state change", () => {
    const onStateChange = vi.fn();
    const controls = createGridColumnVisibilityControls({ onStateChange });
    controls.setAvailableColumnFields(["Id", "Label"]);
    controls.setColumnVisible("Label", false);

    expect(onStateChange).toHaveBeenCalledTimes(1);
    controls.showAllColumns();
    expect(onStateChange).toHaveBeenCalledTimes(2);
  });

  it("restores state from extra", () => {
    const controls = createGridColumnVisibilityControls();
    controls.applyExtraState({ columnVisibility: { hiddenFields: ["Price"] } });
    expect(controls.hiddenColumnFields()).toEqual(["Price"]);
  });
});
