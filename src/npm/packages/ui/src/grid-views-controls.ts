import { computed, signal, type WritableSignal } from "@angular/core";
import {
  createGridViewPreset,
  isGridViewPresetDirty,
  loadStoredGridViews,
  mergeGridViewPresets,
  pickGridViewPresetQuery,
  saveStoredGridViews,
  trimUserGridViewPresets,
  type GridQuery,
  type GridViewPreset,
  type GridViewsConfig,
} from "@query-grid/core";

export interface GridViewsControls {
  presets: ReturnType<typeof signal<readonly GridViewPreset[]>>;
  activePresetId: ReturnType<typeof signal<string | null>>;
  isPresetDirty: ReturnType<typeof computed<boolean>>;
  applyPreset: (id: string) => void;
  saveCurrentAsPreset: (name: string) => GridViewPreset;
  updateActivePreset: () => void;
  deletePreset: (id: string) => void;
  clearActivePreset: () => void;
}

export function createGridViewsControls(options: {
  config: GridViewsConfig;
  query: WritableSignal<GridQuery>;
  clampQuery: (query: GridQuery) => GridQuery;
  defaultQuery: () => GridQuery;
  applyQuery: (query: GridQuery) => void;
  getExtraState?: () => Record<string, unknown> | undefined;
  applyExtraState?: (state: Record<string, unknown>) => void;
}): GridViewsControls {
  const maxUserPresets = options.config.maxUserPresets ?? 20;
  const builtins = options.config.builtins ?? [];
  const stored = loadStoredGridViews(options.config.storageKey);

  const presets = signal<readonly GridViewPreset[]>(
    mergeGridViewPresets(builtins, stored.userPresets),
  );
  const activePresetId = signal<string | null>(stored.activePresetId);

  const persistViewsState = () => {
    const builtinIds = new Set(builtins.map((preset) => preset.id));
    const userPresets = presets().filter((preset) => !preset.builtin && !builtinIds.has(preset.id));

    saveStoredGridViews(options.config.storageKey, {
      userPresets: trimUserGridViewPresets(userPresets, maxUserPresets),
      activePresetId: activePresetId(),
    });
  };

  const activePreset = computed(
    () => presets().find((preset) => preset.id === activePresetId()) ?? null,
  );

  const isPresetDirty = computed(() => {
    const preset = activePreset();
    if (!preset) {
      return false;
    }

    return isGridViewPresetDirty(preset, options.query(), options.getExtraState?.());
  });

  const applyPreset = (id: string) => {
    const preset = presets().find((item) => item.id === id);
    if (!preset) {
      return;
    }

    options.applyQuery(options.clampQuery({ ...options.defaultQuery(), ...preset.query }));

    if (options.applyExtraState) {
      options.applyExtraState(preset.extra ?? {});
    }

    activePresetId.set(id);
    persistViewsState();
  };

  const saveCurrentAsPreset = (name: string) => {
    const preset = createGridViewPreset(name, options.query(), options.getExtraState?.());

    presets.update((current) => {
      const userOnly = current.filter(
        (item) => !item.builtin && !builtins.some((builtin) => builtin.id === item.id),
      );
      const nextUser = trimUserGridViewPresets([...userOnly, preset], maxUserPresets);
      return mergeGridViewPresets(builtins, nextUser);
    });
    activePresetId.set(preset.id);
    persistViewsState();
    return preset;
  };

  const updateActivePreset = () => {
    const id = activePresetId();
    if (!id) {
      return;
    }

    const now = new Date().toISOString();
    const extra = options.getExtraState?.();

    presets.update((current) =>
      current.map((preset) =>
        preset.id === id
          ? {
              ...preset,
              query: pickGridViewPresetQuery(options.query()),
              extra: extra ? structuredClone(extra) : undefined,
              updatedAt: now,
            }
          : preset,
      ),
    );
    persistViewsState();
  };

  const deletePreset = (id: string) => {
    const preset = presets().find((item) => item.id === id);
    if (!preset || preset.builtin) {
      return;
    }

    presets.update((current) => current.filter((item) => item.id !== id));
    if (activePresetId() === id) {
      activePresetId.set(null);
    }
    persistViewsState();
  };

  const clearActivePreset = () => {
    activePresetId.set(null);
    persistViewsState();
  };

  return {
    presets,
    activePresetId,
    isPresetDirty,
    applyPreset,
    saveCurrentAsPreset,
    updateActivePreset,
    deletePreset,
    clearActivePreset,
  };
}

import type { GridResource } from "./create-grid-resource";

export interface GridResourceWithViews<T> {
  presets: GridViewsControls["presets"];
  activePresetId: GridViewsControls["activePresetId"];
  isPresetDirty: GridViewsControls["isPresetDirty"];
  applyPreset: GridViewsControls["applyPreset"];
  saveCurrentAsPreset: GridViewsControls["saveCurrentAsPreset"];
  updateActivePreset: GridViewsControls["updateActivePreset"];
  deletePreset: GridViewsControls["deletePreset"];
  clearActivePreset: GridViewsControls["clearActivePreset"];
}

export function hasGridViews<T>(
  grid: GridResource<T>,
): grid is GridResource<T> & GridResourceWithViews<T> {
  return "applyPreset" in grid && typeof grid.applyPreset === "function";
}
