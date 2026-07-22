import { CommonModule } from '@angular/common';
import { Component, computed, inject, Injector, signal } from '@angular/core';
import { buildGridQueryUrl, formatGridError } from '@query-grid/core';
import { PrimeDataGridComponent, QgColumnDirective, QgEmptyDirective } from '@query-grid/primeng';
import { Card } from 'primeng/card';
import { Message } from 'primeng/message';
import { Tag } from 'primeng/tag';
import { ShowcaseRow } from './models/showcase-row.model';
import { ShowcaseApiService } from './services/showcase-api.service';
import { createPrimengShowcaseGrid } from './showcase-grid.factory';
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

  readonly grid = createPrimengShowcaseGrid(this.injector, this.api);

  /** Type anchor for `qgColumn` cell templates (`[qgColumnOf]="rowType"`). */
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
