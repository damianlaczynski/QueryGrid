import { DEFAULT_GRID_OPTIONS, type SortDescriptor } from "@query-grid/core";
import type { SortMeta } from "primeng/api";
import type { Table, TableLazyLoadEvent } from "primeng/table";

export type ToggleSortOptions = {
  maxDescriptors?: number;
  /**
   * When true (Ctrl/Cmd), add or toggle within multi-sort.
   * When false, replace with a single-column sort — PrimeNG `sortMode="multiple"` UX.
   */
  multi?: boolean;
};

/** PrimeNG-compatible sort toggle for `sortMode="multiple"`. */
export function toggleSortField(
  sort: SortDescriptor[] | null | undefined,
  field: string,
  options: ToggleSortOptions = {},
): SortDescriptor[] {
  const maxDescriptors = options.maxDescriptors ?? DEFAULT_GRID_OPTIONS.maxSortDescriptors;
  const multi = options.multi ?? false;
  const current = [...(sort ?? [])];
  const index = current.findIndex((descriptor) => descriptor.field === field);

  if (multi) {
    if (index >= 0) {
      const existing = current[index];
      return current.map((descriptor, itemIndex) =>
        itemIndex === index ? { ...descriptor, desc: !existing.desc } : descriptor,
      );
    }

    if (current.length >= maxDescriptors) {
      return current;
    }

    return [...current, { field, desc: false }];
  }

  if (index >= 0) {
    return [{ field, desc: !current[index].desc }];
  }

  return [{ field, desc: false }];
}

/** Maps PrimeNG sort metadata to QueryGrid sort descriptors. */
export function mapPrimeSortMetaToDescriptors(
  meta: SortMeta[] | null | undefined,
): SortDescriptor[] {
  return (meta ?? [])
    .filter(
      (item): item is SortMeta & { field: string } =>
        typeof item.field === "string" && item.field.length > 0,
    )
    .map((item) => ({
      field: item.field,
      desc: (item.order ?? 1) < 0,
    }));
}

/** Maps PrimeNG lazy-load sort metadata to QueryGrid sort descriptors. */
export function mapLazyLoadSort(
  event: TableLazyLoadEvent,
  table?: Pick<Table, "multiSortMeta">,
): SortDescriptor[] {
  const multi =
    event.multiSortMeta && event.multiSortMeta.length > 0
      ? event.multiSortMeta
      : (table?.multiSortMeta ?? []);
  if (multi.length > 0) {
    return mapPrimeSortMetaToDescriptors(multi);
  }

  if (typeof event.sortField === "string" && event.sortField.length > 0) {
    return [{ field: event.sortField, desc: (event.sortOrder ?? 1) < 0 }];
  }

  return [];
}

/** Maps QueryGrid sort descriptors to PrimeNG multi-sort metadata. */
export function mapSortToPrimeMeta(sort: SortDescriptor[] | null | undefined): SortMeta[] {
  return (sort ?? []).map((descriptor) => ({
    field: descriptor.field,
    order: descriptor.desc ? -1 : 1,
  }));
}

/** Applies sort metadata to a PrimeNG table and refreshes header sort icons. */
export function syncPrimeTableSort(table: Table, sort: SortDescriptor[] | null | undefined): void {
  const meta = mapSortToPrimeMeta(sort);
  table.multiSortMeta = meta;
  table.tableService.onSort(meta.length > 0 ? meta : null);
}
