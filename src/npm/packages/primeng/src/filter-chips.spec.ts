import { describe, expect, it } from "vitest";
import { buildGridFilterChips, removeFilterCondition } from "./filter-chips.js";
import type { GridColumn } from "./table/grid-column.js";

const columns: GridColumn[] = [
  {
    field: "Status",
    header: "Status",
    filter: {
      type: "enum",
      options: [
        { label: "Active", value: 1 },
        { label: "Pending", value: 0 },
      ],
    },
  },
  { field: "Name", header: "Name", filter: { type: "text" } },
];

describe("filter-chips", () => {
  it("builds search and column chips", () => {
    const chips = buildGridFilterChips(
      {
        search: "acme",
        filter: {
          logic: "and",
          conditions: [
            { field: "Name", operator: "contains", value: "a" },
            { field: "Status", operator: "notIn", value: [0] },
          ],
        },
      },
      columns,
    );

    expect(chips.map((chip) => chip.label)).toEqual([
      "Search: acme",
      "Name: a",
      "Status: not Pending",
    ]);
  });

  it("removeFilterCondition prunes a single condition", () => {
    const filter = {
      logic: "and" as const,
      conditions: [
        { field: "Name", operator: "contains" as const, value: "a" },
        { field: "Status", operator: "in" as const, value: [1] },
      ],
    };

    const next = removeFilterCondition(filter, { field: "Name" });
    expect(next).toEqual({
      field: "Status",
      operator: "in",
      value: [1],
    });
  });
});
