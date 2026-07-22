import { signal } from "@angular/core";
import { createEmptyGridQuery } from "@query-grid/core";
import { describe, expect, it, vi } from "vitest";
import { createGridViewsControls } from "./grid-views-controls.js";

describe("grid-views-controls", () => {
  it("applies extra state before persisting query when switching presets", () => {
    const query = signal(createEmptyGridQuery());
    const applyExtraState = vi.fn();
    const applyQuery = vi.fn();
    const getExtraState = vi.fn(() => ({
      columnLayout: { pins: { Id: "left" } },
    }));
    const persistSession = vi.fn();

    const controls = createGridViewsControls({
      config: { storageKey: "demo" },
      query,
      clampQuery: (value) => value,
      defaultQuery: () => createEmptyGridQuery(),
      applyQuery,
      getExtraState,
      applyExtraState,
      persistSession,
    });

    const preset = controls.saveCurrentAsPreset("Pinned");
    applyExtraState.mockClear();
    applyQuery.mockClear();
    getExtraState.mockClear();
    persistSession.mockClear();

    controls.applyPreset(preset.id);

    expect(applyExtraState).toHaveBeenCalledBefore(applyQuery);
    expect(applyQuery).toHaveBeenCalledTimes(1);
    expect(getExtraState).not.toHaveBeenCalled();
  });

  it("persists session when saving or updating a preset", () => {
    const query = signal(createEmptyGridQuery());
    const persistSession = vi.fn();

    const controls = createGridViewsControls({
      config: { storageKey: "demo" },
      query,
      clampQuery: (value) => value,
      defaultQuery: () => createEmptyGridQuery(),
      applyQuery: (next) => query.set(next),
      getExtraState: () => ({ columnVisibility: { hiddenFields: ["Label"] } }),
      persistSession,
    });

    const preset = controls.saveCurrentAsPreset("Hidden label");
    expect(persistSession).toHaveBeenCalledTimes(1);

    persistSession.mockClear();
    controls.updateActivePreset();
    expect(persistSession).toHaveBeenCalledTimes(1);

    persistSession.mockClear();
    controls.applyPreset(preset.id);
    expect(persistSession).not.toHaveBeenCalled();
  });

  it("does not update builtin presets", () => {
    const query = signal(createEmptyGridQuery());
    const persistSession = vi.fn();

    const controls = createGridViewsControls({
      config: {
        storageKey: "demo",
        builtins: [
          {
            id: "builtin-1",
            name: "Builtin",
            builtin: true,
            createdAt: "2026-01-01T00:00:00.000Z",
            query: { sort: [] },
          },
        ],
      },
      query,
      clampQuery: (value) => value,
      defaultQuery: () => createEmptyGridQuery(),
      applyQuery: (next) => query.set(next),
      persistSession,
    });

    controls.applyPreset("builtin-1");
    query.set({ ...createEmptyGridQuery(), search: "changed" });

    controls.updateActivePreset();

    expect(controls.presets()[0]?.query.search).toBeUndefined();
    expect(persistSession).not.toHaveBeenCalled();
  });
});
