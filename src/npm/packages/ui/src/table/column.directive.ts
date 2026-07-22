import { Directive, inject, input, TemplateRef } from "@angular/core";
import type { QgColumnContext } from "./column-context";
import type { GridCellAlign, GridColumn, GridColumnFilter } from "./grid-column";

/**
 * Declares a grid column and its cell template in one place.
 *
 * ```html
 * <ng-template
 *   qgColumn="status"
 *   header="Status"
 *   [filter]="{ type: 'enum', options: statusOptions }"
 *   [qgColumnOf]="rowType"
 *   let-row
 * >
 *   <p-tag [value]="row.status" />
 * </ng-template>
 * ```
 *
 * When the host grid has no `[columns]` input, column metadata is derived from
 * projected `qgColumn` templates in DOM order.
 */
@Directive({ selector: "[qgColumn]", standalone: true })
export class QgColumnDirective<T = unknown> {
  /** Server field name; must match a sortable/filterable DTO property. */
  readonly field = input.required<string>({ alias: "qgColumn" });
  /**
   * Type-only anchor for `let-row` (e.g. `[qgColumnOf]="rowType"` where `rowType!: MyRow`).
   * Not used at runtime.
   */
  readonly rowTypeAnchor = input<T | undefined>(undefined, {
    alias: "qgColumnOf",
  });
  /** Header label shown in the table. */
  readonly header = input.required<string>();
  /** Defaults to `true`. Set `false` for computed/non-server columns. */
  readonly sortable = input<boolean | undefined>(undefined);
  /** Defaults to `true`. Set `false` to exclude the column from the column chooser. */
  readonly hideable = input<boolean | undefined>(undefined);
  /** Column header filter editor. Omit to disable filtering. */
  readonly filter = input<GridColumnFilter | undefined>(undefined);
  readonly align = input<GridCellAlign | undefined>(undefined);
  readonly width = input<string | undefined>(undefined);
  readonly template = inject<TemplateRef<QgColumnContext<T>>>(TemplateRef);

  toGridColumn(): GridColumn<T> {
    const column: GridColumn<T> = {
      field: this.field(),
      header: this.header(),
    };

    const sortable = this.sortable();
    if (sortable !== undefined) {
      column.sortable = sortable;
    }

    const hideable = this.hideable();
    if (hideable !== undefined) {
      column.hideable = hideable;
    }

    const filter = this.filter();
    if (filter) {
      column.filter = filter;
    }

    const align = this.align();
    if (align) {
      column.align = align;
    }

    const width = this.width();
    if (width) {
      column.width = width;
    }

    return column;
  }

  static ngTemplateContextGuard<T>(
    _directive: QgColumnDirective<T>,
    _context: unknown,
  ): _context is QgColumnContext<T> {
    return true;
  }
}
