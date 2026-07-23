import { describe, expect, it } from "vitest";
import {
  buildExportColumns,
  buildExportQuery,
  buildGridExportBody,
  defaultExportFilename,
  resolveExportFilename,
} from "./grid-export.js";

describe("grid-export", () => {
  it("buildExportQuery omits paging fields", () => {
    expect(
      buildExportQuery({
        skip: 40,
        take: 20,
        search: "alice",
        sort: [{ field: "Id", desc: true }],
        filter: { field: "IsActive", operator: "eq", value: true },
      }),
    ).toEqual({
      search: "alice",
      sort: [{ field: "Id", desc: true }],
      filter: { field: "IsActive", operator: "eq", value: true },
    });
  });

  it("buildExportColumns skips hidden columns", () => {
    expect(
      buildExportColumns([
        { field: "Id", header: "ID" },
        { field: "Label", header: "Label", hidden: true },
        { field: "Quantity", header: "Qty" },
      ]),
    ).toEqual([
      { field: "Id", header: "ID" },
      { field: "Quantity", header: "Qty" },
    ]);
  });

  it("buildGridExportBody maps selected export scope", () => {
    expect(
      buildGridExportBody({
        query: { sort: [] },
        scope: "selectedKeys",
        selectedKeys: ["1", "3"],
        dataKeyField: "id",
        format: "xlsx",
        columns: [{ field: "Id", header: "ID" }],
      }),
    ).toEqual({
      query: { sort: [] },
      scope: "selectedKeys",
      selectedKeys: ["1", "3"],
      dataKeyField: "id",
      format: "xlsx",
      columns: [{ field: "Id", header: "ID" }],
    });
  });

  it("defaultExportFilename appends extension", () => {
    expect(defaultExportFilename("issues", "csv")).toBe("issues.csv");
    expect(defaultExportFilename("issues", "xlsx")).toBe("issues.xlsx");
    expect(defaultExportFilename("issues.csv", "xlsx")).toBe("issues.csv");
  });

  it("resolveExportFilename reads Content-Disposition", () => {
    const response = new Response(null, {
      headers: {
        "Content-Disposition": 'attachment; filename="rows-2026-07-23.csv"',
      },
    });

    expect(resolveExportFilename(response, "fallback.csv")).toBe("rows-2026-07-23.csv");
  });
});
