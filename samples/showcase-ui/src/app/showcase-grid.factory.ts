import { Injector } from '@angular/core';
import type { GridExportColumnInput, GridQuery, GridViewPreset } from '@query-grid/core';
import { createGridResource, type GridResource } from '@query-grid/primeng';
import {
  createGridResource as createUiGridResource,
  type GridResource as UiGridResource,
} from '@query-grid/ui';
import { ShowcaseRow } from './models/showcase-row.model';
import { ShowcaseApiService } from './services/showcase-api.service';

const showcaseActiveView: GridViewPreset = {
  id: 'showcase-active',
  name: 'Active only',
  builtin: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  query: {
    filter: { field: 'IsActive', operator: 'eq', value: true },
  },
};

const showcaseExportColumns: readonly GridExportColumnInput[] = [
  { field: 'Id', header: 'Id' },
  { field: 'Label', header: 'Label' },
  { field: 'OptionalNote', header: 'Optional note' },
  { field: 'Quantity', header: 'Quantity' },
  { field: 'BigNumber', header: 'Big number' },
  { field: 'Price', header: 'Price' },
  { field: 'Score', header: 'Score' },
  { field: 'IsActive', header: 'Active' },
  { field: 'OccurredAt', header: 'Occurred at' },
  { field: 'OccurredAtOffset', header: 'Occurred (offset)' },
  { field: 'OccurredOn', header: 'Occurred on' },
  { field: 'Category', header: 'Category' },
  { field: 'ReferenceId', header: 'Reference' },
  { field: 'SortDisabledField', header: 'Sort disabled' },
  { field: 'FilterDisabledField', header: 'Filter disabled' },
  { field: 'NullableDate', header: 'Nullable date' },
];

function showcaseGridOptions(injector: Injector, api: ShowcaseApiService, persistKey: string) {
  return {
    injector,
    load: (query: GridQuery) => api.getRows(query),
    defaultSort: [{ field: 'Id', desc: false }],
    defaultTake: 20,
    persistState: { key: persistKey, storage: 'session' as const },
    syncRoute: true,
    columnChooser: true,
    columnLayout: true,
    rowSelection: true,
    export: {
      url: '/rows/export',
      dataKeyField: 'id',
      defaultFilename: 'showcase-rows',
      columns: showcaseExportColumns,
    },
    views: {
      storageKey: persistKey,
      builtins: [showcaseActiveView],
    },
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
