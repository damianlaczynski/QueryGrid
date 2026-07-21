import { describe, expect, it } from "vitest";
import {
  coerceOperatorForColumnType,
  lazyLoadEventToGridPatch,
  mapPrimeFiltersToGridFilter,
} from "./lazy-load-mapper.js";
import type { GridColumn } from "./table/grid-column.js";

const columns: GridColumn[] = [
  { field: "Name", header: "Name", filter: { type: "text" } },
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
  {
    field: "OptionalStatus",
    header: "Optional status",
    filter: { type: "enum", nullable: true, options: [] },
  },
  { field: "IsActive", header: "Active", filter: { type: "boolean" } },
  { field: "Age", header: "Age", filter: { type: "number" } },
];

describe("filter-mapper UX edge cases", () => {
  it("coerces PrimeNG contains on enum columns to in", () => {
    const filter = mapPrimeFiltersToGridFilter(
      { Status: { value: [1], matchMode: "contains", operator: "and" } },
      columns,
    );

    expect(filter).toEqual({ field: "Status", operator: "in", value: [1] });
  });

  it("drops empty filter values instead of sending invalid constraints", () => {
    expect(
      mapPrimeFiltersToGridFilter(
        {
          Name: { value: "", matchMode: "contains", operator: "and" },
          Status: { value: [], matchMode: "in", operator: "and" },
        },
        columns,
      ),
    ).toBeNull();
  });

  it("keeps nullable enum is-null checks without a value", () => {
    expect(
      mapPrimeFiltersToGridFilter(
        { OptionalStatus: { value: null, matchMode: "is", operator: "and" } },
        columns,
      ),
    ).toEqual({ field: "OptionalStatus", operator: "isNull" });
  });

  it("coerces stale string operators on boolean columns", () => {
    expect(coerceOperatorForColumnType("contains", "boolean")).toBe("eq");

    const filter = mapPrimeFiltersToGridFilter(
      { IsActive: { value: true, matchMode: "contains", operator: "and" } },
      columns,
    );

    expect(filter).toEqual({ field: "IsActive", operator: "eq", value: true });
  });

  it("coerces stale contains on number columns to eq", () => {
    const filter = mapPrimeFiltersToGridFilter(
      { Age: { value: 42, matchMode: "contains", operator: "and" } },
      columns,
    );

    expect(filter).toEqual({ field: "Age", operator: "eq", value: 42 });
  });

  it("ignores filters for unknown columns", () => {
    expect(
      mapPrimeFiltersToGridFilter(
        { UnknownField: { value: "x", matchMode: "contains", operator: "and" } },
        columns,
      ),
    ).toBeNull();
  });

  it("trims whitespace from global search in lazy-load events", () => {
    expect(
      lazyLoadEventToGridPatch({ first: 0, rows: 20, globalFilter: "   ", filters: {} }, columns)
        .search,
    ).toBeUndefined();
  });
});
