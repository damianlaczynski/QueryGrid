import { signal } from "@angular/core";
import {
  normalizeColumnOrder,
  normalizeColumnPins,
  normalizeColumnWidths,
  pickColumnLayoutExtra,
  readColumnLayoutExtra,
  type ColumnPin,
  type GridColumnLayoutState,
} from "@query-grid/core";

export interface GridColumnLayoutControls {
  columnOrder: ReturnType<typeof signal<readonly string[]>>;
  columnWidths: ReturnType<typeof signal<Readonly<Record<string, number>>>>;
  columnPins: ReturnType<typeof signal<Readonly<Record<string, ColumnPin>>>>;
  setColumnOrder: (fields: readonly string[]) => void;
  setColumnWidth: (field: string, widthPx: number) => void;
  setColumnPin: (field: string, pin: ColumnPin | null) => void;
  resetColumnLayout: () => void;
  setAvailableColumnFields: (fields: readonly string[]) => void;
  getExtraState: () => Record<string, unknown> | undefined;
  applyExtraState: (extra: Record<string, unknown>) => void;
  reset: () => void;
}

export function createGridColumnLayoutControls(options?: {
  onStateChange?: () => void;
}): GridColumnLayoutControls {
  const columnOrder = signal<readonly string[]>([]);
  const columnWidths = signal<Readonly<Record<string, number>>>({});
  const columnPins = signal<Readonly<Record<string, ColumnPin>>>({});
  let availableFields: readonly string[] = [];
  let defaultOrder: readonly string[] = [];
  let pendingExtra: Record<string, unknown> | undefined;

  const currentState = (): GridColumnLayoutState => ({
    order: [...columnOrder()],
    widths: { ...columnWidths() },
    pins: { ...columnPins() },
  });

  const applyLayoutExtra = (extra: Record<string, unknown>): void => {
    const state = readColumnLayoutExtra(extra);

    if (availableFields.length === 0) {
      pendingExtra = extra;
      return;
    }

    pendingExtra = undefined;
    columnOrder.set(
      state.order.length > 0
        ? normalizeColumnOrder(state.order, availableFields)
        : [...defaultOrder],
    );
    columnWidths.set(normalizeColumnWidths(state.widths, availableFields));
    columnPins.set(normalizeColumnPins(state.pins, availableFields));
  };

  const commitState = (next: GridColumnLayoutState) => {
    const order = normalizeColumnOrder(next.order, availableFields);
    const widths = normalizeColumnWidths(next.widths, availableFields);
    const pins = normalizeColumnPins(next.pins, availableFields);

    const changed =
      order.join("|") !== columnOrder().join("|") ||
      JSON.stringify(widths) !== JSON.stringify(columnWidths()) ||
      JSON.stringify(pins) !== JSON.stringify(columnPins());

    if (!changed) {
      return;
    }

    columnOrder.set(order);
    columnWidths.set(widths);
    columnPins.set(pins);
    options?.onStateChange?.();
  };

  return {
    columnOrder,
    columnWidths,
    columnPins,
    setColumnOrder(fields) {
      commitState({ ...currentState(), order: [...fields] });
    },
    setColumnWidth(field, widthPx) {
      const px = Math.max(48, Math.round(widthPx));
      commitState({
        ...currentState(),
        widths: { ...columnWidths(), [field]: px },
      });
    },
    setColumnPin(field, pin) {
      const pins = { ...columnPins() };
      if (pin) {
        pins[field] = pin;
      } else {
        delete pins[field];
      }

      commitState({ ...currentState(), pins });
    },
    resetColumnLayout() {
      commitState({ order: [...defaultOrder], widths: {}, pins: {} });
    },
    setAvailableColumnFields(fields) {
      availableFields = normalizeColumnOrder(fields, fields);
      defaultOrder = [...availableFields];

      if (pendingExtra) {
        applyLayoutExtra(pendingExtra);
        return;
      }

      const state = currentState();
      const nextOrder =
        state.order.length > 0
          ? normalizeColumnOrder(state.order, availableFields)
          : [...defaultOrder];

      commitState({
        order: nextOrder,
        widths: normalizeColumnWidths(state.widths, availableFields),
        pins: normalizeColumnPins(state.pins, availableFields),
      });
    },
    getExtraState() {
      if (pendingExtra) {
        return pickColumnLayoutExtra(readColumnLayoutExtra(pendingExtra));
      }

      return pickColumnLayoutExtra(currentState());
    },
    applyExtraState(extra) {
      applyLayoutExtra(extra);
    },
    reset() {
      pendingExtra = undefined;
      columnOrder.set([...defaultOrder]);
      columnWidths.set({});
      columnPins.set({});
      options?.onStateChange?.();
    },
  };
}

import type { GridResource } from "./create-grid-resource";

export interface GridResourceWithColumnLayout {
  columnOrder: GridColumnLayoutControls["columnOrder"];
  columnWidths: GridColumnLayoutControls["columnWidths"];
  columnPins: GridColumnLayoutControls["columnPins"];
  setColumnOrder: GridColumnLayoutControls["setColumnOrder"];
  setColumnWidth: GridColumnLayoutControls["setColumnWidth"];
  setColumnPin: GridColumnLayoutControls["setColumnPin"];
  resetColumnLayout: GridColumnLayoutControls["resetColumnLayout"];
  setAvailableLayoutFields: GridColumnLayoutControls["setAvailableColumnFields"];
}

export function hasColumnLayout<T>(
  grid: GridResource<T>,
): grid is GridResource<T> & GridResourceWithColumnLayout {
  return (
    "setColumnWidth" in grid &&
    typeof (grid as GridResource<T> & GridResourceWithColumnLayout).setColumnWidth === "function" &&
    "setColumnOrder" in grid
  );
}
