import { CommonModule, NgTemplateOutlet } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  LOCALE_ID,
  output,
  signal,
  type TemplateRef,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DEFAULT_GRID_OPTIONS } from "@query-grid/core";
import type { SortMeta } from "primeng/api";
import { Button } from "primeng/button";
import { Chip } from "primeng/chip";
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";
import { InputText } from "primeng/inputtext";
import { Table, TableModule, type TableLazyLoadEvent } from "primeng/table";
import type { GridResource } from "./create-grid-resource";
import { buildGridFilterChips, removeFilterCondition, type GridFilterChip } from "./filter-chips";
import {
  applyGridQueryToPrimeTable,
  isSameGridPatch,
  lazyLoadEventToGridPatch,
  mapLazyLoadSort,
  mergeInitialLazyPatch,
  syncPrimeTableFieldFilters,
} from "./lazy-load-mapper";
import { GRID_TABLE_STYLES } from "./prime-data-grid.styles";
import { mapSortToPrimeMeta, toggleSortField } from "./sort-mapper";
import type { QgColumnContext } from "./table/column-context";
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
  TableModule,
  Button,
  Chip,
  InputText,
  IconField,
  InputIcon,
  QgColumnFilterComponent,
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

  protected readonly searchText = signal("");
  protected readonly filtersExpanded = signal(false);
  private initialLazyLoadHandled = false;

  constructor() {
    effect(() => {
      const search = this.grid().query().search ?? "";
      if (search !== this.searchText()) {
        this.searchText.set(search);
      }
    });
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
    const clickedField = event.field;
    if (!clickedField) {
      return;
    }

    const original = event.originalEvent;
    const next = toggleSortField(this.grid().query().sort, clickedField, {
      multi: !!(original?.ctrlKey || original?.metaKey),
    });
    table.multiSortMeta = mapSortToPrimeMeta(next);
  }

  protected onLazyLoad(event: TableLazyLoadEvent, table: Table): void {
    const defaultPageSize = this.grid().query().take ?? DEFAULT_GRID_OPTIONS.defaultPageSize;
    const sort = mapLazyLoadSort(event, table);

    const patch = {
      ...lazyLoadEventToGridPatch(event, this.resolvedColumns(), defaultPageSize, table),
      sort,
    };
    const current = this.grid().query();

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
    table.clear();
    this.searchText.set("");
    this.filtersExpanded.set(false);
    this.grid().resetQuery();
    this.cleared.emit();
  }
}
