import { Injector } from '@angular/core';
import { createGridResource, type GridResource } from '@query-grid/primeng';
import { ShowcaseRow } from './models/showcase-row.model';
import { ShowcaseApiService } from './services/showcase-api.service';

export function createShowcaseGrid(
  injector: Injector,
  api: ShowcaseApiService,
  persistKey: string,
): GridResource<ShowcaseRow> {
  return createGridResource({
    injector,
    load: (query) => api.getRows(query),
    defaultSort: [{ field: 'Id', desc: false }],
    defaultTake: 20,
    persistState: { key: persistKey, storage: 'session' },
  });
}
