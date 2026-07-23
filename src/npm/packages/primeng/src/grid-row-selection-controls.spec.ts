import { describe, expect, it } from "vitest";
import { createGridRowSelectionControls } from "./grid-row-selection-controls.js";

describe("grid-row-selection-controls", () => {
  it("tracks keys across pages", () => {
    const controls = createGridRowSelectionControls();

    controls.toggleKey("a");
    controls.togglePageKeys(["b", "c"]);

    expect(controls.selectedCount()).toBe(3);
    expect(controls.isKeySelected("a")).toBe(true);

    controls.setPageSelection(["c"], ["b", "c"]);
    expect([...controls.selectedKeys()]).toEqual(["a", "c"]);
  });

  it("supports single selection mode", () => {
    const controls = createGridRowSelectionControls({ mode: "single" });

    controls.toggleKey("a");
    controls.toggleKey("b");

    expect([...controls.selectedKeys()]).toEqual(["b"]);
  });

  it("clears selection", () => {
    const controls = createGridRowSelectionControls();
    controls.toggleKey("a");
    controls.clearSelection();
    expect(controls.selectedCount()).toBe(0);
  });
});
