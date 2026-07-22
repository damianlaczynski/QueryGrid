import { CommonModule } from '@angular/common';
import { Component, computed, inject, Injector, signal } from '@angular/core';
import { ButtonComponent, CardComponent, MessageBarComponent, TagComponent } from '@laczynski/ui';
import { buildGridQueryUrl, formatGridError } from '@query-grid/core';
import { QgColumnDirective, QgEmptyDirective, QgGridViewsComponent, UiDataGridComponent } from '@query-grid/ui';
import { ShowcaseRow } from './models/showcase-row.model';
import { ShowcaseApiService } from './services/showcase-api.service';
import { createUiShowcaseGrid } from './showcase-grid.factory';
import { getShowcaseCategoryLabel, showcaseCategories } from './utils/showcase.utils';

@Component({
  selector: 'app-ui-showcase-page',
  imports: [
    CommonModule,
    ButtonComponent,
    CardComponent,
    MessageBarComponent,
    TagComponent,
    UiDataGridComponent,
    QgGridViewsComponent,
    QgColumnDirective,
    QgEmptyDirective,
  ],
  templateUrl: './ui-showcase-page.component.html',
  styleUrl: './showcase-page.shared.css',
})
export class UiShowcasePageComponent {
  private readonly api = inject(ShowcaseApiService);
  private readonly injector = inject(Injector);

  readonly showcaseCategories = showcaseCategories;
  readonly getShowcaseCategoryLabel = getShowcaseCategoryLabel;

  readonly grid = createUiShowcaseGrid(this.injector, this.api);

  protected readonly rowType!: ShowcaseRow;

  readonly errorMessage = computed(() => formatGridError(this.grid.error()));

  readonly linkCopied = signal(false);

  copyGridLink(): void {
    const url = buildGridQueryUrl(globalThis.location.href, this.grid.query());
    void navigator.clipboard.writeText(url).then(() => {
      this.linkCopied.set(true);
      globalThis.setTimeout(() => this.linkCopied.set(false), 2000);
    });
  }
}
