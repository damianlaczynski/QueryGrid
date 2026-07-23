import { CdkDrag, CdkDragPreview, CdkDropList, type CdkDragDrop } from "@angular/cdk/drag-drop";
import { CommonModule, NgTemplateOutlet } from "@angular/common";
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  effect,
  inject,
  Injector,
  input,
  LOCALE_ID,
  output,
  signal,
  untracked,
  viewChild,
  type TemplateRef,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  computePinnedColumnOffsets,
  DEFAULT_GRID_OPTIONS,
  filterColumnsByVisibility,
  isColumnHideable,
  isColumnPinnable,
  isColumnReorderable,
  isColumnResizable,
  orderColumns,
  partitionColumnsByPin,
  reorderDisplayedColumnFields,
  resolveColumnPin,
  resolveColumnWidthPx,
  type SortDescriptor,
} from "@query-grid/core";
import type { SortMeta } from "primeng/api";
import { Button } from "primeng/button";
import { Chip } from "primeng/chip";
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";
import { InputText } from "primeng/inputtext";
import { Table, TableModule, type TableLazyLoadEvent } from "primeng/table";
import type { GridResource } from "./create-grid-resource";
import { buildGridFilterChips, removeFilterCondition, type GridFilterChip } from "./filter-chips";
import { QgGridColumnChooserComponent } from "./grid-column-chooser.component";
import { hasColumnLayout } from "./grid-column-layout-controls";
import { hasColumnChooser } from "./grid-column-visibility-controls";
import { QgGridViewsComponent } from "./grid-views.component";
import {
  applyGridQueryToPrimeTable,
  isSameGridPatch,
  lazyLoadEventToGridPatch,
  mergeInitialLazyPatch,
  needsPrimeTableQuerySync,
  syncPrimeTableFieldFilters,
} from "./lazy-load-mapper";
import { GRID_TABLE_STYLES } from "./prime-data-grid.styles";
import { mapPrimeSortMetaToDescriptors, syncPrimeTableSort, toggleSortField } from "./sort-mapper";
import type { QgColumnContext } from "./table/column-context";
import { QgColumnResizeDirective } from "./table/column-resize.directive";
import { QgColumnDirective } from "./table/column.directive";
import { QgEmptyDirective } from "./table/empty.directive";
import type { GridColumn } from "./table/grid-column";
import { QgColumnFilterComponent } from "./table/qg-column-filter.component";
import { resolveGridColumns } from "./table/resolve-grid-columns";
import { QgToolbarDirective } from "./toolbar.directive";
import type { GridAppearance } from "./types";

export type GridExtraChip = {
  id: string;
  label: string;
};

const GRID_TABLE_IMPORTS = [
  CommonModule,
  FormsModule,
  NgTemplateOutlet,
  CdkDropList,
  CdkDrag,
  CdkDragPreview,
  TableModule,
  Button,
  Chip,
  InputText,
  IconField,
  InputIcon,
  QgColumnFilterComponent,
  QgColumnResizeDirective,
  QgGridColumnChooserComponent,
  QgGridViewsComponent,
];

const GRID_TABLE_HOST = {
  "[class.qg-appearance-plain]": 'appearance() === "plain"',
  "[class.qg-appearance-prime]": 'appearance() === "prime"',
  "[class.qg-scrollable]": "!!scrollHeight()",
};

/**
 * PrimeNG lazy table wired to a {@link GridResource}.
 *
 * Caption layout: search (left), optional expandable toolbar filters, clear
 * (right). Applied filters render as removable chips below the toolbar.
 */
@Component({
  selector: "qg-prime-data-grid",
  standalone: true,
  imports: GRID_TABLE_IMPORTS,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: GRID_TABLE_HOST,
  styles: GRID_TABLE_STYLES,
  templateUrl: "./prime-data-grid.component.html",
})
export class PrimeDataGridComponent<T = unknown> {
  private readonly localeId = inject(LOCALE_ID);
  private readonly injector = inject(Injector);

  readonly grid = input.required<GridResource<T>>();
  /** `plain` = minimal table chrome; `prime` = default PrimeNG styling. */
  readonly appearance = input<GridAppearance>("prime");
  /** Omit when columns are declared with projected `qgColumn` templates. */
  readonly columns = input<GridColumn<T>[]>();
  readonly pageSizeOptions = input<number[]>([10, 20, 50]);
  readonly searchable = input(true);
  readonly searchPlaceholder = input("Search…");
  readonly searchFields = input<string[]>([]);
  readonly showGridlines = input(false);
  readonly stripedRows = input(true);
  readonly dataKey = input<string | undefined>(undefined);
  readonly extraChips = input<GridExtraChip[]>([]);
  /** Locale for numeric column filters (decimal/grouping). Defaults to Angular `LOCALE_ID`. */
  readonly filterLocale = input<string | undefined>(undefined);
  /** When set (e.g. `"flex"`), enables PrimeNG virtual scroll with a fixed viewport height. */
  readonly scrollHeight = input<string | undefined>(undefined);

  readonly extraChipRemove = output<string>();
  readonly cleared = output<void>();

  private readonly columnDirectives = contentChildren(QgColumnDirective);
  private readonly emptyDirective = contentChildren(QgEmptyDirective);
  private readonly toolbar = contentChildren(QgToolbarDirective);

  protected columnDirectiveQueries(): readonly QgColumnDirective<T>[] {
    return this.columnDirectives() as QgColumnDirective<T>[];
  }

  protected emptyDirectiveQueries(): readonly QgEmptyDirective[] {
    return this.emptyDirective();
  }

  protected toolbarDirectiveQueries(): readonly QgToolbarDirective[] {
    return this.toolbar();
  }

  protected readonly resolvedColumns = computed(() =>
    resolveGridColumns(this.columns(), this.columnDirectiveQueries()),
  );

  protected readonly layoutColumns = computed(() => {
    const columns = this.resolvedColumns();
    const grid = this.grid();
    if (!hasColumnLayout(grid)) {
      return columns;
    }

    return orderColumns(columns, grid.columnOrder());
  });

  protected readonly displayedColumns = computed(() => {
    const grid = this.grid();
    let columns = this.layoutColumns();

    if (hasColumnChooser(grid)) {
      columns = filterColumnsByVisibility(columns, grid.hiddenColumnFields());
    }

    if (hasColumnLayout(grid) && Object.keys(grid.columnPins()).length > 0) {
      columns = partitionColumnsByPin(columns, grid.columnPins());
    }

    return columns;
  });

  protected readonly pinnedOffsets = computed(() => {
    const grid = this.grid();
    if (!hasColumnLayout(grid)) {
      return new Map<string, never>();
    }

    return computePinnedColumnOffsets(
      this.displayedColumns(),
      grid.columnWidths(),
      grid.columnPins(),
      this.measuredColumnWidths(),
    );
  });

  protected readonly leftPinnedFields = computed(() =>
    this.displayedColumns()
      .filter((column) => this.pinnedOffset(column.field)?.pin === "left")
      .map((column) => column.field),
  );

  protected readonly rightPinnedFields = computed(() =>
    this.displayedColumns()
      .filter((column) => this.pinnedOffset(column.field)?.pin === "right")
      .map((column) => column.field),
  );

  protected readonly columnLayoutEnabled = computed(() => hasColumnLayout(this.grid()));

  protected readonly hasPinnedColumns = computed(() => this.pinnedOffsets().size > 0);

  protected readonly searchText = signal("");
  protected readonly filtersExpanded = signal(false);
  protected readonly measuredColumnWidths = signal<Readonly<Record<string, number>>>({});
  protected readonly columnDragActive = signal(false);
  private readonly tableRef = viewChild<Table>("table");
  private initialLazyLoadHandled = false;
  private suppressLazyLoad = false;

  constructor() {
    effect(() => {
      const grid = this.grid();
      const fields = this.resolvedColumns().map((column) => column.field);

      if (hasColumnLayout(grid)) {
        grid.setAvailableLayoutFields(fields);
      }

      if (hasColumnChooser(grid)) {
        const hideableFields = this.resolvedColumns()
          .filter((column) => isColumnHideable(column))
          .map((column) => column.field);
        grid.setAvailableColumnFields(hideableFields);
      }
    });

    effect(() => {
      const search = this.grid().query().search ?? "";
      if (search !== this.searchText()) {
        this.searchText.set(search);
      }
    });

    effect(() => {
      const table = this.tableRef();
      const query = this.grid().query();
      const columns = this.resolvedColumns();
      if (!table || !this.initialLazyLoadHandled) {
        return;
      }

      untracked(() => {
        if (!needsPrimeTableQuerySync(table, query, columns)) {
          return;
        }

        this.suppressLazyLoad = true;
        try {
          applyGridQueryToPrimeTable(table, query, columns);
          this.searchText.set(query.search ?? "");
        } finally {
          queueMicrotask(() => {
            this.suppressLazyLoad = false;
          });
        }
      });
    });

    effect(() => {
      const grid = this.grid();
      if (!hasColumnLayout(grid)) {
        return;
      }

      this.displayedColumns();
      grid.columnOrder();
      grid.columnWidths();
      grid.columnPins();
      this.tableRef();
      this.measuredColumnWidths.set({});
      this.scheduleColumnWidthMeasure();
    });
  }

  private scheduleColumnWidthMeasure(): void {
    afterNextRender(
      () => {
        const host = this.tableRef()?.el?.nativeElement as HTMLElement | undefined;
        if (!host) {
          return;
        }

        const measured: Record<string, number> = {};
        for (const header of Array.from(
          host.querySelectorAll<HTMLElement>(".qg-header-cell[data-field]"),
        )) {
          const field = header.dataset["field"];
          if (field && header.offsetWidth > 0) {
            measured[field] = header.offsetWidth;
          }
        }

        const current = this.measuredColumnWidths();
        const changed =
          Object.keys(measured).length !== Object.keys(current).length ||
          Object.entries(measured).some(([field, width]) => current[field] !== width);

        if (changed) {
          this.measuredColumnWidths.set(measured);
        }
      },
      { injector: this.injector },
    );
  }

  private readonly cellMap = computed(() => {
    const map = new Map<string, TemplateRef<QgColumnContext<T>>>();
    for (const column of this.columnDirectiveQueries()) {
      map.set(column.field(), column.template);
    }
    return map;
  });

  protected readonly resolvedFilterLocale = computed(() => this.filterLocale() ?? this.localeId);

  protected readonly DEFAULT_GRID_OPTIONS = DEFAULT_GRID_OPTIONS;

  protected readonly queryChips = computed(() =>
    buildGridFilterChips(this.grid().query(), this.resolvedColumns()),
  );

  protected readonly allChips = computed(() => {
    const extra = this.extraChips().map((chip) => ({
      id: chip.id,
      kind: "extra" as const,
      label: chip.label,
    }));
    return [...this.queryChips(), ...extra];
  });

  protected readonly hasActiveFilters = computed(() => this.allChips().length > 0);

  protected toolbarTemplate(): TemplateRef<unknown> | undefined {
    return this.toolbarDirectiveQueries()[0]?.template;
  }

  protected cellTemplate(field: string): TemplateRef<QgColumnContext<T>> | undefined {
    return this.cellMap().get(field);
  }

  protected emptyTemplate(): TemplateRef<unknown> | undefined {
    return this.emptyDirectiveQueries()[0]?.template;
  }

  protected cellContext(row: T, column: string): QgColumnContext<T> {
    return { $implicit: row, row, column };
  }

  protected formatCell(column: GridColumn<T>, row: T): string {
    const value = (row as Record<string, unknown>)[column.field];
    if (column.format) {
      return column.format(value, row);
    }
    return value === null || value === undefined ? "" : String(value);
  }

  protected isSortable(column: GridColumn<T>): boolean {
    return column.sortable !== false;
  }

  protected isResizable(column: GridColumn<T>): boolean {
    return this.columnLayoutEnabled() && isColumnResizable(column);
  }

  protected isReorderable(column: GridColumn<T>): boolean {
    return this.columnLayoutEnabled() && isColumnReorderable(column);
  }

  protected isPinnable(column: GridColumn<T>): boolean {
    return this.columnLayoutEnabled() && isColumnPinnable(column);
  }

  protected columnWidth(column: GridColumn<T>): string | undefined {
    const grid = this.grid();
    if (!hasColumnLayout(grid)) {
      return column.width;
    }

    const widthPx = resolveColumnWidthPx(column, grid.columnWidths());
    return widthPx != null ? `${widthPx}px` : column.width;
  }

  protected pinnedOffset(field: string) {
    return this.pinnedOffsets().get(field);
  }

  protected isLeftPinnedSeparator(field: string): boolean {
    const fields = this.leftPinnedFields();
    return fields.length > 1 && fields.indexOf(field) > 0;
  }

  protected isLeftPinnedEdge(field: string): boolean {
    const fields = this.leftPinnedFields();
    return fields.length > 0 && fields[fields.length - 1] === field;
  }

  protected isRightPinnedSeparator(field: string): boolean {
    const fields = this.rightPinnedFields();
    const index = fields.indexOf(field);
    return fields.length > 1 && index >= 0 && index < fields.length - 1;
  }

  protected isRightPinnedEdge(field: string): boolean {
    const fields = this.rightPinnedFields();
    return fields.length > 0 && fields[0] === field;
  }

  protected pinnedZIndex(field: string, section: "header" | "body"): number | undefined {
    if (!this.pinnedOffset(field)) {
      return undefined;
    }

    const base = section === "header" ? 20 : 1;
    let pinIndex = 0;

    for (const column of this.displayedColumns()) {
      if (!this.pinnedOffset(column.field)) {
        continue;
      }

      if (column.field === field) {
        return base + pinIndex;
      }

      pinIndex++;
    }

    return undefined;
  }

  protected scrollableZIndex(field: string): number | undefined {
    return this.pinnedOffset(field) ? undefined : 0;
  }

  protected currentPin(column: GridColumn<T>) {
    const grid = this.grid();
    if (!hasColumnLayout(grid)) {
      return column.pin;
    }

    return resolveColumnPin(column, grid.columnPins());
  }

  protected onColumnResized(column: GridColumn<T>, width: number): void {
    const grid = this.grid();
    if (hasColumnLayout(grid)) {
      grid.setColumnWidth(column.field, width);
    }
  }

  protected onColumnDropped(event: CdkDragDrop<GridColumn<T>[]>): void {
    this.columnDragActive.set(false);
    const grid = this.grid();
    if (!hasColumnLayout(grid) || event.previousIndex === event.currentIndex) {
      return;
    }

    const displayed = this.displayedColumns();
    const fromColumn = displayed[event.previousIndex];
    const toColumn = displayed[event.currentIndex];
    if (!fromColumn || !toColumn || !this.canReorderWithColumn(toColumn, fromColumn)) {
      return;
    }

    const hidden = new Set(hasColumnChooser(grid) ? grid.hiddenColumnFields() : []);
    grid.setColumnOrder(
      reorderDisplayedColumnFields(
        this.persistedColumnOrderFields(),
        hidden,
        displayed.map((column) => column.field),
        event.previousIndex,
        event.currentIndex,
      ),
    );
  }

  protected onColumnDragStarted(): void {
    this.columnDragActive.set(true);
  }

  protected canReorderWithColumn(target: GridColumn<T>, source: GridColumn<T> = target): boolean {
    return this.columnPinGroup(source) === this.columnPinGroup(target);
  }

  protected columnPinGroup(column: GridColumn<T>): string {
    return this.currentPin(column) ?? "center";
  }

  protected reorderHandleLabel(column: GridColumn<T>): string {
    return `Reorder ${column.header}`;
  }

  private persistedColumnOrderFields(): string[] {
    const grid = this.grid();
    const order = hasColumnLayout(grid) ? grid.columnOrder() : [];
    if (order.length > 0) {
      return [...order];
    }

    return this.layoutColumns().map((column) => column.field);
  }

  protected cycleColumnPin(column: GridColumn<T>, event: MouseEvent): void {
    event.stopPropagation();
    const grid = this.grid();
    if (!hasColumnLayout(grid) || !this.isPinnable(column)) {
      return;
    }

    const current = this.currentPin(column);
    const next = current === "left" ? "right" : current === "right" ? null : "left";
    grid.setColumnPin(column.field, next);
  }

  protected pinIcon(column: GridColumn<T>): string {
    const pin = this.currentPin(column);
    if (pin === "left") {
      return "pi pi-arrow-left";
    }
    if (pin === "right") {
      return "pi pi-arrow-right";
    }
    return "pi pi-thumbtack";
  }

  protected pinAriaLabel(column: GridColumn<T>): string {
    const pin = this.currentPin(column);
    if (pin === "left") {
      return `Unpin ${column.header}`;
    }
    if (pin === "right") {
      return `Pin ${column.header} left`;
    }
    return `Pin ${column.header} right`;
  }

  protected toggleFiltersExpanded(): void {
    this.filtersExpanded.update((expanded) => !expanded);
  }

  protected onTableSort(
    event: {
      multisortmeta?: SortMeta[];
      multiSortMeta?: SortMeta[];
      field?: string;
      order?: number;
      originalEvent?: MouseEvent;
    },
    table: Table,
  ): void {
    const primeMeta =
      event.multisortmeta ??
      event.multiSortMeta ??
      (event.field ? [{ field: event.field, order: event.order ?? 1 }] : table.multiSortMeta);

    let next: SortDescriptor[] | null =
      primeMeta && primeMeta.length > 0 ? mapPrimeSortMetaToDescriptors(primeMeta) : null;

    if (!next && event.field) {
      const original = event.originalEvent;
      next = toggleSortField(this.grid().query().sort, event.field, {
        multi: !!(original?.ctrlKey || original?.metaKey),
      });
    }

    if (!next) {
      return;
    }

    syncPrimeTableSort(table, next);
    this.grid().setSort(next);
  }

  protected onLazyLoad(event: TableLazyLoadEvent, table: Table): void {
    if (this.suppressLazyLoad) {
      return;
    }

    const defaultPageSize = this.grid().query().take ?? DEFAULT_GRID_OPTIONS.defaultPageSize;
    const current = this.grid().query();
    const basePatch = lazyLoadEventToGridPatch(
      event,
      this.resolvedColumns(),
      defaultPageSize,
      table,
    );
    const lazySort = basePatch.sort ?? [];
    const querySort = current.sort ?? [];
    const patch = {
      ...basePatch,
      sort: lazySort.length > 0 ? lazySort : querySort,
    };

    if (!this.initialLazyLoadHandled) {
      this.initialLazyLoadHandled = true;
      const merged = mergeInitialLazyPatch(patch, current);
      const search = merged.search ?? "";

      this.searchText.set(search);
      applyGridQueryToPrimeTable(table, merged, this.resolvedColumns());

      if (!isSameGridPatch(current, merged, defaultPageSize)) {
        this.grid().patchQuery(merged);
      }

      return;
    }

    if (patch.search !== undefined) {
      this.searchText.set(patch.search ?? "");
    }

    if (isSameGridPatch(current, patch, defaultPageSize)) {
      return;
    }

    this.grid().patchQuery(patch);
  }

  protected onSearchChange(value: string, table: Table): void {
    this.searchText.set(value);
    table.filterGlobal(value, "contains");
  }

  protected removeChip(
    chip: GridFilterChip | { id: string; kind: "extra"; label: string },
    table: Table,
    event: MouseEvent,
  ): void {
    event.preventDefault();

    if (chip.kind === "extra") {
      this.extraChipRemove.emit(chip.id);
      return;
    }

    if (chip.kind === "search") {
      this.searchText.set("");
      table.filterGlobal("", "contains");
      this.grid().patchQuery({ search: undefined, skip: 0 });
      return;
    }

    if (chip.kind === "column" && chip.field) {
      const nextFilter = removeFilterCondition(this.grid().query().filter, {
        field: chip.field,
        operator: chip.operator,
      });
      syncPrimeTableFieldFilters(table, chip.field, nextFilter, this.resolvedColumns());
      this.grid().patchQuery({ filter: nextFilter, skip: 0 });
    }
  }

  protected clear(table: Table): void {
    this.grid().resetQuery();
    this.searchText.set("");
    this.filtersExpanded.set(false);
    applyGridQueryToPrimeTable(table, this.grid().query(), this.resolvedColumns());
    this.cleared.emit();
  }
}
