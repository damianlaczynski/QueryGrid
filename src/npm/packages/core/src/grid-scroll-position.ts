export const GRID_EXTRA_SCROLL = "scroll";

export interface GridScrollExtra {
  left?: number;
}

export function normalizeScrollLeft(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }

  return Math.max(0, Math.round(value));
}

export function pickScrollExtra(
  left: number | null | undefined,
): Record<string, unknown> | undefined {
  const normalized = normalizeScrollLeft(left ?? undefined);
  if (normalized === undefined) {
    return undefined;
  }

  return {
    [GRID_EXTRA_SCROLL]: {
      left: normalized,
    } satisfies GridScrollExtra,
  };
}

export function readScrollExtra(extra?: Record<string, unknown>): number | undefined {
  const raw = extra?.[GRID_EXTRA_SCROLL];
  if (!raw || typeof raw !== "object") {
    return undefined;
  }

  return normalizeScrollLeft((raw as GridScrollExtra).left);
}

export function clampScrollLeft(left: number, element: HTMLElement): number {
  const max = Math.max(0, element.scrollWidth - element.clientWidth);
  return Math.min(Math.max(0, Math.round(left)), max);
}

export function resolveHorizontalScrollContainer(root: HTMLElement): HTMLElement | null {
  const selectors = [".p-datatable-table-container", ".p-datatable-wrapper"];

  for (const selector of selectors) {
    const element = root.querySelector<HTMLElement>(selector);
    if (element) {
      return element;
    }
  }

  const style = globalThis.getComputedStyle(root);
  if (style.overflowX === "auto" || style.overflowX === "scroll") {
    return root;
  }

  return null;
}
