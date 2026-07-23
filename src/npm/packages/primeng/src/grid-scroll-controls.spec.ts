import { describe, expect, it, vi } from "vitest";
import { createGridScrollControls } from "./grid-scroll-controls.js";

describe("grid-scroll-controls", () => {
  it("persists and restores horizontal scroll", () => {
    const onStateChange = vi.fn();
    const controls = createGridScrollControls({ onStateChange });

    controls.setScrollLeft(180);
    expect(controls.getExtraState()).toEqual({ scroll: { left: 180 } });
    expect(onStateChange).toHaveBeenCalledTimes(1);

    controls.reset();
    expect(controls.scrollLeft()).toBe(0);
    expect(controls.getExtraState()).toBeUndefined();

    controls.applyExtraState({ scroll: { left: 96 } });
    expect(controls.scrollLeft()).toBe(96);

    controls.applyExtraState({ columnLayout: { order: ["Id"] } });
    expect(controls.scrollLeft()).toBe(96);
  });
});
