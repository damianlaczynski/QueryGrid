import { afterNextRender, effect, signal, type Injector } from "@angular/core";
import {
  GRID_EXTRA_SCROLL,
  clampScrollLeft,
  pickScrollExtra,
  readScrollExtra,
} from "@query-grid/core";

export interface GridScrollControls {
  scrollLeft: ReturnType<typeof signal<number>>;
  setScrollLeft: (left: number) => void;
  getExtraState: () => Record<string, unknown> | undefined;
  applyExtraState: (extra: Record<string, unknown>) => void;
  reset: () => void;
}

export function createGridScrollControls(options?: {
  onStateChange?: () => void;
}): GridScrollControls {
  const scrollLeft = signal(0);

  const commit = (left: number) => {
    const next = Math.max(0, Math.round(left));
    if (scrollLeft() === next) {
      return;
    }

    scrollLeft.set(next);
    options?.onStateChange?.();
  };

  return {
    scrollLeft,
    setScrollLeft(left) {
      commit(left);
    },
    getExtraState() {
      return pickScrollExtra(scrollLeft());
    },
    applyExtraState(extra) {
      if (!(GRID_EXTRA_SCROLL in extra)) {
        return;
      }

      scrollLeft.set(readScrollExtra(extra) ?? 0);
    },
    reset() {
      if (scrollLeft() === 0) {
        return;
      }

      scrollLeft.set(0);
      options?.onStateChange?.();
    },
  };
}

import type { GridResource } from "./create-grid-resource";

export interface GridResourceWithScrollPersistence {
  scrollLeft: GridScrollControls["scrollLeft"];
  setPersistedScrollLeft: GridScrollControls["setScrollLeft"];
  resetPersistedScroll: GridScrollControls["reset"];
}

export function hasScrollPersistence<T>(
  grid: GridResource<T>,
): grid is GridResource<T> & GridResourceWithScrollPersistence {
  return (
    "setPersistedScrollLeft" in grid &&
    typeof (grid as GridResource<T> & GridResourceWithScrollPersistence).setPersistedScrollLeft ===
      "function"
  );
}

export function bindHorizontalScrollPersistence<T>(options: {
  injector: Injector;
  grid: () => GridResource<T>;
  resolveContainer: () => HTMLElement | null | undefined;
  restoreDeps: () => void;
}): void {
  let restoring = false;
  let debounceId: ReturnType<typeof setTimeout> | undefined;

  effect((onCleanup) => {
    const grid = options.grid();
    if (!hasScrollPersistence(grid)) {
      return;
    }

    options.restoreDeps();

    const container = options.resolveContainer();
    if (!container) {
      return;
    }

    const onScroll = () => {
      if (restoring) {
        return;
      }

      clearTimeout(debounceId);
      debounceId = setTimeout(() => {
        grid.setPersistedScrollLeft(container.scrollLeft);
      }, 200);
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    onCleanup(() => {
      container.removeEventListener("scroll", onScroll);
      clearTimeout(debounceId);
    });
  });

  effect(() => {
    const grid = options.grid();
    if (!hasScrollPersistence(grid)) {
      return;
    }

    options.restoreDeps();
    if (grid.loading()) {
      return;
    }

    const left = grid.scrollLeft();

    afterNextRender(
      () => {
        const container = options.resolveContainer();
        if (!container) {
          return;
        }

        const applyScroll = () => {
          const target = clampScrollLeft(left, container);
          if (container.scrollLeft === target) {
            return;
          }

          restoring = true;
          container.scrollLeft = target;
          restoring = false;
        };

        applyScroll();

        if (container.scrollLeft < left) {
          requestAnimationFrame(applyScroll);
        }
      },
      { injector: options.injector },
    );
  });
}
