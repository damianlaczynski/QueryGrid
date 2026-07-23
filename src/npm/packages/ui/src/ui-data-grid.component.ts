import { CdkDrag, type CdkDragDrop, CdkDragPreview, CdkDropList } from "@angular/cdk/drag-drop";
import { CommonModule, NgTemplateOutlet } from "@angular/common";
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  signal,
  type TemplateRef,
  viewChild,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  ButtonComponent,
  IconComponent,
  type IconName,
  PaginationComponent,
  type PaginationConfig,
  SearchComponent,
  SpinnerComponent,
  TagComponent,
} from "@laczynski/ui";
import type { FilterCondition, FilterLogic } from "@query-grid/core";
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
} from "@query-grid/core";
import type { GridResource } from "./create-grid-resource";
import { buildGridFilterChips, type GridFilterChip, removeFilterCondition } from "./filter-chips";
import { getFieldFilterConditions, getFieldFilterLogic, upsertFieldFilter } from "./filter-mapper";
import { QgGridColumnChooserComponent } from "./grid-column-chooser.component";
import { hasColumnLayout } from "./grid-column-layout-controls";
import { hasColumnChooser } from "./grid-column-visibility-controls";
import { QgGridViewsComponent } from "./grid-views.component";
import { getSortDirection, toggleSortField } from "./sort-mapper";
import type { QgColumnContext } from "./table/column-context";
import { QgColumnResizeDirective } from "./table/column-resize.directive";
import { QgColumnDirective } from "./table/column.directive";
import { QgEmptyDirective } from "./table/empty.directive";
import type { GridColumn } from "./table/grid-column";
import {
  type ColumnFilterApplyEvent,
  QgColumnFilterComponent,
} from "./table/qg-column-filter.component";
import { resolveGridColumns } from "./table/resolve-grid-columns";
import { QgToolbarDirective } from "./toolbar.directive";
import type { GridSize } from "./types";

export type GridExtraChip = {
  id: string;
  label: string;
};

const EMPTY_CONDITIONS: FilterCondition[] = [];

const GRID_IMPORTS = [
  CommonModule,
  FormsModule,
  NgTemplateOutlet,
  CdkDropList,
  CdkDrag,
  CdkDragPreview,
  ButtonComponent,
  IconComponent,
  SearchComponent,
  TagComponent,
  PaginationComponent,
  SpinnerComponent,
  QgColumnFilterComponent,
  QgColumnResizeDirective,
  QgGridColumnChooserComponent,
  QgGridViewsComponent,
];

@Component({
  selector: "qg-ui-data-grid",
  standalone: true,
  imports: GRID_IMPORTS,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./ui-data-grid.component.html",
  styleUrl: "./ui-data-grid.component.scss",
  host: {
    class: "qg-ui-grid",
    "[class.qg-ui-grid--small]": 'size() === "small"',
    "[class.qg-ui-grid--medium]": 'size() === "medium"',
    "[class.qg-ui-grid--large]": 'size() === "large"',
    "[class.qg-ui-grid--striped]": "striped()",
    "[class.qg-ui-grid--hoverable]": "hoverable()",
    "[class.qg-ui-grid--bordered]": "hasGridlines()",
  },
})
export class UiDataGridComponent<T = unknown> {
  private readonly injector = inject(Injector);

  readonly grid = input.required<GridResource<T>>();
  readonly columns = input<GridColumn<T>[]>();
  readonly pageSizeOptions = input<number[]>([10, 20, 50]);
  readonly searchable = input(true);
  readonly searchPlaceholder = input("Search…");
  readonly size = input<GridSize>("medium");
  readonly striped = input(true);
  readonly hoverable = input(true);
  readonly bordered = input(true);
  /** Alias for `bordered` (PrimeNG `showGridlines` DX parity). */
  readonly showGridlines = input<boolean | undefined>(undefined);
  readonly extraChips = input<GridExtraChip[]>([]);
  /** Stable row identity for `@for` tracking (e.g. `"id"`). */
  readonly dataKey = input<string | undefined>(undefined);

  readonly extraChipRemove = output<string>();
  readonly cleared = output<void>();

  private readonly columnDirectives = contentChildren(QgColumnDirective);
  private readonly emptyDirective = contentChildren(QgEmptyDirective);
  private readonly toolbar = contentChildren(QgToolbarDirective);
  private readonly tableWrap = viewChild<ElementRef<HTMLElement>>("tableWrap");

  protected readonly searchText = signal("");
  protected readonly filtersExpanded = signal(false);
  protected readonly showRefreshOverlay = signal(false);
  protected readonly measuredColumnWidths = signal<Readonly<Record<string, number>>>({});
  protected readonly columnDragActive = signal(false);

  protected readonly DEFAULT_GRID_OPTIONS = DEFAULT_GRID_OPTIONS;

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

    effect((onCleanup) => {
      const loading = this.grid().loading();
      const hasRows = (this.grid().items() ?? []).length > 0;

      if (!loading || !hasRows) {
        this.showRefreshOverlay.set(false);
        return;
      }

      const timer = setTimeout(() => this.showRefreshOverlay.set(true), 200);
      onCleanup(() => {
        clearTimeout(timer);
        this.showRefreshOverlay.set(false);
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
      this.measuredColumnWidths.set({});
      this.scheduleColumnWidthMeasure();
    });
  }

  private scheduleColumnWidthMeasure(): void {
    afterNextRender(
      () => {
        const wrap = this.tableWrap()?.nativeElement;
        if (!wrap) {
          return;
        }

        const measured: Record<string, number> = {};
        for (const header of Array.from(
          wrap.querySelectorAll<HTMLElement>(".qg-ui-grid__header-cell[data-field]"),
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

  private readonly cellMap = computed(() => {
    const map = new Map<string, TemplateRef<QgColumnContext<T>>>();
    for (const column of this.columnDirectiveQueries()) {
      map.set(column.field(), column.template);
    }
    return map;
  });

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

  protected readonly paginationConfig = computed<PaginationConfig>(() => {
    const resource = this.grid();
    const take = resource.query().take ?? DEFAULT_GRID_OPTIONS.defaultPageSize;
    return {
      currentPage: resource.page(),
      totalPages: Math.max(1, resource.pageCount()),
      totalItems: resource.totalCount(),
      pageSize: take,
      showPageSizeSelector: true,
      pageSizeOptions: this.pageSizeOptions(),
      showPageNumbers: true,
      maxVisiblePages: 5,
      showFirstLast: true,
      showInfo: true,
    };
  });

  protected readonly hasRows = computed(() => (this.grid().items() ?? []).length > 0);

  protected readonly isRefreshing = computed(() => this.grid().loading() && this.hasRows());

  protected readonly hasGridlines = computed(() => this.showGridlines() ?? this.bordered());

  protected trackRow(row: T, index: number): unknown {
    const key = this.dataKey();
    if (!key) {
      return index;
    }

    const value = (row as Record<string, unknown>)[key];
    return value ?? index;
  }

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

  protected cycleColumnPin(column: GridColumn<T>, event: Event): void {
    event.stopPropagation();
    const grid = this.grid();
    if (!hasColumnLayout(grid) || !this.isPinnable(column)) {
      return;
    }

    const current = this.currentPin(column);
    const next = current === "left" ? "right" : current === "right" ? null : "left";
    grid.setColumnPin(column.field, next);
  }

  protected pinIcon(column: GridColumn<T>): IconName {
    const pin = this.currentPin(column);
    if (pin === "left") {
      return "arrow_left";
    }
    if (pin === "right") {
      return "arrow_right";
    }
    return "pin";
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

  protected sortDirection(field: string): "asc" | "desc" | null {
    return getSortDirection(this.grid().query().sort, field);
  }

  protected sortIndex(field: string): number | null {
    const sort = this.grid().query().sort ?? [];
    const index = sort.findIndex((descriptor) => descriptor.field === field);
    return index >= 0 ? index + 1 : null;
  }

  protected sortIcon(column: GridColumn<T>): IconName {
    const direction = this.sortDirection(column.field);
    if (!direction) {
      return "arrow_sort";
    }

    return direction === "asc" ? "arrow_sort_up_lines" : "arrow_sort_down_lines";
  }

  protected ariaSort(column: GridColumn<T>): "ascending" | "descending" | "none" {
    if (!this.isSortable(column)) {
      return "none";
    }

    const direction = this.sortDirection(column.field);
    if (direction === "asc") {
      return "ascending";
    }
    if (direction === "desc") {
      return "descending";
    }
    return "none";
  }

  protected sortAriaLabel(column: GridColumn<T>): string {
    const direction = this.sortDirection(column.field);
    if (direction === "asc") {
      return `${column.header} sorted ascending`;
    }
    if (direction === "desc") {
      return `${column.header} sorted descending`;
    }
    return `${column.header} sortable`;
  }

  protected showSortPriority(field: string): boolean {
    return (this.grid().query().sort?.length ?? 0) > 1 && this.sortIndex(field) !== null;
  }

  private readonly conditionsByField = computed(() => {
    const filter = this.grid().query().filter;
    const map = new Map<string, FilterCondition[]>();
    for (const column of this.resolvedColumns()) {
      map.set(column.field, getFieldFilterConditions(filter, column.field));
    }
    return map;
  });

  protected columnConditions(field: string): FilterCondition[] {
    return this.conditionsByField().get(field) ?? EMPTY_CONDITIONS;
  }

  protected columnFilterLogic(field: string): FilterLogic {
    return getFieldFilterLogic(this.grid().query().filter, field);
  }

  protected toggleFiltersExpanded(): void {
    this.filtersExpanded.update((expanded) => !expanded);
  }

  protected onSortClick(column: GridColumn<T>, event: Event): void {
    event.stopPropagation();
    if (!this.isSortable(column)) {
      return;
    }

    const mouse = event as MouseEvent;
    const nextSort = toggleSortField(this.grid().query().sort, column.field, {
      multi: mouse.ctrlKey || mouse.metaKey,
    });
    this.grid().setSort(nextSort);
  }

  protected onSearchChange(value: string): void {
    this.searchText.set(value);
    this.grid().setSearch(value.trim() || undefined);
  }

  protected onPageChange(page: number): void {
    this.grid().setPage(page);
  }

  protected onPageSizeChange(take: number): void {
    this.grid().setTake(take);
  }

  protected onColumnFilterChange(field: string, event: ColumnFilterApplyEvent): void {
    const nextFilter = upsertFieldFilter(
      this.grid().query().filter,
      field,
      event.conditions,
      event.logic,
    );
    this.grid().patchQuery({ filter: nextFilter, skip: 0 });
  }

  protected removeChip(chip: GridFilterChip | { id: string; kind: "extra"; label: string }): void {
    if (chip.kind === "extra") {
      this.extraChipRemove.emit(chip.id);
      return;
    }

    if (chip.kind === "search") {
      this.searchText.set("");
      this.grid().patchQuery({ search: undefined, skip: 0 });
      return;
    }

    if (chip.kind === "column" && chip.field) {
      const nextFilter = removeFilterCondition(this.grid().query().filter, {
        field: chip.field,
        operator: chip.operator,
      });
      this.grid().patchQuery({ filter: nextFilter, skip: 0 });
    }
  }

  protected clear(): void {
    this.searchText.set("");
    this.filtersExpanded.set(false);
    this.grid().resetQuery();
    this.cleared.emit();
  }
}
