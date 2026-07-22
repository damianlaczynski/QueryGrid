import { Injector } from '@angular/core';
import type { GridQuery } from '@query-grid/core';
import { createGridResource, type GridResource } from '@query-grid/primeng';
import {
  createGridResource as createUiGridResource,
  type GridResource as UiGridResource,
} from '@query-grid/ui';
import { ShowcaseRow } from './models/showcase-row.model';
import { ShowcaseApiService } from './services/showcase-api.service';

function showcaseGridOptions(injector: Injector, api: ShowcaseApiService, persistKey: string) {
  return {
    injector,
    load: (query: GridQuery) => api.getRows(query),
    defaultSort: [{ field: 'Id', desc: false }],
    defaultTake: 20,
    persistState: { key: persistKey, storage: 'session' as const },
    syncRoute: true,
  };
}

export function createPrimengShowcaseGrid(
  injector: Injector,
  api: ShowcaseApiService,
): GridResource<ShowcaseRow> {
  return createGridResource(showcaseGridOptions(injector, api, 'querygrid.showcase-primeng'));
}

export function createUiShowcaseGrid(
  injector: Injector,
  api: ShowcaseApiService,
): UiGridResource<ShowcaseRow> {
  return createUiGridResource(showcaseGridOptions(injector, api, 'querygrid.showcase-ui'));
}
