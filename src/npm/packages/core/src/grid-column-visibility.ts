export const GRID_EXTRA_COLUMN_VISIBILITY = "columnVisibility";

export interface GridColumnVisibilityExtra {
  hiddenFields: string[];
}

export function normalizeHiddenFields(fields: readonly string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const field of fields) {
    if (typeof field !== "string" || field.length === 0 || seen.has(field)) {
      continue;
    }

    seen.add(field);
    normalized.push(field);
  }

  return normalized;
}

export function pickColumnVisibilityExtra(
  hiddenFields: readonly string[],
): Record<string, unknown> | undefined {
  const normalized = normalizeHiddenFields(hiddenFields);
  if (normalized.length === 0) {
    return undefined;
  }

  return {
    [GRID_EXTRA_COLUMN_VISIBILITY]: {
      hiddenFields: normalized,
    } satisfies GridColumnVisibilityExtra,
  };
}

export function readColumnVisibilityExtra(extra?: Record<string, unknown>): string[] {
  const raw = extra?.[GRID_EXTRA_COLUMN_VISIBILITY];
  if (!raw || typeof raw !== "object") {
    return [];
  }

  const hiddenFields = (raw as GridColumnVisibilityExtra).hiddenFields;
  return Array.isArray(hiddenFields) ? normalizeHiddenFields(hiddenFields) : [];
}

export function mergeExtraState(
  ...parts: (Record<string, unknown> | undefined)[]
): Record<string, unknown> | undefined {
  const merged: Record<string, unknown> = {};

  for (const part of parts) {
    if (!part) {
      continue;
    }

    Object.assign(merged, part);
  }

  return Object.keys(merged).length > 0 ? merged : undefined;
}

export function filterColumnsByVisibility<T extends { field: string }>(
  columns: readonly T[],
  hiddenFields: readonly string[],
): T[] {
  if (hiddenFields.length === 0) {
    return [...columns];
  }

  const hidden = new Set(hiddenFields);
  return columns.filter((column) => !hidden.has(column.field));
}

export function isColumnHideable(column: { hideable?: boolean }): boolean {
  return column.hideable !== false;
}
