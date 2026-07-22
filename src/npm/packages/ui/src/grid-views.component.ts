import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  signal,
  viewChild,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  ButtonComponent,
  SelectComponent,
  TextComponent,
  TooltipDirective,
  type SelectItem,
} from "@laczynski/ui";
import type { GridResource } from "./create-grid-resource";
import { hasGridViews, type GridResourceWithViews } from "./grid-views-controls";
import type { GridSize } from "./types";

function asGridWithViews<T>(
  grid: GridResource<T>,
): (GridResource<T> & GridResourceWithViews<T>) | null {
  return hasGridViews(grid) ? grid : null;
}

@Component({
  selector: "qg-grid-views",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SelectComponent,
    ButtonComponent,
    TextComponent,
    TooltipDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./grid-views.component.html",
  styleUrl: "./grid-views.component.scss",
})
export class QgGridViewsComponent<T = unknown> {
  readonly grid = input.required<GridResource<T>>();
  readonly size = input<GridSize>("medium");

  private readonly saveDialog = viewChild<ElementRef<HTMLDialogElement>>("saveDialog");

  protected readonly newPresetName = signal("");

  protected readonly viewsEnabled = computed(() => asGridWithViews(this.grid()) != null);

  protected readonly presetItems = computed((): SelectItem[] => {
    const grid = asGridWithViews(this.grid());
    if (!grid) {
      return [];
    }

    return grid.presets().map((preset) => ({
      label: preset.name,
      value: preset.id,
    }));
  });

  protected readonly selectedPresetId = computed(
    () => asGridWithViews(this.grid())?.activePresetId() ?? null,
  );

  protected readonly isPresetDirty = computed(
    () => asGridWithViews(this.grid())?.isPresetDirty() ?? false,
  );

  protected readonly canUpdateSelected = computed(() => {
    const grid = asGridWithViews(this.grid());
    if (!grid?.isPresetDirty()) {
      return false;
    }

    const id = grid.activePresetId();
    if (!id) {
      return false;
    }

    const preset = grid.presets().find((item) => item.id === id);
    return Boolean(preset && !preset.builtin);
  });

  protected readonly canDeleteSelected = computed(() => {
    const grid = asGridWithViews(this.grid());
    if (!grid) {
      return false;
    }

    const id = grid.activePresetId();
    if (!id) {
      return false;
    }

    const preset = grid.presets().find((item) => item.id === id);
    return Boolean(preset && !preset.builtin);
  });

  protected onPresetSelected(id: string | null): void {
    const grid = asGridWithViews(this.grid());
    if (!grid) {
      return;
    }

    if (!id) {
      grid.clearActivePreset();
      return;
    }

    grid.applyPreset(id);
  }

  protected openSaveDialog(): void {
    this.newPresetName.set("");
    this.saveDialog()?.nativeElement.showModal();
  }

  protected closeSaveDialog(): void {
    this.saveDialog()?.nativeElement.close();
    this.newPresetName.set("");
  }

  protected onSaveSubmit(event: Event): void {
    event.preventDefault();
    this.saveAs();
  }

  protected saveAs(): void {
    const name = this.newPresetName().trim();
    const grid = asGridWithViews(this.grid());
    if (!name || !grid) {
      return;
    }

    grid.saveCurrentAsPreset(name);
    this.closeSaveDialog();
  }

  protected updatePreset(): void {
    asGridWithViews(this.grid())?.updateActivePreset();
  }

  protected deleteSelected(): void {
    const grid = asGridWithViews(this.grid());
    const id = grid?.activePresetId();
    if (grid && id) {
      grid.deletePreset(id);
    }
  }
}
