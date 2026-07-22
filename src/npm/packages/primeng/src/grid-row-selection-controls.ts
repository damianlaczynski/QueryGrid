import { computed, signal } from "@angular/core";
import {
  areAllPageRowsSelected,
  isSomePageRowsSelected,
  replacePageRowSelection,
  togglePageRowSelection,
  toggleRowSelection,
  type RowSelectionMode,
} from "@query-grid/core";

export interface GridRowSelectionConfig {
  mode?: RowSelectionMode;
}

export interface GridRowSelectionControls {
  selectedKeys: ReturnType<typeof signal<ReadonlySet<string>>>;
  selectedCount: ReturnType<typeof computed<number>>;
  selectionMode: () => RowSelectionMode;
  isKeySelected: (key: string) => boolean;
  toggleKey: (key: string | null) => void;
  togglePageKeys: (pageKeys: readonly string[]) => void;
  setPageSelection: (selectedOnPage: readonly string[], pageKeys: readonly string[]) => void;
  areAllPageKeysSelected: (pageKeys: readonly string[]) => boolean;
  isSomePageKeysSelected: (pageKeys: readonly string[]) => boolean;
  clearSelection: () => void;
}

function setsEqual(left: ReadonlySet<string>, right: ReadonlySet<string>): boolean {
  if (left.size !== right.size) {
    return false;
  }

  for (const value of left) {
    if (!right.has(value)) {
      return false;
    }
  }

  return true;
}

export function createGridRowSelectionControls(
  options?: GridRowSelectionConfig,
): GridRowSelectionControls {
  const mode = options?.mode ?? "multiple";
  const selectedKeys = signal<ReadonlySet<string>>(new Set());

  const setKeys = (next: ReadonlySet<string>) => {
    if (setsEqual(next, selectedKeys())) {
      return;
    }

    selectedKeys.set(next);
  };

  return {
    selectedKeys,
    selectedCount: computed(() => selectedKeys().size),
    selectionMode: () => mode,
    isKeySelected(key) {
      return selectedKeys().has(key);
    },
    toggleKey(key) {
      if (!key) {
        return;
      }

      setKeys(toggleRowSelection(selectedKeys(), key, mode));
    },
    togglePageKeys(pageKeys) {
      setKeys(togglePageRowSelection(selectedKeys(), pageKeys, mode));
    },
    setPageSelection(selectedOnPage, pageKeys) {
      setKeys(replacePageRowSelection(selectedKeys(), pageKeys, selectedOnPage, mode));
    },
    areAllPageKeysSelected(pageKeys) {
      return areAllPageRowsSelected(selectedKeys(), pageKeys);
    },
    isSomePageKeysSelected(pageKeys) {
      return isSomePageRowsSelected(selectedKeys(), pageKeys);
    },
    clearSelection() {
      setKeys(new Set());
    },
  };
}

import type { GridResource } from "./create-grid-resource";

export interface GridResourceWithRowSelection {
  selectedKeys: GridRowSelectionControls["selectedKeys"];
  selectedCount: GridRowSelectionControls["selectedCount"];
  selectionMode: GridRowSelectionControls["selectionMode"];
  isRowKeySelected: GridRowSelectionControls["isKeySelected"];
  toggleRowKey: GridRowSelectionControls["toggleKey"];
  togglePageRowKeys: GridRowSelectionControls["togglePageKeys"];
  setPageRowSelection: GridRowSelectionControls["setPageSelection"];
  areAllPageKeysSelected: GridRowSelectionControls["areAllPageKeysSelected"];
  isSomePageKeysSelected: GridRowSelectionControls["isSomePageKeysSelected"];
  clearRowSelection: GridRowSelectionControls["clearSelection"];
}

export function hasRowSelection<T>(
  grid: GridResource<T>,
): grid is GridResource<T> & GridResourceWithRowSelection {
  return "toggleRowKey" in grid && typeof grid.toggleRowKey === "function";
}
