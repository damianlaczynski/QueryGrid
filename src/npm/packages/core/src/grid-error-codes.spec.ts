import { describe, expect, it } from "vitest";
import { readGridErrorCode, readGridProblemDetails } from "./format-grid-error.js";
import {
  GRID_ERROR_CODES,
  GRID_TRANSPORT_ERROR_CODES,
  GRID_VALIDATION_CODES,
  isGridErrorCode,
  isGridValidationCode,
} from "./grid-error-codes.js";

const EXPECTED_VALIDATION_CODES = [
  "export_columns_required",
  "export_format_not_supported",
  "export_selection_required",
  "export_selection_too_large",
  "field_not_filterable",
  "field_not_sortable",
  "filter_too_deep",
  "in_list_too_long",
  "invalid_filter",
  "invalid_value",
  "operator_not_allowed",
  "operator_not_supported",
  "page_too_large",
  "too_many_conditions",
  "too_many_sorts",
  "unknown_field",
] as const;

describe("grid-error-codes", () => {
  it("matches the .NET GridValidationCodes contract set", () => {
    expect(Object.values(GRID_VALIDATION_CODES).sort()).toEqual(
      [...EXPECTED_VALIDATION_CODES].sort(),
    );
  });

  it("includes transport codes in the combined map", () => {
    expect(GRID_ERROR_CODES.invalidGridJson).toBe("invalid_grid_json");
    expect(GRID_TRANSPORT_ERROR_CODES.invalidGridJson).toBe("invalid_grid_json");
  });

  it("narrows known validation codes", () => {
    expect(isGridValidationCode("unknown_field")).toBe(true);
    expect(isGridValidationCode("invalid_grid_json")).toBe(false);
    expect(isGridErrorCode("invalid_grid_json")).toBe(true);
    expect(isGridErrorCode("nope")).toBe(false);
  });
});

describe("format-grid-error", () => {
  it("reads problem details with code extension", () => {
    const problem = readGridProblemDetails({
      title: "Grid query validation failed",
      detail: "Field 'Nope' does not exist.",
      status: 400,
      code: GRID_VALIDATION_CODES.unknownField,
    });

    expect(problem?.code).toBe("unknown_field");
    expect(readGridErrorCode({ error: problem })).toBe("unknown_field");
  });

  it("returns null for unknown codes", () => {
    expect(readGridErrorCode({ code: "custom_host_error" })).toBeNull();
  });
});
