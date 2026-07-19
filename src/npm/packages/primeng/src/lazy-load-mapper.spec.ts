import { describe, expect, it } from "vitest";
import {
  buildPrimeTableFilters,
  coerceOperatorForColumnType,
  isSameGridPatch,
  lazyLoadEventToGridPatch,
  mapLazyLoadSort,
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
];

describe("lazy-load-mapper", () => {
  it("maps lazy-load sort metadata", () => {
    expect(
      mapLazyLoadSort({
        multiSortMeta: [{ field: "Name", order: -1 }],
      }),
    ).toEqual([{ field: "Name", desc: true }]);
  });

  it("maps PrimeNG filters including notIn", () => {
    const filter = mapPrimeFiltersToGridFilter(
      {
        Status: { value: [0, 1], matchMode: "notIn", operator: "and" },
      },
      columns,
    );

    expect(filter).toEqual({ field: "Status", operator: "notIn", value: [0, 1] });
  });

  it("maps Match Any as a field-level or group", () => {
    const filter = mapPrimeFiltersToGridFilter(
      {
        Name: [
          { value: "a", matchMode: "contains", operator: "or" },
          { value: "b", matchMode: "contains", operator: "or" },
        ],
      },
      columns,
    );

    expect(filter).toEqual({
      logic: "or",
      conditions: [
        { field: "Name", operator: "contains", value: "a" },
        { field: "Name", operator: "contains", value: "b" },
      ],
    });
  });

  it("round-trips notIn through buildPrimeTableFilters", () => {
    const filter = {
      logic: "and" as const,
      conditions: [{ field: "Status", operator: "notIn" as const, value: [0] }],
    };

    expect(buildPrimeTableFilters(filter, columns).Status?.[0]?.matchMode).toBe("notIn");
  });

  it("round-trips Match Any operator through buildPrimeTableFilters", () => {
    const filter = {
      logic: "or" as const,
      conditions: [
        { field: "Name", operator: "contains" as const, value: "a" },
        { field: "Name", operator: "contains" as const, value: "b" },
      ],
    };

    const built = buildPrimeTableFilters(filter, columns).Name;
    expect(built?.map((meta) => meta.operator)).toEqual(["or", "or"]);
  });

  it("lazyLoadEventToGridPatch maps paging and search", () => {
    expect(
      lazyLoadEventToGridPatch(
        {
          first: 20,
          rows: 10,
          globalFilter: "  find me ",
          filters: {},
        },
        columns,
      ),
    ).toEqual({
      skip: 20,
      take: 10,
      sort: [],
      filter: null,
      search: "find me",
    });
  });

  it("isSameGridPatch compares structural filter and sort", () => {
    const current = {
      skip: 0,
      take: 20,
      sort: [{ field: "Name" }],
      filter: { field: "Name", operator: "contains" as const, value: "a" },
    };

    expect(
      isSameGridPatch(current, {
        skip: 0,
        take: 20,
        sort: [{ field: "Name" }],
        filter: { field: "Name", operator: "contains", value: "a" },
      }),
    ).toBe(true);

    expect(
      isSameGridPatch(current, {
        filter: { field: "Name", operator: "contains", value: "b" },
      }),
    ).toBe(false);
  });

  it("coerceOperatorForColumnType keeps notIn for enum", () => {
    expect(coerceOperatorForColumnType("notIn", "enum")).toBe("notIn");
  });
});
