import type { GridQuery } from "@query-grid/core";

export type GridStateStorageType = "session" | "local";

export interface GridStatePersistence {
  key: string;
  storage?: GridStateStorageType;
}

interface PersistedGridState {
  query?: GridQuery;
  extra?: Record<string, unknown>;
}

function resolveStorage(type: GridStateStorageType): Storage | null {
  if (typeof globalThis.sessionStorage === "undefined") {
    return null;
  }

  return type === "local" ? globalThis.localStorage : globalThis.sessionStorage;
}

function resolvePersistence(
  persistState: boolean | GridStatePersistence | undefined,
): GridStatePersistence | null {
  if (!persistState) {
    return null;
  }

  if (persistState === true) {
    return { key: "query-grid", storage: "session" };
  }

  return {
    key: persistState.key,
    storage: persistState.storage ?? "session",
  };
}

export function loadPersistedGridState(
  persistState: boolean | GridStatePersistence | undefined,
): PersistedGridState | null {
  const options = resolvePersistence(persistState);
  if (!options) {
    return null;
  }

  const storage = resolveStorage(options.storage ?? "session");
  if (!storage) {
    return null;
  }

  const raw = storage.getItem(options.key);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as PersistedGridState;
    if (parsed.query) {
      parsed.query = JSON.parse(JSON.stringify(parsed.query)) as GridQuery;
    }
    return parsed;
  } catch {
    storage.removeItem(options.key);
    return null;
  }
}

export function savePersistedGridState(
  persistState: boolean | GridStatePersistence | undefined,
  query: GridQuery,
  extra?: Record<string, unknown>,
): void {
  const options = resolvePersistence(persistState);
  if (!options) {
    return;
  }

  const storage = resolveStorage(options.storage ?? "session");
  if (!storage) {
    return;
  }

  const payload: PersistedGridState = { query };
  if (extra && Object.keys(extra).length > 0) {
    payload.extra = extra;
  }

  storage.setItem(options.key, JSON.stringify(payload));
}

export function clearPersistedGridState(
  persistState: boolean | GridStatePersistence | undefined,
): void {
  const options = resolvePersistence(persistState);
  if (!options) {
    return;
  }

  const storage = resolveStorage(options.storage ?? "session");
  storage?.removeItem(options.key);
}
