import { CommonModule } from '@angular/common';
import { Component, computed, inject, Injector } from '@angular/core';
import { formatGridError } from '@query-grid/core';
import {
    PrimeDataGridComponent,
    QgColumnDirective,
    QgEmptyDirective,
} from '@query-grid/primeng';
import { Card } from 'primeng/card';
import { Message } from 'primeng/message';
import { Tag } from 'primeng/tag';
import { ShowcaseRow } from './models/showcase-row.model';
import { ShowcaseApiService } from './services/showcase-api.service';
import { createShowcaseGrid } from './showcase-grid.factory';
import { getShowcaseCategoryLabel, showcaseCategories } from './utils/showcase.utils';

@Component({
  selector: 'app-primeng-showcase-page',
  imports: [
    CommonModule,
    Card,
    Message,
    Tag,
    PrimeDataGridComponent,
    QgColumnDirective,
    QgEmptyDirective,
  ],
  templateUrl: './primeng-showcase-page.component.html',
  styleUrl: './showcase-page.shared.css',
})
export class PrimengShowcasePageComponent {
  private readonly api = inject(ShowcaseApiService);
  private readonly injector = inject(Injector);

  readonly showcaseCategories = showcaseCategories;
  readonly getShowcaseCategoryLabel = getShowcaseCategoryLabel;

  readonly grid = createShowcaseGrid(this.injector, this.api, 'querygrid.showcase-primeng');

  /** Type anchor for `qgColumn` cell templates (`[qgColumnOf]="rowType"`). */
  protected readonly rowType!: ShowcaseRow;

  readonly errorMessage = computed(() => formatGridError(this.grid.error()));
}
