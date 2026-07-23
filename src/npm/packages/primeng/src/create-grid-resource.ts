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
  readScrollExtra,
  sameFilterNode,
  skipToPage,
  totalPages,
  type GridQuery,
  type GridResult,
  type GridViewsConfig,
  type SortDescriptor,
} from "@query-grid/core";
import { catchError, finalize, Observable, of, switchMap, tap } from "rxjs";
import { createGridColumnLayoutControls } from "./grid-column-layout-controls";
import { createGridColumnVisibilityControls } from "./grid-column-visibility-controls";
import {
  readGridQueryFromRoute,
  resolveGridRouteSyncConfig,
  setupGridRouteSync,
  type GridRouteSyncConfig,
} from "./grid-route-sync";
import {
  createGridRowSelectionControls,
  type GridRowSelectionConfig,
} from "./grid-row-selection-controls";
import { createGridScrollControls } from "./grid-scroll-controls";
import {
  clearPersistedGridState,
  loadPersistedGridState,
  savePersistedGridState,
  type GridStatePersistence,
} from "./grid-state-storage";
import { createGridViewsControls, type GridViewsControls } from "./grid-views-controls";

export type { GridViewPreset, GridViewsConfig } from "@query-grid/core";
export type { GridResourceWithColumnLayout } from "./grid-column-layout-controls";
export type { GridResourceWithColumnChooser } from "./grid-column-visibility-controls";
export type { GridResourceWithScrollPersistence } from "./grid-scroll-controls";
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
  /** Client-side column resize, reorder, and pin stored in persist extra state. */
  columnLayout?: boolean;
  rowSelection?: boolean | GridRowSelectionConfig;
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

    const columnLayout = config.columnLayout
      ? createGridColumnLayoutControls({
          onStateChange: () => persistCurrentState(),
        })
      : null;

    const scrollControls = config.persistState
      ? createGridScrollControls({
          onStateChange: () => {
            if (!config.persistState) {
              return;
            }

            const existing = loadPersistedGridState(config.persistState);
            savePersistedGridState(
              config.persistState,
              query(),
              mergeExtraState(existing?.extra, scrollControls?.getExtraState()),
            );
          },
        })
      : null;

    const rowSelectionControls = config.rowSelection
      ? createGridRowSelectionControls({
          mode: typeof config.rowSelection === "object" ? config.rowSelection.mode : undefined,
        })
      : null;

    const clearRowSelection = (): void => {
      rowSelectionControls?.clearSelection();
    };

    const getExtraState = (): Record<string, unknown> | undefined =>
      mergeExtraState(
        config.getExtraState?.(),
        columnVisibility?.getExtraState(),
        columnLayout?.getExtraState(),
      );

    const getPersistedExtraState = (): Record<string, unknown> | undefined =>
      mergeExtraState(getExtraState(), scrollControls?.getExtraState());

    const applyExtraState = (extra: Record<string, unknown>): void => {
      config.applyExtraState?.(extra);
      columnVisibility?.applyExtraState(extra);
      columnLayout?.applyExtraState(extra);
      scrollControls?.applyExtraState(extra);
    };

    const readInitialQuery = (): GridQuery => {
      const base = createDefaultQuery();
      const persisted = loadPersistedGridState(config.persistState);
      const activePreset = config.views
        ? readActiveGridViewPreset(config.views.storageKey, config.views.builtins)
        : null;

      const applyInitialExtra = (): void => {
        if (activePreset) {
          applyExtraState(activePreset.extra ?? {});
        } else if (persisted?.extra) {
          applyExtraState(persisted.extra);
        }

        const persistedScroll = readScrollExtra(persisted?.extra);
        if (persistedScroll !== undefined) {
          scrollControls?.scrollLeft.set(persistedScroll);
        }
      };

      if (routeSync && route) {
        const routeQuery = readGridQueryFromRoute(route, routeSync);
        if (routeQuery) {
          applyInitialExtra();
          return { ...base, ...routeQuery };
        }
      }

      applyInitialExtra();

      if (persisted?.query) {
        return { ...base, ...persisted.query };
      }

      if (activePreset) {
        return { ...base, ...activePreset.query };
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
    let viewsControls: GridViewsControls | null = null;

    const persistState = (next: GridQuery, options?: { includeExtra?: boolean }) => {
      if (!config.persistState) {
        return;
      }

      const includeExtra = options?.includeExtra ?? viewsControls?.activePresetId() == null;

      if (includeExtra) {
        savePersistedGridState(config.persistState, next, getPersistedExtraState());
        return;
      }

      const existing = loadPersistedGridState(config.persistState);
      savePersistedGridState(
        config.persistState,
        next,
        mergeExtraState(existing?.extra, scrollControls?.getExtraState()),
      );
    };

    persistCurrentState = () => persistState(query());

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

    const updateQuery = (
      updater: (current: GridQuery) => GridQuery,
      updateOptions?: { clearSelection?: boolean },
    ) => {
      if (updateOptions?.clearSelection ?? true) {
        clearRowSelection();
      }

      const next = updater(query());
      next.take = clampTake(next.take, options);
      query.set(next);
      persistState(next);
    };

    const applyQueryState = (next: GridQuery) => {
      clearRowSelection();
      query.set(clampQuery(next));
      persistState(query());
    };

    viewsControls = config.views
      ? createGridViewsControls({
          config: config.views,
          query,
          clampQuery,
          defaultQuery: createDefaultQuery,
          applyQuery: applyQueryState,
          getExtraState,
          applyExtraState,
          persistSession: () => persistState(query(), { includeExtra: true }),
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
        updateQuery(
          (q) => ({
            ...q,
            sort: clampSortDescriptors(sort, options.maxSortDescriptors),
            skip: 0,
          }),
          { clearSelection: false },
        );
      },
      setFilter(filter: GridQuery["filter"]) {
        updateQuery((q) => ({ ...q, filter, skip: 0 }));
      },
      setSearch(search: string | null | undefined) {
        updateQuery((q) => ({ ...q, search: search ?? undefined, skip: 0 }));
      },
      patchQuery(patch: Partial<GridQuery>) {
        updateQuery(
          (q) => {
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
          },
          {
            clearSelection:
              patch.filter !== undefined ||
              patch.search !== undefined ||
              patch.skip !== undefined ||
              patch.take !== undefined,
          },
        );
      },
      resetQuery() {
        const next = createDefaultQuery();
        clearRowSelection();
        scrollControls?.reset();
        applyExtraState({});
        viewsControls?.clearActivePreset();
        query.set(next);
        clearPersistedGridState(config.persistState);
        if (config.persistState) {
          savePersistedGridState(config.persistState, next, getPersistedExtraState());
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
            applyPreset: (id: string) => {
              scrollControls?.reset();
              viewsControls!.applyPreset(id);
            },
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
      ...(columnLayout
        ? {
            columnOrder: columnLayout.columnOrder,
            columnWidths: columnLayout.columnWidths,
            columnPins: columnLayout.columnPins,
            setColumnOrder: columnLayout.setColumnOrder,
            setColumnWidth: columnLayout.setColumnWidth,
            setColumnPin: columnLayout.setColumnPin,
            resetColumnLayout() {
              columnLayout.resetColumnLayout();
              scrollControls?.reset();
            },
            setAvailableLayoutFields: columnLayout.setAvailableColumnFields,
          }
        : {}),
      ...(scrollControls
        ? {
            scrollLeft: scrollControls.scrollLeft,
            setPersistedScrollLeft: scrollControls.setScrollLeft,
            resetPersistedScroll: scrollControls.reset,
          }
        : {}),
      ...(rowSelectionControls
        ? {
            selectedKeys: rowSelectionControls.selectedKeys,
            selectedCount: rowSelectionControls.selectedCount,
            selectionMode: rowSelectionControls.selectionMode,
            isRowKeySelected: rowSelectionControls.isKeySelected,
            toggleRowKey: rowSelectionControls.toggleKey,
            togglePageRowKeys: rowSelectionControls.togglePageKeys,
            setPageRowSelection: rowSelectionControls.setPageSelection,
            areAllPageKeysSelected: rowSelectionControls.areAllPageKeysSelected,
            isSomePageKeysSelected: rowSelectionControls.isSomePageKeysSelected,
            clearRowSelection: rowSelectionControls.clearSelection,
          }
        : {}),
    };
  });
}
