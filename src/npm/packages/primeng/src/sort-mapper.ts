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

/** Maps PrimeNG lazy-load sort metadata to QueryGrid sort descriptors. */
export function mapLazyLoadSort(
  event: TableLazyLoadEvent,
  table?: Pick<Table, "multiSortMeta">,
): SortDescriptor[] {
  const multi =
    event.multiSortMeta && event.multiSortMeta.length > 0
      ? event.multiSortMeta
      : (table?.multiSortMeta ?? []);
  if (multi && multi.length > 0) {
    return multi
      .filter(
        (meta): meta is SortMeta & { field: string } =>
          typeof meta.field === "string" && meta.field.length > 0,
      )
      .map((meta) => ({
        field: meta.field,
        desc: (meta.order ?? 1) < 0,
      }));
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
