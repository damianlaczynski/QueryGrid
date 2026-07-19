import type { FilterOperator } from "./models.js";

export type ColumnFilterType = "text" | "number" | "date" | "enum" | "boolean" | "guid";

const STRING_OPERATORS: FilterOperator[] = ["contains", "notContains", "startsWith", "endsWith"];

const NULL_OPERATORS: FilterOperator[] = ["isNull", "isNotNull"];

/** Operators exposed for a column filter type (mirrors backend TypeClassifier rules). */
export function getAllowedOperatorsForColumnType(
  columnType?: ColumnFilterType,
  nullable = false,
): FilterOperator[] {
  const nullOps = nullable ? NULL_OPERATORS : [];

  switch (columnType) {
    case "boolean":
      return ["eq", "ne"];
    case "guid":
      return ["eq", "ne", "in", "notIn", ...nullOps];
    case "enum":
      return ["in", "notIn", "eq", "ne", ...nullOps];
    case "number":
    case "date":
      return ["eq", "ne", "lt", "lte", "gt", "gte", "between", "in", "notIn", ...nullOps];
    case "text":
      return ["contains", "notContains", "startsWith", "endsWith", "eq", "ne", ...nullOps];
    default:
      return [];
  }
}

export function defaultOperatorForColumnType(columnType?: ColumnFilterType): FilterOperator {
  switch (columnType) {
    case "text":
      return "contains";
    case "enum":
      return "in";
    case "boolean":
    case "guid":
    case "number":
    case "date":
      return "eq";
    default:
      return "eq";
  }
}

/**
 * Maps a requested operator to one allowed for the column type.
 * Used when restoring PrimeNG persisted state or lazy-load metadata that may be stale.
 */
export function coerceOperatorForColumnType(
  operator: FilterOperator,
  columnType?: ColumnFilterType,
  nullable = false,
): FilterOperator {
  const allowed = getAllowedOperatorsForColumnType(columnType, nullable);
  if (allowed.length > 0 && allowed.includes(operator)) {
    return operator;
  }

  return defaultOperatorForColumnType(columnType);
}
