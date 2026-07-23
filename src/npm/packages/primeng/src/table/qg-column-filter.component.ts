import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  LOCALE_ID,
  ViewEncapsulation,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Checkbox } from "primeng/checkbox";
import { MultiSelect } from "primeng/multiselect";
import { TableModule } from "primeng/table";
import { QgI18nService } from "../i18n";
import { buildEnumMatchModeOptions, buildNullableMatchModeOptions } from "../match-mode-options";
import type { GridColumn } from "./grid-column";

/** Aligned with `@query-grid/ui` multi-rule column filters. PrimeNG defaults to 2. */
const MAX_COLUMN_FILTER_RULES = 5;

@Component({
  selector: "qg-column-filter",
  standalone: true,
  imports: [FormsModule, TableModule, Checkbox, MultiSelect],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: "./qg-column-filter.component.css",
  templateUrl: "./qg-column-filter.component.html",
})
export class QgColumnFilterComponent<T = unknown> {
  private readonly localeId = inject(LOCALE_ID);
  private readonly i18n = inject(QgI18nService);

  readonly column = input.required<GridColumn<T>>();
  readonly filterLocale = input<string | undefined>(undefined);

  protected readonly maxConstraints = MAX_COLUMN_FILTER_RULES;

  protected resolvedFilterLocale(): string {
    return this.filterLocale() ?? this.localeId;
  }

  protected numberFilterFractionDigits(column: GridColumn<T>): {
    min: number;
    max: number;
  } {
    return {
      min: column.filter?.minFractionDigits ?? 0,
      max: column.filter?.maxFractionDigits ?? 10,
    };
  }

  protected numberFilterUseGrouping(column: GridColumn<T>): boolean {
    return column.filter?.useGrouping ?? false;
  }

  protected nullableMatchModeOptions(column: GridColumn<T>) {
    if (!column.filter?.nullable) {
      return undefined;
    }

    this.i18n.languageVersion()();
    return buildNullableMatchModeOptions(column.filter.type, (key, fallback) =>
      this.i18n.t(key, fallback),
    );
  }

  protected enumMatchModeOptions(column: GridColumn<T>) {
    this.i18n.languageVersion()();
    return buildEnumMatchModeOptions(
      (key, fallback) => this.i18n.t(key, fallback),
      column.filter?.nullable,
    );
  }

  protected booleanFilterTrueLabel(column: GridColumn<T>): string {
    this.i18n.languageVersion()();
    return column.filter?.trueLabel ?? this.i18n.t("filter.boolean.yes", "Yes");
  }

  protected booleanFilterFalseLabel(column: GridColumn<T>): string {
    this.i18n.languageVersion()();
    return column.filter?.falseLabel ?? this.i18n.t("filter.boolean.no", "No");
  }

  protected readonly anyPlaceholder = this.i18n.tSignal("filter.value.any", "Any");

  protected onBooleanFilterCheck(
    target: boolean,
    checked: boolean,
    filter: (value: unknown) => void,
  ): void {
    filter(checked ? target : null);
  }
}
