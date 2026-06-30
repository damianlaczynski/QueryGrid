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
import { PrimeNG } from "primeng/config";
import { MultiSelect } from "primeng/multiselect";
import { TableModule } from "primeng/table";
import { buildEnumMatchModeOptions, buildNullableMatchModeOptions } from "../match-mode-options";
import type { GridColumn } from "./grid-column";

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
  private readonly primeConfig = inject(PrimeNG);

  readonly column = input.required<GridColumn<T>>();
  readonly filterLocale = input<string | undefined>(undefined);

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

    return buildNullableMatchModeOptions(column.filter.type, (key) =>
      this.primeConfig.getTranslation(key),
    );
  }

  protected enumMatchModeOptions() {
    return buildEnumMatchModeOptions((key) => this.primeConfig.getTranslation(key));
  }

  protected booleanFilterTrueLabel(column: GridColumn<T>): string {
    return column.filter?.trueLabel ?? "Yes";
  }

  protected booleanFilterFalseLabel(column: GridColumn<T>): string {
    return column.filter?.falseLabel ?? "No";
  }

  protected onBooleanFilterCheck(
    target: boolean,
    checked: boolean,
    filter: (value: unknown) => void,
  ): void {
    filter(checked ? target : null);
  }
}
