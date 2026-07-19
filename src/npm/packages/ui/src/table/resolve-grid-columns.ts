import type { QgColumnDirective } from "./column.directive";
import type { GridColumn } from "./grid-column";

/** Uses `[columns]` when provided; otherwise derives metadata from `qgColumn` templates. */
export function resolveGridColumns<T>(
  inputColumns: GridColumn<T>[] | undefined,
  columnDirectives: readonly QgColumnDirective<T>[],
): GridColumn<T>[] {
  if (inputColumns?.length) {
    return inputColumns;
  }

  return columnDirectives.map((column) => column.toGridColumn());
}
