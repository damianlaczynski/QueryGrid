import type { SortDescriptor } from "@query-grid/core";
import type { SortMeta } from "primeng/api";
import type { Table, TableLazyLoadEvent } from "primeng/table";

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
