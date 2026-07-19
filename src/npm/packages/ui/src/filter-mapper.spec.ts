import { describe, expect, it } from "vitest";
import {
  getFieldFilterConditions,
  getFieldFilterLogic,
  removeFieldFilter,
  upsertFieldFilter,
} from "./filter-mapper.js";

describe("filter-mapper", () => {
  it("upserts and reads a field filter", () => {
    const next = upsertFieldFilter(null, "Name", {
      field: "Name",
      operator: "contains",
      value: "acme",
    });

    expect(getFieldFilterConditions(next, "Name")).toEqual([
      { field: "Name", operator: "contains", value: "acme" },
    ]);
  });

  it("removes a field filter", () => {
    const filter = {
      logic: "and" as const,
      conditions: [
        { field: "Name", operator: "contains" as const, value: "a" },
        { field: "Status", operator: "eq" as const, value: 1 },
      ],
    };

    expect(removeFieldFilter(filter, "Name")).toEqual({
      field: "Status",
      operator: "eq",
      value: 1,
    });
  });

  it("upserts multiple rules for one field with and logic", () => {
    const next = upsertFieldFilter(
      null,
      "Quantity",
      [
        { field: "Quantity", operator: "gte", value: 10 },
        { field: "Quantity", operator: "lte", value: 50 },
      ],
      "and",
    );

    expect(next).toEqual({
      logic: "and",
      conditions: [
        { field: "Quantity", operator: "gte", value: 10 },
        { field: "Quantity", operator: "lte", value: 50 },
      ],
    });
    expect(getFieldFilterConditions(next, "Quantity")).toEqual([
      { field: "Quantity", operator: "gte", value: 10 },
      { field: "Quantity", operator: "lte", value: 50 },
    ]);
    expect(getFieldFilterLogic(next, "Quantity")).toBe("and");
  });

  it("upserts multiple rules for one field with or logic", () => {
    const next = upsertFieldFilter(
      null,
      "Label",
      [
        { field: "Label", operator: "contains", value: "a" },
        { field: "Label", operator: "contains", value: "b" },
      ],
      "or",
    );

    expect(next).toEqual({
      logic: "or",
      conditions: [
        { field: "Label", operator: "contains", value: "a" },
        { field: "Label", operator: "contains", value: "b" },
      ],
    });
    expect(getFieldFilterLogic(next, "Label")).toBe("or");
  });

  it("preserves sibling field or-groups when upserting another field", () => {
    const existing = upsertFieldFilter(
      null,
      "Label",
      [
        { field: "Label", operator: "contains", value: "a" },
        { field: "Label", operator: "contains", value: "b" },
      ],
      "or",
    );

    const next = upsertFieldFilter(existing, "Status", {
      field: "Status",
      operator: "eq",
      value: 1,
    });

    expect(getFieldFilterLogic(next, "Label")).toBe("or");
    expect(getFieldFilterConditions(next, "Label")).toHaveLength(2);
    expect(getFieldFilterConditions(next, "Status")).toEqual([
      { field: "Status", operator: "eq", value: 1 },
    ]);
  });
});
