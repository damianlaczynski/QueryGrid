import { describe, expect, it } from "vitest";
import { getSortDirection, toggleSortField } from "./sort-mapper.js";

describe("sort-mapper", () => {
  it("plain click replaces with a single-column sort (PrimeNG without metaKey)", () => {
    expect(toggleSortField([], "Name")).toEqual([{ field: "Name", desc: false }]);
    expect(toggleSortField([{ field: "Name", desc: false }], "Name")).toEqual([
      { field: "Name", desc: true },
    ]);
    expect(toggleSortField([{ field: "Name", desc: true }], "Name")).toEqual([
      { field: "Name", desc: false },
    ]);
    expect(
      toggleSortField(
        [
          { field: "Name", desc: false },
          { field: "Age", desc: true },
        ],
        "City",
      ),
    ).toEqual([{ field: "City", desc: false }]);
  });

  it("meta/ctrl click adds and toggles within multi-sort (PrimeNG with metaKey)", () => {
    expect(toggleSortField([], "Name", { multi: true })).toEqual([{ field: "Name", desc: false }]);
    expect(toggleSortField([{ field: "Name", desc: false }], "Age", { multi: true })).toEqual([
      { field: "Name", desc: false },
      { field: "Age", desc: false },
    ]);
    expect(
      toggleSortField(
        [
          { field: "Name", desc: false },
          { field: "Age", desc: false },
        ],
        "Name",
        { multi: true },
      ),
    ).toEqual([
      { field: "Name", desc: true },
      { field: "Age", desc: false },
    ]);
  });

  it("reads sort direction for a field", () => {
    expect(getSortDirection([{ field: "Name", desc: true }], "Name")).toBe("desc");
    expect(getSortDirection([{ field: "Name", desc: false }], "Name")).toBe("asc");
    expect(getSortDirection([], "Name")).toBeNull();
  });
});
