import { areGridQueriesEqual } from "./grid-query-param.js";
import type { GridQuery } from "./models.js";

export interface GridViewPreset {
  id: string;
  name: string;
  query: GridQuery;
  extra?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
  builtin?: boolean;
}

export interface GridViewsConfig {
  storageKey: string;
  builtins?: GridViewPreset[];
  maxUserPresets?: number;
}

export interface StoredGridViews {
  userPresets: GridViewPreset[];
  activePresetId: string | null;
}

const STORAGE_PREFIX = "query-grid.views.";

export function createGridViewPresetId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `view-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createGridViewPreset(
  name: string,
  query: GridQuery,
  extra?: Record<string, unknown>,
): GridViewPreset {
  const now = new Date().toISOString();
  return {
    id: createGridViewPresetId(),
    name: name.trim(),
    query: pickGridViewPresetQuery(query),
    extra: extra ? structuredClone(extra) : undefined,
    createdAt: now,
  };
}

export function pickGridViewPresetQuery(query: GridQuery): GridQuery {
  const picked: GridQuery = {
    sort: structuredClone(query.sort ?? []),
  };

  if (query.take != null) {
    picked.take = query.take;
  }

  if (query.filter != null) {
    picked.filter = structuredClone(query.filter);
  }

  if (query.search != null && query.search !== "") {
    picked.search = query.search;
  }

  return picked;
}

export function mergeGridViewPresets(
  builtins: GridViewPreset[] | undefined,
  userPresets: GridViewPreset[],
): GridViewPreset[] {
  const builtinList = builtins ?? [];
  const builtinIds = new Set(builtinList.map((preset) => preset.id));
  const customPresets = userPresets.filter((preset) => !builtinIds.has(preset.id));
  return [...builtinList, ...customPresets];
}

export function readActiveGridViewPreset(
  storageKey: string,
  builtins?: GridViewPreset[],
): GridViewPreset | null {
  const stored = loadStoredGridViews(storageKey);
  if (!stored.activePresetId) {
    return null;
  }

  return (
    mergeGridViewPresets(builtins, stored.userPresets).find(
      (preset) => preset.id === stored.activePresetId,
    ) ?? null
  );
}

export function areExtrasEqual(
  left: Record<string, unknown> | undefined,
  right: Record<string, unknown> | undefined,
): boolean {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
}

export function isGridViewPresetDirty(
  preset: GridViewPreset,
  query: GridQuery,
  extra?: Record<string, unknown>,
): boolean {
  return !areGridQueriesEqual(preset.query, query) || !areExtrasEqual(preset.extra, extra);
}

function resolveStorageKey(storageKey: string): string {
  return `${STORAGE_PREFIX}${storageKey}`;
}

function resolveStorage(): Storage | null {
  if (typeof globalThis.localStorage === "undefined") {
    return null;
  }

  return globalThis.localStorage;
}

export function loadStoredGridViews(storageKey: string): StoredGridViews {
  const storage = resolveStorage();
  if (!storage) {
    return { userPresets: [], activePresetId: null };
  }

  const raw = storage.getItem(resolveStorageKey(storageKey));
  if (!raw) {
    return { userPresets: [], activePresetId: null };
  }

  try {
    const parsed = JSON.parse(raw) as StoredGridViews;
    return {
      userPresets: Array.isArray(parsed.userPresets) ? parsed.userPresets : [],
      activePresetId: typeof parsed.activePresetId === "string" ? parsed.activePresetId : null,
    };
  } catch {
    storage.removeItem(resolveStorageKey(storageKey));
    return { userPresets: [], activePresetId: null };
  }
}

export function saveStoredGridViews(storageKey: string, state: StoredGridViews): void {
  const storage = resolveStorage();
  if (!storage) {
    return;
  }

  storage.setItem(resolveStorageKey(storageKey), JSON.stringify(state));
}

export function trimUserGridViewPresets(
  presets: GridViewPreset[],
  maxUserPresets: number,
): GridViewPreset[] {
  if (presets.length <= maxUserPresets) {
    return presets;
  }

  return [...presets]
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    .slice(presets.length - maxUserPresets);
}
