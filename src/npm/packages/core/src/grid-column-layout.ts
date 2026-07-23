export const GRID_EXTRA_COLUMN_LAYOUT = "columnLayout";

export type ColumnPin = "left" | "right";

export interface GridColumnLayoutExtra {
  order?: string[];
  widths?: Record<string, number>;
  pins?: Record<string, ColumnPin>;
}

export interface GridColumnLayoutState {
  order: string[];
  widths: Record<string, number>;
  pins: Record<string, ColumnPin>;
}

export function isColumnReorderable(column: { reorderable?: boolean }): boolean {
  return column.reorderable !== false;
}

export function isColumnResizable(column: { resizable?: boolean }): boolean {
  return column.resizable !== false;
}

export function isColumnPinnable(column: { pinnable?: boolean }): boolean {
  return column.pinnable !== false;
}

export function normalizeColumnOrder(
  order: readonly string[],
  availableFields: readonly string[],
): string[] {
  const available = new Set(availableFields);
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const field of order) {
    if (
      typeof field !== "string" ||
      field.length === 0 ||
      seen.has(field) ||
      !available.has(field)
    ) {
      continue;
    }

    seen.add(field);
    normalized.push(field);
  }

  for (const field of availableFields) {
    if (!seen.has(field)) {
      normalized.push(field);
    }
  }

  return normalized;
}

export function normalizeColumnWidths(
  widths: Readonly<Record<string, number>>,
  availableFields?: readonly string[],
): Record<string, number> {
  const available = availableFields ? new Set(availableFields) : null;
  const normalized: Record<string, number> = {};

  for (const [field, width] of Object.entries(widths)) {
    if (!available || available.has(field)) {
      const px = Math.round(width);
      if (Number.isFinite(px) && px > 0) {
        normalized[field] = px;
      }
    }
  }

  return normalized;
}

export function normalizeColumnPins(
  pins: Readonly<Record<string, ColumnPin>>,
  availableFields?: readonly string[],
): Record<string, ColumnPin> {
  const available = availableFields ? new Set(availableFields) : null;
  const normalized: Record<string, ColumnPin> = {};

  for (const [field, pin] of Object.entries(pins)) {
    if ((!available || available.has(field)) && (pin === "left" || pin === "right")) {
      normalized[field] = pin;
    }
  }

  return normalized;
}

export function orderColumns<T extends { field: string }>(
  columns: readonly T[],
  orderFields: readonly string[],
): T[] {
  if (orderFields.length === 0) {
    return [...columns];
  }

  const byField = new Map(columns.map((column) => [column.field, column]));
  const ordered: T[] = [];
  const seen = new Set<string>();

  for (const field of orderFields) {
    const column = byField.get(field);
    if (column) {
      ordered.push(column);
      seen.add(field);
    }
  }

  for (const column of columns) {
    if (!seen.has(column.field)) {
      ordered.push(column);
    }
  }

  return ordered;
}

export function reorderVisibleColumnFields(
  fullOrder: readonly string[],
  hiddenFields: ReadonlySet<string>,
  fromVisibleIndex: number,
  toVisibleIndex: number,
): string[] {
  const visible = fullOrder.filter((field) => !hiddenFields.has(field));
  if (
    fromVisibleIndex < 0 ||
    toVisibleIndex < 0 ||
    fromVisibleIndex >= visible.length ||
    toVisibleIndex >= visible.length
  ) {
    return [...fullOrder];
  }

  const reordered = [...visible];
  const [moved] = reordered.splice(fromVisibleIndex, 1);
  reordered.splice(toVisibleIndex, 0, moved);

  let visibleIndex = 0;
  return fullOrder.map((field) => (hiddenFields.has(field) ? field : reordered[visibleIndex++]));
}

export function reorderDisplayedColumnFields(
  fullOrder: readonly string[],
  hiddenFields: ReadonlySet<string>,
  displayedFields: readonly string[],
  fromDisplayIndex: number,
  toDisplayIndex: number,
): string[] {
  if (
    fromDisplayIndex < 0 ||
    toDisplayIndex < 0 ||
    fromDisplayIndex >= displayedFields.length ||
    toDisplayIndex >= displayedFields.length ||
    fromDisplayIndex === toDisplayIndex
  ) {
    return [...fullOrder];
  }

  const reordered = [...displayedFields];
  const [moved] = reordered.splice(fromDisplayIndex, 1);
  reordered.splice(toDisplayIndex, 0, moved);

  let visibleIndex = 0;
  return fullOrder.map((field) => (hiddenFields.has(field) ? field : reordered[visibleIndex++]));
}

export function parseColumnWidthPx(width?: string): number | undefined {
  if (!width) {
    return undefined;
  }

  const match = /^(\d+(?:\.\d+)?)px$/i.exec(width.trim());
  if (!match) {
    return undefined;
  }

  const px = Math.round(Number(match[1]));
  return Number.isFinite(px) && px > 0 ? px : undefined;
}

export function resolveColumnWidthPx(
  column: { field: string; width?: string; minWidth?: number },
  widths: Readonly<Record<string, number>>,
  measuredWidths?: Readonly<Record<string, number>>,
): number | undefined {
  const stored = widths[column.field];
  if (stored != null && stored > 0) {
    return stored;
  }

  const measured = measuredWidths?.[column.field];
  if (measured != null && measured > 0) {
    return measured;
  }

  return parseColumnWidthPx(column.width) ?? column.minWidth;
}

export function resolvePinnedOffsetWidthPx(
  column: { field: string; width?: string; minWidth?: number },
  widths: Readonly<Record<string, number>>,
  measuredWidths?: Readonly<Record<string, number>>,
): number {
  const measured = measuredWidths?.[column.field];
  if (measured != null && measured > 0) {
    return measured;
  }

  return resolveColumnWidthPx(column, widths, measuredWidths) ?? 120;
}

export function resolveColumnPin(
  column: { field: string; pin?: ColumnPin },
  pins: Readonly<Record<string, ColumnPin>>,
): ColumnPin | undefined {
  const stored = pins[column.field];
  if (stored === "left" || stored === "right") {
    return stored;
  }

  return column.pin;
}

export function partitionColumnsByPin<T extends { field: string; pin?: ColumnPin }>(
  columns: readonly T[],
  pins: Readonly<Record<string, ColumnPin>>,
): T[] {
  const left: T[] = [];
  const center: T[] = [];
  const right: T[] = [];

  for (const column of columns) {
    const pin = resolveColumnPin(column, pins);
    if (pin === "left") {
      left.push(column);
    } else if (pin === "right") {
      right.push(column);
    } else {
      center.push(column);
    }
  }

  if (left.length === 0 && right.length === 0) {
    return [...columns];
  }

  return [...left, ...center, ...right];
}

export interface PinnedColumnOffset {
  pin: ColumnPin;
  left?: number;
  right?: number;
}

export function computePinnedColumnOffsets<T extends { field: string; pin?: ColumnPin }>(
  columns: readonly T[],
  widths: Readonly<Record<string, number>>,
  pins: Readonly<Record<string, ColumnPin>>,
  measuredWidths?: Readonly<Record<string, number>>,
): Map<string, PinnedColumnOffset> {
  const offsets = new Map<string, PinnedColumnOffset>();
  const leftPinned = columns.filter((column) => resolveColumnPin(column, pins) === "left");
  const rightPinned = columns.filter((column) => resolveColumnPin(column, pins) === "right");

  let leftOffset = 0;
  for (const column of leftPinned) {
    offsets.set(column.field, { pin: "left", left: leftOffset });
    leftOffset += resolvePinnedOffsetWidthPx(column, widths, measuredWidths);
  }

  let rightOffset = 0;
  for (const column of [...rightPinned].reverse()) {
    offsets.set(column.field, { pin: "right", right: rightOffset });
    rightOffset += resolvePinnedOffsetWidthPx(column, widths, measuredWidths);
  }

  return offsets;
}

export function pickColumnLayoutExtra(
  state: GridColumnLayoutState,
): Record<string, unknown> | undefined {
  const extra: GridColumnLayoutExtra = {};

  if (state.order.length > 0) {
    extra.order = [...state.order];
  }

  if (Object.keys(state.widths).length > 0) {
    extra.widths = { ...state.widths };
  }

  if (Object.keys(state.pins).length > 0) {
    extra.pins = { ...state.pins };
  }

  return Object.keys(extra).length > 0
    ? { [GRID_EXTRA_COLUMN_LAYOUT]: extra satisfies GridColumnLayoutExtra }
    : undefined;
}

export function readColumnLayoutExtra(extra?: Record<string, unknown>): GridColumnLayoutState {
  const raw = extra?.[GRID_EXTRA_COLUMN_LAYOUT];
  if (!raw || typeof raw !== "object") {
    return { order: [], widths: {}, pins: {} };
  }

  const layout = raw as GridColumnLayoutExtra;
  return {
    order: Array.isArray(layout.order) ? normalizeColumnOrder(layout.order, layout.order) : [],
    widths:
      layout.widths && typeof layout.widths === "object"
        ? normalizeColumnWidths(layout.widths as Record<string, number>)
        : {},
    pins:
      layout.pins && typeof layout.pins === "object"
        ? normalizeColumnPins(layout.pins as Record<string, ColumnPin>)
        : {},
  };
}

export function isColumnLayoutDirty(
  state: GridColumnLayoutState,
  defaults: { order: readonly string[] },
): boolean {
  if (state.order.length > 0 && state.order.join("|") !== defaults.order.join("|")) {
    return true;
  }

  return Object.keys(state.widths).length > 0 || Object.keys(state.pins).length > 0;
}
