import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { isColumnHideable } from "@query-grid/core";
import { Button } from "primeng/button";
import { Checkbox } from "primeng/checkbox";
import { Popover } from "primeng/popover";
import { Tooltip } from "primeng/tooltip";
import type { GridResource } from "./create-grid-resource";
import {
  hasColumnChooser,
  type GridResourceWithColumnChooser,
} from "./grid-column-visibility-controls";
import type { GridColumn } from "./table/grid-column";

function asGridWithColumnChooser<T>(
  grid: GridResource<T>,
): (GridResource<T> & GridResourceWithColumnChooser) | null {
  return hasColumnChooser(grid) ? grid : null;
}

@Component({
  selector: "qg-grid-column-chooser",
  standalone: true,
  imports: [CommonModule, FormsModule, Button, Checkbox, Popover, Tooltip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./grid-column-chooser.component.html",
  styles: `
    :host {
      display: contents;
    }

    .qg-grid-column-chooser__panel {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      min-width: 14rem;
      max-height: 20rem;
      padding: 0.25rem 0;
    }

    .qg-grid-column-chooser__list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      overflow: auto;
      padding-inline: 0.25rem;
    }

    .qg-grid-column-chooser__item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .qg-grid-column-chooser__footer {
      display: flex;
      justify-content: flex-end;
      padding-top: 0.25rem;
      border-top: 1px solid var(--p-content-border-color, #e2e8f0);
    }
  `,
})
export class QgGridColumnChooserComponent<T = unknown> {
  readonly grid = input.required<GridResource<T>>();
  readonly columns = input.required<GridColumn<T>[]>();

  protected readonly chooserEnabled = computed(() => asGridWithColumnChooser(this.grid()) != null);

  protected readonly hideableColumns = computed(() =>
    this.columns().filter((column) => isColumnHideable(column)),
  );

  protected readonly hiddenFields = computed(() => {
    const grid = asGridWithColumnChooser(this.grid());
    return new Set(grid?.hiddenColumnFields() ?? []);
  });

  protected readonly hasHiddenColumns = computed(() => this.hiddenFields().size > 0);

  protected isColumnVisible(field: string): boolean {
    return !this.hiddenFields().has(field);
  }

  protected canUncheck(field: string): boolean {
    const hidden = this.hiddenFields();
    const visibleCount = this.hideableColumns().filter(
      (column) => !hidden.has(column.field),
    ).length;
    return !this.isColumnVisible(field) || visibleCount > 1;
  }

  protected onVisibilityChange(field: string, visible: boolean): void {
    asGridWithColumnChooser(this.grid())?.setColumnVisible(field, visible);
  }

  protected showAllColumns(): void {
    asGridWithColumnChooser(this.grid())?.showAllColumns();
  }
}
