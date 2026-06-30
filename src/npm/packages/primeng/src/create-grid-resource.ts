import {
  computed,
  DestroyRef,
  inject,
  Injector,
  runInInjectionContext,
  signal,
} from "@angular/core";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import {
  clampSortDescriptors,
  clampTake,
  createEmptyGridQuery,
  DEFAULT_GRID_OPTIONS,
  sameFilterNode,
  skipToPage,
  totalPages,
  type GridQuery,
  type GridResult,
  type SortDescriptor,
} from "@query-grid/core";
import { catchError, finalize, Observable, of, switchMap, tap } from "rxjs";
import {
  clearPersistedGridState,
  loadPersistedGridState,
  savePersistedGridState,
  type GridStatePersistence,
} from "./grid-state-storage";

export type { GridStatePersistence };

export interface GridResourceConfig<T> {
  load: (query: GridQuery) => Observable<GridResult<T>>;
  defaultSort?: SortDescriptor[];
  defaultTake?: number;
  maxTake?: number;
  maxSortDescriptors?: number;
  /** Persists query (and optional extra state) to session/local storage. */
  persistState?: boolean | GridStatePersistence;
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
export function createGridResource<T>(
  config: GridResourceConfig<T>,
): GridResource<T> {
  return runInInjectionContext(config.injector, () => {
    const destroyRef = config.destroyRef ?? inject(DestroyRef);

    const options = {
      defaultPageSize: config.defaultTake ?? 20,
      maxTake: config.maxTake ?? 100,
      maxSortDescriptors:
        config.maxSortDescriptors ?? DEFAULT_GRID_OPTIONS.maxSortDescriptors,
    };

    const createDefaultQuery = (): GridQuery => ({
      ...createEmptyGridQuery(options),
      sort: config.defaultSort ?? [],
    });

    const readInitialQuery = (): GridQuery => {
      const base = createDefaultQuery();
      const persisted = loadPersistedGridState(config.persistState);

      if (persisted?.extra && config.applyExtraState) {
        config.applyExtraState(persisted.extra);
      }

      return persisted?.query ? { ...base, ...persisted.query } : base;
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

    const resolvedTake = computed(() => clampTake(query().take, options));
    const page = computed(() => skipToPage(query().skip ?? 0, resolvedTake()));
    const pageCount = computed(() => totalPages(totalCount(), resolvedTake()));

    const persistState = (next: GridQuery) => {
      if (!config.persistState) {
        return;
      }

      savePersistedGridState(
        config.persistState,
        next,
        config.getExtraState?.(),
      );
    };

    const updateQuery = (updater: (current: GridQuery) => GridQuery) => {
      const next = updater(query());
      next.take = clampTake(next.take, options);
      query.set(next);
      persistState(next);
    };

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
            next.sort = clampSortDescriptors(
              patch.sort,
              options.maxSortDescriptors,
            );
          }
          if (
            patch.filter !== undefined &&
            !sameFilterNode(q.filter, patch.filter)
          ) {
            next.skip = 0;
          }
          if (
            patch.search !== undefined &&
            (q.search ?? "") !== (patch.search ?? "")
          ) {
            next.skip = 0;
          }
          return next;
        });
      },
      resetQuery() {
        const next = createDefaultQuery();
        if (config.applyExtraState) {
          config.applyExtraState({});
        }
        query.set(next);
        clearPersistedGridState(config.persistState);
        if (config.persistState) {
          savePersistedGridState(config.persistState, next, {});
        }
      },
      reload() {
        reloadToken.update((value) => value + 1);
      },
    };
  });
}
