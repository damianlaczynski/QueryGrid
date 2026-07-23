import { signal } from "@angular/core";
import {
  buildExportColumns,
  defaultExportFilename,
  downloadGridExport,
  type GridExportColumn,
  type GridExportColumnInput,
  type GridExportFormat,
  type GridExportRequest,
  type GridQuery,
} from "@query-grid/core";

export interface GridExportConfig {
  url: string;
  dataKeyField?: string;
  defaultFilename?: string;
  columns: readonly GridExportColumnInput[];
}

export interface GridExportRunOptions {
  filename?: string;
  format?: GridExportFormat;
}

export interface GridExportControls {
  exporting: ReturnType<typeof signal<boolean>>;
  exportAllMatching(query: GridQuery, options?: GridExportRunOptions): Promise<void>;
  exportSelected(
    query: GridQuery,
    selectedKeys: ReadonlySet<string>,
    options?: GridExportRunOptions,
  ): Promise<void>;
}

export function createGridExportControls(config: {
  export: GridExportConfig;
  resolveHiddenFields?: () => readonly string[];
}): GridExportControls {
  const exporting = signal(false);

  const resolveColumns = (): GridExportColumn[] => {
    const hidden = new Set(config.resolveHiddenFields?.() ?? []);
    return buildExportColumns(
      config.export.columns.map((column) => ({
        ...column,
        hidden: hidden.has(column.field),
      })),
    );
  };

  const resolveFilename = (format: GridExportFormat, filename?: string): string | undefined => {
    if (filename) {
      return filename;
    }

    if (!config.export.defaultFilename) {
      return defaultExportFilename("export", format);
    }

    return defaultExportFilename(config.export.defaultFilename, format);
  };

  const runExport = async (
    request: GridExportRequest,
    options?: GridExportRunOptions,
  ): Promise<void> => {
    const format = options?.format ?? request.format ?? "csv";
    exporting.set(true);
    try {
      await downloadGridExport({
        url: config.export.url,
        request: { ...request, format },
        filename: resolveFilename(format, options?.filename),
      });
    } finally {
      exporting.set(false);
    }
  };

  return {
    exporting,
    async exportAllMatching(query, options) {
      await runExport(
        {
          query,
          scope: "allMatching",
          dataKeyField: config.export.dataKeyField,
          columns: resolveColumns(),
        },
        options,
      );
    },
    async exportSelected(query, selectedKeys, options) {
      if (selectedKeys.size === 0) {
        return;
      }

      await runExport(
        {
          query,
          scope: "selectedKeys",
          selectedKeys: [...selectedKeys],
          dataKeyField: config.export.dataKeyField,
          columns: resolveColumns(),
        },
        options,
      );
    },
  };
}

import type { GridResource } from "./create-grid-resource.js";

export interface GridResourceWithExport {
  exporting: GridExportControls["exporting"];
  exportAllMatching(options?: GridExportRunOptions): Promise<void>;
  exportSelected(options?: GridExportRunOptions): Promise<void>;
}

export function hasExport<T>(
  grid: GridResource<T>,
): grid is GridResource<T> & GridResourceWithExport {
  return "exportAllMatching" in grid && typeof grid.exportAllMatching === "function";
}
