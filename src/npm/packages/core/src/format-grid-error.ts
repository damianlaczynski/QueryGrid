import type { GridErrorCode } from "./grid-error-codes.js";
import { isGridErrorCode } from "./grid-error-codes.js";

export type GridProblemDetails = {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  code?: string;
};

function readProblemDetails(source: unknown): GridProblemDetails | null {
  if (!source || typeof source !== "object") {
    return null;
  }

  const record = source as Record<string, unknown>;
  if (
    typeof record.detail === "string" ||
    typeof record.title === "string" ||
    typeof record.code === "string"
  ) {
    return source as GridProblemDetails;
  }

  const nested = record.error;
  if (nested && typeof nested === "object") {
    return readProblemDetails(nested);
  }

  return null;
}

/** Reads ASP.NET ProblemDetails (or nested HttpErrorResponse error bodies). */
export function readGridProblemDetails(
  error: unknown,
): GridProblemDetails | null {
  if (error == null) {
    return null;
  }

  if (typeof error === "object") {
    const direct = readProblemDetails(error);
    if (direct) {
      return direct;
    }
  }

  if (error instanceof Error && "error" in error) {
    return readProblemDetails((error as Error & { error?: unknown }).error);
  }

  return null;
}

/** Returns the stable machine-readable grid error code when present. */
export function readGridErrorCode(error: unknown): GridErrorCode | null {
  const code = readGridProblemDetails(error)?.code;
  return code && isGridErrorCode(code) ? code : null;
}

/** Formats grid load / validation errors for display (e.g. Angular HttpErrorResponse). */
export function formatGridError(error: unknown): string | null {
  if (error == null) {
    return null;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  const problem = readGridProblemDetails(error);
  if (problem?.detail) {
    return problem.detail;
  }
  if (problem?.title) {
    return problem.title;
  }

  if (typeof error === "object") {
    const record = error as Record<string, unknown>;
    if (typeof record.message === "string" && record.message.length > 0) {
      return record.message;
    }
  }

  return null;
}
