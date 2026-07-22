import { describe, expect, it } from "vitest";
import {
  buildGridQueryUrl,
  decodeGridQueryParam,
  deserializeGridQuery,
  encodeGridQueryParam,
  isEmptyShareableGridQuery,
  pickShareableGridQuery,
  serializeGridQuery,
} from "./grid-query-param.js";

describe("grid-query-param", () => {
  it("omits skip by default in shareable query", () => {
    const query = {
      skip: 40,
      take: 20,
      sort: [{ field: "Name", desc: true }],
      search: "alice",
    };

    expect(pickShareableGridQuery(query)).toEqual({
      take: 20,
      sort: [{ field: "Name", desc: true }],
      search: "alice",
    });
    expect(serializeGridQuery(query)).toBe(
      JSON.stringify({
        take: 20,
        sort: [{ field: "Name", desc: true }],
        search: "alice",
      }),
    );
  });

  it("includes skip when requested", () => {
    const query = { skip: 40, take: 20, sort: [] };
    expect(JSON.parse(serializeGridQuery(query, { includeSkip: true }))).toEqual({
      skip: 40,
      take: 20,
    });
  });

  it("roundtrips filter trees through encode/decode", () => {
    const query = {
      take: 25,
      sort: [{ field: "Age", desc: false }],
      filter: {
        logic: "and" as const,
        conditions: [
          { field: "Age", operator: "gte" as const, value: 18 },
          { field: "IsActive", operator: "eq" as const, value: true },
        ],
      },
    };

    const encoded = encodeGridQueryParam(query);
    const decoded = decodeGridQueryParam(encoded);

    expect(decoded).toEqual({
      sort: [{ field: "Age", desc: false }],
      take: 25,
      filter: query.filter,
    });
  });

  it("returns null for invalid param values", () => {
    expect(decodeGridQueryParam(null)).toBeNull();
    expect(decodeGridQueryParam("")).toBeNull();
    expect(decodeGridQueryParam("{not-json")).toBeNull();
    expect(deserializeGridQuery("[]")).toBeNull();
  });

  it("detects empty shareable queries", () => {
    expect(isEmptyShareableGridQuery({ sort: [] })).toBe(true);
    expect(
      isEmptyShareableGridQuery({
        sort: [],
        search: "x",
      }),
    ).toBe(false);
  });

  it("builds URLs with a grid query param", () => {
    const url = buildGridQueryUrl("/rows", {
      take: 20,
      sort: [{ field: "Id", desc: false }],
    });

    expect(url).toContain("/rows?");
    expect(url).toContain("grid=");
    expect(decodeGridQueryParam(new URL(url, "http://localhost").searchParams.get("grid"))).toEqual(
      {
        take: 20,
        sort: [{ field: "Id", desc: false }],
      },
    );
  });
});
