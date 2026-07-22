import {
  computed,
  DestroyRef,
  inject,
  Injector,
  runInInjectionContext,
  signal,
} from "@angular/core";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Router } from "@angular/router";
import {
  clampSortDescriptors,
  clampTake,
  createEmptyGridQuery,
  DEFAULT_GRID_OPTIONS,
  mergeExtraState,
  readActiveGridViewPreset,
  sameFilterNode,
  skipToPage,
  totalPages,
  type GridQuery,
  type GridResult,
  type GridViewsConfig,
  type SortDescriptor,
} from "@query-grid/core";
import { catchError, finalize, Observable, of, switchMap, tap } from "rxjs";
import { createGridColumnVisibilityControls } from "./grid-column-visibility-controls";
import {
  readGridQueryFromRoute,
  resolveGridRouteSyncConfig,
  setupGridRouteSync,
  type GridRouteSyncConfig,
} from "./grid-route-sync";
import {
  clearPersistedGridState,
  loadPersistedGridState,
  savePersistedGridState,
  type GridStatePersistence,
} from "./grid-state-storage";
import { createGridViewsControls } from "./grid-views-controls";

export type { GridViewPreset, GridViewsConfig } from "@query-grid/core";
export type { GridResourceWithColumnChooser } from "./grid-column-visibility-controls";
export type { GridResourceWithViews } from "./grid-views-controls";
export type { GridRouteSyncConfig, GridStatePersistence };

export interface GridResourceConfig<T> {
  load: (query: GridQuery) => Observable<GridResult<T>>;
  defaultSort?: SortDescriptor[];
  defaultTake?: number;
  maxTake?: number;
  maxSortDescriptors?: number;
  /** Persists query (and optional extra state) to session/local storage. */
  persistState?: boolean | GridStatePersistence;
  /** Syncs shareable query fields with a router query parameter (default: `grid`). */
  syncRoute?: boolean | GridRouteSyncConfig;
  /** Named view presets stored in localStorage. */
  views?: GridViewsConfig;
  /** Client-side column visibility stored in persist extra state. */
  columnChooser?: boolean;
  getExtraState?: () => Record<string, unknown> | undefined;
  applyExtraState?: (state: Record<string, unknown>) => void;
  /** Component/environment injector — pass `inject(EnvironmentInjector)` from a field initializer. */
  injector: Injector;
  destroyRef?: DestroyRef;
}

export interface GridResource<T> {
  readonly query: ReturnType<typeof signal<GridQuery>>;
  readonly items: ReturnType<typeof signal<T[]>>;
  readonly totalCount: ReturnType<typeof signal<number>>;
  readonly loading: ReturnType<typeof signal<boolean>>;
  readonly error: ReturnType<typeof signal<unknown>>;
  readonly page: ReturnType<typeof computed<number>>;
  readonly pageCount: ReturnType<typeof computed<number>>;
  setPage(page: number): void;
  setTake(take: number): void;
  setSort(sort: SortDescriptor[]): void;
  setFilter(filter: GridQuery["filter"]): void;
  setSearch(search: string | null | undefined): void;
  patchQuery(patch: Partial<GridQuery>): void;
  resetQuery(): void;
  reload(): void;
}

/** Creates a reactive grid store. Pass `injector: inject(EnvironmentInjector)` or use {@link GridResourceFactory}. */
export function createGridResource<T>(config: GridResourceConfig<T>): GridResource<T> {
  return runInInjectionContext(config.injector, () => {
    const destroyRef = config.destroyRef ?? inject(DestroyRef);

    const options = {
      defaultPageSize: config.defaultTake ?? 20,
      maxTake: config.maxTake ?? 100,
      maxSortDescriptors: config.maxSortDescriptors ?? DEFAULT_GRID_OPTIONS.maxSortDescriptors,
    };

    const routeSync = resolveGridRouteSyncConfig(config.syncRoute);
    const route = routeSync ? inject(ActivatedRoute) : null;

    const createDefaultQuery = (): GridQuery => ({
      ...createEmptyGridQuery(options),
      sort: config.defaultSort ?? [],
    });

    let persistCurrentState = () => {};

    const columnVisibility = config.columnChooser
      ? createGridColumnVisibilityControls({
          onStateChange: () => persistCurrentState(),
        })
      : null;

    const getExtraState = (): Record<string, unknown> | undefined =>
      mergeExtraState(config.getExtraState?.(), columnVisibility?.getExtraState());

    const applyExtraState = (extra: Record<string, unknown>): void => {
      config.applyExtraState?.(extra);
      columnVisibility?.applyExtraState(extra);
    };

    const readInitialQuery = (): GridQuery => {
      const base = createDefaultQuery();

      if (routeSync && route) {
        const routeQuery = readGridQueryFromRoute(route, routeSync);
        if (routeQuery) {
          return { ...base, ...routeQuery };
        }
      }

      const persisted = loadPersistedGridState(config.persistState);

      if (persisted?.extra) {
        applyExtraState(persisted.extra);
      }

      if (persisted?.query) {
        return { ...base, ...persisted.query };
      }

      if (config.views) {
        const activePreset = readActiveGridViewPreset(
          config.views.storageKey,
          config.views.builtins,
        );
        if (activePreset) {
          if (activePreset.extra) {
            applyExtraState(activePreset.extra);
          }
          return { ...base, ...activePreset.query };
        }
      }

      return base;
    };

    const clampQuery = (value: GridQuery): GridQuery => ({
      ...value,
      take: clampTake(value.take, options),
      sort: clampSortDescriptors(value.sort, options.maxSortDescriptors),
    });

    const query = signal<GridQuery>(clampQuery(readInitialQuery()));
    const items = signal<T[]>([]);
    const totalCount = signal(0);
    const loading = signal(false);
    const error = signal<unknown>(null);
    const reloadToken = signal(0);

    const persistState = (next: GridQuery) => {
      if (!config.persistState) {
        return;
      }

      savePersistedGridState(config.persistState, next, getExtraState());
    };

    persistCurrentState = () => persistState(query());

    persistState(query());

    if (routeSync && route) {
      setupGridRouteSync({
        route,
        router: inject(Router),
        query,
        config: routeSync,
        defaultQuery: createDefaultQuery(),
        clampQuery,
        onQueryApplied: persistState,
        destroyRef,
      });
    }

    const resolvedTake = computed(() => clampTake(query().take, options));
    const page = computed(() => skipToPage(query().skip ?? 0, resolvedTake()));
    const pageCount = computed(() => totalPages(totalCount(), resolvedTake()));

    const updateQuery = (updater: (current: GridQuery) => GridQuery) => {
      const next = updater(query());
      next.take = clampTake(next.take, options);
      query.set(next);
      persistState(next);
    };

    const applyQueryState = (next: GridQuery) => {
      query.set(clampQuery(next));
      persistState(query());
    };

    const viewsControls = config.views
      ? createGridViewsControls({
          config: config.views,
          query,
          clampQuery,
          defaultQuery: createDefaultQuery,
          applyQuery: applyQueryState,
          getExtraState,
          applyExtraState,
        })
      : null;

    toObservable(computed(() => ({ q: query(), token: reloadToken() })))
      .pipe(
        switchMap(({ q }) => {
          loading.set(true);
          error.set(null);
          const request: GridQuery = { ...q, take: clampTake(q.take, options) };
          return config.load(request).pipe(
            tap((result) => {
              items.set(result.items);
              totalCount.set(result.totalCount);
            }),
            catchError((err) => {
              error.set(err);
              items.set([]);
              totalCount.set(0);
              return of(null);
            }),
            finalize(() => loading.set(false)),
          );
        }),
        takeUntilDestroyed(destroyRef),
      )
      .subscribe();

    return {
      query,
      items,
      totalCount,
      loading,
      error,
      page,
      pageCount,
      setPage(pageNumber: number) {
        updateQuery((q) => ({
          ...q,
          skip: Math.max(0, (pageNumber - 1) * clampTake(q.take, options)),
        }));
      },
      setTake(nextTake: number) {
        updateQuery((q) => ({
          ...q,
          take: clampTake(nextTake, options),
          skip: 0,
        }));
      },
      setSort(sort: SortDescriptor[]) {
        updateQuery((q) => ({
          ...q,
          sort: clampSortDescriptors(sort, options.maxSortDescriptors),
          skip: 0,
        }));
      },
      setFilter(filter: GridQuery["filter"]) {
        updateQuery((q) => ({ ...q, filter, skip: 0 }));
      },
      setSearch(search: string | null | undefined) {
        updateQuery((q) => ({ ...q, search: search ?? undefined, skip: 0 }));
      },
      patchQuery(patch: Partial<GridQuery>) {
        updateQuery((q) => {
          const next = { ...q, ...patch };
          if (patch.sort !== undefined) {
            next.sort = clampSortDescriptors(patch.sort, options.maxSortDescriptors);
          }
          if (patch.filter !== undefined && !sameFilterNode(q.filter, patch.filter)) {
            next.skip = 0;
          }
          if (patch.search !== undefined && (q.search ?? "") !== (patch.search ?? "")) {
            next.skip = 0;
          }
          return next;
        });
      },
      resetQuery() {
        const next = createDefaultQuery();
        applyExtraState({});
        viewsControls?.clearActivePreset();
        query.set(next);
        clearPersistedGridState(config.persistState);
        if (config.persistState) {
          savePersistedGridState(config.persistState, next, getExtraState());
        }
      },
      reload() {
        reloadToken.update((value) => value + 1);
      },
      ...(viewsControls
        ? {
            presets: viewsControls.presets,
            activePresetId: viewsControls.activePresetId,
            isPresetDirty: viewsControls.isPresetDirty,
            applyPreset: viewsControls.applyPreset,
            saveCurrentAsPreset: viewsControls.saveCurrentAsPreset,
            updateActivePreset: viewsControls.updateActivePreset,
            deletePreset: viewsControls.deletePreset,
            clearActivePreset: viewsControls.clearActivePreset,
          }
        : {}),
      ...(columnVisibility
        ? {
            hiddenColumnFields: columnVisibility.hiddenColumnFields,
            setColumnVisible: columnVisibility.setColumnVisible,
            showAllColumns: columnVisibility.showAllColumns,
            setAvailableColumnFields: columnVisibility.setAvailableColumnFields,
          }
        : {}),
    };
  });
}
