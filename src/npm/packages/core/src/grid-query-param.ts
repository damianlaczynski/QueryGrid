import { areSortDescriptorsEqual, sameFilterNode, type GridQuery } from "./models.js";

export const GRID_QUERY_PARAM_DEFAULT = "grid";

export interface GridQueryParamOptions {
  /** Include `skip` in the serialized query. Defaults to `false` for shareable links. */
  includeSkip?: boolean;
}

export function pickShareableGridQuery(
  query: GridQuery,
  options?: GridQueryParamOptions,
): GridQuery {
  const includeSkip = options?.includeSkip ?? false;
  const result: GridQuery = {
    sort: query.sort ?? [],
  };

  if (query.take != null) {
    result.take = query.take;
  }

  if (includeSkip && query.skip != null) {
    result.skip = query.skip;
  }

  if (query.filter != null) {
    result.filter = query.filter;
  }

  if (query.search != null && query.search !== "") {
    result.search = query.search;
  }

  return result;
}

export function serializeGridQuery(query: GridQuery, options?: GridQueryParamOptions): string {
  const picked = pickShareableGridQuery(query, options);
  const payload: Record<string, unknown> = {};

  if (picked.take != null) {
    payload.take = picked.take;
  }

  if (options?.includeSkip && picked.skip != null) {
    payload.skip = picked.skip;
  }

  if (picked.sort && picked.sort.length > 0) {
    payload.sort = picked.sort;
  }

  if (picked.filter != null) {
    payload.filter = picked.filter;
  }

  if (picked.search != null && picked.search !== "") {
    payload.search = picked.search;
  }

  return JSON.stringify(payload);
}

export function deserializeGridQuery(json: string): GridQuery | null {
  try {
    const parsed: unknown = JSON.parse(json);
    if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    const record = parsed as Record<string, unknown>;
    const query: GridQuery = {
      sort: Array.isArray(record.sort) ? (record.sort as GridQuery["sort"]) : [],
    };

    if (record.skip != null) {
      query.skip = record.skip as GridQuery["skip"];
    }

    if (record.take != null) {
      query.take = record.take as GridQuery["take"];
    }

    if (record.filter != null) {
      query.filter = record.filter as GridQuery["filter"];
    }

    if (record.search != null) {
      query.search = record.search as GridQuery["search"];
    }

    return query;
  } catch {
    return null;
  }
}

export function decodeGridQueryParam(value: string | null | undefined): GridQuery | null {
  if (value == null || value.trim() === "") {
    return null;
  }

  const trimmed = value.trim();
  try {
    return deserializeGridQuery(decodeURIComponent(trimmed));
  } catch {
    return deserializeGridQuery(trimmed);
  }
}

export function encodeGridQueryParam(query: GridQuery, options?: GridQueryParamOptions): string {
  return encodeURIComponent(serializeGridQuery(query, options));
}

export function areGridQueriesEqual(
  a: GridQuery,
  b: GridQuery,
  options?: GridQueryParamOptions,
): boolean {
  const includeSkip = options?.includeSkip ?? false;

  if (includeSkip && (a.skip ?? 0) !== (b.skip ?? 0)) {
    return false;
  }

  if ((a.take ?? null) !== (b.take ?? null)) {
    return false;
  }

  if ((a.search ?? "") !== (b.search ?? "")) {
    return false;
  }

  if (!areSortDescriptorsEqual(a.sort, b.sort)) {
    return false;
  }

  return sameFilterNode(a.filter, b.filter);
}

export function isEmptyShareableGridQuery(
  query: GridQuery,
  options?: GridQueryParamOptions,
): boolean {
  return serializeGridQuery(query, options) === "{}";
}

export function buildGridQueryUrl(
  url: string,
  query: GridQuery,
  options?: GridQueryParamOptions & { param?: string },
): string {
  const param = options?.param ?? GRID_QUERY_PARAM_DEFAULT;
  const base =
    typeof globalThis.location !== "undefined"
      ? new URL(url, globalThis.location.origin)
      : new URL(url, "http://localhost");

  if (isEmptyShareableGridQuery(query, options)) {
    base.searchParams.delete(param);
  } else {
    base.searchParams.set(param, serializeGridQuery(query, options));
  }

  return `${base.pathname}${base.search}${base.hash}`;
}
