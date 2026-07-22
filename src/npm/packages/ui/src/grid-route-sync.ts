import { DestroyRef, effect, untracked, type WritableSignal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Router } from "@angular/router";
import {
  areGridQueriesEqual,
  decodeGridQueryParam,
  GRID_QUERY_PARAM_DEFAULT,
  pickShareableGridQuery,
  serializeGridQuery,
  type GridQuery,
} from "@query-grid/core";

export interface GridRouteSyncConfig {
  param?: string;
  includeSkip?: boolean;
  debounceMs?: number;
  mode?: "replace" | "push";
}

export function resolveGridRouteSyncConfig(
  syncRoute: boolean | GridRouteSyncConfig | undefined,
): GridRouteSyncConfig | null {
  if (!syncRoute) {
    return null;
  }

  if (syncRoute === true) {
    return {};
  }

  return syncRoute;
}

export function readGridQueryFromRoute(
  route: ActivatedRoute,
  config: GridRouteSyncConfig,
): GridQuery | null {
  const param = config.param ?? GRID_QUERY_PARAM_DEFAULT;
  return decodeGridQueryParam(route.snapshot.queryParamMap.get(param));
}

export function setupGridRouteSync(options: {
  route: ActivatedRoute;
  router: Router;
  query: WritableSignal<GridQuery>;
  config: GridRouteSyncConfig;
  defaultQuery: GridQuery;
  clampQuery: (query: GridQuery) => GridQuery;
  onQueryApplied: (query: GridQuery) => void;
  destroyRef: DestroyRef;
}): void {
  const param = options.config.param ?? GRID_QUERY_PARAM_DEFAULT;
  const includeSkip = options.config.includeSkip ?? false;
  const debounceMs = options.config.debounceMs ?? 300;
  const replaceUrl = (options.config.mode ?? "replace") !== "push";
  const paramOptions = { includeSkip };

  let routeWriteTimer: ReturnType<typeof setTimeout> | undefined;
  let suppressRouteWrite = false;

  const shareableQuery = (query: GridQuery) => pickShareableGridQuery(query, paramOptions);

  const shareableEqual = (left: GridQuery, right: GridQuery) =>
    areGridQueriesEqual(left, right, paramOptions);

  const readRouteQuery = (): GridQuery | null => {
    const decoded = decodeGridQueryParam(options.route.snapshot.queryParamMap.get(param));
    if (!decoded) {
      return null;
    }

    return options.clampQuery({ ...options.defaultQuery, ...decoded });
  };

  const writeRouteQuery = (query: GridQuery) => {
    const defaults = shareableQuery(options.defaultQuery);
    const current = shareableQuery(query);
    const serialized = shareableEqual(current, defaults)
      ? null
      : serializeGridQuery(query, paramOptions);

    options.router.navigate([], {
      queryParams: { [param]: serialized },
      queryParamsHandling: "merge",
      replaceUrl,
    });
  };

  options.route.queryParamMap.pipe(takeUntilDestroyed(options.destroyRef)).subscribe(() => {
    if (suppressRouteWrite) {
      return;
    }

    const routeQuery = readRouteQuery();
    if (!routeQuery) {
      const current = shareableQuery(options.query());
      const defaults = shareableQuery(options.defaultQuery);
      if (!shareableEqual(current, defaults)) {
        suppressRouteWrite = true;
        const next = options.clampQuery({ ...options.defaultQuery });
        options.query.set(next);
        options.onQueryApplied(next);
        suppressRouteWrite = false;
      }
      return;
    }

    const current = options.query();
    if (!shareableEqual(shareableQuery(routeQuery), shareableQuery(current))) {
      suppressRouteWrite = true;
      options.query.set(routeQuery);
      options.onQueryApplied(routeQuery);
      suppressRouteWrite = false;
    }
  });

  effect((onCleanup) => {
    if (suppressRouteWrite) {
      return;
    }

    const current = options.query();
    const defaults = shareableQuery(options.defaultQuery);
    const currentShareable = shareableQuery(current);
    const serialized = shareableEqual(currentShareable, defaults)
      ? null
      : serializeGridQuery(current, paramOptions);
    const routeSerialized = options.route.snapshot.queryParamMap.get(param)?.trim() || null;

    if (serialized === routeSerialized) {
      return;
    }

    if (routeWriteTimer) {
      clearTimeout(routeWriteTimer);
    }

    routeWriteTimer = setTimeout(() => {
      untracked(() => writeRouteQuery(current));
    }, debounceMs);

    onCleanup(() => {
      if (routeWriteTimer) {
        clearTimeout(routeWriteTimer);
      }
    });
  });
}
