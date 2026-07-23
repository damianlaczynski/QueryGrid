import { describe, expect, it } from "vitest";
import { clampScrollLeft, pickScrollExtra, readScrollExtra } from "./grid-scroll-position.js";

describe("grid-scroll-position", () => {
  it("round-trips scroll extra state", () => {
    const extra = pickScrollExtra(240);
    expect(readScrollExtra(extra)).toBe(240);
  });

  it("omits zero or invalid scroll positions", () => {
    expect(pickScrollExtra(0)).toBeUndefined();
    expect(pickScrollExtra(-4)).toBeUndefined();
    expect(readScrollExtra({ scroll: { left: "bad" } })).toBeUndefined();
  });

  it("clamps scroll left to the container width", () => {
    const element = {
      scrollWidth: 500,
      clientWidth: 200,
    } as HTMLElement;

    expect(clampScrollLeft(999, element)).toBe(300);
    expect(clampScrollLeft(-10, element)).toBe(0);
  });
});
