import { describe, expect, it } from "vitest";
import {
  areSortDescriptorsEqual,
  clampSortDescriptors,
  clampTake,
  createEmptyGridQuery,
  flattenFilterConditions,
  isFilterCondition,
  isFilterGroup,
  sameFilterNode,
  skipToPage,
  totalPages,
} from "./models.js";

describe("models helpers", () => {
  it("clampTake respects bounds and defaults", () => {
    expect(clampTake(undefined)).toBe(20);
    expect(clampTake(-5)).toBe(0);
    expect(clampTake(500, { maxTake: 100 })).toBe(100);
  });

  it("clampSortDescriptors limits descriptor count", () => {
    const sort = [{ field: "a" }, { field: "b" }, { field: "c" }];
    expect(clampSortDescriptors(sort, 2)).toEqual([
      { field: "a" },
      { field: "b" },
    ]);
  });

  it("skipToPage and totalPages", () => {
    expect(skipToPage(0, 20)).toBe(1);
    expect(skipToPage(40, 20)).toBe(3);
    expect(totalPages(41, 20)).toBe(3);
    expect(totalPages(0, 0)).toBe(0);
  });

  it("createEmptyGridQuery applies defaults", () => {
    expect(createEmptyGridQuery()).toEqual({ skip: 0, take: 20, sort: [] });
  });

  it("type guards discriminate filter nodes", () => {
    const condition = { field: "a", operator: "eq" as const, value: 1 };
    const group = { logic: "and" as const, conditions: [condition] };
    expect(isFilterCondition(condition)).toBe(true);
    expect(isFilterGroup(condition)).toBe(false);
    expect(isFilterGroup(group)).toBe(true);
  });

  it("flattenFilterConditions walks nested groups", () => {
    const filter = {
      logic: "and" as const,
      conditions: [
        { field: "a", operator: "eq" as const, value: 1 },
        {
          logic: "or" as const,
          conditions: [{ field: "b", operator: "ne" as const, value: 2 }],
        },
      ],
    };
    expect(flattenFilterConditions(filter).map((c) => c.field)).toEqual([
      "a",
      "b",
    ]);
  });

  it("sameFilterNode compares structure", () => {
    const left = { field: "a", operator: "in" as const, value: [1, 2] };
    const right = { field: "a", operator: "in" as const, value: [1, 2] };
    expect(sameFilterNode(left, right)).toBe(true);
    expect(sameFilterNode(left, { ...left, value: [2, 1] })).toBe(false);
  });

  it("areSortDescriptorsEqual ignores desc default", () => {
    expect(
      areSortDescriptorsEqual([{ field: "a" }], [{ field: "a", desc: false }]),
    ).toBe(true);
  });
});
