import { CommonModule } from '@angular/common';
import { Component, computed, inject, Injector, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { buildGridQueryUrl, formatGridError } from '@query-grid/core';
import {
  hasRowSelection,
  PrimeDataGridComponent,
  QgBulkToolbarDirective,
  QgColumnDirective,
  QgEmptyDirective,
} from '@query-grid/primeng';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Message } from 'primeng/message';
import { Tag } from 'primeng/tag';
import { ShowcaseRow } from './models/showcase-row.model';
import { ShowcaseApiService } from './services/showcase-api.service';
import { ShowcaseLocaleService } from './services/showcase-locale.service';
import { createPrimengShowcaseGrid } from './showcase-grid.factory';
import { getShowcaseCategoryLabel, showcaseCategories } from './utils/showcase.utils';

@Component({
  selector: 'app-primeng-showcase-page',
  imports: [
    CommonModule,
    Card,
    Message,
    Tag,
    Button,
    PrimeDataGridComponent,
    QgColumnDirective,
    QgEmptyDirective,
    QgBulkToolbarDirective,
    TranslatePipe,
  ],
  templateUrl: './primeng-showcase-page.component.html',
  styleUrl: './showcase-page.shared.css',
})
export class PrimengShowcasePageComponent {
  private readonly api = inject(ShowcaseApiService);
  private readonly injector = inject(Injector);
  private readonly translate = inject(TranslateService);
  protected readonly locale = inject(ShowcaseLocaleService);

  readonly showcaseCategories = () => {
    this.locale.language();
    return showcaseCategories(this.translate);
  };
  readonly getShowcaseCategoryLabel = (category: ShowcaseRow['category']) => {
    this.locale.language();
    return getShowcaseCategoryLabel(category, this.translate);
  };

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

  exportSelected(): void {
    if (!hasRowSelection(this.grid)) {
      return;
    }

    const keys = [...this.grid.selectedKeys()];
    globalThis.alert(`Export ${keys.length} row(s): ${keys.join(', ')}`);
  }
}
