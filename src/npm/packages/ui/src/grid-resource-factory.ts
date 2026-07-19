import { inject, Injectable, Injector } from "@angular/core";
import {
  createGridResource,
  type GridResource,
  type GridResourceConfig,
} from "./create-grid-resource";

@Injectable({ providedIn: "root" })
export class GridResourceFactory {
  private readonly injector = inject(Injector);

  create<T>(config: Omit<GridResourceConfig<T>, "injector">): GridResource<T> {
    return createGridResource({ ...config, injector: this.injector });
  }
}
