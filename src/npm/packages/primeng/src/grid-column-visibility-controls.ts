import { signal } from "@angular/core";
import {
  normalizeHiddenFields,
  pickColumnVisibilityExtra,
  readColumnVisibilityExtra,
} from "@query-grid/core";

export interface GridColumnVisibilityControls {
  hiddenColumnFields: ReturnType<typeof signal<readonly string[]>>;
  setColumnVisible: (field: string, visible: boolean) => void;
  showAllColumns: () => void;
  setAvailableColumnFields: (fields: readonly string[]) => void;
  getExtraState: () => Record<string, unknown> | undefined;
  applyExtraState: (extra: Record<string, unknown>) => void;
  reset: () => void;
}

export function createGridColumnVisibilityControls(options?: {
  onStateChange?: () => void;
}): GridColumnVisibilityControls {
  const hiddenColumnFields = signal<readonly string[]>([]);
  let availableFields: readonly string[] = [];

  const pruneHiddenFields = (fields: readonly string[]): string[] => {
    const normalized = normalizeHiddenFields(fields);
    if (availableFields.length === 0) {
      return normalized;
    }

    const available = new Set(availableFields);
    return normalized.filter((field) => available.has(field));
  };

  const setHiddenFields = (fields: readonly string[]) => {
    const next = pruneHiddenFields(fields);
    const current = hiddenColumnFields();
    if (next.length === current.length && next.every((field, index) => field === current[index])) {
      return;
    }

    hiddenColumnFields.set(next);
    options?.onStateChange?.();
  };

  const canHideField = (field: string, hidden: ReadonlySet<string>): boolean => {
    if (availableFields.length === 0) {
      return true;
    }

    const visibleCount = availableFields.filter((candidate) => !hidden.has(candidate)).length;
    return visibleCount > 0 || !hidden.has(field);
  };

  return {
    hiddenColumnFields,
    setColumnVisible(field, visible) {
      const hidden = new Set(hiddenColumnFields());
      if (visible) {
        hidden.delete(field);
        setHiddenFields([...hidden]);
        return;
      }

      hidden.add(field);
      if (!canHideField(field, hidden)) {
        return;
      }

      setHiddenFields([...hidden]);
    },
    showAllColumns() {
      setHiddenFields([]);
    },
    setAvailableColumnFields(fields) {
      availableFields = normalizeHiddenFields(fields);
      setHiddenFields(hiddenColumnFields());
    },
    getExtraState() {
      return pickColumnVisibilityExtra(hiddenColumnFields());
    },
    applyExtraState(extra) {
      hiddenColumnFields.set(readColumnVisibilityExtra(extra));
    },
    reset() {
      if (hiddenColumnFields().length === 0) {
        return;
      }

      hiddenColumnFields.set([]);
      options?.onStateChange?.();
    },
  };
}

import type { GridResource } from "./create-grid-resource";

export interface GridResourceWithColumnChooser {
  hiddenColumnFields: GridColumnVisibilityControls["hiddenColumnFields"];
  setColumnVisible: GridColumnVisibilityControls["setColumnVisible"];
  showAllColumns: GridColumnVisibilityControls["showAllColumns"];
  setAvailableColumnFields: GridColumnVisibilityControls["setAvailableColumnFields"];
}

export function hasColumnChooser<T>(
  grid: GridResource<T>,
): grid is GridResource<T> & GridResourceWithColumnChooser {
  return (
    "setColumnVisible" in grid &&
    typeof (grid as GridResource<T> & GridResourceWithColumnChooser).setColumnVisible === "function"
  );
}
