import type { GridQuery } from "@query-grid/core";
import { areSortDescriptorsEqual, DEFAULT_GRID_OPTIONS, sameFilterNode } from "@query-grid/core";
import type { FilterMetadata } from "primeng/api";
import type { Table, TableLazyLoadEvent } from "primeng/table";
import { mapPrimeFiltersToGridFilter } from "./filter-mapper";
import { mapLazyLoadSort } from "./sort-mapper";
import type { GridColumn } from "./table/grid-column";

export {
  applyGridQueryToPrimeTable,
  buildPrimeTableFilters,
  defaultPrimeMatchMode,
  fixOperatorForColumnType,
  mapPrimeFiltersToGridFilter,
  syncPrimeTableFieldFilters,
} from "./filter-mapper";
export { buildEnumMatchModeOptions, buildNullableMatchModeOptions } from "./match-mode-options";
export { mapLazyLoadSort, mapSortToPrimeMeta } from "./sort-mapper";
export type { GridAppearance } from "./types";

/** Maps a PrimeNG lazy-load event to a partial {@link GridQuery} patch. */
export function lazyLoadEventToGridPatch(
  event: TableLazyLoadEvent,
  columns: GridColumn[],
  defaultPageSize = DEFAULT_GRID_OPTIONS.defaultPageSize,
  table?: Pick<Table, "multiSortMeta">,
): Partial<GridQuery> {
  const take = event.rows ?? defaultPageSize;
  const skip = event.first ?? 0;

  const sort = mapLazyLoadSort(event, table);

  const filter = mapPrimeFiltersToGridFilter(
    event.filters as Record<string, FilterMetadata | FilterMetadata[]> | undefined,
    columns,
  );

  const globalFilter = event.globalFilter;
  let search: string | undefined;

  if (typeof globalFilter === "string") {
    search = globalFilter.trim() || undefined;
  } else if (Array.isArray(globalFilter) && globalFilter.length > 0) {
    search = String(globalFilter[0]).trim() || undefined;
  }

  return { skip, take, sort, filter, search };
}

/** Returns `true` when two grid query snapshots represent the same lazy request. */
export function isSameGridPatch(
  current: GridQuery,
  patch: Partial<GridQuery>,
  defaultPageSize = DEFAULT_GRID_OPTIONS.defaultPageSize,
): boolean {
  if ((current.skip ?? 0) !== (patch.skip ?? 0)) {
    return false;
  }

  if ((current.take ?? defaultPageSize) !== (patch.take ?? defaultPageSize)) {
    return false;
  }

  if ((current.search ?? "") !== (patch.search ?? "")) {
    return false;
  }

  if (!sameFilterNode(current.filter, patch.filter)) {
    return false;
  }

  return areSortDescriptorsEqual(current.sort, patch.sort);
}

/**
 * Merges a restored grid query into the first PrimeNG lazy-load patch.
 * PrimeNG emits empty filters on init while persisted state may still carry constraints.
 */
export function mergeInitialLazyPatch(
  patch: Partial<GridQuery>,
  restored: GridQuery,
): Partial<GridQuery> {
  return {
    ...patch,
    filter: patch.filter ?? restored.filter ?? null,
    search: patch.search ?? restored.search,
    sort: (patch.sort?.length ?? 0) > 0 ? patch.sort : (restored.sort ?? patch.sort),
  };
}
