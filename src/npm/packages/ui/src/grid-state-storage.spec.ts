import type { GridQuery } from "@query-grid/core";
import { describe, expect, it, vi } from "vitest";
import { loadPersistedGridState, savePersistedGridState } from "./grid-state-storage.js";

describe("grid-state-storage", () => {
  it("replaces persisted extra when saving without extra", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    });

    const query: GridQuery = { sort: [] };
    savePersistedGridState({ key: "demo" }, query, {
      columnLayout: { widths: { Label: 220 } },
    });

    savePersistedGridState({ key: "demo" }, query);

    expect(loadPersistedGridState({ key: "demo" })?.extra).toBeUndefined();
  });
});
