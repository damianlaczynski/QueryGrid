import { CommonModule } from '@angular/common';
import { Component, computed, inject, Injector } from '@angular/core';
import { formatGridError } from '@query-grid/core';
import {
  QgColumnDirective,
  QgEmptyDirective,
  UiDataGridComponent,
} from '@query-grid/ui';
import { CardComponent, MessageBarComponent, TagComponent } from '@laczynski/ui';
import { ShowcaseRow } from './models/showcase-row.model';
import { ShowcaseApiService } from './services/showcase-api.service';
import { createUiShowcaseGrid } from './showcase-grid.factory';
import { getShowcaseCategoryLabel, showcaseCategories } from './utils/showcase.utils';

@Component({
  selector: 'app-ui-showcase-page',
  imports: [
    CommonModule,
    CardComponent,
    MessageBarComponent,
    TagComponent,
    UiDataGridComponent,
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
}
