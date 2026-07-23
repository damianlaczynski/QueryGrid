export type RowSelectionMode = "single" | "multiple";

export function normalizeRowKey(key: unknown): string | null {
  if (key === null || key === undefined) {
    return null;
  }

  const normalized = String(key);
  return normalized.length > 0 ? normalized : null;
}

export function resolveRowKey(row: unknown, dataKey: string): string | null {
  if (!row || typeof row !== "object") {
    return null;
  }

  return normalizeRowKey((row as Record<string, unknown>)[dataKey]);
}

export function toggleRowSelection(
  selected: ReadonlySet<string>,
  key: string,
  mode: RowSelectionMode,
): ReadonlySet<string> {
  if (mode === "single") {
    return selected.has(key) ? new Set() : new Set([key]);
  }

  const next = new Set(selected);
  if (next.has(key)) {
    next.delete(key);
  } else {
    next.add(key);
  }

  return next;
}

export function togglePageRowSelection(
  selected: ReadonlySet<string>,
  pageKeys: readonly string[],
  mode: RowSelectionMode,
): ReadonlySet<string> {
  const keys = pageKeys.filter((key) => key.length > 0);
  if (keys.length === 0) {
    return selected;
  }

  if (mode === "single") {
    const firstUnselected = keys.find((key) => !selected.has(key));
    return firstUnselected ? new Set([firstUnselected]) : new Set();
  }

  const allSelected = keys.every((key) => selected.has(key));
  const next = new Set(selected);
  if (allSelected) {
    for (const key of keys) {
      next.delete(key);
    }
  } else {
    for (const key of keys) {
      next.add(key);
    }
  }

  return next;
}

export function replacePageRowSelection(
  selected: ReadonlySet<string>,
  pageKeys: readonly string[],
  selectedOnPage: readonly string[],
  mode: RowSelectionMode,
): ReadonlySet<string> {
  const pageKeySet = new Set(pageKeys.filter((key) => key.length > 0));
  const next = new Set([...selected].filter((key) => !pageKeySet.has(key)));

  if (mode === "single") {
    const first = selectedOnPage.find((key) => pageKeySet.has(key));
    return first ? new Set([first]) : next;
  }

  for (const key of selectedOnPage) {
    if (pageKeySet.has(key)) {
      next.add(key);
    }
  }

  return next;
}

export function areAllPageRowsSelected(
  selected: ReadonlySet<string>,
  pageKeys: readonly string[],
): boolean {
  const keys = pageKeys.filter((key) => key.length > 0);
  return keys.length > 0 && keys.every((key) => selected.has(key));
}

export function isSomePageRowsSelected(
  selected: ReadonlySet<string>,
  pageKeys: readonly string[],
): boolean {
  const keys = pageKeys.filter((key) => key.length > 0);
  return keys.some((key) => selected.has(key)) && !areAllPageRowsSelected(selected, keys);
}
