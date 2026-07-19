import { DEFAULT_GRID_OPTIONS, type SortDescriptor } from "@query-grid/core";

export type ToggleSortOptions = {
  maxDescriptors?: number;
  /**
   * When true (Ctrl/Cmd), add or toggle within multi-sort.
   * When false, replace with a single-column sort — PrimeNG `sortMode="multiple"` UX.
   */
  multi?: boolean;
};

export function getSortDirection(
  sort: SortDescriptor[] | null | undefined,
  field: string,
): "asc" | "desc" | null {
  const item = (sort ?? []).find((descriptor) => descriptor.field === field);
  if (!item) {
    return null;
  }

  return item.desc ? "desc" : "asc";
}

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
