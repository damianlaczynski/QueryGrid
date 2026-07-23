export type GridCellAlign = "left" | "center" | "right";

export type GridColumnFilterType = "text" | "number" | "date" | "enum" | "boolean" | "guid";

export interface GridColumnFilterOption {
  label: string;
  value: unknown;
}

export interface GridColumnFilter {
  /** Editor rendered in the column header filter popover. */
  type: GridColumnFilterType;
  /** Options for the `enum` checkbox editor. */
  options?: GridColumnFilterOption[];
  /** Placeholder for `text`/`number`/`date`/`guid` inputs. */
  placeholder?: string;
  /** Decimal places for `number` filters (PrimeNG InputNumber). */
  minFractionDigits?: number;
  maxFractionDigits?: number;
  /** Thousand separators in `number` filters. Defaults to `false`. */
  useGrouping?: boolean;
  /** Labels for the `boolean` checkbox filter. */
  trueLabel?: string;
  falseLabel?: string;
  /** Enables `is` / `is not` (isNull / isNotNull) match modes for nullable fields. */
  nullable?: boolean;
}

export interface GridColumn<T = unknown> {
  /** Server field name; must match a sortable/filterable property of the row DTO. */
  field: string;
  /** Header label. */
  header: string;
  /** Defaults to `true`. Set `false` for computed/non-server columns (e.g. actions). */
  sortable?: boolean;
  /** Defaults to `true`. Set `false` to exclude the column from the column chooser. */
  hideable?: boolean;
  /** Defaults to `true`. Set `false` to disable drag-reorder for the column. */
  reorderable?: boolean;
  /** Defaults to `true`. Set `false` to disable resize for the column. */
  resizable?: boolean;
  /** Defaults to `true`. Set `false` to disable pin controls for the column. */
  pinnable?: boolean;
  /** Default pin position from column metadata. */
  pin?: "left" | "right";
  /** Minimum width in pixels when resizing. */
  minWidth?: number;
  /** Column header filter editor. Omit to disable filtering for the column. */
  filter?: GridColumnFilter;
  /** Cell horizontal alignment. */
  align?: GridCellAlign;
  /** Optional fixed width (any CSS width, e.g. `"160px"`). */
  width?: string;
  /** Fallback text renderer used when no `qgColumn` cell template is supplied. */
  format?: (value: unknown, row: T) => string;
}
