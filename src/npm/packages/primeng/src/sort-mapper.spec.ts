import { describe, expect, it, vi } from "vitest";
import {
  mapLazyLoadSort,
  mapPrimeSortMetaToDescriptors,
  syncPrimeTableSort,
} from "./sort-mapper.js";

describe("sort-mapper", () => {
  it("maps PrimeNG multi-sort metadata", () => {
    expect(
      mapPrimeSortMetaToDescriptors([
        { field: "Name", order: 1 },
        { field: "Id", order: -1 },
      ]),
    ).toEqual([
      { field: "Name", desc: false },
      { field: "Id", desc: true },
    ]);
  });

  it("maps lazy-load multiSortMeta", () => {
    expect(
      mapLazyLoadSort({
        multiSortMeta: [{ field: "Name", order: -1 }],
      }),
    ).toEqual([{ field: "Name", desc: true }]);
  });

  it("syncPrimeTableSort updates metadata and notifies sort icons", () => {
    const onSort = vi.fn();
    const table = {
      multiSortMeta: [],
      tableService: { onSort },
    } as unknown as import("primeng/table").Table;

    syncPrimeTableSort(table, [{ field: "Label", desc: true }]);

    expect(table.multiSortMeta).toEqual([{ field: "Label", order: -1 }]);
    expect(onSort).toHaveBeenCalledWith([{ field: "Label", order: -1 }]);
  });
});
