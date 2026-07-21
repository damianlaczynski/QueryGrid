import { describe, expect, it } from "vitest";
import {
  coerceOperatorForColumnType,
  getAllowedOperatorsForColumnType,
} from "./column-filter-operators.js";

describe("column-filter-operators", () => {
  it("enum allows null operators only when nullable", () => {
    expect(getAllowedOperatorsForColumnType("enum", false)).not.toContain("isNull");
    expect(getAllowedOperatorsForColumnType("enum", true)).toContain("isNull");
  });

  it("coerceOperatorForColumnType keeps valid enum operators", () => {
    expect(coerceOperatorForColumnType("notIn", "enum")).toBe("notIn");
  });

  it("coerceOperatorForColumnType replaces invalid enum operator with default", () => {
    expect(coerceOperatorForColumnType("contains", "enum")).toBe("in");
  });

  it("coerceOperatorForColumnType replaces string operator on number columns", () => {
    expect(coerceOperatorForColumnType("contains", "number")).toBe("eq");
  });
});
