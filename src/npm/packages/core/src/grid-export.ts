import { readGridProblemDetails } from "./format-grid-error.js";
import type { GridQuery } from "./models.js";

export type GridExportScope = "allMatching" | "selectedKeys";

export type GridExportFormat = "csv" | "xlsx";

export interface GridExportColumn {
  field: string;
  header: string;
}

export interface GridExportRequest {
  query: GridQuery;
  scope: GridExportScope;
  selectedKeys?: readonly string[];
  dataKeyField?: string;
  format?: GridExportFormat;
  columns: readonly GridExportColumn[];
}

export interface DownloadGridExportOptions {
  url: string;
  request: GridExportRequest;
  filename?: string;
  init?: RequestInit;
}

export interface GridExportColumnInput {
  field: string;
  header: string;
  hidden?: boolean;
}

/** Strips paging fields from a grid query before sending an export request. */
export function buildExportQuery(query: GridQuery): GridQuery {
  return {
    filter: query.filter ?? undefined,
    search: query.search ?? undefined,
    sort: query.sort ?? [],
  };
}

export function buildExportColumns(columns: readonly GridExportColumnInput[]): GridExportColumn[] {
  return columns
    .filter((column) => !column.hidden)
    .map((column) => ({
      field: column.field,
      header: column.header,
    }));
}

export function defaultExportFilename(base: string, format: GridExportFormat): string {
  if (base.endsWith(".csv") || base.endsWith(".xlsx")) {
    return base;
  }

  return `${base}.${format}`;
}

export function buildGridExportBody(request: GridExportRequest): Record<string, unknown> {
  return {
    query: buildExportQuery(request.query),
    scope: request.scope,
    selectedKeys: request.scope === "selectedKeys" ? [...(request.selectedKeys ?? [])] : undefined,
    dataKeyField: request.dataKeyField ?? "id",
    format: request.format ?? "csv",
    columns: request.columns.map((column) => ({
      field: column.field,
      header: column.header,
    })),
  };
}

export function resolveExportFilename(response: Response, fallback = "export.csv"): string {
  const disposition = response.headers.get("Content-Disposition");
  if (!disposition) {
    return fallback;
  }

  const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const quotedMatch = /filename="([^"]+)"/i.exec(disposition);
  if (quotedMatch?.[1]) {
    return quotedMatch[1];
  }

  const plainMatch = /filename=([^;]+)/i.exec(disposition);
  if (plainMatch?.[1]) {
    return plainMatch[1].trim();
  }

  return fallback;
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  if (typeof document === "undefined") {
    return;
  }

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

export async function downloadGridExport(options: DownloadGridExportOptions): Promise<void> {
  const { url, request, filename, init } = options;
  const response = await fetch(url, {
    ...init,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    body: JSON.stringify(buildGridExportBody(request)),
  });

  if (!response.ok) {
    let errorBody: unknown;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = null;
    }

    const problem = readGridProblemDetails(errorBody);
    const detail = problem?.detail ?? problem?.title ?? `Export failed (${response.status})`;
    throw new Error(detail);
  }

  const blob = await response.blob();
  triggerBlobDownload(blob, resolveExportFilename(response, filename));
}
